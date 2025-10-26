// supabase-config-v3.js — final compatibility build
(function () {
  const SUPABASE_URL = "https://xnpsjajyjtczlxciatfy.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucHNqYWp5anRjemx4Y2lhdGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTQ4OTcsImV4cCI6MjA3Mzc5MDg5N30.DqwC4jIYskdU9iXX8c1pX6qkfX3Wvuwzx-VzySJ9YX0";

  // Create client once
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
    console.log("✅ Supabase client initialized (v3)");
  }

  const sb = window.supabase;

  // Small top banner notifier
  function notify(msg, type = "info", ms = 2600) {
    const colors = { success:"#2E7D32", error:"#C62828", info:"#1565C0", warn:"#EF6C00" };
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position:"fixed", top:"18px", left:"50%", transform:"translateX(-50%)",
      background: colors[type] || colors.info, color:"#fff",
      padding:"10px 16px", borderRadius:"10px", zIndex: 99999,
      boxShadow:"0 8px 24px rgba(0,0,0,.25)", fontFamily:"Inter,system-ui,sans-serif",
      fontSize:"14px", opacity:0, transition:"opacity .25s ease"
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = 1);
    setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300); }, ms);
  }
  window.__notify = notify;

  // Modern API
  window.authSystem = {
    async signIn(email, password) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("🔐 Signed in:", data.user?.email);
        notify("Login successful — redirecting...", "success");
        setTimeout(() => (location.href = "app.html"), 900);
      } catch (e) {
        console.error("Login error:", e?.message || e);
        notify("Incorrect email or password", "error");
      }
    },
    async signOut() {
      try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
        notify("Signed out", "info");
        setTimeout(() => (location.href = "index.html"), 800);
      } catch (e) {
        console.error("Sign-out error:", e?.message || e);
        notify("Error signing out", "error");
      }
    },
    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session || null;
    }
  };

  // Backward-compat wrapper expected by old code
  // Provides .init() and .on(event, handler) APIs
  (function ensureAuthWrapper() {
    if (!window.authWrapper) window.authWrapper = {
      // no-op initializer kept for legacy calls
      init() { console.log("🧩 authWrapper.init() called — no UI to open; handled by page logic."); },
      // legacy event system: authWrapper.on('auth', handler)
      on(event, handler) {
        if (event !== "auth" || !handler) return { unsubscribe: () => {} };
        const { data } = sb.auth.onAuthStateChange((evt, session) => handler({ event: evt, session }));
        console.log("🧩 authWrapper.on('auth', ...) attached via Supabase.");
        return data;
      },
      signIn: (...args) => window.authSystem.signIn?.(...args),
      signOut: (...args) => window.authSystem.signOut?.(...args)
    };
  })();

  // Useful logs
  if (sb?.auth?.onAuthStateChange) {
    sb.auth.onAuthStateChange((event) => console.log("🪪 onAuthStateChange:", event));
  }

  // Basic guards (redirect behavior)
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

  // expose readiness
  window.__SUPABASE_READY__ = true;
  document.dispatchEvent(new CustomEvent("supabase:ready"));
})();
