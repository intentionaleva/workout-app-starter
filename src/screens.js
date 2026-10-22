// All screens: home (tiles + week view), routine overview, player, check-off
// (cardio), settings, first-launch disclaimer and the config error screen.

import { fullSVG, placeholderSVG, esc, frameBox } from "./rig.js";
import { posesFor, thumbPose, evalAnim, keyPoses } from "./exercise.js";
import { t, tx, txList, getLang, languages, initLang, weekdaysMonFirst, dayLabel, shortDate } from "./i18n.js";
import * as store from "./storage.js";
import * as player from "./player.js";
import { ICONS, icon } from "./icons.js";

let ctx = null;   // { config, exercises, routines, version }
let app = null;
const reducedMotion = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

export function initScreens(context, root) {
  ctx = context;
  app = root;
  player.initPlayer({ exercises: ctx.exercises, config: ctx.config }, { render: renderPlayer, rest: updateRest, work: updateWork });
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
}

const routine = id => ctx.routines.find(r => r.id === id);
const EX = id => ctx.exercises[id];
const toneCls = r => "t-" + r.tone;
const top0 = () => { try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } };

/* ---------- theme colours from app.config.js ---------- */

export function applyTones(tones) {
  const names = Object.keys(tones);
  let light = "", dark = "", cls = "";
  for (const n of names) {
    const c = tones[n], d = c.dark || {};
    for (const k of ["tint", "fg", "deep", "solid"]) {
      light += `--${n}-${k}:${c[k]};`;
      if (d[k]) dark += `--${n}-${k}:${d[k]};`;
    }
    cls += `.t-${n}{--tint:var(--${n}-tint);--afg:var(--${n}-fg);--deep:var(--${n}-deep);--solid:var(--${n}-solid)}\n`;
  }
  const first = names[0];
  const css = `:root{${light}--tint:var(--${first}-tint);--afg:var(--${first}-fg);--deep:var(--${first}-deep);--solid:var(--${first}-solid)}\n` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}\n:root[data-theme="dark"]{${dark}}\n` + cls;
  let st = document.getElementById("tones");
  if (!st) { st = document.createElement("style"); st.id = "tones"; document.head.appendChild(st); }
  st.textContent = css;
}

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
  else root.removeAttribute("data-theme");
}

/* ---------- dates and the weekly log ---------- */

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function isoWeek(d) {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return Math.ceil(((u - y) / 864e5 + 1) / 7);
}
function inRange(e, a, b) { return e.ts >= a.getTime() && e.ts < b.getTime(); }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function doneLabel(rid, short) {
  const ts = store.lastOf(rid);
  if (!ts) return "";
  const d = new Date(ts);
  if (sameDay(d, new Date())) return short ? t("today") : t("doneToday");
  return short ? dayLabel(d) : t("lastDone", { date: dayLabel(d) });
}

/** Weekly goal groups, in the order routines first mention them. */
function goalGroups() {
  const groups = [], cfg = ctx.config.goals || {};
  for (const r of ctx.routines) {
    if (!r.goal) continue;
    const id = r.goal.group || r.id;
    let g = groups.find(x => x.id === id);
    if (!g) {
      const c = cfg[id] || {};
      g = { id, label: c.label || r.name, short: c.short || c.label || r.name, tone: c.tone || r.tone, perWeek: c.perWeek != null ? c.perWeek : r.goal.perWeek, ids: [] };
      groups.push(g);
    }
    g.ids.push(r.id);
  }
  return groups;
}

/* ---------- small pieces ---------- */

function thumbHTML(e, scene, cls) {
  const name = tx(e.name);
  if (e.animated) return fullSVG(e, scene, thumbPose(e, scene), false, cls || "", name);
  if (e.image) return `<img src="${esc(e.image)}" alt="${esc(name)}" loading="lazy">`;
  return placeholderSVG(scene, cls || "", name);
}
function eqChip(id) {
  const e = EX(id);
  if (!e.equipment) return "";
  const w = store.getWeight(id);
  return '<span class="eqc">' + esc(player.equipmentName(e.equipment)) + (w ? " · " + esc(w) + " " + esc(ctx.config.weightUnit || "kg") : "") + '</span>';
}
const backBtn = (act = "home", label = t("back")) => `<button class="icon-btn" data-act="${act}" aria-label="${esc(label)}">${ICONS._back}</button>`;

/* ---------- home ---------- */

export function renderHome() {
  player.stopPlayer();
  const now = new Date(), ws = weekStart(now), we = addDays(ws, 7), lws = addDays(ws, -7), LOG = store.getLog();
  const thisW = LOG.filter(e => inRange(e, ws, we)), lastW = LOG.filter(e => inRange(e, lws, ws));
  const cnt = (list, ids) => list.filter(e => ids.includes(e.r)).length;

  // day dots
  let days = "";
  const today = (now.getDay() + 6) % 7, wd = weekdaysMonFirst();
  for (let d = 0; d < 7; d++) {
    const a = addDays(ws, d), b = addDays(ws, d + 1), seen = {};
    let dots = "";
    thisW.forEach(e => {
      const r = routine(e.r);
      if (inRange(e, a, b) && !seen[e.r] && r) { seen[e.r] = 1; dots += `<i class="dot ${toneCls(r)}" title="${esc(tx(r.name))}"></i>`; }
    });
    days += `<div class="day${d === today ? " today" : ""}"><span>${wd[d]}</span><span class="dots">${dots || '<i class="dot empty"></i>'}</span></div>`;
  }

  // goal bars and last week
  const groups = goalGroups();
  const goal = g => {
    const n = cnt(thisW, g.ids), gl = g.perWeek, pct = gl ? Math.min(100, n / gl * 100) : (n ? 100 : 0);
    return `<div class="goal t-${g.tone}"><div class="gl"><span>${esc(tx(g.label))}</span><b>${n}${gl ? " / " + gl : "×"}</b></div><div class="bar"><i style="width:${pct.toFixed(0)}%"></i></div></div>`;
  };
  const lw = groups.map(g => { const n = cnt(lastW, g.ids); return n ? tx(g.short) + " " + t("times", { n }) : ""; }).filter(Boolean);
  const we6 = addDays(ws, 6);
  const week = `<div class="card week"><div class="wk-h"><h3>${t("thisWeek")}</h3><span class="eyebrow">${t("weekNo", { n: isoWeek(now) })} · ${shortDate(ws)} – ${shortDate(we6)}</span></div>` +
    `<div class="days">${days}</div>` + (groups.length ? `<div class="goals">${groups.map(goal).join("")}</div>` : "") +
    `<p class="lastwk">${esc(t("lastWeek", { list: lw.length ? lw.join(" · ") : t("nothingYet") }))}</p></div>`;

  // tiles: featured (or first) routine gets the wide tile
  const featured = ctx.routines.find(r => r.featured) || ctx.routines[0];
  const order = featured ? [featured, ...ctx.routines.filter(r => r !== featured)] : [];
  const tiles = order.map(r => tile(r, r === featured, thisW)).join("");

  app.innerHTML = `<div class="screen"><div class="home-h"><h1>${esc(t("homeTitle"))}</h1><button class="icon-btn" data-act="settings" aria-label="${esc(t("settings"))}">${ICONS._settings}</button></div>` +
    `<div class="tiles">${tiles}</div>${week}<p class="note">${t("perDevice")}</p></div>`;
}

function tile(r, wide, thisW) {
  const dl = doneLabel(r.id, !wide);
  let meta, badge = dl;
  if (r.type === "checkoff") {
    const n = thisW.filter(e => e.r === r.id).length;
    meta = t("checkoffMeta", { min: r.minutes, n, goal: r.goal ? r.goal.perWeek : 0 });
  } else {
    meta = [tx(r.duration), t("exercises", { n: player.countItems(r) }), tx(r.tileNote)].filter(Boolean).join(" · ");
    if (!badge && r.frequency === "daily") badge = t("daily");
  }
  return `<button class="tile ${toneCls(r)}${wide ? " wide" : ""}" data-act="open" data-r="${esc(r.id)}">` +
    `<div class="top"><div class="ico">${icon(r.icon)}</div>${badge ? `<span class="badge">${esc(badge)}</span>` : ""}</div>` +
    `<div class="row"><div><div class="nm">${esc(tx(r.name))}</div><div class="mt">${esc(meta)}</div></div>` +
    (wide && r.type !== "checkoff" ? `<span class="playdot" style="color:#fff">${ICONS._play}</span>` : "") + `</div></button>`;
}

/* ---------- check-off routine (cardio) ---------- */

function renderCheckoff(rid) {
  player.stopPlayer();
  const r = routine(rid), ws = weekStart(new Date()), we = addDays(ws, 7), lws = addDays(ws, -7), LOG = store.getLog();
  const mine = LOG.filter(e => e.r === rid && inRange(e, ws, we)).sort((a, b) => a.ts - b.ts);
  const last = LOG.filter(e => e.r === rid && inRange(e, lws, ws)).length;
  const sel = store.getKind(rid, r.kinds[0].id), n = mine.length, goal = r.goal ? r.goal.perWeek : 0, min = r.minutes;
  const kindName = id => { const k = r.kinds.find(x => x.id === id); return k ? tx(k.name) : id; };
  const list = mine.length ? mine.map(e => `<div class="entry"><span>${dayLabel(new Date(e.ts))} · ${esc(e.k ? kindName(e.k) : tx(r.name))}</span><button class="del" data-act="cdel" data-r="${esc(rid)}" data-ts="${e.ts}" aria-label="${esc(t("deleteEntry"))}">${ICONS._close}</button></div>`).join("")
    : `<p style="margin:0;color:var(--muted);font-size:14px">${t("noSessions")}</p>`;
  const check = ICONS._check.replace("<svg ", '<svg style="stroke:#fff;fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round" ');
  app.innerHTML = `<div class="screen ${toneCls(r)}">${backBtn()}` +
    `<div style="display:flex;flex-direction:column;gap:10px"><h1>${esc(tx(r.name))}</h1><div class="chips"><span class="chip acc">${t("perSession", { min })}</span>${goal ? `<span class="chip">${t("goalPerWeek", { n: goal })}</span>` : ""}</div></div>` +
    `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px"><div class="bigstat">${n}${goal ? ` <small>/ ${goal}</small>` : ""}</div><span class="eyebrow">${goal ? t("minutesOf", { m: n * min, total: goal * min }) : n * min + " min"}</span></div>` +
    `<div class="bar"><i style="width:${(goal ? Math.min(100, n / goal * 100) : (n ? 100 : 0)).toFixed(0)}%"></i></div>` +
    (goal && n >= goal ? `<p style="margin:0;font-weight:500;color:var(--afg)">${t("goalReached")}</p>` : "") + `</div>` +
    `<div class="card" style="display:flex;flex-direction:column;gap:12px"><h3>${t("whatDidYouDo")}</h3><div class="typepills">` +
    r.kinds.map(k => `<button class="tp" data-act="kind" data-r="${esc(rid)}" data-k="${esc(k.id)}" aria-pressed="${k.id === sel}">${esc(tx(k.name))}</button>`).join("") + `</div>` +
    `<button class="big-btn" data-act="clog" data-r="${esc(rid)}">${check}<span>${t("logMinutes", { min })}</span></button></div>` +
    `<div class="card" style="display:flex;flex-direction:column;gap:4px"><h3 style="padding-bottom:6px">${t("thisWeek")}</h3>${list}</div>` +
    `<p class="note">${esc(t("checkoffNote", { n: last, sessions: t(last === 1 ? "session" : "sessions"), m: last * min }))}</p></div>`;
}

