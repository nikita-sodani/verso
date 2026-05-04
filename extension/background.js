// ─── Config ────────────────────────────────────────────────────────────────
// Change this to your production URL before publishing.
// e.g. "https://versoapp.com" or your Vercel URL.
const VERSO_URL = "https://verso-app.vercel.app";

// ─── Icon (drawn with OffscreenCanvas — no PNG files needed) ───────────────
function drawIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const r = size * 0.2;

  // Rounded background
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = "#111111";
  ctx.fill();

  // "V" letterform — drawn as a path so it looks identical at all sizes
  const pad = size * 0.22;
  const top = size * 0.22;
  const bot = size * 0.78;
  const mid = size / 2;

  ctx.beginPath();
  ctx.moveTo(pad, top);               // top-left
  ctx.lineTo(mid, bot);               // bottom-center
  ctx.lineTo(size - pad, top);        // top-right
  // Stroke width proportional to size
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = size * 0.13;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

function setActionIcon() {
  try {
    chrome.action.setIcon({
      imageData: {
        16: drawIcon(16),
        48: drawIcon(48),
        128: drawIcon(128),
      },
    });
  } catch (_) {
    // Silently ignore — icon is cosmetic only
  }
}

chrome.runtime.onInstalled.addListener(setActionIcon);
chrome.runtime.onStartup.addListener(setActionIcon);

// ─── One-click save ────────────────────────────────────────────────────────
chrome.action.onClicked.addListener((tab) => {
  const url = tab.url ?? "";

  // Skip non-web pages
  if (
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("file://")
  ) {
    return;
  }

  const addUrl = `${VERSO_URL}/add?url=${encodeURIComponent(url)}`;
  chrome.tabs.create({ url: addUrl });
});
