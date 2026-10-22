// Pose editor: build and tweak exercise animations visually, then copy the
// result into config/exercises.js. Uses the same renderer and checks as the app.

import { C, solve, ik, innerSVG, figSVG, SCENES, FRAMES, BASES, ANCHORS, LIMBS, frameBox, isObj, clone, esc, placeholderSVG } from "./rig.js";
import { compileExercises, evalAnim, posesFor } from "./exercise.js";
import { checkExercise } from "./checks.js";
import { applyTones } from "./screens.js";

const DRAFT_KEY = "pose-editor:draft";
const BREATHS = ["out", "in", "hold", "calm"];
const LIMB_NAMES = { L1: "Near leg (L1)", L2: "Far leg (L2)", A1: "Near arm (A1)", A2: "Far arm (A2)" };
const FIELD_ORDER = ["extends", "name", "target", "scene", "highlight", "equipment", "props", "alternating", "sideWord", "view", "frame",
  "custom", "image", "repsPerLoop", "repSeconds", "base", "poses", "intro", "loop", "cues"];
// Shared constants used in config/exercises.js, so pasted code that uses them still works.
const PASTE_CONSTS = {
  armOut: { ua: 100, fa: 100 }, legOut: { th: -90, sh: -90, ft: -90 }, standLeg: { th: 0, sh: 0, ft: 90 },
  hang: { ua: 0, fa: 0 }, up: { ua: 180, fa: 180 }, lieArm: { ua: 90, fa: 90 },
};

const S = {
  sources: {}, src: "config", lib: {}, id: null, X: null,
  pose: null, scene: "mat", mirror: false, onion: true, playing: false, t: 0, def: null, errors: [],
};
const root = document.getElementById("ed");
const $ = id => document.getElementById(id);
const r1 = v => Math.round(v * 10) / 10;
const r05 = v => Math.round(v * 2) / 2;
const angleOf = v => r1(Math.atan2(v[0], v[1]) * 180 / Math.PI);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

/* ---------- loading ---------- */

async function loadSource(path) {
  try { return (await import(path)).default || {}; } catch (e) { console.error(e); return {}; }
}

async function init() {
  const [cfg, mine, lib] = await Promise.all([loadSource("../config/app.config.js"), loadSource("../config/exercises.js"), loadSource("../examples/library/extra-exercises.js")]);
  if (cfg.tones) { applyTones(cfg.tones); document.body.className = "t-" + Object.keys(cfg.tones)[0]; }
  S.sources = { config: mine, library: lib, draft: {} };
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }
  if (draft && draft.id && draft.X) {
    S.sources.draft = { [draft.id]: draft.X };
    S.src = draft.src && S.sources[draft.src] ? draft.src : "config";
    S.lib = S.sources[S.src];
    open(draft.id, clone(draft.X));
    toast("Restored your last session");
  } else {
    const first = Object.keys(mine)[0];
    S.lib = mine;
    if (first) open(first, clone(mine[first])); else newExercise();
  }
}

function open(id, X) {
  S.id = id; S.X = X; S.playing = false; S.t = 0;
  compile();
  S.scene = S.def ? S.def.scene : "mat";
  S.pose = S.def && S.def.poses ? Object.keys(S.def.poses)[0] : null;
  render();
}

function newExercise() {
  let id = "new-exercise", n = 2;
  while (S.lib[id]) id = "new-exercise-" + n++;
  open(id, {
    name: { de: "Neue Übung", en: "New exercise" },
    target: { de: "", en: "" },
    scene: "floor", highlight: "hip",
    base: "standing",
    poses: { start: { g: .2 }, end: { t: 150, L1: { sh: -35, th: 100, ft: 90 }, L2: { sh: -35, th: 100, ft: 90 }, A1: { ua: 80, fa: 85 }, A2: { ua: 80, fa: 85 }, g: .9 } },
    loop: [
      ["start", "end", 1500, { de: "Runter", en: "Down" }, "in"],
      ["end", "start", 1500, { de: "Hoch", en: "Up" }, "out"],
    ],
    cues: { de: [], en: [] },
  });
}

/* ---------- model ---------- */

function compile() {
  const raw = { ...S.lib, [S.id]: S.X };
  const { exercises, errors } = compileExercises(raw);
  S.def = exercises[S.id] || null;
  S.errors = errors.filter(e => e.startsWith(`Exercise "${S.id}"`)).map(e => e.replace(`Exercise "${S.id}": `, ""));
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ src: S.src, id: S.id, X: S.X })); } catch (e) { /* ignore */ }
}

const groundY = () => (SCENES[S.scene] || SCENES.mat).groundY;
const effPose = () => S.def && S.def.poses && S.pose ? S.def.poses[S.pose] : null;       // data coords
const scrPose = () => S.def && S.def.poses && S.pose ? posesFor(S.def, S.scene)[S.pose] : null; // screen coords
function ov() { S.X.poses = S.X.poses || {}; if (!isObj(S.X.poses[S.pose])) S.X.poses[S.pose] = {}; return S.X.poses[S.pose]; }
const own = (k, sub) => { const o = S.X.poses && S.X.poses[S.pose]; if (!o || !(k in o)) return false; return sub ? isObj(o[k]) && sub in o[k] : true; };

