/* ==========================================================================
   SUPABASE CONFIG + AUTH SYSTEM (unified)
   Handles login, logout, session persistence, and notifications.
   ========================================================================== */

(function () {
  const SUPABASE_URL = "https://ygaurcstrehqgdxhhnob.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVyY3N0cmVocWdkeGhobm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDg5MjQsImV4cCI6MjA3MzAyNDkyNH0.EAP8nJk1G4p22lE001zJPDZPnrZOh9uWj9TfP00SuJ8";

  // --- 1. Initialize Supabase client ---
  if (!window.supabase) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        storageKey: "macro-app-session",
        detectSessionInUrl: true,
        autoRefreshToken: true,
      },
    });
    console.log("✅ Supabase client initialized");
  }

  const sb = window.supabase;

  // --- 2. Notification System (Top-Center Banner) ---
  function showMessage(text, type = "info", duration = 3500) {
    const colors = {
      success: "#3CB371",
      error: "#E57373",
      info: "#3A7CA5",
      warn: "#F6BE00",
    };

    let banner = document.createElement("div");
    banner.textContent = text;
    banner.style.position = "fixed";
    banner.style.top = "20px";
    banner.style.left = "50%";
    banner.style.transform = "translateX(-50%)";
    banner.style.background = colors[type] || colors.info;
    banner.style.color = "#fff";
    banner.style.padding = "10px 20px";
    banner.style.borderRadius = "8px";
    banner.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    banner.style.fontFamily = "Inter, sans-serif";
    banner.style.fontSize = "14px";
    banner.style.zIndex = "9999";
    banner.style.opacity = "0";
    banner.style.transition = "opacity 0.3s ease";
    document.body.appendChild(banner);
    setTimeout(() => (banner.style.opacity = "1"), 50);
    setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 400);
    }, duration);
  }

  // --- 3. Auth Helpers ---
  window.authSystem = {
    async signIn(email, password) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showMessage("Login successful — redirecting...", "success");
        console.log("🔐 Authenticated user:", data.user?.email);
        setTimeout(() => (window.location.href = "app.html"), 1200);
      } catch (err) {
        console.error("Login error:", err.message);
        showMessage("Incorrect email or password", "error");
      }
    },

    async signOut() {
      try {
        const { error } = await sb.auth.signOut();
        if (error) throw error;
        showMessage("Signed out successfully", "info");
        setTimeout(() => (window.location.href = "index.html"), 1000);
      } catch (err) {
        console.error("Sign-out error:", err.message);
        showMessage("Error signing out", "error");
      }
    },

    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session;
    },
  };

  // --- 4. Session Handling + Auto Redirects ---
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      console.log("User signed in:", session.user.email);
    } else if (event === "SIGNED_OUT") {
      console.log("User signed out");
    } else if (event === "TOKEN_REFRESHED") {
      console.log("Token refreshed");
    } else if (event === "USER_UPDATED") {
      console.log("User updated");
    }
  });

  // --- 5. Page Guard (optional redirect logic) ---
  document.addEventListener("DOMContentLoaded", async () => {
    const { data } = await sb.auth.getSession();
    const path = window.location.pathname.split("/").pop();

    if (path === "index.html" && data.session) {
      // Already logged in → go to app.html
      window.location.href = "app.html";
    } else if (path === "app.html" && !data.session) {
      showMessage("Session expired — please log in again", "warn");
      setTimeout(() => (window.location.href = "index.html"), 1500);
    }
  });
})();
