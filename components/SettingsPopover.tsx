"use client";

import { useEffect, useRef } from "react";
import type { Settings, ThemeId, FontMode } from "@/lib/types";

const FONT_OPTIONS: { id: FontMode; label: string; sub: string }[] = [
  { id: "editorial", label: "Editorial", sub: "Serif" },
  { id: "modern", label: "Modern", sub: "Sans" },
  { id: "book", label: "Book", sub: "Serif" },
];

const THEMES: { id: ThemeId; label: string; sub: string; bg: string; fg: string }[] = [
  { id: "paper", label: "Paper", sub: "Clean & bright", bg: "#F8F7F4", fg: "#1A1A1A" },
  { id: "night", label: "Night", sub: "Dark & calm", bg: "#0F1115", fg: "#EAEAEA" },
  { id: "ember", label: "Ember", sub: "Warm & cozy", bg: "#F3E9DC", fg: "#2B2B2B" },
];

export function SettingsPopover({
  open, onClose, settings, onChange,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-[300px] surface border line rounded-[12px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] p-4 z-50"
    >
      <div className="text-[10px] tracking-[0.18em] uppercase muted mb-2">Theme</div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={
              "rounded-[10px] border p-2 text-left transition " +
              (settings.theme === t.id ? "border-current ring-1 ring-current/40" : "line hover:border-current/40")
            }
            onClick={() => onChange({ ...settings, theme: t.id })}
          >
            <div
              className="rounded-[6px] h-9 mb-2 border line"
              style={{ background: t.bg, color: t.fg }}
            />
            <div className="text-[12px] font-medium">{t.label}</div>
            <div className="text-[10.5px] muted leading-tight">{t.sub}</div>
          </button>
        ))}
      </div>

      <div className="text-[10px] tracking-[0.18em] uppercase muted mb-2">Typography</div>
      <div className="grid grid-cols-3 gap-1.5 mb-5">
        {FONT_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange({ ...settings, fontMode: f.id })}
            className={
              "rounded-[8px] border py-2 px-1 text-center " +
              (settings.fontMode === f.id ? "border-current font-medium" : "line muted")
            }
          >
            <div className="text-[12px]">{f.label}</div>
            <div className="text-[10px] opacity-70">{f.sub}</div>
          </button>
        ))}
      </div>

      <Slider
        label="Font size" value={settings.fontSize} min={14} max={24} step={1}
        onChange={(v) => onChange({ ...settings, fontSize: v })}
        leftIcon={<span className="text-[10px]">A</span>}
        rightIcon={<span className="text-[14px]">A</span>}
      />
      <Slider
        label="Line height" value={settings.lineHeight} min={1.3} max={2.0} step={0.05}
        onChange={(v) => onChange({ ...settings, lineHeight: parseFloat(v.toFixed(2)) })}
        format={(v) => v.toFixed(2)}
        leftIcon={<Lines n={2} />}
        rightIcon={<Lines n={3} />}
      />
      <Slider
        label="Width" value={settings.columnWidth} min={560} max={920} step={10}
        onChange={(v) => onChange({ ...settings, columnWidth: v })}
        format={(v) => v + "px"}
      />
    </div>
  );
}

function Lines({ n }: { n: number }) {
  return (
    <span className="inline-flex flex-col gap-[2px]">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="block h-[1.5px] w-[10px] bg-current opacity-70" />
      ))}
    </span>
  );
}

function Slider({
  label, value, min, max, step, onChange, format, leftIcon, rightIcon,
}: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[12px] font-medium">{label}</div>
        <div className="text-[11px] muted">{format ? format(value) : value}</div>
      </div>
      <div className="flex items-center gap-2.5">
        {leftIcon && <span className="muted">{leftIcon}</span>}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-current"
        />
        {rightIcon && <span className="muted">{rightIcon}</span>}
      </div>
    </div>
  );
}
