"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Highlighter, Bookmark, Archive, Settings as SettingsIcon, BookOpen } from "lucide-react";
import type { LibraryItem } from "@/lib/types";

const NAV = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/highlights", label: "Highlights", icon: Highlighter },
  { href: "/library?filter=bookmarked", label: "Bookmarks", icon: Bookmark },
  { href: "/library?filter=archived", label: "Archive", icon: Archive },
];

export function Sidebar({ recent }: { recent: LibraryItem[] }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-[200px] shrink-0 border-r line py-6 px-4 h-screen sticky top-0">
      <Link href="/library" className="font-serif text-[20px] font-semibold tracking-tight mb-7 px-2">
        VERSO
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] " +
                (active ? "font-medium bg-black/[0.04]" : "muted hover:bg-black/[0.03]")
              }
            >
              <Icon size={15} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 px-2">
        <div className="text-[10px] tracking-[0.18em] uppercase muted mb-3">Recent</div>
        <ul className="space-y-3">
          {recent.slice(0, 4).map((it) => (
            <li key={it.id}>
              <Link href={`/read/${it.id}`} className="block">
                <div className="font-serif text-[12.5px] font-medium leading-snug line-clamp-2">{it.title}</div>
                <div className="text-[10.5px] muted mt-0.5">{it.readMinutes ?? 1} min read</div>
              </Link>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="text-[11px] muted">Saved articles appear here.</li>
          )}
        </ul>
      </div>

      <div className="mt-auto px-2 pt-6 border-t line">
        <Link href="/settings" className="flex items-center gap-2 muted text-[12px] hover:opacity-90">
          <SettingsIcon size={14} strokeWidth={1.6} /> Settings
        </Link>
        <Link href="/" className="flex items-center gap-2 muted text-[12px] mt-2 hover:opacity-90">
          <BookOpen size={14} strokeWidth={1.6} /> Home
        </Link>
      </div>
    </aside>
  );
}
