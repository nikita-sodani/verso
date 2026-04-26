"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { getSettings, saveSettings, listItems } from "@/lib/storage";
import type { FontMode, LibraryItem, Settings, ThemeId } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

const THEMES: { id: ThemeId; label: string; sub: string; bg: string; fg: string }[] = [
  { id: "paper", label: "Paper", sub: "Clean & bright", bg: "#F8F7F4", fg: "#1A1A1A" },
  { id: "night", label: "Night", sub: "Dark & calm",   bg: "#0F1115", fg: "#EAEAEA" },
  { id: "ember", label: "Ember", sub: "Warm & cozy",   bg: "#F3E9DC", fg: "#2B2B2B" },
];
const FONTS: { id: FontMode; label: string; sub: string }[] = [
  { id: "editorial", label: "Editorial", sub: "Serif" },
  { id: "modern",    label: "Modern",    sub: "Sans"  },
  { id: "book",      label: "Book",      sub: "Serif" },
];

export default function SettingsPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => { (async () => {
    setItems(await listItems());
    setS(await getSettings());
  })(); }, []);

  async function update(next: Settings) {
    setS(next);
    await saveSettings(next);
    const html = document.documentElement;
    html.classList.remove("theme-paper", "theme-night", "theme-ember");
    html.classList.add(`theme-${next.theme}`);
    html.classList.remove("font-editorial", "font-modern", "font-book");
    html.classList.add(`font-${next.fontMode}`);
    html.style.setProperty("--reader-fs", next.fontSize + "px");
    html.style.setProperty("--reader-lh", String(next.lineHeight));
    html.style.setProperty("--reader-w", next.columnWidth + "px");
  }

  return (
    <div className="flex">
      <Sidebar recent={items} />
      <main className="flex-1 min-h-screen px-5 md:px-10 py-6 md:py-9">
        <h1 className="font-serif text-[28px] font-semibold tracking-tight mb-2">Reading Settings</h1>
        <div className="muted text-[13px] mb-8">Tune typography and atmosphere. Changes save automatically.</div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[820px]">
          <Panel title="Theme">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={
                    "rounded-[10px] border p-2.5 text-left transition " +
                    (s.theme === t.id ? "border-current ring-1 ring-current/40" : "line hover:border-current/40")
                  }
                  onClick={() => update({ ...s, theme: t.id })}
                >
                  <div className="rounded-[6px] h-12 mb-2 border line" style={{ background: t.bg, color: t.fg }} />
                  <div className="text-[12.5px] font-medium">{t.label}</div>
                  <div className="text-[11px] muted">{t.sub}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Typeface">
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => update({ ...s, fontMode: f.id })}
                  className={
                    "rounded-[10px] border py-3 px-2 text-center " +
                    (s.fontMode === f.id ? "border-current font-medium" : "line muted")
                  }
                >
                  <div className="text-[13px]">{f.label}</div>
                  <div className="text-[11px] opacity-70">{f.sub}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Font size">
            <Slider
              value={s.fontSize} min={14} max={24} step={1}
              onChange={(v) => update({ ...s, fontSize: v })}
              format={(v) => `${v}px`}
            />
          </Panel>

          <Panel title="Line height">
            <Slider
              value={s.lineHeight} min={1.3} max={2.0} step={0.05}
              onChange={(v) => update({ ...s, lineHeight: parseFloat(v.toFixed(2)) })}
              format={(v) => v.toFixed(2)}
            />
          </Panel>

          <Panel title="Column width">
            <Slider
              value={s.columnWidth} min={560} max={920} step={10}
              onChange={(v) => update({ ...s, columnWidth: v })}
              format={(v) => `${v}px`}
            />
          </Panel>
        </div>

        <div className="mt-10 max-w-[640px]">
          <div className="font-serif text-[16px] font-semibold mb-2">Your data</div>
          <p className="muted text-[13px] leading-[1.6]">
            Verso stores your library and highlights in your browser. No account, no cloud.
            Clear your browser data and your reads will be gone — export anything you want to keep.
          </p>
        </div>
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface border line rounded-[12px] p-5">
      <div className="text-[10px] tracking-[0.18em] uppercase muted mb-3">{title}</div>
      {children}
    </div>
  );
}

function Slider({
  value, min, max, step, onChange, format,
}: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <div>
      <div className="flex justify-between mb-2 text-[12px]">
        <span className="muted">{format(min)}</span>
        <span className="font-medium">{format(value)}</span>
        <span className="muted">{format(max)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-current"
      />
    </div>
  );
}
