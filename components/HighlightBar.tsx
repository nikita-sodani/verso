"use client";

import { useLayoutEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import type { HighlightColor } from "@/lib/types";
import { HIGHLIGHT_META } from "@/lib/types";

const COLORS: HighlightColor[] = ["key", "insight", "important", "question"];

export function HighlightBar({
  containerRef,
  onPick,
  onCopy,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  onPick: (c: HighlightColor) => void;
  onCopy: () => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    function update() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPos(null); return; }
      const range = sel.getRangeAt(0);
      const root = containerRef.current;
      if (!root || !root.contains(range.commonAncestorContainer)) { setPos(null); return; }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPos(null); return; }
      const top = rect.top + window.scrollY - 50;
      const left = rect.left + rect.width / 2 + window.scrollX;
      setPos({ top, left });
    }
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [containerRef]);

  if (!pos) return null;

  return (
    <div
      className="hl-toolbar absolute z-40 flex items-center gap-1.5 px-2.5 py-1.5 -translate-x-1/2 no-select"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {COLORS.map((c) => (
        <button
          key={c}
          aria-label={HIGHLIGHT_META[c].label}
          title={HIGHLIGHT_META[c].label}
          onClick={() => onPick(c)}
          className="h-6 w-6 rounded-full border border-black/10 hover:scale-110 transition"
          style={{ background: HIGHLIGHT_META[c].bg }}
        />
      ))}
      <span className="h-4 w-px bg-current opacity-15 mx-1" />
      <button
        aria-label="Copy"
        onClick={onCopy}
        className="h-6 px-2 text-[11px] rounded-md hover:bg-black/[0.05]"
      >
        Copy
      </button>
      <button
        aria-label="Bookmark"
        onClick={() => onPick("key")}
        className="h-6 w-6 rounded-md hover:bg-black/[0.05] flex items-center justify-center"
      >
        <Bookmark size={12} />
      </button>
    </div>
  );
}
