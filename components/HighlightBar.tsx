"use client";

import { useLayoutEffect, useState } from "react";
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
    let mouseDown = false;

    function update() {
      // Don't reposition while the user is still dragging
      if (mouseDown) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPos(null); return; }

      const range = sel.getRangeAt(0);
      const root = containerRef.current;
      if (!root || !root.contains(range.commonAncestorContainer)) { setPos(null); return; }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPos(null); return; }

      // Position relative to the scrollable <main> container, not the window.
      // main has `position: relative`, so absolute children are offset from its top-left.
      const scrollEl = root.closest("main") ?? root.parentElement;
      const scrollElRect = scrollEl?.getBoundingClientRect() ?? { top: 0, left: 0 };
      const scrollTop = scrollEl?.scrollTop ?? 0;
      const scrollLeft = scrollEl?.scrollLeft ?? 0;

      const top = rect.top - scrollElRect.top + scrollTop - 48;
      const left = rect.left - scrollElRect.left + scrollLeft + rect.width / 2;

      setPos({ top, left });
    }

    function onPointerDown() {
      mouseDown = true;
      // Don't call setPos(null) here — selectionchange handles it when the
      // selection collapses. If the user clicked the toolbar, e.preventDefault()
      // keeps the selection alive until onClick fires.
    }

    function onPointerUp() {
      mouseDown = false;
      // Small delay so the selection finalises before we measure
      requestAnimationFrame(update);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
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
      onPointerDown={(e) => e.preventDefault()} // prevent selection loss on click
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
    </div>
  );
}
