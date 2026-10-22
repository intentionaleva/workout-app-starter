#!/usr/bin/env node
// Draws docs/rig-diagram.svg: the joints, the anchors and the angle convention.
// Usage: node tools/rig-diagram.js

import fs from "node:fs";
import path from "node:path";
import { solve, toScreen, dir } from "../src/rig.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const G = 207;
// A standing figure with one arm forward and one knee lifted, so every joint is visible.
const pose = toScreen({ hip: [150, 102], t: 180, h: 175, L1: { th: 70, sh: 10, ft: 90 }, L2: { th: -5, sh: 0, ft: 90 }, A1: { ua: 60, fa: 95 }, A2: { ua: -25, fa: 10 } }, G);
const s = solve(pose);
const f = n => n.toFixed(1);
const line = (pts, c, w = 8) => `<path d="M${pts.map(p => f(p[0]) + " " + f(p[1])).join(" L")}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot = (p, c = "#C4501F") => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.5"/>`;
const label = (p, txt, dx, dy, anchor = "start", c = "#1B2430") => `<text x="${f(p[0] + dx)}" y="${f(p[1] + dy)}" text-anchor="${anchor}" fill="${c}">${txt}</text>`;

let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 300" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="12">`;
o += `<rect width="720" height="300" rx="16" fill="#F3F5F7"/>`;
o += `<g transform="translate(20,40)">`;
o += `<rect x="20" y="212" width="300" height="3" rx="1.5" fill="#C3CEDA"/>`;
o += line([s.hip, s.L2.kn, s.L2.an, s.L2.ft], "#8D97A5") + line([s.sho, s.A2.el, s.A2.hd], "#8D97A5");
o += line([s.hip, s.sho], "#1B2430") + `<circle cx="${f(s.head[0])}" cy="${f(s.head[1])}" r="11" fill="#1B2430"/>`;
o += line([s.hip, s.L1.kn, s.L1.an, s.L1.ft], "#1B2430") + line([s.sho, s.A1.el, s.A1.hd], "#1B2430");
for (const p of [s.hip, s.sho, s.L1.kn, s.L1.an, s.A1.el, s.A1.hd, s.L2.an]) o += dot(p);
o += label(s.head, "head (h)", 16, 4);
o += label(s.sho, "sho · shoulder", -12, -6, "end");
o += label(s.hip, "hip", -14, -6, "end");
o += label(s.A1.el, "elbow", 0, 22, "middle");
o += label(s.A1.hd, "hand (A1)", 8, 4);
o += label(s.L1.kn, "knee", 8, -8);
o += label(s.L1.an, "ankle (L1)", 8, 14);
o += label(s.L2.an, "far ankle (L2)", -10, 18, "end", "#55606E");
o += label([s.A2.hd[0], s.A2.hd[1]], "far hand (A2)", -12, 16, "end", "#55606E");
o += label([330, 208], "ground line: y = 0", 0, 0, "end", "#55606E");
o += label([150, -16], "torso angle t (hip → shoulder), here 180", 0, 0, "middle", "#55606E");
o += `</g>`;

// angle compass
const cx = 540, cy = 140, r = 70;
o += `<text x="${cx}" y="34" text-anchor="middle" font-weight="600" fill="#1B2430">Angles (degrees)</text>`;
o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#C3CEDA" stroke-width="2"/>`;
for (const [a, t] of [[0, "0 = down"], [90, "90 = right"], [180, "180 = up"], [270, "270 / -90 = left"]]) {
  const v = dir(a), p = [cx + v[0] * r, cy + v[1] * r];
  o += `<line x1="${cx}" y1="${cy}" x2="${f(p[0])}" y2="${f(p[1])}" stroke="#2F64B3" stroke-width="2.5" stroke-linecap="round"/>`;
  const lp = [cx + v[0] * (r + 14), cy + v[1] * (r + 14)];
  o += `<text x="${f(lp[0])}" y="${f(lp[1] + (a === 0 ? 10 : a === 180 ? -2 : 4))}" text-anchor="${a === 90 ? "start" : a === 270 ? "end" : "middle"}" fill="#1D4A86">${t}</text>`;
}
o += `<path d="M ${cx + 34} ${cy + 22} A 40 40 0 0 0 ${cx + 22} ${cy - 34}" fill="none" stroke="#8A3410" stroke-width="1.8" marker-end="url(#ar)"/>`;
o += `<defs><marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8A3410"/></marker></defs>`;
o += `<text x="${cx + 44}" y="${cy - 44}" fill="#8A3410">positive =</text><text x="${cx + 44}" y="${cy - 30}" fill="#8A3410">counter-</text><text x="${cx + 44}" y="${cy - 16}" fill="#8A3410">clockwise</text>`;
o += `<text x="360" y="288" text-anchor="middle" fill="#55606E">th/sh = thigh/shin · ua/fa = upper arm/forearm · ft = foot</text>`;
o += `</svg>\n`;
fs.writeFileSync(path.join(root, "docs/rig-diagram.svg"), o);
console.log("docs/rig-diagram.svg written");
