"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { listItems, listHighlights, deleteHighlight } from "@/lib/storage";
import type { Highlight, LibraryItem } from "@/lib/types";
import { HIGHLIGHT_META } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function HighlightsPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [byItem, setByItem] = useState<Record<string, Highlight[]>>({});
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const its = await listItems();
    const all = await listHighlights();
    const grouped: Record<string, Highlight[]> = {};
    for (const h of all) (grouped[h.itemId] ||= []).push(h);
    setItems(its);
    setByItem(grouped);
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  const total = Object.values(byItem).reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="flex">
      <Sidebar recent={items} />

      <main className="flex-1 min-h-screen px-5 md:px-10 py-6 md:py-9">
        <h1 className="font-serif text-[28px] font-semibold tracking-tight mb-2">Highlights</h1>
        <div className="muted text-[13px] mb-8">
          {loaded ? `${total} highlight${total === 1 ? "" : "s"} across ${Object.keys(byItem).length} ${Object.keys(byItem).length === 1 ? "read" : "reads"}` : "Loading…"}
        </div>

        {loaded && total === 0 && (
          <div className="surface border line rounded-[12px] py-14 px-6 text-center max-w-[560px]">
            <div className="font-serif text-[18px] font-semibold mb-1">Nothing highlighted yet</div>
            <div className="muted text-[13px]">Open a read and select text to start.</div>
          </div>
        )}

        <div className="space-y-10">
          {items
            .filter((it) => byItem[it.id]?.length)
            .map((it) => (
              <section key={it.id}>
                <Link href={`/read/${it.id}`} className="font-serif text-[18px] font-semibold hover:underline">
                  {it.title}
                </Link>
                {it.byline && <div className="font-serif italic muted text-[12.5px] mt-0.5">{it.byline}</div>}
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {byItem[it.id].map((h) => {
                    const meta = HIGHLIGHT_META[h.color];
                    return (
                      <div
                        key={h.id}
                        className="surface border line rounded-[10px] p-4 group relative"
                      >
                        <div
                          className="absolute left-0 top-3 bottom-3 w-[3px] rounded"
                          style={{ background: meta.bar }}
                        />
                        <div className="font-serif text-[14px] leading-[1.55] pl-2">"{h.text}"</div>
                        <div className="text-[10.5px] muted mt-2 pl-2 flex items-center justify-between">
                          <span>{meta.label}</span>
                          <button
                            className="opacity-0 group-hover:opacity-100 muted hover:text-red-600"
                            onClick={async () => {
                              await deleteHighlight(it.id, h.id);
                              load();
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      </main>
    </div>
  );
}
