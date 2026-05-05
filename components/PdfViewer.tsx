"use client";

/**
 * PdfViewer — renders a PDF blob natively using PDF.js (pdfjs-dist).
 *
 * Each page renders:
 *  - a <canvas> for the visual content
 *  - an absolutely-positioned text layer for selection / highlighting
 *
 * Pages load lazily via IntersectionObserver.
 */

import { useEffect, useRef, useState } from "react";

const BASE_SCALE = 1.5;

// ─── Single page ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PdfPage({ doc, pageNum, scale }: { doc: any; pageNum: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [visible, setVisible] = useState(false);

  // Lazy-reveal via IntersectionObserver
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Render canvas + text layer once visible
  useEffect(() => {
    if (!visible || rendered.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderTask: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let textLayer: any = null;

    (async () => {
      const page = await doc.getPage(pageNum);
      if (cancelled) return;

      const dpr = window.devicePixelRatio || 1;

      // High-DPI viewport for canvas pixels
      const viewport = page.getViewport({ scale: scale * dpr });
      // CSS-pixel viewport for text layer positions
      const textViewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const textLayerDiv = textLayerRef.current;
      if (!canvas || cancelled) return;

      // Size the canvas in physical pixels, display at CSS size
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${textViewport.width}px`;
      canvas.style.height = `${textViewport.height}px`;

      // Size text layer to match canvas CSS dimensions
      if (textLayerDiv) {
        textLayerDiv.style.width = `${textViewport.width}px`;
        textLayerDiv.style.height = `${textViewport.height}px`;
        // Clear any previous render
        textLayerDiv.innerHTML = "";
      }

      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;

      // Start canvas render
      renderTask = page.render({ canvas, canvasContext: ctx, viewport });

      // Build text layer in parallel
      const pdfjs = await import("pdfjs-dist");
      if (!cancelled && textLayerDiv) {
        const textContent = await page.getTextContent();
        if (!cancelled) {
          textLayer = new pdfjs.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: textViewport,
          });
          textLayer.render().catch(() => {/* cancelled */});
        }
      }

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
      textLayer?.cancel();
    };
  }, [visible, doc, pageNum, scale]);

  return (
    // Relative wrapper so text layer can be positioned over the canvas
    <div className="relative mx-auto shadow-sm rounded overflow-hidden" style={{ display: "table" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", background: "#fff", maxWidth: "100%" }}
      />
      <div ref={textLayerRef} className="pdf-text-layer" />
    </div>
  );
}

// ─── Full document ────────────────────────────────────────────────────────────

export function PdfViewer({
  blob,
  containerRef,
}: {
  blob: Blob;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerRef?: React.RefObject<any>;
}) {
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
        const pdfjs = await import("pdfjs-dist");
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

    return () => { cancelled = true; loadingTask?.destroy?.(); };
  }, [blob]);

  if (error) {
    return <div className="muted text-sm py-20 text-center">Failed to load PDF: {error}</div>;
  }
  if (!doc) {
    return <div className="muted text-sm py-20 text-center">Rendering PDF…</div>;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-5 py-4">
      {Array.from({ length: numPages }, (_, i) => (
        <PdfPage key={i + 1} doc={doc} pageNum={i + 1} scale={BASE_SCALE} />
      ))}
    </div>
  );
}
