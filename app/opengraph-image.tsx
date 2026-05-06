import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#111111",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Faint oversized V watermark */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: 20,
            fontSize: 500,
            color: "#ffffff",
            opacity: 0.04,
            fontWeight: 700,
            lineHeight: 1,
            display: "flex",
          }}
        >
          V
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            display: "flex",
          }}
        >
          VERSO
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.5)",
            marginTop: 28,
            letterSpacing: "0.01em",
            display: "flex",
          }}
        >
          A calm, intelligent reading space for the internet
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.22)",
            marginTop: 60,
            letterSpacing: "0.08em",
            display: "flex",
          }}
        >
          read-with-verso.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
