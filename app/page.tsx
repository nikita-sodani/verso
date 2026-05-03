import Link from "next/link";
import { ArrowRight, BookOpen, Highlighter, Moon, Sun, Sparkles, FileText, Link2, Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-static";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 md:pt-24 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-[11px] tracking-[0.18em] uppercase muted mb-4">A reading space for the internet</div>
          <h1 className="font-serif text-[46px] md:text-[64px] leading-[1.02] tracking-[-0.02em] font-semibold mb-5">
            Read calmly. Highlight what matters. Keep it forever.
          </h1>
          <p className="font-serif text-[18px] md:text-[19px] leading-[1.6] muted max-w-[520px] mb-8">
            Verso is a Kindle-style reader for the web. Paste any article or upload a PDF —
            we strip the noise, restore the typography, and give you a place to think.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/library" className="btn btn-primary">
              Open Verso <ArrowRight size={14} />
            </Link>
            <a href="#features" className="btn btn-outline">How it works</a>
          </div>
          <div className="mt-7 text-[12px] muted">Sign in once. Your library and highlights follow you across devices.</div>
        </div>

        <HeroPreview />
      </section>

      {/* Feature row */}
      <section id="features" className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature icon={<Link2 size={16} />} title="Paste any link"
            body="Articles, essays, longreads — Verso extracts the text and serves it in a readable, distraction-free column." />
          <Feature icon={<FileText size={16} />} title="Upload PDFs"
            body="Drop in a PDF and read it like a book. Highlights and bookmarks travel with the file." />
          <Feature icon={<Highlighter size={16} />} title="Meaningful highlights"
            body="Mark passages by intent — Key idea, Insight, Important, Question. Find them all in one place." />
        </div>
      </section>

      {/* Themes */}
      <section className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-5">
          <ThemeCard name="Paper" description="Clean and bright for focused reading." icon={<Sun size={14} />} bg="#F8F7F4" fg="#1A1A1A" />
          <ThemeCard name="Night" description="Dark and calm for late-night reading." icon={<Moon size={14} />} bg="#0F1115" fg="#EAEAEA" />
          <ThemeCard name="Ember" description="Warm and cozy, like your favorite book." icon={<Sparkles size={14} />} bg="#F3E9DC" fg="#2B2B2B" />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <h2 className="font-serif text-[34px] md:text-[44px] leading-tight tracking-tight font-semibold mb-3">
          Bring your reading home.
        </h2>
        <p className="muted max-w-[520px] mx-auto mb-6 text-[15px]">
          Verso is free to use. Open it in your browser, save it to your home screen, and start reading better today.
        </p>
        <Link href="/library" className="btn btn-primary mx-auto">
          Open Verso <ArrowRight size={14} />
        </Link>
      </section>

      <footer className="border-t line">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between text-[12px] muted">
          <div className="font-serif italic">A calm, intelligent reading space for the internet.</div>
          <div>© {new Date().getFullYear()} Verso</div>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b line">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-[18px] font-semibold tracking-tight">VERSO</Link>
        <nav className="flex items-center gap-1">
          <Link href="/library" className="btn btn-ghost"><BookOpen size={14} /> Library</Link>
          <Link href="/settings" className="btn btn-ghost"><SettingsIcon size={14} /> Settings</Link>
          <Link href="/library" className="btn btn-primary">Open Verso</Link>
        </nav>
      </div>
    </header>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="surface border line rounded-[12px] p-6">
      <div className="h-7 w-7 rounded-full bg-black/[0.05] flex items-center justify-center mb-3">{icon}</div>
      <div className="font-serif text-[18px] font-semibold mb-1.5">{title}</div>
      <div className="text-[13px] leading-[1.6] muted">{body}</div>
    </div>
  );
}

function ThemeCard({ name, description, icon, bg, fg }: { name: string; description: string; icon: React.ReactNode; bg: string; fg: string }) {
  return (
    <div className="rounded-[12px] border line overflow-hidden surface">
      <div style={{ background: bg, color: fg }} className="px-6 py-7">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase opacity-70">{icon}{name}</div>
        <div className="font-serif text-[22px] font-semibold mt-3 leading-tight">The Psychology of Focus</div>
        <p className="font-serif text-[13.5px] leading-[1.65] mt-2 opacity-90">
          Focus is more than a productivity skill. It's a form of resistance. In a world designed to steal your attention,
          learning to direct it intentionally is one of the highest leverage skills you can develop.
        </p>
      </div>
      <div className="px-5 py-3 text-[12px] muted">{description}</div>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="surface border line rounded-[14px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
      <div className="px-5 py-2.5 border-b line text-[10px] tracking-[0.18em] uppercase muted flex items-center justify-between">
        <span>Reading view · Paper</span>
        <span>32%</span>
      </div>
      <div className="px-7 pt-5 pb-7">
        <div className="text-[10px] tracking-wide muted text-center mb-2">James Clear · 12 min read</div>
        <h3 className="font-serif text-[24px] md:text-[28px] font-semibold tracking-tight text-center leading-[1.15] max-w-[440px] mx-auto">
          The Psychology of Focus in a Distracted World
        </h3>
        <div className="font-serif text-[14px] leading-[1.7] mt-5 max-w-[440px] mx-auto">
          <p className="first-letter:font-serif first-letter:font-semibold first-letter:text-[42px] first-letter:leading-[0.9] first-letter:float-left first-letter:pr-1 first-letter:pt-1">
            Focus is more than a productivity skill. It's a form of resistance. In a world designed to steal your attention,
            learning to direct it intentionally is one of the highest leverage skills you can develop.
          </p>
          <p className="muted">
            We live in an age of distraction. Our devices buzz. Our inboxes never stop.
          </p>
        </div>
      </div>
    </div>
  );
}
