"use client";

import type { LibraryItem } from "@/lib/types";

const GRADS = [
  "linear-gradient(135deg, #1B2A3D, #4A5C72 60%, #C9C2A6)",
  "linear-gradient(160deg, #C7B69A, #8E7A56 70%, #3E331E)",
  "radial-gradient(circle at 70% 35%, #F5EAD0 0%, #D9BD86 30%, #2B2A2A 75%)",
  "linear-gradient(180deg, #F2EBDD, #E2D2B6)",
  "linear-gradient(160deg, #E9DEC6, #C9B58F)",
  "linear-gradient(165deg, #D9C7A6, #A88A5C)",
  "linear-gradient(135deg, #2B2B2B, #6B6B6B 80%, #C9C2A6)",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Thumb({ item, className }: { item: LibraryItem; className?: string }) {
  if (item.thumb) {
    return (
      <div
        className={className}
        style={{ backgroundImage: `url(${item.thumb})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden
      />
    );
  }
  const idx = hash(item.title || item.id) % GRADS.length;
  return (
    <div className={className} style={{ background: GRADS[idx], position: "relative" }} aria-hidden>
      {item.kind === "pdf" && (
        <span
          style={{
            position: "absolute", top: 8, right: 10,
            background: "#C53A3A", color: "#fff",
            fontSize: 9, fontWeight: 700, padding: "2px 5px",
            borderRadius: 3, letterSpacing: "0.05em",
            fontFamily: "var(--font-sans)",
          }}
        >
          PDF
        </span>
      )}
    </div>
  );
}
