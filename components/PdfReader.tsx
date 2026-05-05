"use client";

import { useEffect, useState } from "react";
import { loadPdfBlob } from "@/lib/pdfStorage";
import { PdfViewer } from "./PdfViewer";

export function PdfReader({
  itemId,
  containerRef,
}: {
  itemId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerRef?: React.RefObject<any>;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    (async () => {
      const b = await loadPdfBlob(itemId);
      if (b) setBlob(b);
    })();
  }, [itemId]);

  if (!blob) {
    return <div className="muted text-sm py-20 text-center">Loading PDF…</div>;
  }

  return (
    <div className="px-3 md:px-6 py-6">
      <div className="max-w-[900px] mx-auto">
        <PdfViewer blob={blob} containerRef={containerRef} />
      </div>
    </div>
  );
}
