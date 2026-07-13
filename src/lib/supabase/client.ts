/**
 * Supabase client — lazy singleton, only constructed on first use.
 *
 * This avoids crashing at module-evaluation time when env vars are
 * missing (e.g. during CI builds that only generate static page shells
 * and never actually query Supabase).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}
