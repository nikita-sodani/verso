"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { saveItem, saveArticleBody } from "@/lib/sync";
import { uid, estimateReadMinutes } from "@/lib/util";
import type { LibraryItem } from "@/lib/types";

type Status = "parsing" | "saving" | "done" | "error";

export function AddArticle() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url") ?? "";

  const [status, setStatus] = useState<Status>(url ? "parsing" : "error");
  const [error, setError] = useState<string | null>(url ? null : "No URL provided.");
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    (async () => {
      try {
        setStatus("parsing");
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not read this page");
        if (cancelled) return;

        setTitle(data.title);
        setStatus("saving");

        const id = uid("a_");
        const item: LibraryItem = {
          id,
          kind: "article",
          title: data.title,
          byline: data.byline,
          siteName: data.siteName,
          url: data.url,
          excerpt: data.excerpt,
          thumb: data.thumb,
          wordCount: data.wordCount,
          readMinutes: estimateReadMinutes(data.wordCount ?? 0),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveItem(item);
        await saveArticleBody({
          itemId: id,
          html: data.content,
          textLength: (data.wordCount ?? 0) * 5,
        });

        if (cancelled) return;
        setStatus("done");
        router.push(`/read/${id}`);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Something went wrong");
        setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const domain = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  })();

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-[400px] text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={22} className="text-red-600" />
            </div>
          </div>
          <div className="font-serif text-[22px] font-semibold mb-2">
            Couldn&rsquo;t save article
          </div>
          <p className="muted text-[13px] mb-1">{error}</p>
          {url && (
            <p className="text-[12px] muted mb-6 truncate">{domain}</p>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/library" className="btn btn-outline">
              Back to library
            </Link>
            {url && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setStatus("parsing");
                  setError(null);
                  // re-trigger via page reload with same params
                  window.location.reload();
                }}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] text-center">
        <Link href="/" className="inline-block mb-8">
          <span className="font-serif text-[22px] font-semibold tracking-tight">Verso</span>
        </Link>

        <div className="flex justify-center mb-5">
          {status === "done" ? (
            <div className="h-12 w-12 rounded-full bg-black/[0.06] flex items-center justify-center">
              <BookOpen size={22} />
            </div>
          ) : (
            <Loader2 size={32} className="animate-spin muted" />
          )}
        </div>

        <div className="font-serif text-[20px] font-semibold mb-1">
          {status === "parsing" && "Reading article…"}
          {status === "saving" && "Saving to library…"}
          {status === "done" && "Saved! Opening…"}
        </div>

        {title && status !== "parsing" ? (
          <p className="muted text-[13px] mt-1 line-clamp-2">{title}</p>
        ) : (
          <p className="muted text-[13px] mt-1 truncate">{domain}</p>
        )}
      </div>
    </div>
  );
}
