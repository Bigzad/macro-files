// supabase-init-v2.js — cache-busted build for GitHub Pages (Oct 2025)
/* ==========================================================================
   SUPABASE INIT (Enhanced, Safe)
   - Waits for Supabase client readiness
   - Initializes authWrapper safely after Supabase loads
   ========================================================================== */
(function () {
  function waitForSupabaseReady(max = 60) {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const tick = () => {
        const ok = window.__SUPABASE_READY__ && window.supabase && typeof window.supabase.from === "function";
        if (ok) return resolve(true);
        if (tries++ >= max) return reject(new Error("Supabase not ready after waiting"));
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  (async () => {
    try {
      await waitForSupabaseReady();
      console.log("✅ Supabase is ready (supabase-init).");

      // Check session state
      const { data } = await window.supabase.auth.getSession();
      if (data?.session) {
        console.log("👤 Active session for:", data.session.user.email);
      } else {
        console.log("🚪 No active session.");
      }
    } catch (e) {
      console.error("❌ supabase-init failed:", e.message);
    }
  })();

  // New: Listen for Supabase readiness and init authWrapper safely
  document.addEventListener("supabase:ready", () => {
    if (window.authWrapper?.init) {
      console.log("✅ Supabase ready — initializing authWrapper safely.");
      try {
        window.authWrapper.init();
      } catch (err) {
        console.warn("⚠️ authWrapper.init() threw an error:", err.message);
      }
    } else {
      console.warn("⚠️ Supabase ready but authWrapper not defined yet.");
    }
  });
})();

// ===========================================================
// Added safe Supabase-native auth listener (replaces .on())
// ===========================================================
if (window.supabase?.auth?.onAuthStateChange) {
  window.supabase.auth.onAuthStateChange((event, session) => {
    console.log("🪪 Auth state event:", event, session ? "Session active" : "No session");
  });
} else {
  console.warn("⚠️ Supabase auth listener not available yet.");
}
