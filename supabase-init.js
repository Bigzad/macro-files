// shim: older code might call initializeSupabase() once
import { supabase } from "./lib/supabaseClient.js";

export function initializeSupabase() {
  // no-op: creating the client already happened on import
  return supabase;
}

// global back-compat just in case
window.initializeSupabase = window.initializeSupabase || initializeSupabase;
