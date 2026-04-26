"use client";

import { Download, X, Trash2 } from "lucide-react";
import type { Highlight, LibraryItem } from "@/lib/types";
import { HIGHLIGHT_META } from "@/lib/types";

export function HighlightsSidebar({
  open, onClose, highlights, item, onDelete, onScrollTo,
}: {
  open: boolean;
  onClose: () => void;
  highlights: Highlight[];
  item: LibraryItem;
  onDelete: (id: string) => void;
  onScrollTo: (id: string) => void;
}) {
  if (!open) return null;

  function exportMarkdown() {
    const lines: string[] = [];
    lines.push(`# ${item.title}`);
    if (item.byline) lines.push(`*${item.byline}*`);
    if (item.url) lines.push(item.url);
    lines.push("");
    for (const h of highlights) {
      lines.push(`> ${h.text.replace(/\n+/g, " ")}`);
      lines.push(`— ${HIGHLIGHT_META[h.color].label}`);
      lines.push("");
    }
    const md = lines.join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (item.title || "highlights").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") + ".md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <aside className="hidden lg:flex flex-col w-[280px] shrink-0 border-l line h-screen sticky top-0">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="font-serif text-[16px] font-semibold">Highlights</div>
        <button onClick={onClose} className="muted hover:opacity-100" aria-label="Close highlights">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-5">
        {highlights.length === 0 && (
          <div className="muted text-[12.5px] py-10 text-center font-serif">
            Select text to start highlighting.
          </div>
        )}
        {highlights.map((h) => {
          const meta = HIGHLIGHT_META[h.color];
          return (
            <div key={h.id} className="group mb-4 cursor-pointer" onClick={() => onScrollTo(h.id)}>
              <div className="border-l-[3px] pl-3 py-0.5" style={{ borderColor: meta.bar }}>
                <div className="font-serif text-[12.5px] leading-[1.55]">"{h.text}"</div>
                <div className="text-[10px] muted mt-1.5 flex items-center justify-between">
                  <span>{meta.label}</span>
                  <button
                    aria-label="Delete highlight"
                    className="opacity-0 group-hover:opacity-100 muted hover:text-red-600"
                    onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-4 border-t line">
        <button
          onClick={exportMarkdown}
          disabled={highlights.length === 0}
          className="btn btn-outline w-full justify-center disabled:opacity-50"
        >
          <Download size={13} /> Export highlights
        </button>
      </div>
    </aside>
  );
}