/* ---------- routine overview ---------- */

function renderOverview(rid) {
  player.stopPlayer();
  const r = routine(rid);
  if (!r) return renderHome();
  if (r.type === "checkoff") return renderCheckoff(rid);
  const name = tx(r.name);
  if (!r.sections.length || !player.countItems(r)) {
    app.innerHTML = `<div class="screen ${toneCls(r)}">${backBtn()}<h1>${esc(name)}</h1><div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>${t("emptyTitle")}</h3><p style="margin:0;color:var(--muted);font-size:15px">${t("emptyText")}</p></div></div>`;
    return;
  }
  const secs = r.sections.map((s, si) => {
    const badge = s.badge ? tx(s.badge) : (s.rounds > 1 ? t("rounds", { n: s.rounds }) : "");
    return `<div class="card sec"><div class="sec-h"><h3>${esc(tx(s.title))}</h3>${badge ? `<span class="sec-b">${esc(badge)}</span>` : ""}</div>` +
      s.items.map((it, ii) => {
        const e = EX(it.ex), sc = it.scene || e.scene;
        return `<button class="ex-row" data-act="preview" data-r="${esc(r.id)}" data-s="${si}" data-i="${ii}">` +
          `<span class="thumb">${thumbHTML(e, sc)}</span>` +
          `<span class="ex-txt"><span class="ex-nm">${esc(tx(e.name))}</span><span class="ex-sub"><span>${esc(player.doseText(it, e))}</span>${eqChip(it.ex)}</span></span>` +
          `<span class="ex-go" style="color:var(--solid)" aria-hidden="true">${icon("_play", 14)}</span></button>`;
      }).join("") + `</div>`;
  }).join("");
  const freq = r.frequency === "daily" ? t("daily") : r.frequency ? tx(r.frequency) : "";
  const dur = tx(r.duration), gear = tx(r.gear);
  const chips = (freq ? `<span class="chip acc">${esc(freq)}</span>` : "") + (dur ? `<span class="chip${freq ? "" : " acc"}">${esc(dur)}</span>` : "") +
    `<span class="chip">${t("exercises", { n: player.countItems(r) })}</span>` + (gear ? `<span class="chip">${esc(gear)}</span>` : "");
  const doneToday = doneLabel(r.id) === t("doneToday");
  app.innerHTML = `<div class="screen ${toneCls(r)}">${backBtn()}` +
    `<div style="display:flex;flex-direction:column;gap:10px"><h1>${esc(name)}</h1><div class="chips">${chips}</div></div>${secs}` +
    `<p class="note">${t("tapToPreview")}</p>` +
    (doneToday ? `<p class="note" style="color:var(--afg);font-weight:500">${t("doneToday")}</p>` : `<button class="sm-btn" data-act="manual" data-r="${esc(r.id)}" style="align-self:center">${t("markDone")}</button>`) +
    `<div class="sticky"><button class="big-btn" data-act="start" data-r="${esc(r.id)}">${icon("_play", 18)}<span>${t(r.frequency === "daily" ? "startRoutine" : "startWorkout")}</span></button></div></div>`;
}

