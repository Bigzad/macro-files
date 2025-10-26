// initialization-manager-v2.js — cache-busted build for GitHub Pages (Oct 2025)
/* ==========================================================================
   INITIALIZATION MANAGER — Orchestrates load order safely
   ========================================================================== */
(function () {
  // Fire when Supabase is ready
  document.addEventListener("supabase:ready", () => {
    console.log("🧭 InitializationManager: Supabase ready event received.");
  });

  // Defensive: also poll in case event was missed
  (function ensureReady() {
    let checks = 0;
    const timer = setInterval(() => {
      const ready = window.__SUPABASE_READY__ && window.supabase && typeof window.supabase.from === "function";
      if (ready) {
        clearInterval(timer);
        console.log("🧭 InitializationManager: confirmed Supabase readiness.");
      } else if (++checks > 60) {
        clearInterval(timer);
        console.warn("🧭 InitializationManager: Supabase still not ready after polling.");
      }
    }, 100);
  })();
})();
