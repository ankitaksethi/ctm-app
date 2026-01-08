import { TaxonomyData } from "../types";

function formatFastApiDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail.map((d: any) => d?.msg || d?.message).filter(Boolean);
    if (msgs.length) return msgs.join(" | ");
    try { return JSON.stringify(detail); } catch { return "Request validation failed."; }
  }

  if (detail && typeof detail === "object") {
    try { return JSON.stringify(detail); } catch { return "Server error."; }
  }

  return "Unknown error";
}

export async function categorizeConditions(
  conditions: string[] | string
): Promise<TaxonomyData> {
  const response = await fetch("/api/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conditions }),
  });

  // Read body ONCE so we don't lose the error message
  const raw = await response.text().catch(() => "");

  if (!response.ok) {
    // Try parse JSON error payload
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        const msg = formatFastApiDetail((parsed as any).detail ?? parsed);
        throw new Error(msg || `Server returned ${response.status}`);
      }
    } catch {
      // ignore parse error, fall back to raw text
    }
    throw new Error(raw || `Server returned ${response.status}`);
  }

  // Successful response
  const data = raw ? JSON.parse(raw) : {};

  return {
    summary: data.summary || { Genetic: [], RecentEvents: [], OtherMajorDiagnosis: [] },
    lookup: data.lookup || {},
  };
}
