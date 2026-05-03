"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Highlighter, Settings as SettingsIcon, MoreHorizontal, Bookmark } from "lucide-react";
import type { ArticleBody, Highlight, HighlightColor, LibraryItem, Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getItem, getArticleBody, getSettings, listHighlights } from "@/lib/storage";
import {
  saveSettings, saveHighlight, deleteHighlight, saveItem,
} from "@/lib/sync";
import { applyHighlights, buildHighlightFromSelection } from "@/lib/highlights";
import { safeHostname } from "@/lib/util";
import { SettingsPopover } from "./SettingsPopover";
import { HighlightBar } from "./HighlightBar";
import { HighlightsSidebar } from "./HighlightsSidebar";
import { PdfReader } from "./PdfReader";

export function Reader({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<LibraryItem | null | undefined>(undefined);
  const [body, setBody] = useState<ArticleBody | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [hlOpen, setHlOpen] = useState(true);
  const [setOpen, setSetOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const articleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  // Load item + settings + highlights
  useEffect(() => {
    let mounted = true;
    async function load() {
      const [it, s, hs] = await Promise.all([getItem(id), getSettings(), listHighlights(id)]);
      if (!mounted) return;
      setItem(it ?? null);
      setSettingsState(s);
      setHighlights(hs);
      if (it?.kind === "article") {
        const b = await getArticleBody(id);
        if (mounted) setBody(b ?? null);
      }
      applyTheme(s);
    }
    load();
    function onSync() { load(); }
    window.addEventListener("verso:sync", onSync);
    return () => { mounted = false; window.removeEventListener("verso:sync", onSync); };
  }, [id]);

  // Apply theme/typography on settings change
  useEffect(() => { applyTheme(settings); }, [settings]);

  // Inject highlights when body or highlights change
  useEffect(() => {
    if (!articleRef.current || !body) return;
    applyHighlights(articleRef.current, highlights);
  }, [body, highlights]);

  // Track read progress
  useEffect(() => {
    function onScroll() {
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      setProgress(p);
    }
    const el = scrollRef.current;
    el?.addEventListener("scroll", onScroll);
    return () => el?.removeEventListener("scroll", onScroll);
  }, [body]);

  // Persist progress occasionally
  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => {
      saveItem({ ...item, progress, updatedAt: Date.now() });
    }, 600);
    return () => clearTimeout(t);
  }, [progress, item]);

  const onSettings = useCallback(async (s: Settings) => {
    setSettingsState(s);
    await saveSettings(s);
  }, []);

  const onPickColor = useCallback(async (color: HighlightColor) => {
    if (!articleRef.current || !item) return;
    const h = buildHighlightFromSelection(articleRef.current, item.id, color);
    if (!h) return;
    await saveHighlight(h);
    setHighlights((prev) => [...prev, h]);
    window.getSelection()?.removeAllRanges();
  }, [item]);

  const onCopy = useCallback(() => {
    const sel = window.getSelection()?.toString() ?? "";
    if (sel) navigator.clipboard?.writeText(sel);
    window.getSelection()?.removeAllRanges();
  }, []);

  const onDeleteHighlight = useCallback(async (hid: string) => {
    if (!item) return;
    await deleteHighlight(item.id, hid);
    setHighlights((prev) => prev.filter((h) => h.id !== hid));
  }, [item]);

  const onScrollTo = useCallback((hid: string) => {
    const el = articleRef.current?.querySelector(`mark[data-hl-id="${hid}"]`);
    if (el && el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const onToggleBookmark = useCallback(async () => {
    if (!item) return;
    const next = { ...item, bookmarked: !item.bookmarked, updatedAt: Date.now() };
    await saveItem(next);
    setItem(next);
  }, [item]);

  const subtitle = useMemo(() => {
    if (!item) return "";
    const parts = [item.byline, item.readMinutes ? `${item.readMinutes} min read` : null, item.wordCount ? `${item.wordCount.toLocaleString()} words` : null]
      .filter(Boolean);
    return parts.join(" · ");
  }, [item]);

  if (item === undefined) return <div className="min-h-screen flex items-center justify-center muted text-sm">Loading…</div>;
  if (item === null) return <div className="min-h-screen flex items-center justify-center muted text-sm">Article not found. <Link href="/library" className="underline ml-2">Back to library</Link></div>;

  return (
    <div className="flex">
      <main ref={scrollRef} className="flex-1 h-screen overflow-y-auto scroll-thin relative">
        {/* Top bar */}
        <div className="sticky top-0 z-30 backdrop-blur-md bg-current/[0]">
          <div
            className="h-[2px] w-full bg-current/10"
            aria-hidden
          >
            <div className="h-full bg-current/70 transition-[width]" style={{ width: `${(progress * 100).toFixed(1)}%` }} />
          </div>
          <div className="px-5 md:px-8 h-12 flex items-center gap-2 border-b line">
            <button onClick={() => router.push("/library")} className="btn btn-ghost h-9 w-9 p-0 justify-center" aria-label="Back">
              <ArrowLeft size={15} />
            </button>
            <div className="text-[11px] muted truncate flex-1">
              {item.url ? <span>{safeHostname(item.url)}</span> : <span>PDF · {item.title}</span>}
            </div>
            <div className="text-[11px] muted tabular-nums hidden sm:block">{Math.round(progress * 100)}%</div>
            <button
              onClick={onToggleBookmark}
              className={"btn btn-ghost h-9 w-9 p-0 justify-center " + (item.bookmarked ? "text-current" : "muted")}
              aria-label="Bookmark"
            >
              <Bookmark size={15} fill={item.bookmarked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => setHlOpen((v) => !v)}
              className={"btn btn-ghost h-9 w-9 p-0 justify-center " + (hlOpen ? "text-current" : "muted")}
              aria-label="Toggle highlights"
            >
              <Highlighter size={15} />
            </button>
            <div className="relative">
              <button
                onClick={() => setSetOpen((v) => !v)}
                className="btn btn-ghost h-9 px-2 muted"
                aria-label="Settings"
              >
                Aa
              </button>
              <SettingsPopover open={setOpen} onClose={() => setSetOpen(false)} settings={settings} onChange={onSettings} />
            </div>
            <button className="btn btn-ghost h-9 w-9 p-0 justify-center muted" aria-label="More">
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        {item.kind === "article" ? (
          body ? (
            <article className="px-5 md:px-10 py-10 md:py-14">
              <div className="max-w-[760px] mx-auto text-center mb-7" style={{ maxWidth: "var(--reader-w, 720px)" }}>
                {item.siteName && <div className="text-[11px] tracking-[0.16em] uppercase muted mb-3">{item.siteName}</div>}
                <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.01em] font-semibold">
                  {item.title}
                </h1>
                {subtitle && <div className="muted text-[12.5px] mt-3 font-sans">{subtitle}</div>}
              </div>
              <div ref={articleRef} className="prose-verso" dangerouslySetInnerHTML={{ __html: body.html }} />
              <div className="text-center muted my-12 text-[11px] tracking-[0.6em]">* * *</div>
              {item.url && (
                <div className="text-center muted text-[12px] mb-16">
                  Originally published at{" "}
                  <a href={item.url} target="_blank" rel="noreferrer" className="underline">{safeHostname(item.url)}</a>
                </div>
              )}
            </article>
          ) : (
            <div className="muted text-sm py-20 text-center">Loading article…</div>
          )
        ) : (
          <PdfReader itemId={item.id} />
        )}

        <HighlightBar containerRef={articleRef} onPick={onPickColor} onCopy={onCopy} />
      </main>

      <HighlightsSidebar
        open={hlOpen}
        onClose={() => setHlOpen(false)}
        highlights={highlights}
        item={item}
        onDelete={onDeleteHighlight}
        onScrollTo={onScrollTo}
      />
    </div>
  );
}

function applyTheme(s: Settings) {
  const html = document.documentElement;
  html.classList.remove("theme-paper", "theme-night", "theme-ember");
  html.classList.add(`theme-${s.theme}`);
  html.classList.remove("font-editorial", "font-modern", "font-book");
  html.classList.add(`font-${s.fontMode}`);
  html.style.setProperty("--reader-fs", s.fontSize + "px");
  html.style.setProperty("--reader-lh", String(s.lineHeight));
  html.style.setProperty("--reader-w", s.columnWidth + "px");
}
