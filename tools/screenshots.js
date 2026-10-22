#!/usr/bin/env node
// Generates the README screenshots in docs/screenshots/ (English and German),
// plus an animated GIF of the player if ffmpeg is installed.
// Usage: node tools/screenshots.js

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { serve } from "./smoke-test.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "docs/screenshots");
fs.mkdirSync(out, { recursive: true });

// A plausible week of history so the week view isn't empty.
function seed(lang) {
  const day = 864e5, now = new Date(); now.setHours(8, 0, 0, 0);
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const at = (d, h = 8) => { const x = new Date(monday); x.setDate(monday.getDate() + d); x.setHours(h); return x.getTime(); };
  const today = (now.getDay() + 6) % 7, log = [];
  for (let d = 0; d <= today; d++) log.push({ r: "morning", ts: at(d, 7) });
  if (today >= 1) log.push({ r: "strength-a", ts: at(1, 18) });
  for (const d of [0, 2, 3].filter(d => d <= today)) log.push({ r: "cardio", ts: at(d, 12), k: "walk" });
  if (today >= 2) log.push({ r: "postpartum", ts: at(2, 15) });
  for (let d = -7; d < 0; d++) log.push({ r: "morning", ts: at(d, 7) });
  log.push({ r: "strength-a", ts: at(-6, 18) }, { r: "strength-b", ts: at(-3, 18) });
  for (const d of [-7, -5, -4, -2, -1]) log.push({ r: "cardio", ts: at(d, 12), k: "bike" });
  const s = { "ut-log": JSON.stringify(log), "ut-disclaimer": "1", "ut-lang": lang, "ut-v": "2", "ut-w-goblet-squat": "16", "ut-w-romanian-deadlift": lang === "de" ? "12,5" : "12.5" };
  void day;
  return `for (const [k, v] of Object.entries(${JSON.stringify(s)})) localStorage.setItem(k, v);`;
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();

for (const lang of ["en", "de"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: lang });
  await ctx.addInitScript(seed(lang));
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForSelector(".tiles");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${lang}-home.png` });
  await (await page.$(".week")).screenshot({ path: `${out}/${lang}-week.png` });
  await page.click('[data-act=open][data-r="strength-a"]');
  await page.screenshot({ path: `${out}/${lang}-overview.png` });
  await page.click("[data-act=start]");
  for (let i = 0; i < 4; i++) await page.click("[data-act=skip]");   // to the goblet squat (has the weight log)
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${lang}-player.png` });
  await ctx.close();
}

// Animated GIF of a few exercises in the player
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gif-"));
  const ctx = await browser.newContext({ viewport: { width: 460, height: 844 }, deviceScaleFactor: 1, locale: "en" });
  await ctx.addInitScript(seed("en"));
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForSelector(".tiles");
  await page.click('[data-act=open][data-r="strength-b"]');
  await page.click("[data-act=start]");
  // Step the player's clock by hand so every frame is exactly 80 ms apart.
  await page.evaluate(async () => { window.__pl = await import("./src/player.js"); });
  let n = 0, at = 0, clipH = 0;
  for (const [step, ms] of [[0, 4400], [4, 3000], [5, 3000], [6, 3600]]) {   // cat cow, lunge, swing, push-up
    while (at < step) { await page.click("[data-act=skip]"); at++; }
    const box = await (await page.$(".stage")).boundingBox();
    const clip = { x: box.x, y: box.y, width: box.width, height: Math.floor(box.height) };
    clip.height = clipH = clipH || clip.height;
    for (let t = 0; t < ms; t += 80) {
      await page.evaluate(t => new Promise(r => { window.__pl.P.t = t; requestAnimationFrame(() => requestAnimationFrame(r)); }), t);
      await page.screenshot({ clip, path: path.join(tmp, `f${String(n++).padStart(4, "0")}.png`), animations: "disabled" });
    }
  }
  await ctx.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "12.5", "-i", path.join(tmp, "f%04d.png"),
    "-vf", "scale=400:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=5", "-loop", "0", `${out}/player.gif`]);
  fs.rmSync(tmp, { recursive: true });
  console.log("player.gif written");
} catch (e) { console.log("Skipping GIF (ffmpeg not found or failed):", e.message); }

// Pose editor (desktop)
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base + "editor.html");
  await page.waitForSelector("#stage");
  await page.selectOption("#pick", "goblet-squat");
  await page.click('[data-pose="squat"]');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/editor.png` });
  await ctx.close();
}

await browser.close();
server.close();
console.log("Screenshots written to docs/screenshots/");
