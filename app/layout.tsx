import type { Metadata } from "next";
import "./globals.css";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import { SyncBoot } from "@/components/SyncBoot";

export const metadata: Metadata = {
  title: "Verso — A calm, intelligent reading space",
  description:
    "A Kindle-style reader for the web. Paste any article or upload a PDF — read, highlight, and remember what matters.",
  metadataBase: new URL("https://read-with-verso.vercel.app"),
  openGraph: {
    title: "Verso — A calm, intelligent reading space",
    description:
      "A Kindle-style reader for the web. Paste any article or upload a PDF — read, highlight, and remember what matters.",
    url: "https://read-with-verso.vercel.app",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Verso" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verso — A calm, intelligent reading space",
    description:
      "A Kindle-style reader for the web. Paste any article or upload a PDF — read, highlight, and remember what matters.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-paper">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeBootstrap />
        <SyncBoot />
        {children}
      </body>
    </html>
  );
}
