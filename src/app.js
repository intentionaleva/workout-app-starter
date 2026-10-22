// Entry point: loads the config files, checks them, then shows the app.
// The config is loaded with dynamic import() so that a typo in a config file
// shows a readable message on screen instead of a blank page.

import { compileExercises } from "./exercise.js";
import { validateAppConfig, validateRoutines } from "./validate.js";
import { initLang } from "./i18n.js";
import { initStorage, getPref } from "./storage.js";
import { initScreens, applyTones, applyTheme, renderHome, renderDisclaimer, renderErrors, showUpdateBanner } from "./screens.js";

async function load(path) {
  try { return { mod: (await import(path)).default }; }
  catch (e) { console.error(e); return { error: `${path.replace("../", "")} could not be loaded: ${e.message}` }; }
}

async function boot() {
  const root = document.getElementById("app");
  const [a, x, r] = await Promise.all([load("../config/app.config.js"), load("../config/exercises.js"), load("../config/routines.js")]);
  const loadErrors = [a, x, r].filter(m => m.error).map(m => m.error);
  const cfg = a.mod || {};
  initStorage(cfg.storageKey);
  initLang(cfg.language, getPref("lang", null));

  const errors = [...loadErrors];
  if (!loadErrors.length) {
    errors.push(...validateAppConfig(cfg));
    const lib = compileExercises(x.mod);
    errors.push(...lib.errors);
    if (!errors.length) errors.push(...validateRoutines(r.mod, lib.exercises, cfg));
    if (!errors.length) {
      document.title = cfg.name;
      const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (meta) meta.setAttribute("content", cfg.shortName || cfg.name);
      applyTones(cfg.tones);
      applyTheme(getPref("theme", "auto"));
      const ctx = { config: cfg, exercises: lib.exercises, routines: r.mod, version: self.APP_VERSION || "dev" };
      initScreens(ctx, root);
      if (cfg.showDisclaimer !== false && !getPref("disclaimer", null)) renderDisclaimer();
      else renderHome();
      window.__app = ctx;   // used by the smoke test
      registerServiceWorker();
      return;
    }
  }
  errors.forEach(m => console.error(m));
  if (cfg.tones) try { applyTones(cfg.tones); } catch (e) { /* ignore */ }
  renderErrors(errors);
  window.__app = { errors };
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Skip the offline cache while developing locally, so edits show up on reload.
  // Add ?sw to the URL to test it locally anyway.
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (local && !/[?&]sw\b/.test(location.search)) return;
  navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.type === "updated") showUpdateBanner(); });
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

boot();