/* ---------- player ---------- */

function renderPlayer() {
  const P = player.P, st = P.steps[P.i], e = EX(st.ex), r = P.routine, tn = toneCls(r), name = tx(e.name);
  const top = `<div class="ptop"><button class="icon-btn" data-act="exit" aria-label="${esc(t("close"))}">${ICONS._close}</button><div class="pinfo">` +
    (P.preview ? `<div class="l"><span>${esc(t("preview", { name: tx(r.name) }))}</span><span>${P.i + 1} / ${P.steps.length}</span></div>`
      : `<div class="l"><span>${esc(tx(st.sec))}${st.rounds > 1 ? esc(t("roundOf", { r: st.round, n: st.rounds })) : ""}</span><span>${P.i + 1} / ${P.steps.length}</span></div>` +
      `<div class="bar"><i style="width:${((P.i + (P.mode === "rest" ? 1 : 0)) / P.steps.length * 100).toFixed(1)}%"></i></div>`) + `</div></div>`;

  if (P.mode === "done") {
    app.innerHTML = `<div class="screen ${tn}"><div class="stage tinted overlay"><div class="lbl">${t("done")}</div><h1 style="color:var(--deep)">${esc(t("routineDone", { name: tx(r.name) }))}</h1>` +
      `<p style="margin:0;color:var(--afg)">${esc(t("doneText", { n: P.steps.length }))}</p></div><button class="big-btn" data-act="home">${t("toHome")}</button></div>`;
    return;
  }
  if (P.mode === "rest") {
    const nx = P.steps[P.i + 1], ne = EX(nx.ex);
    app.innerHTML = `<div class="screen ${tn}">${top}<div class="stage tinted overlay"><div class="lbl">${t(st.endRound ? "roundRest" : "rest")}</div><div class="huge" id="pcount" role="timer">${player.fmt(P.left)}</div>` +
      `<div class="btnrow"><button class="sm-btn" data-act="plus">${t("addRest")}</button><button class="sm-btn acc" data-act="skip">${t("next")}</button></div></div>` +
      `<div class="card" style="display:flex;gap:14px;align-items:center"><span class="thumb" style="width:96px;height:62px">${thumbHTML(ne, nx.scene)}</span>` +
      `<div style="display:flex;flex-direction:column;gap:3px;min-width:0"><span class="eyebrow">${esc(nx.rounds > 1 ? t("upNextRound", { r: nx.round }) : t("upNext"))}</span>` +
      `<span class="ex-nm" style="font-size:17px">${esc(tx(ne.name))}</span><span class="ex-sub">${esc(player.doseText(nx.dose, ne))} ${eqChip(nx.ex)}</span></div></div></div>`;
    return;
  }

  const nextSt = !P.preview && P.steps[P.i + 1];
  const nxt = nextSt ? `<p class="next">${t("upNextLine")}<b>${esc(tx(EX(nextSt.ex).name))}</b> · ${esc(player.doseText(nextSt.dose, EX(nextSt.ex)))}</p>` : "";
  let stage;
  if (!e.animated) {
    stage = e.image ? `<img class="ex-img" src="${esc(e.image)}" alt="${esc(name)}">` :
      `<div style="width:100%;position:relative">${placeholderSVG(st.scene, "fig", name)}<span class="noanim">${t("noAnimation")}</span></div>`;
  } else if (reducedMotion.matches) {
    const po = posesFor(e, st.scene);
    stage = `<div class="keys" id="keys" aria-label="${esc(t("keyPoses"))}">` + keyPoses(e).map(k =>
      `<figure class="key" data-pose="${esc(k.name)}">${fullSVG(e, st.scene, po[k.name], false, "", tx(k.label))}<figcaption>${esc(tx(k.label))}</figcaption></figure>`).join("") + `</div>`;
  } else stage = `<div id="fig" style="width:100%"></div>`;

  const unit = ctx.config.weightUnit || "kg";
  const weight = e.equipment ? `<div class="card wcard"><div class="wtxt"><h3>${t("weight")}</h3><span class="eyebrow">${t("weightHint")}</span></div>` +
    `<div class="stepper"><button class="stp" data-act="wminus" aria-label="${esc(t("weightLess"))}">−</button><input id="wkg" type="text" inputmode="decimal" autocomplete="off" aria-label="${esc(t("weightInput", { unit }))}" placeholder="–" value="${esc(store.getWeight(st.ex))}">` +
    `<span class="unit">${esc(unit)}</span><button class="stp" data-act="wplus" aria-label="${esc(t("weightMore"))}">+</button></div></div>` : "";
  const cues = txList(e.cues);

  app.innerHTML = `<div class="screen ${tn}">${top}` +
    `<div class="stage" style="--hl:var(--solid)">${e.view ? `<span class="view">${esc(tx(e.view))}</span>` : ""}${stage}` +
    `<div class="pills"><span class="pill" id="phase" aria-live="polite"></span><span class="pill br"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="var(--br-ring)" stroke-width="1"/><circle id="bdot" cx="10" cy="10" r="6" fill="var(--br-dot)"/></svg><span id="btxt"></span></span></div></div>` +
    `<div class="ex-head"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><h2>${esc(name)}</h2><span class="meta" id="meta"></span></div><div class="count" id="count"></div></div>` +
    `<div class="ctls"><button class="ctl" data-act="prev" aria-label="${esc(t("prevEx"))}">${ICONS._prev}</button><button class="ctl main" data-act="pause" id="pbtn" aria-label="${esc(P.paused ? t("resume") : t("pause"))}">${P.paused ? ICONS._play : ICONS._pause}</button><button class="ctl" data-act="skip" aria-label="${esc(t("nextEx"))}">${ICONS._next}</button></div>` +
    weight + (cues.length ? `<div class="card cues"><h3>${t("howTo")}</h3>${cues.map(c => `<div class="cue">${ICONS._check}<span>${esc(c)}</span></div>`).join("")}</div>` : "") + nxt + `</div>`;
}

