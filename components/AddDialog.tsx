"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, FileUp, X, Loader2 } from "lucide-react";
import { saveItem, saveArticleBody, savePdfBody } from "@/lib/storage";
import { uid, estimateReadMinutes } from "@/lib/util";
import type { LibraryItem } from "@/lib/types";

export function AddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"url" | "pdf">("url");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) { setUrl(""); setError(null); setBusy(false); setTab("url"); }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not parse");
      const id = uid("a_");
      const item: LibraryItem = {
        id,
        kind: "article",
        title: data.title,
        byline: data.byline,
        siteName: data.siteName,
        url: data.url,
        excerpt: data.excerpt,
        thumb: data.thumb,
        wordCount: data.wordCount,
        readMinutes: estimateReadMinutes(data.wordCount ?? 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveItem(item);
      await saveArticleBody({ itemId: id, html: data.content, textLength: (data.wordCount ?? 0) * 5 });
      onClose();
      router.push(`/read/${id}`);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submitPdf(file: File) {
    setBusy(true); setError(null);
    try {
      const id = uid("p_");
      const item: LibraryItem = {
        id,
        kind: "pdf",
        title: file.name.replace(/\.pdf$/i, ""),
        wordCount: 0,
        readMinutes: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveItem(item);
      await savePdfBody({ itemId: id, blob: file });
      onClose();
      router.push(`/read/${id}`);
    } catch (err: any) {
      setError(err?.message ?? "Could not save PDF");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="surface relative w-full max-w-[480px] rounded-[12px] border line shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] p-5">
        <button
          aria-label="Close"
          className="absolute right-3 top-3 muted btn btn-ghost h-8 w-8 p-0 justify-center"
          onClick={onClose}
        >
          <X size={16} />
        </button>
        <div className="font-serif text-[18px] font-semibold mb-1">Add to Verso</div>
        <div className="muted text-[12px] mb-4">Paste a link or upload a PDF.</div>

        <div className="flex gap-1 mb-4 p-1 surface border line rounded-[10px] w-fit">
          <button
            className={"px-3 h-7 text-[12px] rounded-[6px] " + (tab === "url" ? "bg-black/[0.06] font-medium" : "muted")}
            onClick={() => setTab("url")}
          >
            <Link2 size={12} className="inline mr-1.5 -mt-px" /> Link
          </button>
          <button
            className={"px-3 h-7 text-[12px] rounded-[6px] " + (tab === "pdf" ? "bg-black/[0.06] font-medium" : "muted")}
            onClick={() => setTab("pdf")}
          >
            <FileUp size={12} className="inline mr-1.5 -mt-px" /> PDF
          </button>
        </div>

        {tab === "url" ? (
          <form onSubmit={submitUrl} className="space-y-3">
            <input
              ref={inputRef}
              className="input"
              placeholder="https://example.com/great-article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              required
            />
            {error && <div className="text-[12px] text-red-600">{error}</div>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy && <Loader2 size={13} className="animate-spin" />}
                {busy ? "Reading..." : "Save & read"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              className="w-full border-2 border-dashed line rounded-[10px] py-10 text-center muted hover:bg-black/[0.02]"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp size={20} className="mx-auto mb-2" />
              <div className="text-[13px]">Click to choose a PDF</div>
              <div className="text-[11px] mt-1 opacity-70">Stays on your device</div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) submitPdf(f);
              }}
            />
            {error && <div className="text-[12px] text-red-600">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
