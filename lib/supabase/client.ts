"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser-side Supabase client. Cached as a singleton so realtime
 * subscriptions and auth state stay attached to a single instance.
 */
export function getSupabaseBrowser() {
  if (_client) return _client;
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return _client;
}
