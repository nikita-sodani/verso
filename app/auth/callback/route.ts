import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auth callback. Handles two arrival shapes:
 *
 *  - OAuth (Google, etc.):  ?code=...                  -> exchangeCodeForSession
 *  - Magic link / email OTP: ?token_hash=...&type=...  -> verifyOtp
 *
 * On success, redirects to `next` (default /library).
 * On failure, bounces back to /login with an error.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/library";
  const supabase = getSupabaseServer();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
      );
    }
    return NextResponse.redirect(new URL(next, url));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url),
      );
    }
    return NextResponse.redirect(new URL(next, url));
  }

  return NextResponse.redirect(new URL("/login?error=missing-code", url));
}
