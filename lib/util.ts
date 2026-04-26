export function uid(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return prefix + Date.now().toString(36) + rand;
}

export function estimateReadMinutes(words: number): number {
  return Math.max(1, Math.round(words / 220));
}

export function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function safeHostname(url?: string): string {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
