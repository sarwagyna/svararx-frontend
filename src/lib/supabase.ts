import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return { url, key };
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  if (!client) {
    client = createBrowserClient(url, key);
  }
  return client;
}

/** Lazy proxy so build-time imports do not require env vars. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(getSupabase()) : value;
  },
});

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}
