import { createClient } from "@supabase/supabase-js";

/* Server-only Supabase client using the service role key.

   Never import this from a Client Component, page rendered in the
   browser, or anywhere with "use client". The service role key bypasses
   RLS and must stay server-side.

   The client is cached at module scope so we don't pay the construction
   cost on every request — but each request still gets a stateless
   connection so this is safe across concurrent requests. */

let cached = null;

export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars — need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
