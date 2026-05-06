import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Load a single weight of Source Serif 4 from Google Fonts
async function fetchFont(weight: 400 | 600): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,${weight}&display=swap`,
      {
        headers: {
          // Without a browser UA, Google returns a legacy format
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    ).then((r) => r.text());

    const url = css.match(/src: url\((.+?)\) format\('woff2'\)/)?.[1];
    if (!url) return null;
    return fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const [font400, font600] = await Promise.all([fetchFont(400), fetchFont(600)]);

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }[] = [];
  if (font400) fonts.push({ name: "SS4", data: font400, weight: 400, style: "normal" });
  if (font600) fonts.push({ name: "SS4", data: font600, weight: 600, style: "normal" });
  const serif = fonts.length ? '"SS4", Georgia, serif' : "Georgia, serif";

  // Verso design tokens
  const bg      = "#F8F7F4";
  const surface = "#FDFCF9";
  const border  = "#E6E3DC";
  const ink     = "#1A1A1A";
  const muted   = "#6B6B6B";

  return new ImageResponse(
    (
      <div
        style={{
          background: bg,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: serif,
        }}
      >
        {/* ── Progress bar ── */}
        <div style={{ height: 3, background: border, display: "flex" }}>
          <div style={{ width: "45%", height: "100%", background: ink, opacity: 0.7, display: "flex" }} />
        </div>

        {/* ── Reader top bar ── */}
        <div
          style={{
            height: 54,
            display: "flex",
            alignItems: "center",
            padding: "0 40px",
            gap: 16,
            background: surface,
            borderBottom: `1px solid ${border}`,
          }}
        >
          {/* Back arrow */}
          <div style={{ fontSize: 18, color: muted, display: "flex", marginRight: 4 }}>←</div>

          {/* Wordmark */}
          <div style={{ fontSize: 20, fontWeight: 600, color: ink, letterSpacing: "-0.01em", display: "flex" }}>
            VERSO
          </div>

          {/* Source URL — centred */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: muted, fontFamily: "system-ui, sans-serif", display: "flex" }}>
              thepsychology.com
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 13, color: muted, fontFamily: "system-ui, sans-serif", display: "flex" }}>45%</div>
            <div style={{ width: 1, height: 16, background: border, display: "flex" }} />
            <div style={{ fontSize: 13, color: muted, fontFamily: "system-ui, sans-serif", display: "flex" }}>🔖</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: muted, fontFamily: "system-ui, sans-serif", display: "flex" }}>Aa</div>
            <div style={{ fontSize: 13, color: muted, fontFamily: "system-ui, sans-serif", display: "flex" }}>···</div>
          </div>
        </div>

        {/* ── Article body ── */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 780,
            }}
          >
            {/* Site name */}
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                color: muted,
                marginBottom: 18,
                fontFamily: "system-ui, sans-serif",
                display: "flex",
              }}
            >
              THE NEW YORKER
            </div>

            {/* Article title */}
            <div
              style={{
                fontSize: 46,
                fontWeight: 600,
                color: ink,
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              The Psychology of Focus in a Distracted World
            </div>

            {/* Byline */}
            <div
              style={{
                fontSize: 13,
                color: muted,
                marginTop: 14,
                fontFamily: "system-ui, sans-serif",
                display: "flex",
              }}
            >
              James Clear · 12 min read · 2,847 words
            </div>

            {/* Divider */}
            <div style={{ width: 40, height: 1, background: border, marginTop: 22, marginBottom: 22, display: "flex" }} />

            {/* Body text — inline spans for highlights */}
            <div
              style={{
                fontSize: 19,
                lineHeight: 1.72,
                color: ink,
                textAlign: "left",
                display: "flex",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              <span style={{ display: "inline" }}>Focus is more than a </span>
              <span style={{ display: "inline", background: "#FCE7B0", padding: "1px 4px", borderRadius: 3 }}>
                productivity skill
              </span>
              <span style={{ display: "inline" }}>. It's a form of </span>
              <span style={{ display: "inline", background: "#FBD9D2", padding: "1px 4px", borderRadius: 3 }}>
                resistance
              </span>
              <span style={{ display: "inline" }}>. In a world designed to steal your attention, learning to direct it is one of the </span>
              <span style={{ display: "inline", background: "#D9E3F4", padding: "1px 4px", borderRadius: 3 }}>
                highest leverage skills
              </span>
              <span style={{ display: "inline" }}> you can develop.</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
