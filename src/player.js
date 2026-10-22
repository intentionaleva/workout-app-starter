// The workout player: steps, timing, rep counting, side switches, rests,
// breathing, beeps, vibration and the screen wake lock. Drawing is done by
// screens.js through the `view` callbacks, so this file has no markup.

import { evalAnim, loopMs } from "./exercise.js";
import { addLog } from "./storage.js";
import { t, tx } from "./i18n.js";
import { ease } from "./rig.js";

let ctx = null;    // { exercises, config }
let view = null;   // { render(), rest(P), work(P, info) }
export let P = null;
let raf = 0, lastTs = 0;

export function initPlayer(context, v) { ctx = context; view = v; }
const ex = id => ctx.exercises[id];
const dflt = k => ctx.config.defaults && ctx.config.defaults[k] != null ? ctx.config.defaults[k] : { rest: 15, roundRest: 45, sideSwitch: 4, repSeconds: 3 }[k];

/* ---------- steps ---------- */

function stepOf(it, sec, round, rounds, endRound) {
  return {
    ex: it.ex, scene: it.scene || ex(it.ex).scene, sec: sec.title, round, rounds, endRound,
    dose: { reps: it.reps, secs: it.secs, perSide: !!it.perSide, label: it.label },
  };
}

/** Every exercise of every round, in order. */
export function buildSteps(r) {
  const st = [];
  for (const sec of r.sections) {
    const rounds = sec.rounds || 1;
    for (let k = 1; k <= rounds; k++) sec.items.forEach((it, i) => st.push(stepOf(it, sec, k, rounds, i === sec.items.length - 1 && k < rounds)));
  }
  return st;
}

/** One step per item (round 1 only), for previewing from the overview. */
export function previewSteps(r) {
  const st = [];
  for (const sec of r.sections) sec.items.forEach(it => st.push(stepOf(it, sec, 1, 1, false)));
  return st;
}

export function countItems(r) { return (r.sections || []).reduce((a, s) => a + s.items.length, 0); }

/** "× 10 pro Seite", "30 s", "1 Min" … */
export function doseText(d, def) {
  if (d.label) return tx(d.label);
  const s = d.secs ? (d.secs >= 60 ? t("doseMin", { n: d.secs / 60 }) : t("doseSec", { n: d.secs })) : t("doseReps", { n: d.reps });
  return s + (d.perSide ? (def && def.sideWord === "direction" ? t("perDirection") : t("perSide")) : "");
}

export function needsSides(st) { return !!st.dose.perSide && !ex(st.ex).alternating; }

/* ---------- audio, vibration, wake lock ---------- */

let actx = null, wake = null;
function unlockAudio() {
  try {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === "suspended") actx.resume();
  } catch (e) { /* no audio */ }
}
function beep(f, ms) {
  try {
    if (actx) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f || 880; o.connect(g); g.connect(actx.destination);
      const now = actx.currentTime;
      g.gain.setValueAtTime(.0001, now);
      g.gain.exponentialRampToValueAtTime(.25, now + .02);
      g.gain.exponentialRampToValueAtTime(.0001, now + (ms || 180) / 1000);
      o.start(now); o.stop(now + (ms || 180) / 1000 + .05);
    }
  } catch (e) { /* ignore */ }
  try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* ignore */ }
}
function lockScreen() {
  try {
    if (navigator.wakeLock && !wake) navigator.wakeLock.request("screen").then(w => { wake = w; w.addEventListener("release", () => { wake = null; }); }).catch(() => {});
  } catch (e) { /* ignore */ }
}
function releaseScreen() { try { if (wake) wake.release(); } catch (e) { /* ignore */ } wake = null; }
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && P && P.mode !== "done") lockScreen();
});

/* ---------- state machine ---------- */

export function startPlayer(routine, steps, opts = {}) {
  unlockAudio(); lockScreen();
  P = { routine, steps, i: opts.pick || 0, mode: "work", side: 1, t: 0, paused: false, left: 0, preview: !!opts.preview, lastBeep: -1 };
  show();
}
export function stopPlayer() { stopLoop(); releaseScreen(); P = null; }

function show() { view.render(); if (P.mode === "done") stopLoop(); else loop(); }
function goStep(i) { P.i = i; P.mode = "work"; P.side = 1; P.t = 0; P.lastBeep = -1; show(); }
function complete() { P.mode = "done"; addLog(P.routine.id); releaseScreen(); show(); }

