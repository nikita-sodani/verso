"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/library";
  const initialError = params.get("error");

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "magic" | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [magicSent, setMagicSent] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setBusy("google");
    const supabase = getSupabaseBrowser();
    const redirectTo =
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setBusy(null);
    }
    // On success the browser is redirected; no need to clear busy.
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy("magic");
    const supabase = getSupabaseBrowser();
    const emailRedirectTo =
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className="surface border line rounded-[10px] p-5">
        <div className="font-serif text-[16px] font-semibold mb-1">Check your email</div>
        <p className="muted text-[13px]">
          We sent a sign-in link to <span className="text-current">{email}</span>.
          Click it to finish signing in. The link expires in an hour.
        </p>
        <button
          className="btn btn-ghost mt-4 -ml-3 text-[12.5px]"
          onClick={() => { setMagicSent(false); setEmail(""); }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn btn-outline w-full justify-center h-[42px]"
        disabled={busy !== null}
        onClick={signInWithGoogle}
      >
        {busy === "google" ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 divider" />
        <div className="muted text-[11px] tracking-[0.18em] uppercase">or</div>
        <div className="flex-1 divider" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={busy !== null}
        />
        <button
          type="submit"
          className="btn btn-primary w-full justify-center h-[42px]"
          disabled={busy !== null}
        >
          {busy === "magic" ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Email me a sign-in link
        </button>
      </form>

      {error && (
        <div className="text-[12.5px] text-red-600 mt-2">{error}</div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.11z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853"/>
      <path d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.46 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
    </svg>
  );
}
