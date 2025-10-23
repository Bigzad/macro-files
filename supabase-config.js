/* ==========================================================================
   SUPABASE CONFIG (Unified) — Non-module safe
   - Creates a single Supabase client on window.supabase
   - Provides authSystem (email + password), persistent sessions
   - Top-center notifications (no alert())
   ========================================================================== */
(function () {
  // --- Guard: require Supabase UMD to be loaded first ---
  if (typeof window.supabase === "object" && typeof window.supabase.from === "function") {
    console.log("ℹ️ Supabase client already present, skipping re-init.");
  } else if (typeof window.supabase === "object" && !window.supabase.from) {
    // If a placeholder object was set, replace it with real client.
    console.log("♻️ Replacing placeholder supabase with real client...");
    window.supabase = window.supabase.createClient
      ? window.supabase.createClient("https://ygaurcstrehqgdxhhnob.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8")
      : supabase.createClient("https://ygaurcstrehqgdxhhnob.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8");
  } else {
    // Create fresh client via UMD global 'supabase'
    if (typeof supabase === "undefined" || !supabase.createClient) {
      console.error("❌ Supabase UMD library not loaded. Ensure the SDK script is before this file.");
      return;
    }
    window.supabase = supabase.createClient("https://ygaurcstrehqgdxhhnob.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8", {
      auth: {
        persistSession: true,
        storageKey: "macro-app-session",
        detectSessionInUrl: true,
        autoRefreshToken: true
      }
    });
    console.log("✅ Supabase client initialized");
  }

  const sb = window.supabase;

  // --- Lightweight top-center notification banners ---
  function notify(msg, type = "info", ms = 3500) {
    const palette = { success: "#2E7D32", error: "#C62828", info: "#1565C0", warn: "#EF6C00" };
    const bar = document.createElement("div");
    bar.textContent = msg;
    Object.assign(bar.style, {
      position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
      background: palette[type] || palette.info, color: "#fff",
      padding: "10px 18px", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,.25)",
      fontFamily: "Inter, system-ui, sans-serif", fontSize: "14px",
      zIndex: 2147483647, opacity: 0, transition: "opacity .25s ease"
    });
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.style.opacity = 1);
    setTimeout(() => { bar.style.opacity = 0; setTimeout(() => bar.remove(), 300); }, ms);
  }
  window.__notify = notify;

  // --- authSystem helpers (email + password) ---
  window.authSystem = {
    async signIn(email, password) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("🔐 SIGNED IN:", data.user?.email);
        notify("Login successful — redirecting...", "success");
        setTimeout(() => (window.location.href = "app.html"), 900);
      } catch (e) {
        console.error("Login error:", e);
        notify("Incorrect email or password", "error");
      }
    },
    async signOut() {
      try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
        notify("Signed out", "info");
        setTimeout(() => (window.location.href = "index.html"), 800);
      } catch (e) {
        console.error("Sign-out error:", e);
        notify("Error signing out", "error");
      }
    },
    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session || null;
    }
  };

  // --- Auth change logs (safe even if called early) ---
  if (sb && sb.auth && typeof sb.auth.onAuthStateChange === "function") {
    sb.auth.onAuthStateChange((event) => {
      console.log("🪪 onAuthStateChange:", event);
    });
  }

  // --- Mark readiness for other scripts ---
  window.__SUPABASE_READY__ = true;
  document.dispatchEvent(new CustomEvent("supabase:ready"));
})();
