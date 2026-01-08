import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, FlattenedTrial } from "../types";

type ConnectionStatus = "connecting" | "connected" | "error";

function getWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${proto}://${host}/ws/eligibility`;
}

export function useEligibilityChat(trial: FlattenedTrial | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const canSend = useMemo(
    () => connectionStatus === "connected" && inputValue.trim().length > 0,
    [connectionStatus, inputValue]
  );

  const connect = useCallback(() => {
    if (!trial) return;

    setConnectionStatus("connecting");
    setIsTyping(false);

    try {
      const socket = new WebSocket(getWsUrl());
      ws.current = socket;

      socket.onopen = () => {
        setConnectionStatus("connected");
        // Send trial context to backend (server expects a JSON message)
        socket.send(
          JSON.stringify({
            type: "init",
            trial: {
              nctId: trial.nctId,
              moduleBriefTitle: trial.moduleBriefTitle,
              moduleOfficialTitle: trial.moduleOfficialTitle,
              overallStatus: trial.overallStatus,
              briefSummary: trial.briefSummary,
              eligibilityCriteria: trial.eligibilityCriteria,
              eligibilityMinimumAge: trial.eligibilityMinimumAge,
              eligibilityMaximumAge: trial.eligibilityMaximumAge,
              conditions: trial.conditions,
            },
          })
        );
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => [
            ...prev,
            { role: "model", text: data.text, timestamp: Date.now() },
          ]);
          setIsTyping(false);
        } else if (data.type === "typing") {
          setIsTyping(true);
        }
      };

      socket.onerror = () => {
        setConnectionStatus("error");
        setIsTyping(false);
      };

      socket.onclose = () => {
        // Only mark error if we didn't intentionally close (browser doesn't reliably provide codes here)
        setConnectionStatus("error");
        setIsTyping(false);
      };
    } catch {
      setConnectionStatus("error");
      setIsTyping(false);
    }
  }, [trial]);

  useEffect(() => {
    // Reset when trial changes
    setMessages([]);
    setInputValue("");
    setIsTyping(false);

    if (ws.current) {
      try {
        ws.current.close();
      } catch {}
      ws.current = null;
    }

    if (trial) connect();

    return () => {
      if (ws.current) {
        try {
          ws.current.close();
        } catch {}
        ws.current = null;
      }
    };
  }, [trial, connect]);

  const sendMessage = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    if (!ws.current || connectionStatus !== "connected") return;

    setMessages((prev) => [...prev, { role: "user", text, timestamp: Date.now() }]);
    setInputValue("");

    ws.current.send(JSON.stringify({ type: "message", text }));
    setIsTyping(true);
  }, [inputValue, connectionStatus]);

  const retry = useCallback(() => {
    if (ws.current) {
      try {
        ws.current.close();
      } catch {}
      ws.current = null;
    }
    connect();
  }, [connect]);

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    connectionStatus,
    isTyping,
    canSend,
    sendMessage,
    retry,
  };
}
