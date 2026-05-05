"use client";

/**
 * PdfViewer — renders a PDF blob natively using PDF.js (pdfjs-dist).
 *
 * Each page is a <canvas> element. Pages are rendered lazily as they scroll
 * into view via IntersectionObserver, so a 200-page PDF loads fast.
 */

import { useEffect, useRef, useState } from "react";

// Scale at which pages are rendered.
// 1.5 × devicePixelRatio gives crisp text on retina screens.
const BASE_SCALE = 1.5;

// ─── Single page ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PdfPage({ doc, pageNum, scale }: { doc: any; pageNum: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendered = useRef(false);
  const [visible, setVisible] = useState(false);

  // Reveal when the placeholder enters the viewport
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Render once visible
  useEffect(() => {
    if (!visible || rendered.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderTask: any = null;

    (async () => {
      const page = await doc.getPage(pageNum);
      if (cancelled) return;

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // CSS size stays device-independent pixels
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;

      renderTask = page.render({ canvas, canvasContext: ctx, viewport });
      try {
        await renderTask.promise;
        rendered.current = true;
      } catch {
        // cancelled — ignore
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [visible, doc, pageNum, scale]);

  return (
    <canvas
      ref={canvasRef}
      className="block mx-auto rounded shadow-sm"
      style={{ maxWidth: "100%", background: "#fff" }}
    />
  );
}

// ─── Full document ────────────────────────────────────────────────────────────

export function PdfViewer({ blob }: { blob: Blob }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doc, setDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let loadingTask: any = null;

    (async () => {
      try {
        // Dynamic import so PDF.js is never bundled into the main chunk
        const pdfjs = await import("pdfjs-dist");

        // Point to the worker served as a static file from /public
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const loaded = await loadingTask.promise;
        if (cancelled) { loaded.destroy(); return; }

        setDoc(loaded);
        setNumPages(loaded.numPages);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy?.();
    };
  }, [blob]);

  if (error) {
    return (
      <div className="muted text-sm py-20 text-center">
        Failed to load PDF: {error}
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="muted text-sm py-20 text-center">Rendering PDF…</div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      {Array.from({ length: numPages }, (_, i) => (
        <PdfPage key={i + 1} doc={doc} pageNum={i + 1} scale={BASE_SCALE} />
      ))}
    </div>
  );
}