function setTxt(id, h) { const el = document.getElementById(id); if (el && el._h !== h) { el.innerHTML = h; el._h = h; } }

function updateRest(P, text) { const el = document.getElementById("pcount"); if (el) el.textContent = text; }

function updateWork(P, info) {
  const st = P.steps[P.i], e = EX(st.ex);
  if (e.animated) {
    const keys = document.getElementById("keys");
    if (keys) {
      keys.classList.toggle("mirror", !!info.mirror);
      for (const f of keys.children) f.classList.toggle("on", f.getAttribute("data-pose") === info.to);
    } else {
      const f = document.getElementById("fig");
      if (f) f.innerHTML = fullSVG(e, st.scene, evalAnim(e, st.scene, info.time).pose, info.mirror, "fig", tx(e.name));
    }
  }
  setTxt("phase", esc(info.label));
  setTxt("btxt", info.breath ? t("breath_" + info.breath) : "");
  const d = document.getElementById("bdot");
  if (d) d.setAttribute("r", player.breathRadius(info.breath, info.k, reducedMotion.matches).toFixed(2));
  setTxt("count", info.count);
  setTxt("meta", esc(info.meta));
}

/* ---------- settings ---------- */

let settingsState = { confirm: false, msg: "" };

function renderSettings() {
  player.stopPlayer();
  const s = settingsState, theme = store.getPref("theme", "auto"), cfg = ctx.config;
  const pills = (act, items, cur) => `<div class="typepills">` + items.map(([v, label]) => `<button class="tp" data-act="${act}" data-v="${esc(v)}" aria-pressed="${v === cur}">${esc(label)}</button>`).join("") + `</div>`;
  const reset = s.confirm
    ? `<div class="confirm" role="alertdialog" aria-labelledby="rc-t"><p id="rc-t">${t("resetConfirm")}</p><div class="btnrow"><button class="sm-btn" data-act="reset-no">${t("cancel")}</button><button class="sm-btn danger" data-act="reset-yes">${t("resetYes")}</button></div></div>`
    : `<button class="sm-btn row-btn" data-act="reset">${ICONS._trash}<span>${t("resetData")}</span></button>`;
  app.innerHTML = `<div class="screen">${backBtn()}<h1>${t("settings")}</h1>` +
    `<div class="card stack"><h3>${t("language")}</h3>${pills("lang", languages().map(l => [l.code, l.name]), getLang())}</div>` +
    `<div class="card stack"><h3>${t("theme")}</h3>${pills("theme", [["auto", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]], theme)}</div>` +
    `<div class="card stack"><h3>${t("data")}</h3><p class="muted">${t("dataText")}</p>` +
    `<div class="btnrow left"><button class="sm-btn row-btn" data-act="export">${ICONS._download}<span>${t("exportData")}</span></button>` +
    `<button class="sm-btn row-btn" data-act="import">${ICONS._upload}<span>${t("importData")}</span></button>` +
    `<input type="file" id="importFile" accept="application/json,.json" hidden></div>${reset}` +
    `<p class="status" role="status">${esc(s.msg)}</p></div>` +
    `<div class="card stack"><h3>${t("about")}</h3><p class="muted">${esc(cfg.name)} · ${t("version", { v: esc(ctx.version) })}</p>` +
    `<div class="btnrow left"><button class="sm-btn" data-act="disclaimer">${t("safetyNote")}</button><a class="sm-btn link-btn" href="editor.html">${t("poseEditor")}</a>` +
    (cfg.sourceUrl ? `<a class="sm-btn link-btn" href="${esc(cfg.sourceUrl)}" target="_blank" rel="noopener">${t("sourceCode")} ${ICONS._external}</a>` : "") + `</div></div></div>`;
}

