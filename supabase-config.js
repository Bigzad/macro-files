// ✅ Synchronous Supabase client loader for non-module environments
(function () {
  if (window.supabase && typeof window.supabase.from === "function") return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = () => {
    const url = "https://ygaurcstrehqgdxhhnob.supabase.co";
    const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8";
    window.supabase = supabase.createClient(url, anon);
    console.log("✅ Supabase client initialized via CDN");
  };
  document.head.appendChild(script);
})();
