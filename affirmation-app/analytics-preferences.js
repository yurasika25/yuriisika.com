// This preference applies only to the three AffirmationApp website pages.
(() => {
  "use strict";
  const key = "affirmation-app.analytics.v1";
  const stream = "G-YZV2LLNLML";
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const panel = document.querySelector("#analytics-dialog");
  const settings = document.querySelector("#analytics-settings");
  const state = panel.querySelector("[data-state]");
  let loaded = false;
  let expiryTimer;
  let storageFailed = false;

  function readChoice() {
    if (storageFailed) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && ["accept", "reject"].includes(saved.choice) &&
          saved.until > Date.now() && saved.until <= Date.now() + lifetime) return saved;
      if (saved) localStorage.removeItem(key);
    } catch { /* Optional storage may be unavailable. */ }
    return null;
  }

  function clearMeasurementCookies() {
    // Expire this stream's two first-party cookies without reading other site cookies.
    const names = ["affirmation_ga", "affirmation_ga_" + stream.slice(2)];
    for (const name of names) {
      try { document.cookie = name + "=; Max-Age=0; Path=/affirmation-app; SameSite=Lax"; }
      catch { /* Cookie access can be blocked independently of local storage. */ }
    }
  }

  function apply() {
    const saved = readChoice();
    const enabled = saved?.choice === "accept";
    window["ga-disable-" + stream] = !enabled;
    state.textContent = enabled ? "Optional analytics are on." : "Optional analytics are off.";
    clearTimeout(expiryTimer);
    if (!enabled) {
      clearMeasurementCookies();
      return;
    }
    // Recheck in short intervals because browser timers have a maximum delay.
    expiryTimer = setTimeout(apply, Math.min(saved.until - Date.now() + 1, 86400000));
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", stream, {
      cookie_prefix: "affirmation", cookie_domain: "none", cookie_path: "/affirmation-app",
      cookie_expires: lifetime / 1000, cookie_update: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + stream;
    document.head.append(script);
  }

  settings.hidden = false;
  panel.addEventListener("close", () => settings.focus({ preventScroll: true }));
  document.querySelectorAll("[data-analytics-open]").forEach(button => {
    button.hidden = false;
    button.addEventListener("click", () => { apply(); panel.showModal(); });
  });
  panel.querySelectorAll("[data-choice]").forEach(button => {
    button.addEventListener("click", () => {
      try {
        localStorage.setItem(key, JSON.stringify({choice: button.dataset.choice, until: Date.now() + lifetime}));
        storageFailed = false;
      } catch {
        // Disable collection in this document even if a previous choice cannot be overwritten.
        storageFailed = true;
        apply();
        state.textContent = "Analytics are off on this page. Your browser could not save your choice.";
        return;
      }
      apply();
      panel.close();
    });
  });
  window.addEventListener("storage", e => { if (!e.key || e.key === key) apply(); });
  window.addEventListener("pageshow", apply);
  apply();
})();
