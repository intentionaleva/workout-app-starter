// Turns the declarative exercise data from config/exercises.js into something the
// player can run: resolves `extends` and `base`, validates everything, converts
// ground-relative coordinates per scene and evaluates the animation at a given time.

import { BASES, CUSTOM, SCENES, FRAMES, ANCHORS, LIMBS, isObj, clone, mergePose, toScreen, lerp, ease } from "./rig.js";

const BREATHS = ["in", "out", "hold", "calm"];
const EASINGS = ["ease", "linear", "lin"];
const HIGHLIGHTS = ["hip", "core", "sho"];
const PROP_TYPES = ["db", "kb"];
const HANDS = ["h1", "h2"];
const SIDE_WORDS = ["side", "direction"];

const KNOWN_KEYS = ["name", "target", "scene", "highlight", "equipment", "props", "alternating", "sideWord", "view", "frame",
  "custom", "base", "poses", "intro", "loop", "cues", "repsPerLoop", "repSeconds", "image", "extends", "notes"];
const POSE_KEYS = ["hip", "sho", "ank", "t", "h", "tc", "g", "L1", "L2", "A1", "A2"];
const LEG_KEYS = ["th", "sh", "ft", "tl", "sl", "to", "s"];
const ARM_KEYS = ["ua", "fa", "to", "s"];

const isNum = v => typeof v === "number" && isFinite(v);
const isPt = v => Array.isArray(v) && v.length === 2 && isNum(v[0]) && isNum(v[1]);
const isText = v => typeof v === "string" ? v.length > 0 : isObj(v) && Object.values(v).some(x => typeof x === "string" && x);

