"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { HighlightColor } from "@/lib/types";
import { HIGHLIGHT_META } from "@/lib/types";

const COLORS: HighlightColor[] = ["key", "insight", "important", "question"];

export function HighlightBar({
  containerRef,
  onPick,
  onCopy,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  onPick: (c: HighlightColor, range: Range) => void;
  onCopy: (range: Range) => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // Store the Range the moment the bar appears so clicking a colour button
  // never depends on window.getSelection() still being intact.
  const savedRange = useRef<Range | null>(null);

  useLayoutEffect(() => {
    let dragging = false;

    function measure(): { top: number; left: number } | null {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        savedRange.current = null;
        return null;
      }
      const range = sel.getRangeAt(0);
      const root = containerRef.current;
      if (!root || !root.contains(range.commonAncestorContainer)) {
        savedRange.current = null;
        return null;
      }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        savedRange.current = null;
        return null;
      }

      // Save a clone of the range — the live range object mutates if selection changes
      savedRange.current = range.cloneRange();

      // Position relative to the scrollable <main position:relative> container
      const scrollEl = root.closest("main") || root.parentElement;
      const srect = scrollEl ? scrollEl.getBoundingClientRect() : { top: 0, left: 0 };
      const st = scrollEl ? scrollEl.scrollTop : 0;
      const sl = scrollEl ? scrollEl.scrollLeft : 0;

      return {
        top: Math.max(4, rect.top - srect.top + st - 48),
        left: rect.left - srect.left + sl + rect.width / 2,
      };
    }

    function onMouseDown(e: MouseEvent) {
      if (barRef.current?.contains(e.target as Node)) return;
      dragging = true;
      setPos(null);
    }

    function onMouseUp(e: MouseEvent) {
      if (barRef.current?.contains(e.target as Node)) return;
      dragging = false;
      requestAnimationFrame(() => setPos(measure()));
    }

    // Handles keyboard selection and post-highlight cleanup
    function onSelChange() {
      if (!dragging) requestAnimationFrame(() => setPos(measure()));
    }

    function onScroll() {
      if (!dragging) setPos(measure());
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", onSelChange);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("selectionchange", onSelChange);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [containerRef]);

  if (!pos) return null;

  return (
    <div
      ref={barRef}
      className="hl-toolbar absolute z-40 flex items-center gap-1.5 px-2.5 py-1.5 -translate-x-1/2 no-select"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => {
        // Prevent the browser from collapsing the selection when the user
        // clicks inside the toolbar. The global onMouseDown is already
        // exempted via barRef.contains, so dragging stays false.
        e.preventDefault();
      }}
    >
      {COLORS.map((c) => (
        <button
          key={c}
          aria-label={HIGHLIGHT_META[c].label}
          title={HIGHLIGHT_META[c].label}
          onClick={() => {
            if (savedRange.current) onPick(c, savedRange.current);
          }}
          className="h-6 w-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
          style={{ background: HIGHLIGHT_META[c].bg }}
        />
      ))}
      <span className="h-4 w-px bg-current opacity-15 mx-1" />
      <button
        aria-label="Copy"
        onClick={() => {
          if (savedRange.current) onCopy(savedRange.current);
        }}
        className="h-6 px-2 text-[11px] rounded-md hover:bg-black/[0.05]"
      >
        Copy
      </button>
    </div>
  );
}
