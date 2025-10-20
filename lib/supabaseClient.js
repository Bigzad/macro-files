// Single Supabase browser client (Supabase JS v2)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url =
  window.__ENV?.SUPABASE_URL ||
  window.SUPABASE_URL ||                         // keep compatibility if you set globals in HTML
  "<PUT_YOUR_SUPABASE_URL_HERE>";
const anon =
  window.__ENV?.SUPABASE_ANON_KEY ||
  window.SUPABASE_ANON_KEY ||
  "<PUT_YOUR_SUPABASE_ANON_KEY_HERE>";

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// Also expose globally for old non-module scripts
window.supabase = window.supabase || supabase;
