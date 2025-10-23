/* ==========================================================================
   SUPABASE INIT — waits for client readiness and logs session state
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
})();