function doExport() {
  const data = store.exportData(ctx.config.name, ctx.version);
  const json = JSON.stringify(data, null, 2);
  const fname = `${ctx.config.storageKey || "workout"}-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([json], { type: "application/json" });
  try {
    const file = new File([blob], fname, { type: "application/json" });
    if (navigator.standalone && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; }
  } catch (e) { /* fall back to download */ }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------- disclaimer, errors, update banner ---------- */

let afterDisclaimer = "home";
export function renderDisclaimer(after = "home") {
  player.stopPlayer();
  afterDisclaimer = after;
  app.innerHTML = `<div class="screen"><div class="card stack disclaimer" role="dialog" aria-labelledby="dc-t"><h1 id="dc-t">${t("disclaimerTitle")}</h1>` +
    t("disclaimer").map(p => `<p>${esc(p)}</p>`).join("") +
    `<button class="big-btn" data-act="disclaimer-ok">${t("understood")}</button></div></div>`;
  const b = app.querySelector("[data-act=disclaimer-ok]");
  if (b) b.focus();
}

export function renderErrors(list) {
  app.innerHTML = `<div class="screen"><h1>${esc(t("configError"))}</h1><div class="card stack errors" role="alert"><ul>` +
    list.map(m => `<li>${esc(m)}</li>`).join("") + `</ul><p class="muted">${esc(t("configErrorHint"))}</p></div></div>`;
}

export function showUpdateBanner() {
  if (document.getElementById("update")) return;
  const b = document.createElement("button");
  b.id = "update";
  b.className = "update";
  b.textContent = t("updateReady");
  b.addEventListener("click", () => location.reload());
  document.body.appendChild(b);
}

/* ---------- events ---------- */

function startFromOverview(rid) { const r = routine(rid); player.startPlayer(r, player.buildSteps(r)); top0(); }

function onClick(ev) {
  const b = ev.target.closest("[data-act]");
  if (!b) return;
  const act = b.getAttribute("data-act"), rid = b.getAttribute("data-r"), P = player.P;
  switch (act) {
    case "home": renderHome(); break;
    case "open": renderOverview(rid); top0(); break;
    case "start": startFromOverview(rid); break;
    case "preview": {
      const r = routine(rid), si = +b.getAttribute("data-s"), ii = +b.getAttribute("data-i");
      let pick = 0;
      for (let a = 0; a < si; a++) pick += r.sections[a].items.length;
      player.startPlayer(r, player.previewSteps(r), { preview: true, pick: pick + ii });
      top0();
      break;
    }
    case "exit": renderOverview(P ? P.routine.id : ctx.routines[0].id); top0(); break;
    case "pause": {
      const paused = player.togglePause(), pb = document.getElementById("pbtn");
      if (pb) { pb.innerHTML = paused ? ICONS._play : ICONS._pause; pb.setAttribute("aria-label", paused ? t("resume") : t("pause")); }
      break;
    }
    case "skip": player.skip(); break;
    case "prev": player.prev(); break;
    case "plus": player.addRest(15000); break;
    case "kind": store.setKind(rid, b.getAttribute("data-k")); renderCheckoff(rid); break;
    case "clog": store.addLog(rid, { k: store.getKind(rid, routine(rid).kinds[0].id) }); renderCheckoff(rid); break;
    case "cdel": { const ts = +b.getAttribute("data-ts"); store.removeLog(e => e.r === rid && e.ts === ts); renderCheckoff(rid); break; }
    case "manual": store.addLog(rid, { manual: 1 }); renderOverview(rid); break;
    case "wminus": case "wplus": {
      if (!P) return;
      const id = P.steps[P.i].ex, inp = document.getElementById("wkg"), steps = ctx.config.weightStep || {};
      const eq = EX(id).equipment, stp = steps[eq] != null ? steps[eq] : (steps.default || 1);
      let cur = parseFloat(String(inp.value).replace(",", ".")) || 0;
      cur = Math.max(0, Math.round((cur + (act === "wplus" ? stp : -stp)) * 100) / 100);
      const v = cur ? (getLang() === "de" ? String(cur).replace(".", ",") : String(cur)) : "";
      inp.value = v;
      store.setWeight(id, v);
      break;
    }
    case "settings": settingsState = { confirm: false, msg: "" }; renderSettings(); top0(); break;
    case "lang": store.setPref("lang", b.getAttribute("data-v")); initLang(ctx.config.language, b.getAttribute("data-v")); renderSettings(); break;
    case "theme": store.setPref("theme", b.getAttribute("data-v")); applyTheme(b.getAttribute("data-v")); renderSettings(); break;
    case "export": doExport(); break;
    case "import": { const f = document.getElementById("importFile"); if (f) f.click(); break; }
    case "reset": settingsState = { confirm: true, msg: "" }; renderSettings(); { const no = app.querySelector("[data-act=reset-no]"); if (no) no.focus(); } break;
    case "reset-no": settingsState = { confirm: false, msg: "" }; renderSettings(); break;
    case "reset-yes": store.resetAll(); store.setPref("disclaimer", "1"); settingsState = { confirm: false, msg: t("resetDone") }; renderSettings(); break;
    case "disclaimer": renderDisclaimer("settings"); top0(); break;
    case "disclaimer-ok": store.setPref("disclaimer", "1"); if (afterDisclaimer === "settings") renderSettings(); else renderHome(); top0(); break;
  }
}

function onChange(ev) {
  const el = ev.target;
  if (el && el.id === "wkg" && player.P) {
    const v = String(el.value).trim();
    store.setWeight(player.P.steps[player.P.i].ex, getLang() === "de" ? v.replace(".", ",") : v);
  }
  if (el && el.id === "importFile" && el.files && el.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      let ok = false;
      try { ok = store.importData(JSON.parse(String(reader.result))); } catch (e) { ok = false; }
      if (ok) {
        const lang = store.getPref("lang", null);
        initLang(ctx.config.language, lang);
        applyTheme(store.getPref("theme", "auto"));
      }
      settingsState = { confirm: false, msg: ok ? t("imported") : t("importFailed") };
      renderSettings();
    };
    reader.readAsText(el.files[0]);
  }
}

export { renderOverview, renderSettings, frameBox };