function setScalar(k, v) { ov()[k] = v; }
function setAnchor(type, pt) { const o = ov(); for (const a of ANCHORS) delete o[a]; o[type] = [r05(pt[0]), r05(pt[1])]; }
function setLimbKey(limb, k, v) { const o = ov(); o[limb] = { ...(isObj(o[limb]) ? o[limb] : {}), [k]: v }; }
function setLimb(limb, obj) { ov()[limb] = obj; }

/** Lengths and root joint for a limb, from the solved figure. */
function limbGeo(limb, s, eff) {
  const leg = limb[0] === "L", L = eff[limb] || {};
  return leg
    ? { root: s.hip, mid: s[limb] && s[limb].kn, end: s[limb] && s[limb].an, l1: C.TH * (L.tl == null ? 1 : L.tl), l2: C.SH * (L.sl == null ? 1 : L.sl), leg }
    : { root: s.sho, mid: s[limb] && s[limb].el, end: s[limb] && s[limb].hd, l1: C.UA, l2: C.FA, leg };
}
function bendOf(g) {
  let best = 1, bd = 1e9;
  for (const sg of [1, -1]) { const r = ik(g.root, g.end, g.l1, g.l2, sg); const d = Math.hypot(r[0][0] - g.mid[0], r[0][1] - g.mid[1]); if (d < bd) { bd = d; best = sg; } }
  return best;
}

function changeLimbMode(limb, mode) {
  const sp = scrPose(), eff = effPose(), s = solve(sp), g = limbGeo(limb, s, eff), L = eff[limb] || {};
  if (mode === "off") return setLimb(limb, null);
  if (mode === "angles") {
    if (!s[limb]) return setLimb(limb, g.leg ? { th: 0, sh: 0, ft: 90 } : { ua: 0, fa: 0 });
    const a = angleOf(sub(g.mid, g.root)), b = angleOf(sub(g.end, g.mid));
    return setLimb(limb, g.leg ? { th: a, sh: b, ...(L.ft != null ? { ft: L.ft } : {}) } : { ua: a, fa: b });
  }
  if (!s[limb]) return setLimb(limb, { to: [r05(g.root[0]), r05(groundY() - g.root[1] - 60)], s: -1, ...(g.leg ? { ft: 90 } : {}) });
  setLimb(limb, { to: [r05(g.end[0]), r05(groundY() - g.end[1])], s: bendOf(g), ...(g.leg && L.ft != null ? { ft: L.ft } : {}) });
}

function changeAnchor(type) {
  const sp = scrPose(), s = solve(sp), eff = effPose();
  if (type === "ank" && (!eff.L1 || eff.L1.to)) changeLimbMode("L1", "angles");
  const p = type === "hip" ? s.hip : type === "sho" ? s.sho : s.L1 ? s.L1.an : s.hip;
  setAnchor(type, [p[0], groundY() - p[1]]);
}

/* ---------- rendering ---------- */

function render() {
  const X = S.X, d = S.def;
  const srcOpts = [["config", "Your exercises (config)"], ["library", "Library (examples/library)"]].concat(Object.keys(S.sources.draft || {}).length ? [["draft", "Last session"]] : []);
  const ids = Object.keys(S.lib);
  if (!ids.includes(S.id)) ids.unshift(S.id);
  root.innerHTML = `
  <div class="bar-top">
    <h1>Pose editor</h1>
    <select id="src" aria-label="Source">${srcOpts.map(([v, l]) => `<option value="${v}"${v === S.src ? " selected" : ""}>${l}</option>`).join("")}</select>
    <select id="pick" aria-label="Exercise">${ids.map(i => `<option${i === S.id ? " selected" : ""}>${esc(i)}</option>`).join("")}</select>
    <button class="btn" id="new">New exercise</button>
    <span class="sp"></span>
    <a class="btn" href="./" style="display:inline-flex;align-items:center;text-decoration:none;color:inherit">Back to the app</a>
  </div>
  <div class="grid">
    <div class="panel left">${metaPanel(X, d)}</div>
    <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="stagewrap">
        <div class="stagebar">
          <button class="btn acc" id="play">${S.playing ? "Stop" : "▶ Play loop"}</button>
          <label class="chk"><input type="checkbox" id="mirror"${S.mirror ? " checked" : ""}> Mirror</label>
          <label class="chk"><input type="checkbox" id="onion"${S.onion ? " checked" : ""}> Onion skin</label>
          <label class="chk">Scene <select id="scene" style="width:auto">${Object.keys(SCENES).map(s => `<option${s === S.scene ? " selected" : ""}>${s}</option>`).join("")}</select></label>
          <span class="info" id="info"></span>
        </div>
        <svg id="stage" viewBox="${d ? frameBox(d) : FRAMES.default}" style="--hl:var(--solid)"></svg>
        <div class="poses" id="poselist"></div>
      </div>
      <div class="panel">${timelinePanel()}</div>
      <div class="panel">${codePanel()}</div>
    </div>
    <div class="panel" id="posepanel"></div>
  </div>`;
  renderPoseList();
  renderPosePanel();
  refresh();
}

function txt(v, lang) { return v == null ? "" : typeof v === "string" ? (lang === "de" ? v : "") : (v[lang] || ""); }