function closest(word, list) {
  let best = null, bd = 3;
  for (const w of list) {
    const d = lev(word.toLowerCase(), w.toLowerCase());
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}
function lev(a, b) {
  const m = []; for (let i = 0; i <= a.length; i++) { m[i] = [i]; }
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}
function unknownKey(k, list) {
  const c = closest(k, list);
  return `unknown field "${k}"` + (c ? ` (did you mean "${c}"?)` : "");
}

/** Resolve `base` (string, object or array of both) into one pose object. */
function resolveBase(base, err) {
  if (base == null) return {};
  const parts = Array.isArray(base) ? base : [base];
  let out = {};
  for (const p of parts) {
    if (typeof p === "string") {
      if (!BASES[p]) { err(`unknown base "${p}" (available: ${Object.keys(BASES).join(", ")})`); continue; }
      out = mergePose(out, BASES[p]);
    } else if (isObj(p)) out = mergePose(out, p);
    else err(`"base" must be a name like "supine", an object, or a list of those`);
  }
  return out;
}

function normSteps(list, poseNames, where, err) {
  if (list == null) return [];
  if (!Array.isArray(list)) { err(`"${where}" must be a list of steps`); return []; }
  return list.map((st, i) => {
    const at = `${where} step ${i + 1}`;
    if (!Array.isArray(st)) { err(`${at} must be a list like ["down", "up", 1000, "Label", "out"]`); return null; }
    const [from, to, ms, label, breath, easing] = st;
    if (poseNames) {
      if (!poseNames.includes(from)) err(`${at} references unknown pose "${from}"` + (closest(String(from), poseNames) ? ` (did you mean "${closest(String(from), poseNames)}"?)` : ""));
      if (!poseNames.includes(to)) err(`${at} references unknown pose "${to}"` + (closest(String(to), poseNames) ? ` (did you mean "${closest(String(to), poseNames)}"?)` : ""));
    }
    if (!isNum(ms) || ms <= 0) err(`${at}: duration must be a positive number of milliseconds, got ${JSON.stringify(ms)}`);
    if (label != null && !isText(label)) err(`${at}: label must be text or { de: "…", en: "…" }`);
    if (breath != null && !BREATHS.includes(breath)) err(`${at}: breath must be one of ${BREATHS.join(" | ")}, got ${JSON.stringify(breath)}`);
    if (easing != null && !EASINGS.includes(easing)) err(`${at}: easing must be "ease" or "linear", got ${JSON.stringify(easing)}`);
    return { from, to, ms, label: label || "", breath: breath || "calm", linear: easing === "linear" || easing === "lin" };
  }).filter(Boolean);
}

function checkPose(pose, at, err) {
  for (const k in pose) if (!POSE_KEYS.includes(k)) err(`${at}: ${unknownKey(k, POSE_KEYS)}`);
  const anchors = ANCHORS.filter(k => k in pose);
  if (anchors.length === 0) err(`${at}: needs an anchor, one of hip: [x, y], sho: [x, y] or ank: [x, y]`);
  for (const k of anchors) if (!isPt(pose[k])) err(`${at}: "${k}" must be [x, y] with two numbers`);
  if (!isNum(pose.t)) err(`${at}: torso angle "t" is missing or not a number`);
  for (const k of ["h", "tc", "g"]) if (k in pose && !isNum(pose[k])) err(`${at}: "${k}" must be a number`);
  for (const k of LIMBS) {
    const L = pose[k];
    if (L == null) continue;
    if (!isObj(L)) { err(`${at}: "${k}" must be an object`); continue; }
    const leg = k[0] === "L", keys = leg ? LEG_KEYS : ARM_KEYS;
    for (const x in L) if (!keys.includes(x)) err(`${at}.${k}: ${unknownKey(x, keys)}`);
    if (L.to != null) {
      if (!isPt(L.to)) err(`${at}.${k}: "to" must be [x, y]`);
      if (L.s !== 1 && L.s !== -1) err(`${at}.${k}: IK limbs need a bend direction "s": 1 or -1`);
    } else {
      const need = leg ? ["th", "sh"] : ["ua", "fa"];
      for (const x of need) if (!isNum(L[x])) err(`${at}.${k}: needs "${need[0]}" and "${need[1]}" angles, or an IK target "to"`);
    }
    for (const x of ["ft", "tl", "sl"]) if (x in L && !isNum(L[x])) err(`${at}.${k}: "${x}" must be a number`);
  }
  if (pose.ank && (!pose.L1 || pose.L1.to || !isNum(pose.L1.th))) err(`${at}: an "ank" anchor needs L1 defined by angles (th, sh)`);
}

/**
 * Compile the raw exercise library.
 * @returns {{ exercises: Object<string, object>, errors: string[] }}
 */
export function compileExercises(raw, source = "config/exercises.js") {
  const errors = [], out = {};
  if (!isObj(raw)) return { exercises: {}, errors: [`${source} must export an object of exercises (export default { "id": { … } })`] };
  const resolving = new Set(), resolved = {};

  function resolve(id) {
    if (resolved[id]) return resolved[id];
    const e = raw[id];
    const err = m => errors.push(`Exercise "${id}": ${m}`);
    if (!isObj(e)) { err("must be an object"); return null; }
    if (resolving.has(id)) { err(`"extends" goes round in a circle`); return null; }
    resolving.add(id);
    for (const k in e) if (!KNOWN_KEYS.includes(k)) err(unknownKey(k, KNOWN_KEYS));

    let parent = null;
    if (e.extends != null) {
      if (!raw[e.extends]) err(`extends unknown exercise "${e.extends}"`);
      else parent = resolve(e.extends);
    }
    const r = parent ? { ...parent.fields } : {};
    for (const k in e) if (k !== "extends" && k !== "base" && k !== "poses") r[k] = e[k];
    if (parent && "loop" in e && !("intro" in e)) delete r.intro; // loop and intro belong together

    // poses: parent's finished poses, then this exercise's base, then this exercise's pose
    const base = resolveBase(e.base, err);
    const fullBase = parent ? mergePose(parent.base, base) : base;
    let poses = null;
    if (e.poses != null || parent && parent.poses) {
      if (e.poses != null && !isObj(e.poses)) err(`"poses" must be an object like { down: {…}, up: {…} }`);
      poses = {};
      const names = new Set([...(parent && parent.poses ? Object.keys(parent.poses) : []), ...(isObj(e.poses) ? Object.keys(e.poses) : [])]);
      for (const n of names) {
        const from = parent && parent.poses && parent.poses[n] ? mergePose(parent.poses[n], base) : fullBase;
        poses[n] = mergePose(from, isObj(e.poses) ? e.poses[n] : null);
      }
    }
    const res = { fields: r, base: fullBase, poses };
    resolved[id] = res;
    resolving.delete(id);
    return res;
  }

  for (const id in raw) {
    const res = resolve(id);
    if (!res) continue;
    const f = res.fields, err = m => errors.push(`Exercise "${id}": ${m}`);
    if (!isText(f.name)) err(`needs a "name", e.g. name: { de: "Kniebeuge", en: "Squat" }`);
    const scene = f.scene == null ? "mat" : f.scene;
    if (!SCENES[scene]) err(`scene must be one of ${Object.keys(SCENES).join(" | ")}, got ${JSON.stringify(f.scene)}`);
    const highlight = f.highlight == null ? "core" : f.highlight;
    if (!HIGHLIGHTS.includes(highlight)) err(`highlight must be one of ${HIGHLIGHTS.join(" | ")}`);
    if (f.target != null && !isText(f.target)) err(`"target" must be text`);
    if (f.view != null && !isText(f.view)) err(`"view" must be text`);
    if (f.equipment != null && typeof f.equipment !== "string") err(`"equipment" must be null or text like "dumbbell"`);
    if (f.sideWord != null && !SIDE_WORDS.includes(f.sideWord)) err(`sideWord must be "side" or "direction"`);
    if (f.custom != null && !CUSTOM[f.custom]) err(`unknown custom drawing "${f.custom}"`);
    if (f.frame != null && !FRAMES[f.frame] && !/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/.test(f.frame)) err(`frame must be "tall" or a viewBox like "0 0 360 230"`);
    if (f.image != null && typeof f.image !== "string") err(`"image" must be a URL or file path`);
    for (const k of ["repsPerLoop", "repSeconds"]) if (f[k] != null && !(isNum(f[k]) && f[k] > 0)) err(`"${k}" must be a positive number`);
    const props = f.props || [];
    if (!Array.isArray(props)) err(`"props" must be a list like [["db", "h1"]]`);
    else props.forEach((p, i) => {
      if (!Array.isArray(p) || !PROP_TYPES.includes(p[0]) || !HANDS.includes(p[1]) || (p[2] != null && p[2] !== "arm"))
        err(`props[${i}] must look like ["db" | "kb", "h1" | "h2"] (kettlebells may add "arm")`);
    });
    let cues = f.cues || [];
    if (!(Array.isArray(cues) || isObj(cues))) err(`"cues" must be a list of tips, or { de: [...], en: [...] }`);

    const poseNames = res.poses ? Object.keys(res.poses) : null;
    const animated = !!(poseNames && poseNames.length);
    if (animated && !f.custom) for (const n of poseNames) checkPose(res.poses[n], `pose "${n}"`, err);
    if (animated && (!Array.isArray(f.loop) || !f.loop.length)) err(`has poses but no "loop" (a list of steps between poses)`);
    if (!animated && f.loop && f.loop.length) err(`has a "loop" but no "poses"`);
    const intro = animated ? normSteps(f.intro, poseNames, "intro", err) : [];
    const loop = animated ? normSteps(f.loop, poseNames, "loop", err) : [];

    const def = {
      id, name: f.name, target: f.target || "", scene, highlight, equipment: f.equipment || null,
      props: Array.isArray(props) ? props : [], alternating: !!f.alternating, sideWord: f.sideWord || "side",
      view: f.view || null, frame: f.frame || null, custom: f.custom || null, image: f.image || null,
      cues, repsPerLoop: f.repsPerLoop || 1, repSeconds: f.repSeconds || null,
      animated, poses: animated ? res.poses : null, intro, loop,
      _cache: {},
    };
    const sum = l => l.reduce((a, s) => a + s.ms, 0);
    def.I = sum(intro);
    def.L = sum(loop);
    out[id] = def;
  }
  return { exercises: out, errors };
}

/** Screen-coordinate poses for a scene (cached). */
export function posesFor(def, scene) {
  if (!def.animated) return null;
  const sc = SCENES[scene] ? scene : def.scene;
  if (!def._cache[sc]) {
    const o = {};
    for (const n in def.poses) o[n] = def.custom ? clone(def.poses[n]) : toScreen(def.poses[n], SCENES[sc].groundY);
    def._cache[sc] = o;
  }
  return def._cache[sc];
}

/** Length of one rep in ms (text-only exercises use repSeconds). */
export function loopMs(def, fallbackSec = 3) { return def.animated ? def.L : (def.repSeconds || fallbackSec) * 1000; }

/** Where the animation is at time t (ms since the exercise started). */
export function evalAnim(def, scene, t) {
  if (!def.animated) return { pose: null, label: "", breath: "calm", k: 0, step: -1 };
  const po = posesFor(def, scene);
  let list, lt;
  if (def.intro.length && t < def.I) { list = def.intro; lt = t; }
  else { list = def.loop; lt = (t - def.I) % def.L; }
  let acc = 0, seg = list[list.length - 1], k = 1, idx = list.length - 1;
  for (let i = 0; i < list.length; i++) {
    const sg = list[i];
    if (lt < acc + sg.ms) { seg = sg; k = (lt - acc) / sg.ms; idx = i; break; }
    acc += sg.ms;
  }
  const e = seg.linear ? k : ease(k);
  return { pose: lerp(po[seg.from], po[seg.to], e), label: seg.label, breath: seg.breath, k, step: list === def.loop ? idx : -1, to: seg.to };
}

/** The pose used for thumbnails: the end of the first loop step. */
export function thumbPose(def, scene) {
  if (!def.animated) return null;
  return posesFor(def, scene)[def.loop[0].to];
}

/** Key poses in the order the loop visits them (for the reduced-motion view). */
export function keyPoses(def) {
  if (!def.animated) return [];
  const seen = new Set(), out = [];
  for (const st of def.loop) if (!seen.has(st.to)) { seen.add(st.to); out.push({ name: st.to, label: st.label }); }
  return out;
}
