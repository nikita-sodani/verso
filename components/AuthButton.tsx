"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};

export function AuthButton() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let mounted = true;

    // getSession() reads from storage — no navigator lock contention.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setProfile(toProfile(data.session?.user ?? null));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(toProfile(session?.user ?? null));
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setOpen(false);
    // Hard reload so any in-memory IDB-only state is cleared.
    window.location.href = "/";
  }

  if (profile === undefined) {
    return <div className="h-8 w-20 rounded-md surface animate-pulse" />;
  }

  if (profile === null) {
    return (
      <Link href="/login" className="btn btn-outline">
        <LogIn size={13} /> Sign in
      </Link>
    );
  }

  const initial = (profile.name || profile.email || "?").charAt(0).toUpperCase();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full bg-black/[0.06] hover:bg-black/[0.12] flex items-center justify-center text-[13px] font-medium overflow-hidden"
        aria-label="Account menu"
      >
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && (
        <>
          <button
            aria-hidden
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 surface border line rounded-md text-[13px] py-1 z-40 w-[220px] shadow-lg">
            <div className="px-3 py-2 border-b line">
              <div className="text-[12.5px] font-medium truncate">{profile.name || "Signed in"}</div>
              <div className="muted text-[11.5px] truncate">{profile.email}</div>
            </div>
            <Link href="/settings"
              className="block px-3 py-2 hover:bg-black/[0.04]"
              onClick={() => setOpen(false)}>
              <span className="inline-flex items-center gap-2"><User size={13} /> Account</span>
            </Link>
            <button
              className="w-full text-left px-3 py-2 hover:bg-black/[0.04] flex items-center gap-2"
              onClick={signOut}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function toProfile(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): Profile | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: u.id,
    email: u.email ?? null,
    name: (meta.full_name as string) || (meta.name as string) || null,
    avatar: (meta.avatar_url as string) || (meta.picture as string) || null,
  };
}
