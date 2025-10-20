/**
 * SUBSCRIPTION MANAGEMENT SYSTEM
 * (no top-level await; works in non-module scripts)
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
    } catch (error) {
      console.error('❌ Subscription Manager initialization failed:', error);
    }
  }

  async waitForSupabase() {
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
      console.warn("Supabase not ready yet — retrying...");
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (!window.supabase) throw new Error('Supabase client not available');
    this.supabase = window.supabase;
  }

  // ---------- PLANS ----------
  async loadSubscriptionPlans() {
    try {
      const { data: plans, error } = await this.supabase
        .from('subscription_plans').select('*').eq('active', true)
        .order('price_cents', { ascending: true });
      if (error) throw error;
      this.plans = plans; this.cache.plans = plans; this.cache.lastUpdated = new Date();
      return plans;
    } catch (e) { console.error('Error loading subscription plans:', e); return []; }
  }
  getPlans() { return this.plans; }
  getClientPlans() { return this.plans.filter(p => p.plan_type === 'client'); }
  getCoachPlans() { return this.plans.filter(p => p.plan_type === 'coach'); }
  getPlanByCode(code) { return this.plans.find(p => p.plan_code === code); }

  // ---------- USER / PROFILE ----------
  async getCurrentUserSubscription() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;
      this.currentUser = user;
      const { data: sub, error } = await this.supabase
        .from('user_subscription_details').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      this.userSubscription = sub; this.cache.subscription = sub; return sub;
    } catch (e) { console.error('Error fetching user subscription:', e); return null; }
  }

  async getUserProfile() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;
      const { data: profile, error } = await this.supabase
        .from('user_profiles').select('*').eq('user_id', user.id).single();
      if (error) throw error; return profile;
    } catch (e) { console.error('Error fetching user profile:', e); return null; }
  }

  // ---------- ACCESS ----------
  async hasActiveSubscription() {
    const s = await this.getCurrentUserSubscription();
    return s && s.subscription_status === 'active';
  }
  async isCoach() { const p = await this.getUserProfile(); return p && p.user_type === 'coach'; }
  async isClient() { const p = await this.getUserProfile(); return p && p.user_type === 'client'; }
  async hasFeatureAccess(feature) {
    const s = await this.getCurrentUserSubscription();
    if (!s || s.subscription_status !== 'active') return false;
    const plan = this.getPlanByCode(s.plan_code);
    return !!(plan && plan.features && plan.features[feature] === true);
  }
  async checkAppAccess() {
    const active = await this.hasActiveSubscription();
    const profile = await this.getUserProfile();
    if (profile && profile.assigned_coach_id) {
      return { hasAccess: true, reason: 'coached_client', message: 'Access provided by your coach' };
    }
    if (active) return { hasAccess: true, reason: 'active_subscription', message: 'Active subscription' };
    return { hasAccess: false, reason: 'no_subscription', message: 'Subscription required for app access' };
  }

  // ---------- COACH ----------
  async getCoachClientCount() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return 0;
      const { count, error } = await this.supabase
        .from('coach_client_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id).eq('status', 'active');
      if (error) throw error;
      this.cache.clientCount = count; return count || 0;
    } catch (e) { console.error('Error getting coach client count:', e); return 0; }
  }
  async getCoachClients() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await this.supabase
        .from('coach_client_assignments')
        .select(`*, client_profile:user_profiles!coach_client_assignments_client_id_fkey(*)`)
        .eq('coach_id', user.id).eq('status', 'active').order('assigned_at', { ascending: false });
      if (error) throw error; return data || [];
    } catch (e) { console.error('Error fetching coach clients:', e); return []; }
  }
  async canAcceptMoreClients() {
    const s = await this.getCurrentUserSubscription();
    if (!s || s.subscription_status !== 'active') return { canAccept: false, reason: 'No active subscription' };
    const count = await this.getCoachClientCount();
    const limit = s.client_limit;
    if (!limit) return { canAccept: false, reason: 'Not a coach plan' };
    const canAccept = count < limit;
    const over = Math.max(0, count - limit);
    return { canAccept, currentCount: count, planLimit: limit, overageClients: over, overageCost: over * 2.00,
      reason: canAccept ? 'Within limit' : 'At plan limit (overage charges apply)' };
  }

  // ---------- OPERATIONS ----------
  async createStripeCheckoutSession(planCode) {
    const plan = this.getPlanByCode(planCode);
    if (!plan) throw new Error('Plan not found');
    return { plan, checkoutUrl: `#checkout-${planCode}`, message: 'Stripe integration pending' };
  }
  async assignClientToCoach(clientUserId, invitationCode = null) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Coach not authenticated');
      await this.canAcceptMoreClients(); // allows overage
      const { data: assignment, error } = await this.supabase
        .from('coach_client_assignments')
        .insert({ coach_id: user.id, client_id: clientUserId, invitation_code: invitationCode, status: 'active' })
        .select().single();
      if (error) throw error;
      const { error: profileError } = await this.supabase
        .from('user_profiles').update({ assigned_coach_id: user.id, user_type: 'client' })
        .eq('user_id', clientUserId);
      if (profileError) console.warn('Could not update client profile:', profileError);
      return assignment;
    } catch (e) { console.error('Error assigning client to coach:', e); throw e; }
  }

  // ---------- PRICING ----------
  formatPrice(cents) { return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
  calculateAnnualSavings() {
    const m = this.getPlanByCode('client_monthly'); const y = this.getPlanByCode('client_annual');
    if (!m || !y) return 0; return m.price_cents * 12 - y.price_cents;
  }

  // ---------- UI ----------
  async renderSubscriptionStatus() {
    const subscription = await this.getCurrentUserSubscription();
    const access = await this.checkAppAccess();
    return { subscription, access, isCoach: await this.isCoach(), clientCount: await this.getCoachClientCount(),
             canAcceptClients: await this.canAcceptMoreClients() };
  }

  // ---------- GUARD ----------
  async enforceSubscriptionAccess(feature = 'app_access') {
    const access = await this.checkAppAccess();
    if (!access.hasAccess) { this.showSubscriptionRequiredModal(access.message); return false; }
    if (feature !== 'app_access' && !(await this.hasFeatureAccess(feature))) {
      this.showUpgradeRequiredModal(feature); return false;
    }
    return true;
  }
  showSubscriptionRequiredModal(message) {
    console.warn('Subscription required:', message);
    if (window.location.pathname !== '/index.html') window.location.href = '/subscription-required.html';
  }
  showUpgradeRequiredModal(feature) { console.warn('Feature upgrade required:', feature); }
}

// ---- GLOBAL INIT (non-module safe) ----
document.addEventListener('DOMContentLoaded', () => {
  if (!window.subscriptionManager) window.subscriptionManager = new SubscriptionManager();
});
if (document.readyState !== 'loading') {
  if (!window.subscriptionManager) window.subscriptionManager = new SubscriptionManager();
}
if (typeof module !== 'undefined' && module.exports) module.exports = SubscriptionManager;