function metaPanel(X, d) {
  const sel = (id, opts, cur) => `<select id="${id}">${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
  const props = X.props || [];
  const has = (t, h) => props.some(p => p[0] === t && p[1] === h);
  const cues = l => Array.isArray(X.cues) ? (l === "de" ? X.cues.map(c => txt(c, "de") || c).join("\n") : X.cues.map(c => txt(c, "en")).filter(Boolean).join("\n")) : ((X.cues && X.cues[l]) || []).join("\n");
  const baseVal = typeof X.base === "string" ? X.base : X.base == null ? "" : "custom";
  return `<h2>Exercise</h2>
    <label class="f">id (used in routines.js)<input type="text" id="m-id" value="${esc(S.id)}"></label>
    <div class="row2"><label class="f">Name (de)<input type="text" data-m="name.de" value="${esc(txt(X.name, "de"))}"></label><label class="f">Name (en)<input type="text" data-m="name.en" value="${esc(txt(X.name, "en"))}"></label></div>
    <div class="row2"><label class="f">Target (de)<input type="text" data-m="target.de" value="${esc(txt(X.target, "de"))}"></label><label class="f">Target (en)<input type="text" data-m="target.en" value="${esc(txt(X.target, "en"))}"></label></div>
    <div class="row2"><label class="f">Default scene${sel("m-scene", Object.keys(SCENES), d ? d.scene : "mat")}</label><label class="f">Highlight${sel("m-hl", [["hip", "hip"], ["core", "core"], ["sho", "shoulder"]], d ? d.highlight : "core")}</label></div>
    <div class="row2"><label class="f">Equipment${sel("m-eq", [["", "none"], "dumbbell", "dumbbells", "kettlebell"], X.equipment || "")}</label><label class="f">Picture size${sel("m-frame", [["", "normal"], ["tall", "tall (arms overhead)"]], X.frame || "")}</label></div>
    <label class="f">Shared base${sel("m-base", [["", "none"], ...Object.keys(BASES).map(b => [b, b]), ...(baseVal === "custom" ? [["custom", "custom (edit as code)"]] : [])], baseVal)}</label>
    ${X.extends ? `<p class="note2">Extends <b>${esc(X.extends)}</b>: poses not listed here come from it.</p>` : ""}
    <h3>Props</h3>
    <div class="row2">
      <label class="chk"><input type="checkbox" data-prop="db,h1"${has("db", "h1") ? " checked" : ""}> Dumbbell near hand</label>
      <label class="chk"><input type="checkbox" data-prop="db,h2"${has("db", "h2") ? " checked" : ""}> Dumbbell far hand</label>
      <label class="chk"><input type="checkbox" data-prop="kb,h1"${has("kb", "h1") ? " checked" : ""}> Kettlebell near hand</label>
      <label class="chk"><input type="checkbox" data-prop="kb,h2"${has("kb", "h2") ? " checked" : ""}> Kettlebell far hand</label>
    </div>
    <label class="chk"><input type="checkbox" id="m-kbarm"${props.some(p => p[2] === "arm") ? " checked" : ""}> Kettlebell hangs along the forearm (swings)</label>
    <h3>Counting</h3>
    <label class="chk"><input type="checkbox" id="m-alt"${X.alternating ? " checked" : ""}> Alternating (both sides in one rep, no side switch)</label>
    <div class="row2"><label class="f">Reps per loop<input type="number" min="1" step="1" id="m-rpl" value="${X.repsPerLoop || 1}"></label><label class="f">"Per side" means${sel("m-side", [["", "side"], ["direction", "direction"]], X.sideWord || "")}</label></div>
    <div class="row2"><label class="f">View caption (de)<input type="text" data-m="view.de" value="${esc(txt(X.view, "de"))}"></label><label class="f">View caption (en)<input type="text" data-m="view.en" value="${esc(txt(X.view, "en"))}"></label></div>
    <h3>Form cues (one per line)</h3>
    <label class="f">Deutsch<textarea rows="4" id="m-cues-de">${esc(cues("de"))}</textarea></label>
    <label class="f">English<textarea rows="4" id="m-cues-en">${esc(cues("en"))}</textarea></label>`;
}

function renderPoseList() {
  const el = $("poselist");
  if (!el) return;
  const names = S.def && S.def.poses ? Object.keys(S.def.poses) : [];
  el.innerHTML = names.map(n => `<button class="btn sm" data-pose="${esc(n)}" aria-pressed="${n === S.pose}">${esc(n)}</button>`).join("") +
    (S.def && !S.def.custom ? `<button class="btn sm" id="pose-add" title="Copy the current pose into a new one">+ New pose</button>` : "") +
    (S.pose ? `<button class="btn sm" id="pose-ren">Rename</button><button class="btn sm" id="pose-del">Delete</button>` : "");
}

function slider(key, label, val, min, max, step, isOwn, attrs) {
  return `<div class="sl"><span class="${isOwn ? "own" : ""}" title="${isOwn ? "set in this pose" : "inherited from base"}">${label}</span>` +
    `<input type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-k="${key}" ${attrs || ""} aria-label="${esc(label)}">` +
    `<input type="number" step="${step}" value="${val}" data-k="${key}" ${attrs || ""} aria-label="${esc(label)} value"></div>`;
}

function renderPosePanel() {
  const el = $("posepanel");
  if (!el) return;
  const eff = effPose();
  if (!S.def || !S.def.animated) {
    el.innerHTML = `<h2>Poses</h2><p class="note2">This is a text-only exercise: it shows a placeholder in the app. Add poses to animate it.</p><button class="btn acc" id="animate">Add poses</button>`;
    return;
  }
  if (!eff) { el.innerHTML = `<h2>Pose</h2><p class="note2">Pick a pose.</p>`; return; }
  if (S.def.custom) {
    el.innerHTML = `<h2>Pose “${esc(S.pose)}”</h2><p class="note2">Custom drawing (${esc(S.def.custom)}).</p>` +
      Object.keys(eff).map(k => slider(k, k, eff[k], -1, 1, .05, own(k))).join("");
    return;
  }
  const anchor = ANCHORS.find(a => eff[a]) || "hip";
  const [ax, ay] = eff[anchor] || [180, 50];
  let h = `<h2>Pose “${esc(S.pose)}”</h2>
    <p class="note2">Drag the dots on the figure, or use the sliders. <b>Bold</b> labels are set in this pose, the others come from the base. Angles: 0 = down, 90 = right, 180 = up.</p>
    <div class="row3"><label class="f">Anchor<select id="anchor">${ANCHORS.map(a => `<option value="${a}"${a === anchor ? " selected" : ""}>${{ hip: "hip", sho: "shoulder", ank: "ankle (L1 planted)" }[a]}</option>`).join("")}</select></label>
    <label class="f">x<input type="number" step="0.5" id="ax" value="${ax}"></label><label class="f">y above floor<input type="number" step="0.5" id="ay" value="${ay}"></label></div>
    ${slider("t", "torso t", eff.t, -200, 380, .1, own("t"))}
    <label class="chk"><input type="checkbox" id="hfollow"${eff.h == null ? " checked" : ""}> Head follows torso</label>
    ${eff.h == null ? "" : slider("h", "head h", eff.h, -200, 380, .1, own("h"))}
    ${slider("tc", "curve tc", eff.tc || 0, -30, 30, .5, own("tc"))}
    ${slider("g", "glow g", eff.g == null ? 0 : eff.g, 0, 1, .05, own("g"))}`;
  for (const limb of LIMBS) {
    const L = eff[limb], leg = limb[0] === "L", mode = !L ? "off" : L.to ? "target" : "angles";
    const lock = limb === "L1" && anchor === "ank";
    h += `<div class="limb"><div class="hd">${LIMB_NAMES[limb]}<select data-mode="${limb}"${lock ? " disabled title=\"The planted leg needs angles\"" : ""}>` +
      [["off", "hidden"], ["angles", "angles"], ["target", "drag target (IK)"]].map(([v, l]) => `<option value="${v}"${v === mode ? " selected" : ""}>${l}</option>`).join("") + `</select></div>`;
    if (mode === "angles") {
      const a = leg ? [["th", "thigh th"], ["sh", "shin sh"]] : [["ua", "upper ua"], ["fa", "fore fa"]];
      for (const [k, lab] of a) h += slider(limb + "." + k, lab, L[k], -360, 360, .1, own(limb, k));
      if (leg) {
        h += slider(limb + ".tl", "thigh len", L.tl == null ? 1 : L.tl, .1, 1.2, .05, own(limb, "tl"));
        h += slider(limb + ".sl", "shin len", L.sl == null ? 1 : L.sl, .1, 1.2, .05, own(limb, "sl"));
      }
    } else if (mode === "target") {
      h += `<div class="row3"><label class="f">x<input type="number" step="0.5" data-to="${limb}.0" value="${L.to[0]}"></label><label class="f">y above floor<input type="number" step="0.5" data-to="${limb}.1" value="${L.to[1]}"></label>` +
        `<label class="f">bend<select data-bend="${limb}"><option value="1"${L.s === 1 ? " selected" : ""}>1</option><option value="-1"${L.s === -1 ? " selected" : ""}>-1</option></select></label></div>`;
    }
    if (leg && mode !== "off") h += L.ft == null ? `<button class="btn sm" data-foot="${limb}">Add foot</button>` : slider(limb + ".ft", "foot ft", L.ft, -360, 360, .1, own(limb, "ft"));
    h += `</div>`;
  }
  h += `<button class="btn sm" id="pose-reset" style="align-self:flex-start">Reset this pose to the base</button>`;
  el.innerHTML = h;
}

function stepsRaw(which) {
  if (Array.isArray(S.X[which])) return S.X[which];
  const list = S.def ? S.def[which] : [];
  return list.map(s => [s.from, s.to, s.ms, s.label, s.breath, ...(s.linear ? ["linear"] : [])]);
}
function ownSteps(which) { if (!Array.isArray(S.X[which])) S.X[which] = clone(stepsRaw(which)); return S.X[which]; }

function timelinePanel() {
  const names = S.def && S.def.poses ? Object.keys(S.def.poses) : [];
  const rows = which => stepsRaw(which).map((st, i) => {
    const [from, to, ms, label, breath, easing] = st;
    const ps = cur => names.map(n => `<option${n === cur ? " selected" : ""}>${esc(n)}</option>`).join("");
    return `<tr data-w="${which}" data-i="${i}"><td><select data-s="0">${ps(from)}</select></td><td><select data-s="1">${ps(to)}</select></td>` +
      `<td><input class="ms" type="number" min="50" step="50" data-s="2" value="${ms}"></td>` +
      `<td><input type="text" data-s="3de" value="${esc(txt(label, "de"))}" placeholder="Deutsch"></td><td><input type="text" data-s="3en" value="${esc(txt(label, "en"))}" placeholder="English"></td>` +
      `<td><select data-s="4">${BREATHS.map(b => `<option${b === (breath || "calm") ? " selected" : ""}>${b}</option>`).join("")}</select></td>` +
      `<td><select data-s="5"><option value="">ease</option><option value="linear"${easing === "linear" || easing === "lin" ? " selected" : ""}>linear</option></select></td>` +
      `<td style="white-space:nowrap"><button class="btn sm" data-step="up" aria-label="Move up">↑</button> <button class="btn sm" data-step="down" aria-label="Move down">↓</button> <button class="btn sm" data-step="del" aria-label="Delete step">✕</button></td></tr>`;
  }).join("");
  const head = `<tr><th>from</th><th>to</th><th>ms</th><th>label (de)</th><th>label (en)</th><th>breath</th><th>easing</th><th></th></tr>`;
  const inh = S.X.extends && !Array.isArray(S.X.loop) ? `<p class="note2">The loop comes from ${esc(S.X.extends)}. Editing it makes a copy here.</p>` : "";
  return `<h2>Timeline</h2>${inh}
    <h3>Intro (plays once)</h3><div style="overflow-x:auto"><table class="tl">${head}${rows("intro")}</table></div><button class="btn sm" data-add="intro" style="align-self:flex-start">+ Intro step</button>
    <h3>Loop</h3><div style="overflow-x:auto"><table class="tl">${head}${rows("loop")}</table></div><button class="btn sm" data-add="loop" style="align-self:flex-start">+ Loop step</button>`;
}

function codePanel() {
  return `<h2>Code</h2>
    <p class="note2">Paste this into <code>config/exercises.js</code>, inside <code>export default { … }</code>.</p>
    <textarea id="code" rows="12" readonly></textarea>
    <div class="btnrow left"><button class="btn acc" id="copy">Copy as code</button></div>
    <h3>Import</h3>
    <p class="note2">Paste an exercise (<code>"id": { … }</code>) or a whole exercises file, then load it.</p>
    <textarea id="paste" rows="5" placeholder='"my-exercise": { name: "…", poses: { … }, loop: [ … ] }'></textarea>
    <div class="btnrow left"><button class="btn" id="load">Load pasted code</button></div>
    <h3>Checks</h3><ul class="warn" id="checks"></ul>`;
}

/** Redraw the stage, checks and code (no panel rebuild, so sliders keep focus). */
function refresh() {
  drawStage();
  const ul = $("checks");
  if (ul) {
    const items = S.errors.map(e => `<li class="err">${esc(e)}</li>`);
    if (S.def) for (const sc of new Set([S.def.scene, S.scene])) for (const i of checkExercise(S.def, sc)) items.push(`<li class="err">${esc(sc)}: ${esc(i)}</li>`);
    ul.innerHTML = items.length ? items.join("") : `<li class="ok">✓ All checks passed (same checks as npm run check)</li>`;
  }
  const code = $("code");
  if (code) code.value = toCode(S.id, S.X);
}

function prevPoseName() {
  if (!S.def || !S.def.loop) return null;
  const st = S.def.loop.find(s => s.to === S.pose && s.from !== S.pose) || S.def.intro.find(s => s.to === S.pose && s.from !== S.pose);
  return st ? st.from : null;
}

function drawStage() {
  const svg = $("stage");
  if (!svg) return;
  const d = S.def;
  svg.setAttribute("viewBox", d ? frameBox(d) : FRAMES.default);
  if (!d) { svg.innerHTML = `<text x="180" y="115" text-anchor="middle" fill="var(--muted)" font-size="14">Fix the errors below to see the figure</text>`; return; }
  if (!d.animated) { svg.innerHTML = placeholderSVG(d.scene, "", "").replace(/^<svg[^>]*>|<\/svg>$/g, ""); setInfo("Text-only exercise"); return; }
  if (S.playing) {
    const a = evalAnim(d, S.scene, S.t);
    svg.innerHTML = innerSVG(d, S.scene, a.pose, S.mirror);
    setInfo(`${(S.t / 1000).toFixed(1)} s · ${txt(a.label, "de") || txt(a.label, "en")} · ${a.breath}`);
    document.querySelectorAll("table.tl tr[data-w]").forEach(tr => tr.classList.toggle("on", tr.dataset.w === "loop" ? +tr.dataset.i === a.step : (a.step === -1 && S.t < d.I && isIntroRow(tr, d))));
    return;
  }
  const sp = scrPose();
  if (!sp) { svg.innerHTML = ""; return; }
  const pn = prevPoseName();
  const onion = S.onion && pn && !d.custom && pn !== S.pose ? `<g class="onion">${figSVG(d, posesFor(d, S.scene)[pn])}</g>` : "";
  let out = (d.custom ? "" : SCENES[S.scene].svg) + onion + figSVG(d, sp);
  if (S.mirror) out = `<g transform="translate(360,0) scale(-1,1)">${out}</g>`;
  if (!S.mirror && !d.custom) out += handlesSVG(sp);
  svg.innerHTML = out;
  setInfo(pn && S.onion ? `Editing “${S.pose}” · faint figure: “${pn}”` : `Editing “${S.pose}”`);
}
function isIntroRow(tr, d) {
  const i = +tr.dataset.i; let acc = 0;
  for (let k = 0; k < d.intro.length; k++) { if (S.t < acc + d.intro[k].ms) return k === i; acc += d.intro[k].ms; }
  return false;
}
function setInfo(s) { const el = $("info"); if (el) el.textContent = s; }

function handlesSVG(sp) {
  const s = solve(sp), anchor = ANCHORS.find(a => sp[a]);
  const hs = [{ id: "anchor", p: anchor === "ank" ? sp.ank : anchor === "sho" ? s.sho : s.hip, cls: "anchor", title: "anchor (" + anchor + ")" }];
  hs.push({ id: "torso", p: anchor === "sho" ? s.hip : s.sho, title: "torso angle" });
  // far-side handles first, so the near side is on top where they overlap
  for (const L of ["L2", "A2", "L1", "A1"]) {
    if (!s[L] || (anchor === "ank" && L === "L1")) continue;
    hs.push({ id: L, p: L[0] === "L" ? s[L].an : s[L].hd, title: LIMB_NAMES[L], cls: L.endsWith("2") ? "far" : "" });
  }
  return hs.map(h => `<circle class="h ${h.cls || ""}" data-h="${h.id}" cx="${h.p[0].toFixed(1)}" cy="${h.p[1].toFixed(1)}" r="7"><title>${esc(h.title)}</title></circle>`).join("");
}

/* ---------- dragging ---------- */

let drag = null;
function svgPoint(ev) {
  const svg = $("stage"), pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const m = svg.getScreenCTM().inverse(), q = pt.matrixTransform(m);
  return [q.x, q.y];
}
function applyDrag(id, p) {
  const sp = scrPose(), s = solve(sp), eff = effPose(), gy = groundY();
  if (id === "anchor") { const a = ANCHORS.find(k => sp[k]); setAnchor(a, [p[0], gy - p[1]]); }
  else if (id === "torso") { const anchor = ANCHORS.find(k => sp[k]); setScalar("t", anchor === "sho" ? angleOf(sub(s.sho, p)) : angleOf(sub(p, s.hip))); }
  else {
    const L = eff[id];
    if (L && L.to) setLimbKey(id, "to", [r05(p[0]), r05(gy - p[1])]);
    else {
      const g = limbGeo(id, s, eff), r = ik(g.root, p, g.l1, g.l2, bendOf(g));
      const a = angleOf(sub(r[0], g.root)), b = angleOf(sub(r[1], r[0]));
      if (g.leg) { setLimbKey(id, "th", a); setLimbKey(id, "sh", b); } else { setLimbKey(id, "ua", a); setLimbKey(id, "fa", b); }
    }
  }
  compile();
  refresh();
}

root.addEventListener("pointerdown", ev => {
  const h = ev.target.closest && ev.target.closest("[data-h]");
  if (!h) return;
  ev.preventDefault();
  drag = h.getAttribute("data-h");
  $("stage").setPointerCapture(ev.pointerId);
});
root.addEventListener("pointermove", ev => { if (drag) applyDrag(drag, svgPoint(ev)); });
const endDrag = () => { if (drag) { drag = null; renderPosePanel(); } };
root.addEventListener("pointerup", endDrag);
root.addEventListener("pointercancel", endDrag);

/* ---------- playback ---------- */

let raf = 0, last = 0;
function tick(ts) {
  if (!S.playing) return;
  S.t += last ? Math.min(100, ts - last) : 0;
  last = ts;
  drawStage();
  raf = requestAnimationFrame(tick);
}
function setPlaying(on) {
  S.playing = on; S.t = 0; last = 0;
  cancelAnimationFrame(raf);
  if (on && S.def && S.def.animated && S.def.L > 0) raf = requestAnimationFrame(tick);
  else S.playing = false;
  const b = $("play"); if (b) b.textContent = S.playing ? "Stop" : "▶ Play loop";
  if (!S.playing) { document.querySelectorAll("table.tl tr.on").forEach(tr => tr.classList.remove("on")); drawStage(); }
}

/* ---------- events ---------- */

function setText(path, value) {
  const [field, lang] = path.split(".");
  let v = S.X[field];
  if (typeof v === "string") v = { de: v };
  v = { ...(isObj(v) ? v : {}), [lang]: value };
  S.X[field] = v;
}

function onInput(ev) {
  const el = ev.target;
  if (el.matches("[data-k]")) {
    const k = el.dataset.k, v = parseFloat(el.value);
    if (!isFinite(v)) return;
    el.parentElement.querySelectorAll(`[data-k="${k}"]`).forEach(o => { if (o !== el) o.value = v; });
    if (k.includes(".")) { const [limb, key] = k.split("."); setLimbKey(limb, key, v); } else setScalar(k, v);
    el.parentElement.firstElementChild.classList.add("own");
    compile(); refresh();
  } else if (el.matches("[data-m]")) { setText(el.dataset.m, el.value); compile(); refresh(); }
  else if (el.matches("[data-to]")) {
    const [limb, i] = el.dataset.to.split("."), L = effPose()[limb], to = L.to.slice();
    to[+i] = parseFloat(el.value) || 0; setLimbKey(limb, "to", to); compile(); refresh();
  } else if (el.id === "ax" || el.id === "ay") {
    const a = $("anchor").value; setAnchor(a, [parseFloat($("ax").value) || 0, parseFloat($("ay").value) || 0]); compile(); refresh();
  } else if (el.closest("tr[data-w]") && el.matches("input[type=text], input[type=number]")) stepEdit(el);
  else if (el.id === "m-cues-de" || el.id === "m-cues-en") {
    const cur = isObj(S.X.cues) ? S.X.cues : Array.isArray(S.X.cues) ? { de: S.X.cues.map(c => txt(c, "de") || c) } : {};
    cur[el.id.slice(-2)] = el.value.split("\n").map(s => s.trim()).filter(Boolean);
    S.X.cues = cur; compile(); refresh();
  }
}

function stepEdit(el) {
  const tr = el.closest("tr[data-w]"), which = tr.dataset.w, i = +tr.dataset.i, list = ownSteps(which), st = list[i], k = el.dataset.s;
  if (k === "0" || k === "1") st[+k] = el.value;
  else if (k === "2") st[2] = Math.max(1, parseFloat(el.value) || 0);
  else if (k === "3de" || k === "3en") { let lab = st[3]; if (typeof lab === "string") lab = { de: lab }; st[3] = { ...(isObj(lab) ? lab : {}), [k.slice(1)]: el.value }; }
  else if (k === "4") st[4] = el.value;
  else if (k === "5") { if (el.value) { while (st.length < 5) st.push("calm"); st[5] = el.value; } else st.length = Math.min(st.length, 5); }
  compile(); refresh();
}

function onChange(ev) {
  const el = ev.target;
  const rerender = () => { compile(); render(); };
  if (el.id === "src") { S.src = el.value; S.lib = S.sources[S.src]; const first = Object.keys(S.lib)[0]; if (first) open(first, clone(S.lib[first])); }
  else if (el.id === "pick") { if (S.lib[el.value]) open(el.value, clone(S.lib[el.value])); }
  else if (el.id === "m-id") { const v = el.value.trim().replace(/\s+/g, "-"); if (v) { S.id = v; rerender(); } }
  else if (el.id === "m-scene") { S.X.scene = el.value; S.scene = el.value; rerender(); }
  else if (el.id === "m-hl") { S.X.highlight = el.value; rerender(); }
  else if (el.id === "m-eq") { if (el.value) S.X.equipment = el.value; else delete S.X.equipment; rerender(); }
  else if (el.id === "m-frame") { if (el.value) S.X.frame = el.value; else delete S.X.frame; rerender(); }
  else if (el.id === "m-base") { if (el.value === "custom") return; if (el.value) S.X.base = el.value; else delete S.X.base; rerender(); }
  else if (el.matches("[data-prop]") || el.id === "m-kbarm") {
    const arm = $("m-kbarm").checked, props = [];
    root.querySelectorAll("[data-prop]").forEach(c => { if (c.checked) { const [t, h] = c.dataset.prop.split(","); props.push(t === "kb" && arm ? [t, h, "arm"] : [t, h]); } });
    if (props.length) S.X.props = props; else delete S.X.props;
    rerender();
  }
  else if (el.id === "m-alt") { if (el.checked) S.X.alternating = true; else delete S.X.alternating; rerender(); }
  else if (el.id === "m-rpl") { const v = parseInt(el.value, 10); if (v > 1) S.X.repsPerLoop = v; else delete S.X.repsPerLoop; rerender(); }
  else if (el.id === "m-side") { if (el.value) S.X.sideWord = el.value; else delete S.X.sideWord; rerender(); }
  else if (el.id === "mirror") { S.mirror = el.checked; drawStage(); }
  else if (el.id === "onion") { S.onion = el.checked; drawStage(); }
  else if (el.id === "scene") { S.scene = el.value; refresh(); }
  else if (el.id === "anchor") { changeAnchor(el.value); compile(); renderPosePanel(); refresh(); }
  else if (el.id === "hfollow") { if (el.checked) setScalar("h", null); else setScalar("h", effPose().t); compile(); renderPosePanel(); refresh(); }
  else if (el.matches("[data-mode]")) { changeLimbMode(el.dataset.mode, el.value); compile(); renderPosePanel(); refresh(); }
  else if (el.matches("[data-bend]")) { setLimbKey(el.dataset.bend, "s", +el.value); compile(); refresh(); }
  else if (el.closest("tr[data-w]") && el.matches("select")) stepEdit(el);
}

function onClick(ev) {
  const b = ev.target.closest("button");
  if (!b) return;
  if (b.id === "new") { S.src = "config"; S.lib = S.sources.config; newExercise(); }
  else if (b.id === "play") setPlaying(!S.playing);
  else if (b.dataset.pose) { setPlaying(false); S.pose = b.dataset.pose; renderPoseList(); renderPosePanel(); refresh(); }
  else if (b.id === "pose-add") {
    let n = "pose", i = 2; while (S.def.poses[n]) n = "pose" + i++;
    S.X.poses = S.X.poses || {};
    S.X.poses[n] = clone((S.X.poses && S.X.poses[S.pose]) || {});
    S.pose = n; compile(); render();
  }
  else if (b.id === "pose-ren") {
    const nn = (prompt("New name for this pose", S.pose) || "").trim().replace(/\s+/g, "-");
    if (!nn || nn === S.pose || (S.def.poses && S.def.poses[nn])) return;
    const rename = list => (list || []).forEach(st => { if (st[0] === S.pose) st[0] = nn; if (st[1] === S.pose) st[1] = nn; });
    S.X.poses = S.X.poses || {};
    S.X.poses[nn] = S.X.poses[S.pose] || {};
    delete S.X.poses[S.pose];
    ownSteps("loop"); rename(S.X.loop);
    if (stepsRaw("intro").length) { ownSteps("intro"); rename(S.X.intro); }
    S.pose = nn; compile(); render();
  }
  else if (b.id === "pose-del") {
    const used = [...stepsRaw("loop"), ...stepsRaw("intro")].some(st => st[0] === S.pose || st[1] === S.pose);
    if (used) { toast("This pose is used in the timeline. Remove those steps first."); return; }
    if (S.X.poses) delete S.X.poses[S.pose];
    compile(); S.pose = S.def && S.def.poses ? Object.keys(S.def.poses)[0] : null; render();
  }
  else if (b.id === "pose-reset") { if (S.X.poses) S.X.poses[S.pose] = {}; compile(); renderPosePanel(); refresh(); }
  else if (b.dataset.foot) { setLimbKey(b.dataset.foot, "ft", 90); compile(); renderPosePanel(); refresh(); }
  else if (b.id === "animate") {
    S.X.base = S.X.base || "standing";
    S.X.poses = { start: { g: .2 }, end: { t: 165, g: .8 } };
    S.X.loop = [["start", "end", 1500, { de: "", en: "" }, "out"], ["end", "start", 1500, { de: "", en: "" }, "in"]];
    compile(); S.pose = "start"; render();
  }
  else if (b.dataset.add) {
    const names = S.def && S.def.poses ? Object.keys(S.def.poses) : [];
    if (!names.length) return;
    const list = ownSteps(b.dataset.add), lastTo = list.length ? list[list.length - 1][1] : names[0];
    list.push([lastTo, names.find(n => n !== lastTo) || lastTo, 1000, { de: "", en: "" }, "calm"]);
    compile(); render();
  }
  else if (b.dataset.step) {
    const tr = b.closest("tr[data-w]"), list = ownSteps(tr.dataset.w), i = +tr.dataset.i;
    if (b.dataset.step === "del") list.splice(i, 1);
    else { const j = b.dataset.step === "up" ? i - 1 : i + 1; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; }
    compile(); render();
  }
  else if (b.id === "copy") {
    const code = toCode(S.id, S.X);
    (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast("Copied. Paste it into config/exercises.js"), () => { $("code").select(); toast("Press Ctrl/Cmd+C to copy"); });
  }
  else if (b.id === "load") loadPasted($("paste").value);
}

root.addEventListener("input", onInput);
root.addEventListener("change", onChange);
root.addEventListener("click", onClick);

/* ---------- import / export ---------- */

function loadPasted(text) {
  let v;
  try {
    let s = text.trim().replace(/^export\s+default\s+/, "").replace(/;\s*$/, "").replace(/,\s*$/, "");
    if (/^["'][^"']+["']\s*:/.test(s) || /^[\w-]+\s*:\s*\{/.test(s)) s = "{" + s + "}";
    // This runs code you pasted yourself, in your own browser (like the dev console).
    v = new Function(...Object.keys(PASTE_CONSTS), '"use strict"; return (' + s + ");")(...Object.values(PASTE_CONSTS));
  } catch (e) { toast("Couldn't read that: " + e.message); return; }
  if (!isObj(v)) { toast("That doesn't look like an exercise"); return; }
  const single = ["name", "poses", "loop", "cues", "base"].some(k => k in v);
  const map = single ? { [S.id || "pasted-exercise"]: v } : v;
  S.sources.draft = { ...map };
  S.src = "draft"; S.lib = S.sources.draft;
  const first = Object.keys(map)[0];
  open(first, clone(map[first]));
  toast(`Loaded ${Object.keys(map).length} exercise(s)`);
}

function cleanText(v) {
  if (!isObj(v)) return v;
  const o = {};
  for (const k in v) if (v[k] !== "" && v[k] != null) o[k] = v[k];
  const keys = Object.keys(o);
  return keys.length ? o : undefined;
}

function cleaned(X) {
  const o = {};
  for (const k of [...FIELD_ORDER, ...Object.keys(X).filter(k => !FIELD_ORDER.includes(k))]) {
    if (!(k in X) || X[k] === undefined) continue;
    let v = X[k];
    if (["name", "target", "view"].includes(k)) v = cleanText(v);
    if (k === "cues" && isObj(v)) { const c = {}; for (const l in v) if (v[l] && v[l].length) c[l] = v[l]; v = Object.keys(c).length ? c : undefined; }
    if ((k === "loop" || k === "intro") && Array.isArray(v)) {
      if (!v.length && k === "intro") v = undefined;
      else v = v.map(st => { const s = st.slice(); s[3] = cleanText(s[3]) || ""; return s; });
    }
    if (v !== undefined) o[k] = v;
  }
  return o;
}

function lit(v, ind) {
  const pad = "  ".repeat(ind);
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "number") return String(Math.round(v * 100) / 100);
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    const inner = v.map(x => lit(x, ind + 1));
    const one = "[" + inner.join(", ") + "]";
    const isStep = typeof v[2] === "number" && typeof v[0] === "string";
    if (isStep || (one.length < 90 && !one.includes("\n"))) return one;
    return "[\n" + inner.map(s => pad + "  " + s).join(",\n") + ",\n" + pad + "]";
  }
  const keys = Object.keys(v).filter(k => v[k] !== undefined);
  const key = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
  const inner = keys.map(k => key(k) + ": " + lit(v[k], ind + 1));
  const one = "{ " + inner.join(", ") + " }";
  if (!keys.length) return "{}";
  if (one.length < 90 && !one.includes("\n")) return one;
  return "{\n" + inner.map(s => pad + "  " + s).join(",\n") + ",\n" + pad + "}";
}

function toCode(id, X) { return JSON.stringify(id) + ": " + lit(cleaned(X), 0) + ","; }

let toastT = 0;
function toast(msg) { const el = $("toast"); el.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => { el.textContent = ""; }, 2600); }

init();
