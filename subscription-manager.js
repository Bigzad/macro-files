/**
 * SUBSCRIPTION MANAGEMENT SYSTEM (Chrome-safe, non-module)
 */
class SubscriptionManager {
  constructor() {
    this.supabase = window.supabase;
    this.currentUser = null;
    this.userSubscription = null;
    this.plans = [];
    this.cache = { subscription: null, plans: null, clientCount: null, lastUpdated: null };
    this.init();
  }

  async init() {
    try {
      await this.waitForSupabase();
      await this.loadSubscriptionPlans();
      console.log("✅ SubscriptionManager initialized successfully.");
    } catch (error) {
      console.error("❌ SubscriptionManager initialization failed:", error);
    }
  }

async waitForSupabase() {
  let attempts = 0;
  while ((!window.supabase || typeof window.supabase.from !== "function") && attempts < 60) {
    console.warn("Supabase not ready yet — retrying...");
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  if (!window.supabase || typeof window.supabase.from !== "function") {
    throw new Error("Supabase client not fully initialized");
  }
  this.supabase = window.supabase;
}


  async loadSubscriptionPlans() {
    try {
      const { data: plans, error } = await this.supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("price_cents", { ascending: true });
      if (error) throw error;
      this.plans = plans;
      this.cache.plans = plans;
      this.cache.lastUpdated = new Date();
      console.log("📦 Subscription plans loaded:", plans?.length || 0);
      return plans;
    } catch (e) {
      console.error("Error loading subscription plans:", e);
      return [];
    }
  }

  async getCurrentUserSubscription() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;
      this.currentUser = user;
      const { data: sub, error } = await this.supabase
        .from("user_subscription_details")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      this.userSubscription = sub;
      this.cache.subscription = sub;
      return sub;
    } catch (e) {
      console.error("Error fetching user subscription:", e);
      return null;
    }
  }

  async getUserProfile() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;
      const { data: profile, error } = await this.supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return profile;
    } catch (e) {
      console.error("Error fetching user profile:", e);
      return null;
    }
  }

  async checkAppAccess() {
    const active = await this.hasActiveSubscription();
    const profile = await this.getUserProfile();
    if (profile && profile.assigned_coach_id) {
      return { hasAccess: true, reason: "coached_client", message: "Access provided by your coach" };
    }
    if (active) return { hasAccess: true, reason: "active_subscription", message: "Active subscription" };
    return { hasAccess: false, reason: "no_subscription", message: "Subscription required for app access" };
  }

  async hasActiveSubscription() {
    const s = await this.getCurrentUserSubscription();
    return s && s.subscription_status === "active";
  }

  showSubscriptionRequiredModal(message) {
    console.warn("Subscription required:", message);
    if (window.location.pathname !== "/index.html") {
      window.location.href = "/subscription-required.html";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.subscriptionManager) {
    window.subscriptionManager = new SubscriptionManager();
  }
});
if (document.readyState !== "loading") {
  if (!window.subscriptionManager) {
    window.subscriptionManager = new SubscriptionManager();
  }
}
