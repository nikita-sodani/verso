"use client";

import { useEffect } from "react";
import { getSettings } from "@/lib/storage";

export function ThemeBootstrap() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSettings();
        if (cancelled) return;
        const html = document.documentElement;
        html.classList.remove("theme-paper", "theme-night", "theme-ember");
        html.classList.add(`theme-${s.theme}`);
        html.classList.remove("font-editorial", "font-modern", "font-book");
        html.classList.add(`font-${s.fontMode}`);
        html.style.setProperty("--reader-fs", s.fontSize + "px");
        html.style.setProperty("--reader-lh", String(s.lineHeight));
        html.style.setProperty("--reader-w", s.columnWidth + "px");
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}
