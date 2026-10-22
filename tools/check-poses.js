#!/usr/bin/env node
// Sanity check for every exercise animation in the current single-file app.
// Usage: node tools/check-poses.js current/index.html
// Steps through each animation in 50 ms frames and reports:
//   - NaN / non-finite joint positions (broken pose or IK)
//   - joints outside the SVG viewBox (figure clipped)
//   - joints more than 4 px below the floor line (figure sinking into the mat)
// Exit code 1 if anything is wrong. Adapt the loader once the code is split into modules.
const fs = require('fs');
const file = process.argv[2] || 'current/index.html';
const html = fs.readFileSync(file, 'utf8');
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(c => c.includes('window.__UT'));
if (!js) { console.error('App script not found'); process.exit(1); }

const el = () => ({ addEventListener() {}, innerHTML: '', setAttribute() {}, getAttribute() { return null; } });
global.document = { getElementById: () => el(), addEventListener() {} };
global.window = global;
global.localStorage = { getItem() { return null; }, setItem() {} };
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.navigator = {};
eval(js);

const U = window.__UT;
const FLOOR = { bed: 192, mat: 212, floor: 212 };
let problems = 0;
for (const id in U.EX) {
  const e = U.EX[id];
  if (e.custom) continue; // custom top-down drawings are not rig-based
  const scene = e.scene;
  const ai = U.animInfo(e);
  const vb = (e.vb || '0 0 360 230').split(' ').map(Number);
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, nan = false;
  for (let t = 0; t < ai.I + ai.L; t += 50) {
    const s = U.solve(U.evalAnim(id, scene, t).pose);
    const pts = [s.hip, s.sho, s.head];
    for (const L of [s.L1, s.L2]) if (L) { pts.push(L.kn, L.an); if (L.ft) pts.push(L.ft); }
    for (const A of [s.A1, s.A2]) if (A) pts.push(A.el, A.hd);
    for (const q of pts) {
      if (!isFinite(q[0]) || !isFinite(q[1])) { nan = true; continue; }
      minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]);
      minY = Math.min(minY, q[1] - (q === s.head ? 11 : 4)); maxY = Math.max(maxY, q[1] + 4);
    }
  }
  const issues = [];
  if (nan) issues.push('NaN joint');
  if (minX < vb[0] || maxX > vb[0] + vb[2] || minY < vb[1] || maxY > vb[1] + vb[3]) issues.push('outside viewBox');
  if (maxY > FLOOR[scene] + 4) issues.push(`below floor by ${(maxY - FLOOR[scene]).toFixed(0)}px`);
  if (issues.length) problems++;
  console.log(`${issues.length ? 'FAIL' : 'ok  '} ${id.padEnd(10)} ${scene.padEnd(5)} ${issues.join(', ')}`);
}
console.log(problems ? `\n${problems} exercise(s) need attention` : '\nAll animations OK');
process.exit(problems ? 1 : 0);
