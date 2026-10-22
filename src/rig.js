// The stick-figure rig: skeleton, inverse kinematics, pose solver and SVG drawing.
// Nothing in here touches the DOM, so the same code runs in the app, the pose
// editor and the Node checks.
//
// Coordinates inside exercise data:
//   x = 0…360 from left to right (the figure usually sits around x = 180)
//   y = height above the ground line (0 = on the floor, 52 = hip height when kneeling)
// Angles: degrees, 0 = pointing straight down, 90 = pointing right (+x),
//   180 = up, -90 / 270 = left. Positive turns counter-clockwise on screen.

/** Segment lengths in px: thigh, shin, torso, upper arm, forearm, foot, neck, head radius. */
export const C = { TH: 52, SH: 50, TO: 62, UA: 36, FA: 33, FT: 14, HN: 20, HR: 11 };
const RAD = Math.PI / 180;

export function dir(a) { return [Math.sin(a * RAD), Math.cos(a * RAD)]; }
function add(p, v, l) { return [p[0] + v[0] * l, p[1] + v[1] * l]; }
function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
export function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
export function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }

/** Interpolate two poses (numbers, arrays and nested objects). */
export function lerp(a, b, k) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * k;
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], k));
  if (isObj(a)) {
    const o = {}, keys = {};
    for (const x in a) keys[x] = 1;
    for (const x in b) keys[x] = 1;
    for (const x in keys) o[x] = lerp(a[x], b[x], k);
    return o;
  }
  return k < .5 ? a : b;
}

/** Two-bone IK: from joint P reach towards T with bone lengths l1, l2. s = bend direction (1 | -1). */
export function ik(P, T, l1, l2, s) {
  const dx = T[0] - P[0], dy = T[1] - P[1], mx = l1 + l2 - 0.5;
  let d = Math.hypot(dx, dy);
  if (d > mx) d = mx;
  if (d < 1) d = 1;
  const phi = Math.atan2(dy, dx);
  let c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  c = Math.max(-1, Math.min(1, c));
  const a = phi + s * Math.acos(c), Mi = [P[0] + l1 * Math.cos(a), P[1] + l1 * Math.sin(a)];
  const a2 = Math.atan2(T[1] - Mi[1], T[0] - Mi[0]);
  return [Mi, [Mi[0] + l2 * Math.cos(a2), Mi[1] + l2 * Math.sin(a2)]];
}

/** Turn a pose (in screen coordinates) into joint positions. */
export function solve(p) {
  const td = dir(p.t);
  let hip;
  if (p.ank) {
    const L = p.L1, kn = add(p.ank, dir(L.sh), -C.SH * (L.sl == null ? 1 : L.sl));
    hip = add(kn, dir(L.th), -C.TH * (L.tl == null ? 1 : L.tl));
  } else if (p.sho) hip = add(p.sho, td, -C.TO);
  else hip = p.hip;
  const sho = add(hip, td, C.TO), head = add(sho, dir(p.h == null ? p.t : p.h), C.HN);
  function leg(L) {
    if (!L) return null;
    let kn, an;
    if (L.to) { const r = ik(hip, L.to, C.TH, C.SH, L.s); kn = r[0]; an = r[1]; }
    else { kn = add(hip, dir(L.th), C.TH * (L.tl == null ? 1 : L.tl)); an = add(kn, dir(L.sh), C.SH * (L.sl == null ? 1 : L.sl)); }
    return { kn, an, ft: L.ft == null ? null : add(an, dir(L.ft), C.FT) };
  }
  function arm(A) {
    if (!A) return null;
    let el, hd;
    if (A.to) { const r = ik(sho, A.to, C.UA, C.FA, A.s); el = r[0]; hd = r[1]; }
    else { el = add(sho, dir(A.ua), C.UA); hd = add(el, dir(A.fa), C.FA); }
    return { el, hd };
  }
  return { hip, sho, head, L1: leg(p.L1), L2: leg(p.L2), A1: arm(p.A1), A2: arm(p.A2), tc: p.tc || 0, t: p.t, g: p.g == null ? 0 : p.g };
}

/* ---------- pose data helpers ---------- */

export const ANCHORS = ["hip", "sho", "ank"];
export const LIMBS = ["L1", "L2", "A1", "A2"];
const ANGLE_KEYS = ["th", "sh", "tl", "sl", "ua", "fa"];

function mergeLimb(a, b) {
  if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
  const o = {};
  // Switching a limb between IK ("to") and angles drops the other mode's keys.
  const dropIK = ANGLE_KEYS.some(k => k in b) && !("to" in b);
  const dropAngles = "to" in b;
  for (const k in a) {
    if (dropIK && (k === "to" || k === "s")) continue;
    if (dropAngles && ANGLE_KEYS.includes(k)) continue;
    o[k] = a[k];
  }
  for (const k in b) o[k] = b[k];
  return o;
}

