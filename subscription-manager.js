/* ==========================================================================
   SUBSCRIPTION MANAGER — Non-module, waits for Supabase, handles plans
   ========================================================================== */
(function () {
  function waitForSupabaseClient(max = 80) {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const tick = () => {
        const sb = window.supabase;
        if (sb && typeof sb.from === "function") return resolve(sb);
        if (tries++ >= max) return reject(new Error("Supabase client not fully initialized"));
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  class SubscriptionManager {
    constructor(sb) {
      this.supabase = sb;
      this.plans = [];
      this._init();
    }
    async _init() {
      try {
        console.log("📦 SubscriptionManager starting...");
        await this.loadPlans();
        console.log("📦 SubscriptionManager ready.");
      } catch (e) {
        console.error("❌ SubscriptionManager initialization failed:", e);
      }
    }
    async loadPlans() {
      try {
        const { data, error } = await this.supabase
          .from("subscription_plans")
          .select("*")
          .eq("active", true)
          .order("price_cents", { ascending: true });
        if (error) throw error;
        this.plans = data || [];
        console.log(`📚 Loaded ${this.plans.length} plan(s).`);
      } catch (e) {
        // common when table doesn't exist yet on a fresh project
        console.error("Error loading subscription plans:", e);
      }
    }
  }

  (async () => {
    try {
      const sb = await waitForSupabaseClient();
      if (!window.subscriptionManager) {
        window.subscriptionManager = new SubscriptionManager(sb);
      }
    } catch (e) {
      console.error("❌ SubscriptionManager bootstrap error:", e.message);
    }
  })();
})();
