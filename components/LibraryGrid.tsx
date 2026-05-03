"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, MoreHorizontal, Trash2, Bookmark, Archive } from "lucide-react";
import type { LibraryItem } from "@/lib/types";
import { listItems } from "@/lib/storage";
import { saveItem, deleteItem } from "@/lib/sync";
import { Sidebar } from "./Sidebar";
import { Thumb } from "./Thumb";
import { AddDialog } from "./AddDialog";
import { AuthButton } from "./AuthButton";

type Filter = "all" | "articles" | "pdfs" | "bookmarked" | "archived";

export function LibraryGrid() {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    const f = params.get("filter");
    if (f === "bookmarked" || f === "archived") setTab(f);
  }, [params]);

  async function load() { setItems(await listItems()); }
  useEffect(() => { load(); }, []);

  // Refresh whenever the sync layer pulls or realtime fires.
  useEffect(() => {
    function onSync() { load(); }
    window.addEventListener("verso:sync", onSync);
    return () => window.removeEventListener("verso:sync", onSync);
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((i) => {
      if (tab === "bookmarked" && !i.bookmarked) return false;
      if (tab === "archived" && !i.archived) return false;
      if (tab !== "archived" && i.archived) return false;
      if (tab === "articles" && i.kind !== "article") return false;
      if (tab === "pdfs" && i.kind !== "pdf") return false;
      if (query) {
        const q = query.toLowerCase();
        if (!i.title.toLowerCase().includes(q) && !(i.byline ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, tab, query]);

  return (
    <div className="flex">
      <Sidebar recent={items ?? []} />

      <main className="flex-1 min-h-screen px-5 md:px-10 py-6 md:py-9">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-serif text-[28px] font-semibold tracking-tight mr-2">Library</h1>
          <div className="relative flex-1 max-w-[420px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
            <input
              className="input pl-8"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add
          </button>
          <AuthButton />
        </div>

        <div className="flex gap-6 border-b line mb-5 text-[13px]">
          {(["all", "articles", "pdfs", "bookmarked"] as Filter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "pb-2.5 -mb-px border-b-2 capitalize " +
                (tab === t ? "border-current font-medium" : "border-transparent muted hover:text-current")
              }
            >
              {t}
            </button>
          ))}
        </div>

        {items === null ? (
          <div className="muted text-sm py-20 text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setAdding(true)} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((it) => (
              <ItemCard key={it.id} item={it} onChanged={load} />
            ))}
            <button
              onClick={() => setAdding(true)}
              className="card border-dashed flex flex-col items-center justify-center py-10 text-[13px] muted hover:opacity-100"
            >
              <Plus size={20} className="mb-1" />
              Add new
            </button>
          </div>
        )}
      </main>

      <AddDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="surface border line rounded-[12px] py-16 px-8 text-center max-w-[640px] mx-auto mt-6">
      <div className="font-serif text-[22px] font-semibold mb-1">Your library is empty</div>
      <p className="muted text-[13px] max-w-[320px] mx-auto mb-5">
        Paste any article URL or upload a PDF to start a calmer kind of reading.
      </p>
      <button className="btn btn-primary mx-auto" onClick={onAdd}>
        <Plus size={14} /> Add your first read
      </button>
    </div>
  );
}

function ItemCard({ item, onChanged }: { item: LibraryItem; onChanged: () => void }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="card relative group">
      <Link href={`/read/${item.id}`} className="block">
        <Thumb item={item} className="aspect-[16/10] w-full" />
        <div className="px-3 py-3">
          <div className="font-serif text-[14px] font-semibold leading-snug line-clamp-2">{item.title}</div>
          {item.byline && <div className="font-serif italic text-[11.5px] muted mt-1 line-clamp-1">{item.byline}</div>}
          <div className="text-[11px] muted mt-2 flex items-center gap-1.5">
            {item.kind === "pdf" && <span className="font-medium">PDF</span>}
            {item.kind === "pdf" && <span>·</span>}
            <span>{item.readMinutes ?? 1} min read</span>
          </div>
        </div>
      </Link>
      <button
        aria-label="More"
        className="absolute right-2 top-2 h-7 w-7 rounded-full bg-black/[0.04] hover:bg-black/[0.1] muted opacity-0 group-hover:opacity-100 flex items-center justify-center"
        onClick={(e) => { e.preventDefault(); setMenu((v) => !v); }}
      >
        <MoreHorizontal size={14} />
      </button>
      {menu && (
        <div className="absolute right-2 top-10 surface border line rounded-md text-[12.5px] py-1 z-10 shadow-lg w-40">
          <button
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-black/[0.04] text-left"
            onClick={async () => { await saveItem({ ...item, bookmarked: !item.bookmarked, updatedAt: Date.now() }); setMenu(false); onChanged(); }}
          >
            <Bookmark size={13} /> {item.bookmarked ? "Unbookmark" : "Bookmark"}
          </button>
          <button
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-black/[0.04] text-left"
            onClick={async () => { await saveItem({ ...item, archived: !item.archived, updatedAt: Date.now() }); setMenu(false); onChanged(); }}
          >
            <Archive size={13} /> {item.archived ? "Unarchive" : "Archive"}
          </button>
          <button
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-black/[0.04] text-left text-red-600"
            onClick={async () => {
              if (confirm(`Delete "${item.title}"?`)) {
                await deleteItem(item.id);
                setMenu(false); onChanged();
              }
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
