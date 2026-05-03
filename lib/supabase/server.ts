import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Server-side Supabase client for Server Components, Route Handlers,
 * and Server Actions. Reads/writes auth cookies via next/headers.
 */
export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            for (const c of toSet) cookieStore.set(c.name, c.value, c.options);
          } catch {
            // Server Components can't set cookies; safe to ignore — middleware
            // handles refresh.
          }
        },
      },
    },
  );
}