/** Merge pose b over pose a. Limbs merge key by key, setting a new anchor replaces the old one. */
export function mergePose(a, b) {
  if (!a) return b ? clone(b) : {};
  if (!b) return clone(a);
  const o = {};
  const newAnchor = ANCHORS.some(k => k in b);
  for (const k in a) {
    if (newAnchor && ANCHORS.includes(k)) continue;
    o[k] = clone(a[k]);
  }
  for (const k in b) o[k] = LIMBS.includes(k) ? mergeLimb(o[k], clone(b[k])) : clone(b[k]);
  return o;
}

export function clone(v) {
  if (Array.isArray(v)) return v.map(clone);
  if (isObj(v)) { const o = {}; for (const k in v) o[k] = clone(v[k]); return o; }
  return v;
}

/** Convert a pose from ground-relative data coordinates to screen coordinates for a scene. */
export function toScreen(pose, groundY) {
  const o = clone(pose);
  for (const k of ANCHORS) if (Array.isArray(o[k])) o[k] = [o[k][0], groundY - o[k][1]];
  for (const k of LIMBS) if (o[k] && Array.isArray(o[k].to)) o[k].to = [o[k].to[0], groundY - o[k].to[1]];
  return o;
}

/** The reverse of toScreen, used by the pose editor when dragging handles. */
export function toData(pose, groundY) { return toScreen(pose, groundY); }

/* ---------- named bases (shared starting poses) ---------- */

const lieArm = { ua: 90, fa: 90 };
const kneelLeg = { th: 0, sh: -90, ft: -100 };
const stand = { th: 0, sh: 0, ft: 90 };

/** Use them in an exercise with `base: "quadruped"` or `base: ["supine", { …overrides }]`. */
export const BASES = {
  // On hands and knees, side view. Used by cat-cow and the bird dog family.
  quadruped: { hip: [130, 52], t: 106, tc: 0, h: 100, L1: kneelLeg, L2: kneelLeg, A1: { ua: 0, fa: 0 }, A2: { ua: 0, fa: 0 }, g: .3 },
  // Lying on the back, knees bent, feet planted, arms by the sides.
  supine: { sho: [80, 0], t: -90, h: -107, L1: { to: [212, 0], s: -1, ft: 90 }, L2: { to: [212, 0], s: -1, ft: 90 }, A1: lieArm, A2: lieArm },
  // Standing upright with feet planted, arms hanging.
  standing: { ank: [180, 0], t: 180, L1: stand, L2: stand, A1: { ua: 0, fa: 0 }, A2: { ua: 0, fa: 0 } },
};

/* ---------- scenes and frames ---------- */

// groundY: screen y of joints resting on the ground (data y = 0).
// floorY: the visible surface, used by the "below floor" check.
export const SCENES = {
  bed: { groundY: 187, floorY: 192, svg: '<rect x="14" y="192" width="332" height="26" rx="12" fill="var(--bed)"/><rect x="24" y="176" width="72" height="17" rx="8" fill="var(--pillow)"/>' },
  mat: { groundY: 207, floorY: 212, svg: '<rect x="8" y="212" width="344" height="7" rx="3.5" fill="var(--mat)"/>' },
  floor: { groundY: 207, floorY: 212, svg: '<rect x="-28" y="212" width="416" height="3" rx="1.5" fill="var(--floor)"/>' },
};
export const FRAMES = { default: "0 0 360 230", tall: "-28 -36 416 266" };
export function frameBox(def) { return FRAMES[def.frame] || def.frame || FRAMES.default; }

/* ---------- drawing ---------- */

function f1(n) { return n.toFixed(1); }
function pth(pts) { return "M" + pts.filter(Boolean).map(p => f1(p[0]) + " " + f1(p[1])).join(" L"); }
export function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/** Hand-drawn exercises that are not built from the rig. Poses are free-form objects. */
export const CUSTOM = {
  // Knee wipers seen from above, lying in bed. Pose: { w: -1…1 (knee direction), g: glow }.
  wiper(p) {
    const w = p.w, aw = Math.abs(w);
    const k1 = [172 + 56 * w, 166 + 6 * aw], k2 = [188 + 56 * w, 166 - 2 * aw], ft1 = [172 + 14 * w, 198], ft2 = [188 + 14 * w, 198], h1 = [171 + 2 * w, 132], h2 = [189 + 2 * w, 132];
    let o = '<rect x="78" y="8" width="204" height="214" rx="16" fill="var(--bed)"/><rect x="138" y="14" width="84" height="36" rx="12" fill="var(--pillow)"/>';
    o += '<circle cx="180" cy="104" r="20" fill="var(--hl)" opacity="' + (0.12 + 0.5 * p.g).toFixed(2) + '"/>';
    o += '<path class="f2" d="' + pth([h2, k2, ft2]) + '"/>';
    o += '<path class="f1" d="M146 66 L118 70 L92 72"/><path class="f1" d="M214 66 L242 70 L268 72"/>';
    o += '<path class="f1" d="M146 66 L214 66"/><path class="f1" d="M180 66 L180 130"/><path class="f1" d="' + pth([h1, h2]) + '"/>';
    o += '<circle cx="180" cy="38" r="13" fill="var(--fig)"/>';
    o += '<path class="f1" d="' + pth([h1, k1, ft1]) + '"/>';
    return o;
  },
};

