// Checks config/routines.js and config/app.config.js. Exercise checks live in exercise.js.
// Returns readable messages instead of throwing, so the app can show them on screen.

import { SCENES } from "./rig.js";
import { ICONS } from "./icons.js";

const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
const isText = v => typeof v === "string" ? v.length > 0 : isObj(v) && Object.values(v).some(x => typeof x === "string" && x);
const isPos = v => typeof v === "number" && isFinite(v) && v > 0;

const ROUTINE_KEYS = ["id", "type", "name", "tone", "icon", "featured", "frequency", "duration", "gear", "tileNote", "rest", "roundRest", "goal", "sections", "minutes", "kinds"];
const ITEM_KEYS = ["ex", "reps", "secs", "perSide", "scene", "label"];
const SECTION_KEYS = ["title", "badge", "rounds", "items"];

export function validateAppConfig(cfg) {
  const errors = [];
  const err = m => errors.push(`app.config.js: ${m}`);
  if (!isObj(cfg)) return ["config/app.config.js must export an object (export default { … })"];
  if (!isText(cfg.name)) err(`needs a "name"`);
  if (!isObj(cfg.tones) || !Object.keys(cfg.tones).length) err(`needs at least one colour in "tones"`);
  else for (const [k, v] of Object.entries(cfg.tones)) {
    for (const c of ["tint", "fg", "deep", "solid"]) if (!v || typeof v[c] !== "string") err(`tone "${k}" needs a "${c}" colour`);
  }
  if (cfg.storageKey != null && !/^[\w-]+$/.test(cfg.storageKey)) err(`"storageKey" may only contain letters, digits, - and _`);
  return errors;
}

export function validateRoutines(routines, exercises, cfg) {
  const errors = [];
  if (!Array.isArray(routines)) return ["config/routines.js must export a list of routines (export default [ … ])"];
  const ids = new Set();
  const tones = cfg && cfg.tones ? Object.keys(cfg.tones) : [];
  routines.forEach((r, ri) => {
    const name = r && r.id ? `Routine "${r.id}"` : `Routine #${ri + 1}`;
    const err = m => errors.push(`${name}: ${m}`);
    if (!isObj(r)) { err("must be an object"); return; }
    for (const k in r) if (!ROUTINE_KEYS.includes(k)) err(`unknown field "${k}"`);
    if (typeof r.id !== "string" || !r.id) err(`needs an "id" (short text without spaces, e.g. "morning")`);
    else if (ids.has(r.id)) err(`the id "${r.id}" is used twice`);
    ids.add(r.id);
    if (!isText(r.name)) err(`needs a "name"`);
    if (!tones.includes(r.tone)) err(`tone must be one of ${tones.join(", ")} (defined in app.config.js), got ${JSON.stringify(r.tone)}`);
    if (r.icon != null && !ICONS[r.icon]) err(`unknown icon "${r.icon}" (available: ${Object.keys(ICONS).filter(k => !k.startsWith("_")).join(", ")})`);
    if (r.goal != null) {
      if (!isObj(r.goal)) err(`"goal" must look like { group: "strength", perWeek: 2 }`);
      else if (!(typeof r.goal.perWeek === "number" && r.goal.perWeek >= 0)) err(`goal.perWeek must be a number (0 = no target)`);
    }
    for (const k of ["rest", "roundRest"]) if (r[k] != null && !(typeof r[k] === "number" && r[k] >= 0)) err(`"${k}" must be seconds (a number)`);
    if (r.type === "checkoff") {
      if (!isPos(r.minutes)) err(`check-off routines need "minutes"`);
      if (!Array.isArray(r.kinds) || !r.kinds.length) err(`check-off routines need a list of "kinds", e.g. [{ id: "walk", name: "Walking" }]`);
      else r.kinds.forEach((k, i) => { if (!isObj(k) || !k.id || !isText(k.name)) err(`kinds[${i}] must look like { id: "walk", name: "Walking" }`); });
      return;
    }
    if (r.type != null) err(`type must be "checkoff" or left out`);
    if (!Array.isArray(r.sections)) { err(`needs "sections": [{ title, items: [...] }]`); return; }
    r.sections.forEach((s, si) => {
      const at = `section ${si + 1}`;
      if (!isObj(s)) { err(`${at} must be an object`); return; }
      for (const k in s) if (!SECTION_KEYS.includes(k)) err(`${at}: unknown field "${k}"`);
      if (!isText(s.title)) err(`${at} needs a "title"`);
      if (s.rounds != null && !(Number.isInteger(s.rounds) && s.rounds > 0)) err(`${at}: rounds must be a whole number like 3`);
      if (!Array.isArray(s.items)) { err(`${at} needs "items": [{ ex: "…", reps: 10 }]`); return; }
      s.items.forEach((it, ii) => {
        const ai = `${at}, item ${ii + 1}`;
        if (!isObj(it)) { err(`${ai} must look like { ex: "glute-bridge", reps: 10 }`); return; }
        for (const k in it) if (!ITEM_KEYS.includes(k)) err(`${ai}: unknown field "${k}"`);
        if (!exercises[it.ex]) err(`${ai}: unknown exercise "${it.ex}"` + suggest(it.ex, Object.keys(exercises)));
        if ((it.reps == null) === (it.secs == null)) err(`${ai} ("${it.ex}"): give either "reps" or "secs"`);
        else if (it.reps != null && !isPos(it.reps)) err(`${ai}: reps must be a positive number`);
        else if (it.secs != null && !isPos(it.secs)) err(`${ai}: secs must be a positive number`);
        if (it.scene != null && !SCENES[it.scene]) err(`${ai}: scene must be one of ${Object.keys(SCENES).join(" | ")}`);
      });
    });
  });
  return errors;
}

function suggest(word, list) {
  word = String(word || "");
  const hit = list.find(x => x.includes(word) || word.includes(x));
  return hit ? ` (did you mean "${hit}"?)` : "";
}