function finishStep() {
  const st = P.steps[P.i];
  beep(988, 200);
  if (needsSides(st) && P.side === 1) { P.mode = "switch"; P.left = dflt("sideSwitch") * 1000; show(); return; }
  if (P.preview) { P.side = 1; P.t = 0; return; }
  if (P.i >= P.steps.length - 1) { complete(); return; }
  const r = P.routine;
  P.mode = "rest";
  P.left = (st.endRound ? (r.roundRest != null ? r.roundRest : dflt("roundRest")) : (r.rest != null ? r.rest : dflt("rest"))) * 1000;
  show();
}

export function togglePause() { if (P) P.paused = !P.paused; return P && P.paused; }
export function skip() {
  if (!P) return;
  if (P.mode === "rest" || P.i < P.steps.length - 1) goStep(P.i + 1);
  else if (P.preview) goStep(0);
  else complete();
}
export function prev() { if (!P) return; if (P.mode === "rest") goStep(P.i); else goStep(Math.max(0, P.i - 1)); }
export function addRest(ms) { if (P) P.left += ms; }

export function fmt(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

/** Radius of the breathing dot for the current phase. */
export function breathRadius(breath, k, reduced) {
  if (reduced) return 6.5;
  return breath === "out" ? 9 - 5 * ease(k) : breath === "in" ? 4 + 5 * ease(k) : breath === "hold" ? 6.5 : 6.5 + 2.5 * Math.sin(Date.now() / 700);
}

/* ---------- frame loop ---------- */

function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
function loop() { stopLoop(); lastTs = 0; raf = requestAnimationFrame(frame); }

function frame(ts) {
  raf = requestAnimationFrame(frame);
  if (!P) return;
  const dt = lastTs ? Math.min(100, ts - lastTs) : 0;
  lastTs = ts;
  const st = P.steps[P.i];
  if (P.mode === "rest") {
    if (!P.paused) P.left -= dt;
    view.rest(P, fmt(P.left));
    const sec = Math.ceil(P.left / 1000);
    if (sec <= 3 && sec > 0 && sec !== P.lastBeep) { P.lastBeep = sec; beep(660, 120); }
    if (P.left <= 0) goStep(P.i + 1);
    return;
  }
  if (P.mode !== "work" && P.mode !== "switch") return;
  const e = ex(st.ex), dir = e.sideWord === "direction";
  const word = t(dir ? "direction" : "side");
  if (P.mode === "switch") {
    if (!P.paused) P.left -= dt;
    view.work(P, {
      time: 0, mirror: true, label: t(dir ? "switchDirection" : "switchSide"), breath: "calm", k: 0, step: -1,
      count: '<small>' + t("secondIn", { word }) + '</small> ' + Math.max(0, Math.ceil(P.left / 1000)),
      meta: t(dir ? "otherDirectionSoon" : "otherSideSoon"),
    });
    if (P.left <= 0) { P.mode = "work"; P.side = 2; P.t = 0; }
    return;
  }
  if (!P.paused) P.t += dt;
  const a = evalAnim(e, st.scene, P.t), L = loopMs(e, dflt("repSeconds"));
  const sideTxt = needsSides(st) ? t("sideOf", { word, n: P.side }) : "";
  let done = false, count, repNo = 1;
  if (st.dose.secs) { const rem = st.dose.secs * 1000 - P.t; count = fmt(rem); done = rem <= 0; repNo = Math.floor(P.t / L) + 1; }
  else {
    const per = L / (e.repsPerLoop || 1), rd = Math.floor(Math.max(0, P.t - e.I) / per);
    count = Math.min(rd + 1, st.dose.reps) + ' <small>/ ' + st.dose.reps + '</small>';
    done = rd >= st.dose.reps;
    repNo = Math.min(rd + 1, st.dose.reps);
  }
  const label = P.paused ? t("paused") : e.animated ? tx(a.label) : t("rep", { n: repNo });
  const eq = e.equipment ? " · " + equipmentName(e.equipment) : "";
  view.work(P, {
    time: P.t, mirror: P.side === 2, label, breath: a.breath, k: e.animated ? a.k : (P.t % L) / L, step: a.step, to: a.to,
    count, meta: doseText(st.dose, e) + eq + sideTxt + (e.target ? " · " + tx(e.target) : ""),
  });
  if (done) finishStep();
}

export function equipmentName(eq) {
  const key = "eq_" + eq;
  const s = t(key);
  return s === key ? eq : s;
}