/** SVG for the figure only. def needs highlight, props and (optionally) custom. */
export function figSVG(def, pose) {
  if (def.custom) return CUSTOM[def.custom](pose);
  const s = solve(pose);
  let o = "";
  const hp = def.highlight === "hip" ? s.hip : def.highlight === "sho" ? s.sho : mid(s.hip, s.sho);
  o += '<circle cx="' + f1(hp[0]) + '" cy="' + f1(hp[1]) + '" r="17" fill="var(--hl)" opacity="' + (0.12 + 0.5 * s.g).toFixed(2) + '"/>';
  const leg = (L, c) => L ? '<path class="' + c + '" d="' + pth([s.hip, L.kn, L.an, L.ft]) + '"/>' : "";
  const arm = (A, c) => A ? '<path class="' + c + '" d="' + pth([s.sho, A.el, A.hd]) + '"/>' : "";
  function props(which) {
    let out = "";
    (def.props || []).forEach(pr => {
      if (pr[1] !== which) return;
      const A = which === "h2" ? s.A2 : s.A1;
      if (!A) return;
      const H = A.hd;
      if (pr[0] === "db") {
        out += '<circle cx="' + f1(H[0]) + '" cy="' + f1(H[1]) + '" r="7.5" fill="var(--eq)"/><circle cx="' + f1(H[0]) + '" cy="' + f1(H[1]) + '" r="2.5" fill="var(--eqi)"/>';
      } else {
        let c;
        if (pr[2] === "arm") { const u = [H[0] - A.el[0], H[1] - A.el[1]], n = Math.hypot(u[0], u[1]) || 1; c = [H[0] + u[0] / n * 12, H[1] + u[1] / n * 12]; }
        else c = [H[0], H[1] + 12];
        out += '<line x1="' + f1(H[0]) + '" y1="' + f1(H[1]) + '" x2="' + f1(c[0]) + '" y2="' + f1(c[1]) + '" stroke="var(--eq)" stroke-width="3.5" stroke-linecap="round"/><circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="9.5" fill="var(--eq)"/>';
      }
    });
    return out;
  }
  o += leg(s.L2, "f2") + arm(s.A2, "f2") + props("h2");
  const m = mid(s.hip, s.sho), cp = add(m, dir(s.t + 90), 2 * s.tc);
  o += '<path class="f1" d="M' + f1(s.hip[0]) + " " + f1(s.hip[1]) + " Q" + f1(cp[0]) + " " + f1(cp[1]) + " " + f1(s.sho[0]) + " " + f1(s.sho[1]) + '"/>';
  o += '<circle cx="' + f1(s.head[0]) + '" cy="' + f1(s.head[1]) + '" r="' + C.HR + '" fill="var(--fig)"/>';
  o += leg(s.L1, "f1") + arm(s.A1, "f1") + props("h1");
  return o;
}

/** Inner SVG markup (scene + figure), optionally mirrored. */
export function innerSVG(def, scene, pose, mirror) {
  let inner = (def.custom ? "" : (SCENES[scene] ? SCENES[scene].svg : "")) + figSVG(def, pose);
  if (mirror) inner = '<g transform="translate(360,0) scale(-1,1)">' + inner + '</g>';
  return inner;
}

/** Complete <svg> element. */
export function fullSVG(def, scene, pose, mirror, cls, label) {
  return '<svg class="' + (cls || "") + '" viewBox="' + frameBox(def) + '" role="img" aria-label="' + esc(label || "") + '">' + innerSVG(def, scene, pose, mirror) + '</svg>';
}

/** A neutral standing figure for exercises that have no animation yet. */
export const PLACEHOLDER_POSE = { ank: [180, 207], t: 180, L1: stand, L2: stand, A1: { ua: 8, fa: 4 }, A2: { ua: -8, fa: -4 }, g: 0 };
export function placeholderSVG(scene, cls, label) {
  const def = { highlight: "core" };
  const inner = (SCENES[scene] ? SCENES[scene].svg : "") + '<g opacity=".35">' + figSVG(def, PLACEHOLDER_POSE) + '</g>';
  return '<svg class="' + (cls || "") + '" viewBox="' + FRAMES.default + '" role="img" aria-label="' + esc(label || "") + '">' + inner + '</svg>';
}

/** Collect every drawn point of a solved pose (used by the checks). */
export function jointPoints(s) {
  const pts = [s.hip, s.sho, s.head];
  for (const L of [s.L1, s.L2]) if (L) { pts.push(L.kn, L.an); if (L.ft) pts.push(L.ft); }
  for (const A of [s.A1, s.A2]) if (A) pts.push(A.el, A.hd);
  return pts;
}
