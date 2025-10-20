/**
 * SUBSCRIPTION ACCESS MIDDLEWARE (Chrome-safe, waits for SubscriptionManager)
 */
(function waitForManager() {
  const check = () => {
    if (window.subscriptionManager) {
      console.log("✅ SubscriptionManager detected, initializing middleware...");
      initMiddleware();
    } else {
      console.warn("SubscriptionManager not ready, retrying...");
      setTimeout(check, 150);
    }
  };
  check();
})();

function initMiddleware() {
  class SubscriptionMiddleware {
    constructor() {
      this.subscriptionManager = null;
      this.enabled = true;
      this.bypassMode = false;
      this.init();
    }

    async init() {
      try {
        await this.waitForSubscriptionManager();
        console.log("✅ SubscriptionMiddleware initialized successfully.");
      } catch (error) {
        console.error("❌ SubscriptionMiddleware initialization failed:", error);
        this.enabled = false;
      }
    }

    async waitForSubscriptionManager() {
      let attempts = 0;
      while (!window.subscriptionManager && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (window.subscriptionManager) {
        this.subscriptionManager = window.subscriptionManager;
      } else {
        throw new Error("SubscriptionManager not available after waiting");
      }
    }

    async checkAccess(options = {}) {
      if (!this.enabled || this.bypassMode) {
        return { allowed: true, reason: "middleware_disabled", message: "Access control disabled" };
      }
      try {
        const { feature = "app_access" } = options;
        const access = await this.subscriptionManager.checkAppAccess();
        if (!access.hasAccess) {
          console.warn("🚫 Access denied:", access.message);
          this.subscriptionManager.showSubscriptionRequiredModal(access.message);
          return { allowed: false, reason: access.reason, message: access.message };
        }
        return { allowed: true, reason: "subscription_valid", message: "Access granted" };
      } catch (e) {
        console.error("Error during access check:", e);
        return { allowed: true, reason: "check_failed", message: "Failed gracefully" };
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.subscriptionMiddleware) {
      window.subscriptionMiddleware = new SubscriptionMiddleware();
      console.log("🔗 SubscriptionMiddleware created and ready.");
    }
  });
}
