// shim for old scripts - works without type="module"
(async () => {
  if (!window.supabase) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const url = "https://ygaurcstrehqgdxhhnob.supabase.co";
    const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8";
    window.supabase = createClient(url, anon);
  }
})();
