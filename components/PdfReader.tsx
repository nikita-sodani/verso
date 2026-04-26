"use client";

import { useEffect, useState } from "react";
import { getPdfBody } from "@/lib/storage";

export function PdfReader({ itemId }: { itemId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    (async () => {
      const body = await getPdfBody(itemId);
      if (!body) return;
      const u = URL.createObjectURL(body.blob);
      revoke = u;
      setUrl(u);
    })();
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [itemId]);

  if (!url) {
    return <div className="muted text-sm py-20 text-center">Loading PDF…</div>;
  }

  return (
    <div className="px-3 md:px-6 py-6">
      <div className="max-w-[1100px] mx-auto surface border line rounded-[10px] overflow-hidden">
        <iframe
          src={url}
          title="PDF"
          className="w-full h-[calc(100vh-120px)] block"
        />
      </div>
      <div className="text-center muted text-[11px] mt-3">
        PDFs open in your browser's built-in viewer. Highlights inside PDFs are coming soon.
      </div>
    </div>
  );
}
