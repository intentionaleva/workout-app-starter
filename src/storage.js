// Everything the app remembers lives in localStorage on this device, under keys
// that start with the `storageKey` from app.config.js. No server, no account.
//
//   <key>-log          workout log: [{ r: routineId, ts: timestamp, k?: kind, manual?: 1 }]
//   <key>-w-<exId>     last weight used for an exercise ("12,5")
//   <key>-kind-<rid>   last chosen kind on a check-off routine ("walk")
//   <key>-lang, <key>-theme, <key>-disclaimer   preferences

import { LEGACY_ROUTINES, LEGACY_EXERCISES, LEGACY_KINDS } from "./legacy.js";

let prefix = "workout";
let LOG = [];
const mem = {};   // fallback when localStorage is unavailable (private mode, blocked storage)

function rawGet(k) { try { const v = localStorage.getItem(k); return v; } catch (e) { return k in mem ? mem[k] : null; } }
function rawSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
function rawDel(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
function allKeys() {
  try { const out = []; for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); return out; }
  catch (e) { return Object.keys(mem); }
}
const K = name => prefix + "-" + name;

export function initStorage(key) {
  prefix = key || "workout";
  if (prefix === "ut") migrateV1();
  LOG = loadLog();
}

export function getPref(name, d) { const v = rawGet(K(name)); return v == null ? d : v; }
export function setPref(name, v) { rawSet(K(name), v); }
export function delPref(name) { rawDel(K(name)); }

/* ---------- log ---------- */

function loadLog() {
  try { const l = JSON.parse(rawGet(K("log")) || "[]"); return Array.isArray(l) ? l.filter(e => e && typeof e.ts === "number") : []; }
  catch (e) { return []; }
}
function saveLog() { rawSet(K("log"), JSON.stringify(LOG)); }
export function getLog() { return LOG; }
export function addLog(rid, extra) { LOG.push({ r: rid, ts: Date.now(), ...(extra || {}) }); saveLog(); }
export function removeLog(pred) { LOG = LOG.filter(e => !pred(e)); saveLog(); }
export function lastOf(rid) { let t = 0; for (const e of LOG) if (e.r === rid && e.ts > t) t = e.ts; return t; }

/* ---------- weights and kinds ---------- */

export function getWeight(exId) { return getPref("w-" + exId, ""); }
export function setWeight(exId, v) { setPref("w-" + exId, v); }
export function getKind(rid, d) { return getPref("kind-" + rid, d); }
export function setKind(rid, v) { setPref("kind-" + rid, v); }

/* ---------- backup ---------- */

export function exportData(appName, version) {
  const data = {};
  for (const k of allKeys()) if (k && k.startsWith(prefix + "-")) data[k.slice(prefix.length + 1)] = rawGet(k);
  return { app: appName, version, exportedAt: new Date().toISOString(), storageKey: prefix, data };
}

/** Replace everything with the content of an export file. Returns false if the file doesn't look right. */
export function importData(obj) {
  if (!obj || typeof obj !== "object" || !obj.data || typeof obj.data !== "object") return false;
  if (obj.data.log != null) { try { if (!Array.isArray(JSON.parse(obj.data.log))) return false; } catch (e) { return false; } }
  resetAll();
  for (const [k, v] of Object.entries(obj.data)) if (typeof v === "string") rawSet(K(k), v);
  LOG = loadLog();
  return true;
}

export function resetAll() {
  for (const k of allKeys()) if (k && k.startsWith(prefix + "-")) rawDel(k);
  LOG = [];
}

/* ---------- one-time upgrade from the original single-file app ---------- */

function migrateV1() {
  if (rawGet("ut-v") === "2") return;
  let log = [];
  try { log = JSON.parse(rawGet("ut-log") || "[]"); if (!Array.isArray(log)) log = []; } catch (e) { log = []; }
  if (!log.length) {
    // even older versions stored only the last completion per routine
    for (const r of ["morgen", "a", "b", "rb"]) {
      const v = rawGet("ut-done-" + r);
      if (v) { const ts = +v.split("|")[1]; if (ts) log.push({ r, ts }); }
    }
  }
  log = log.map(e => ({ ...e, r: LEGACY_ROUTINES[e.r] || e.r, ...(e.k ? { k: LEGACY_KINDS[e.k] || e.k } : {}) }));
  if (log.length) rawSet("ut-log", JSON.stringify(log));
  for (const [oldId, newId] of Object.entries(LEGACY_EXERCISES)) {
    const w = rawGet("ut-w-" + oldId);
    if (w != null && rawGet("ut-w-" + newId) == null) rawSet("ut-w-" + newId, w);
  }
  const ct = rawGet("ut-ctype");
  if (ct && rawGet("ut-kind-cardio") == null) rawSet("ut-kind-cardio", LEGACY_KINDS[ct] || ct);
  rawSet("ut-v", "2");
}
