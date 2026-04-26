import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 12_000;

function isPrivateHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  if (h.endsWith(".internal") || h.endsWith(".local")) return true;
  return false;
}

export async function POST(req: Request) {
  let body: { url?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const raw = (body.url ?? "").trim();
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let url: URL;
  try { url = new URL(raw); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ error: "Only http(s) allowed" }, { status: 400 });
  }
  if (isPrivateHost(url.hostname)) {
    return NextResponse.json({ error: "Disallowed host" }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; VersoBot/1.0; +https://verso.app) AppleWebKit/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json({ error: "Could not fetch URL" }, { status: 502 });
  }
  clearTimeout(timer);

  if (!res.ok) {
    return NextResponse.json({ error: `Source returned ${res.status}` }, { status: 502 });
  }
  const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!ctype.includes("text/html") && !ctype.includes("application/xhtml")) {
    return NextResponse.json({ error: "Not an HTML page" }, { status: 415 });
  }

  const reader = res.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Empty response" }, { status: 502 });
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_BYTES) {
        try { await reader.cancel(); } catch {}
        return NextResponse.json({ error: "Page too large" }, { status: 413 });
      }
      chunks.push(value);
    }
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  const html = buf.toString("utf8");

  let dom: JSDOM;
  try {
    dom = new JSDOM(html, { url: url.toString() });
  } catch {
    return NextResponse.json({ error: "Could not parse page" }, { status: 502 });
  }
  const doc = dom.window.document;
  doc.querySelectorAll("script, style, noscript, iframe, link[rel=stylesheet]").forEach((n) => n.remove());

  const og = (k: string) =>
    doc.querySelector(`meta[property="${k}"]`)?.getAttribute("content") ??
    doc.querySelector(`meta[name="${k}"]`)?.getAttribute("content") ??
    undefined;

  const article = new Readability(doc).parse();
  if (!article || !article.content) {
    return NextResponse.json({ error: "Could not extract readable content" }, { status: 422 });
  }

  const cleaned = sanitize(article.content);
  const text = (article.textContent ?? "").trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  return NextResponse.json({
    url: url.toString(),
    title: article.title ?? og("og:title") ?? doc.title ?? "Untitled",
    byline: article.byline ?? og("article:author") ?? undefined,
    siteName: article.siteName ?? og("og:site_name") ?? url.hostname.replace(/^www\./, ""),
    excerpt: article.excerpt ?? og("og:description") ?? undefined,
    thumb: og("og:image") ?? undefined,
    content: cleaned,
    wordCount: words,
    lang: article.lang ?? doc.documentElement.lang ?? "en",
  });
}

function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
}
