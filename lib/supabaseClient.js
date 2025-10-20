// Single Supabase browser client (Supabase JS v2)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url =
  window.__ENV?.SUPABASE_URL ||
  window.SUPABASE_URL ||
  "https://ygaurcstrehqgdxhhnob.supabase.co";

const anon =
  window.__ENV?.SUPABASE_ANON_KEY ||
  window.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8";

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// Also expose globally for old non-module scripts
window.supabase = window.supabase || supabase;
