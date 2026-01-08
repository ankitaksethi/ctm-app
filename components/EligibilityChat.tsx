import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronRight, CheckCircle2, FlaskConical, Dna, Activity, Stethoscope, Calendar, User, MessageSquare, ExternalLink, Send, X, Bot, User as UserIcon, AlertCircle } from 'lucide-react';
import type { FlattenedTrial, ChatMessage } from '../types';

interface EligibilityChatProps {
  trial: FlattenedTrial;
  onClose: () => void;
}

function EligibilityChat({ trial, onClose }: EligibilityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Determine WebSocket endpoint dynamically based on current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host which includes both domain/ip and port
    const host = window.location.host; 
    const wsUrl = `${protocol}//${host}/ws/verify/${trial.nctId}`;
    
    console.log('[Chat] Connecting to:', wsUrl);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[Chat] Connected');
      setConnectionStatus('connected');
      socket.send(JSON.stringify({ 
        type: 'start', 
        context: {
          title: trial.moduleBriefTitle,
          criteria: trial.eligibilityCriteria || 'No criteria specified in protocol.'
        }
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: data.text, 
          timestamp: Date.now() 
        }]);
        setIsTyping(false);
      } else if (data.type === 'typing') {
        setIsTyping(true);
      }
    };

    socket.onclose = (e) => {
      console.log('[Chat] Socket Closed', e);
      setConnectionStatus('error');
    };

    socket.onerror = (err) => {
      console.error('[Chat] Socket Error:', err);
      setConnectionStatus('error');
    };

    return () => {
      socket.close();
    };
  }, [trial.nctId]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    ws.current.send(JSON.stringify({ type: 'message', text: inputValue }));
    setInputValue('');
    setIsTyping(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-opacity">
      <div className="bg-white w-full max-w-2xl h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-blue-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight line-clamp-1">{trial.moduleBriefTitle}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                }`}></span>
                <span className="text-[11px] font-bold opacity-80 uppercase tracking-widest">
                  {connectionStatus === 'connected' ? 'Eligibility Assistant Live' : 
                   connectionStatus === 'connecting' ? 'Establishing Secure Link...' : 'Connection Failed'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {connectionStatus === 'error' && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex flex-col items-center text-center gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <div className="space-y-1">
                <h4 className="font-black text-red-800 text-sm uppercase tracking-tight">Backend Server Unreachable</h4>
                <p className="text-xs text-red-600 leading-relaxed px-4">
                  The Eligibility Assistant requires the FastAPI backend to be running on <b>{window.location.host}</b>.<br/>
                  Please ensure you have run <code>python main.py</code> in your terminal or are running the Docker container.
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-100"
              >
                Retry Connection
              </button>
            </div>
          )}

          {connectionStatus !== 'error' && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 animate-in fade-in duration-700">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing trial protocol...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-white border border-slate-200'
                }`}>
                  {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-600" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-5 bg-white border-t">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={connectionStatus === 'connected' ? "Type your response..." : "Waiting for connection..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50"
              disabled={connectionStatus !== 'connected'}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || connectionStatus !== 'connected'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-4 rounded-2xl transition-all shadow-lg shadow-blue-100 disabled:shadow-none active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">
            AI Assistant screening • Always verify with study officials
          </p>
        </div>
      </div>
    </div>
  );
}



export default EligibilityChat;
