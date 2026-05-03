import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Supabase session refresh middleware. Mounted in app/middleware.ts.
 * Keeps the auth cookie fresh on every navigation so server components
 * can read the current user.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          for (const c of toSet) request.cookies.set(c.name, c.value);
          response = NextResponse.next({ request });
          for (const c of toSet) response.cookies.set(c.name, c.value, c.options);
        },
      },
    },
  );

  // Triggers a refresh of the auth tokens if needed.
  await supabase.auth.getUser();

  return response;
}
