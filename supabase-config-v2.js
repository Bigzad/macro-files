// supabase-config-v2.js — cache-busted build for GitHub Pages (Oct 2025)
/* ==========================================================================
   SUPABASE CONFIG (Unified, Safe, Final)
   - Handles Supabase client + authWrapper alias
   - Auto reconnects and adds delayed safety init
   ========================================================================== */
(function () {
  const SUPABASE_URL = "https://ygaurcstrehqgdxhhnob.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8";

  if (!window.supabase || typeof window.supabase.from !== "function") {
    if (typeof supabase === "undefined" || !supabase.createClient) {
      console.error("❌ Supabase UMD not loaded before config.");
      return;
    }
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  // Notification utility
  function notify(msg, type = "info", ms = 2800) {
    const colors = { success: "#2E7D32", error: "#C62828", info: "#1565C0", warn: "#EF6C00" };
    const div = document.createElement("div");
    div.textContent = msg;
    Object.assign(div.style, {
      position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
      background: colors[type] || colors.info, color: "#fff",
      padding: "10px 16px", borderRadius: "10px",
      boxShadow: "0 4px 16px rgba(0,0,0,.25)", fontFamily: "Inter, sans-serif",
      fontSize: "14px", zIndex: 9999, opacity: 0, transition: "opacity .25s ease"
    });
    document.body.appendChild(div);
    requestAnimationFrame(() => div.style.opacity = 1);
    setTimeout(() => { div.style.opacity = 0; setTimeout(() => div.remove(), 300); }, ms);
  }
  window.__notify = notify;

  // Auth system
  window.authSystem = {
    async signIn(email, password) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("🔐 Signed in:", data.user?.email);
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

  if (sb?.auth?.onAuthStateChange) {
    sb.auth.onAuthStateChange((event) => console.log("🪪 Auth state:", event));
  }

  // Page guard redirects
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const { data } = await sb.auth.getSession();
      const page = (location.pathname.split("/").pop() || "").toLowerCase();
      if ((page === "" || page === "index.html") && data?.session) location.href = "app.html";
      if (page === "app.html" && !data?.session) {
        notify("Session expired — please log in again", "warn");
        setTimeout(() => (location.href = "index.html"), 1200);
      }
    } catch (e) {
      console.warn("Guard check failed:", e?.message);
    }
  });

  // Legacy compatibility
  if (!window.authWrapper && window.authSystem) {
    window.authWrapper = window.authSystem;
    console.log("🧩 Auth wrapper alias added for compatibility.");
  }
  if (window.authWrapper && !window.authWrapper.init) {
    window.authWrapper.init = function() {
      console.log("🧩 authWrapper.init() called — handled automatically by Supabase.");
    };
  }

  // ✅ Option B: delayed safety init to handle early calls
  setTimeout(() => {
    if (window.authWrapper && !window.authWrapper.__autoInitDone) {
      window.authWrapper.__autoInitDone = true;
      try {
        window.authWrapper.init?.();
        console.log("⏱️ Delayed authWrapper.init() executed safely.");
      } catch (err) {
        console.warn("Skipped auto-init:", err.message);
      }
    }
  }, 1200);

  window.__SUPABASE_READY__ = true;
  document.dispatchEvent(new CustomEvent("supabase:ready"));
})();