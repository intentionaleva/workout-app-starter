#!/usr/bin/env node
// Headless smoke test (Playwright): opens the app, runs every routine from start to
// finish, and fails on any console error. Also checks the check-off screen,
// settings, English, reduced motion, text-only exercises, the error screen for
// broken config, the pose editor and offline mode.
// Usage: node tools/smoke-test.js   (needs `npm install` once)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".md": "text/plain" };

export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(port, "127.0.0.1", () => r(server)));
}

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "ok  " : "FAIL"} ${msg}`); if (!cond) failures++; };

async function newPage(browser, base, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: opts.locale || "de-DE", reducedMotion: opts.reducedMotion || "no-preference" });
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  page.errors = [];
  page.on("console", m => { if (m.type() === "error") page.errors.push(m.text()); });
  page.on("pageerror", e => page.errors.push(e.message));
  return { ctx, page };
}

async function acceptDisclaimer(page) {
  const b = await page.waitForSelector("[data-act=disclaimer-ok], .tiles", { timeout: 5000 });
  if (await b.getAttribute("data-act")) await b.click();
  await page.waitForSelector(".tiles");
}

async function runRoutine(page, rid) {
  await page.click(`[data-act=open][data-r="${rid}"]`);
  const steps = await page.evaluate(id => { const r = window.__app.routines.find(x => x.id === id); return r.sections.reduce((a, s) => a + s.items.length * (s.rounds || 1), 0); }, rid);
  await page.click("[data-act=start]");
  let clicks = 0;
  while (clicks < steps * 2 + 5) {
    if (await page.$(".lbl") && await page.$("[data-act=home].big-btn")) break;   // done screen
    await page.waitForTimeout(40);   // let a few animation frames run
    await page.click("[data-act=skip]");
    clicks++;
  }
  const done = !!(await page.$("[data-act=home].big-btn"));
  ok(done, `routine "${rid}": ${steps} steps played to the end`);
  if (done) await page.click("[data-act=home].big-btn");
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();

  // 1. Every routine, German (as configured)
  {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base);
    await acceptDisclaimer(page);
    ok(await page.textContent("h1") === "Was steht heute an?", "German home screen");
    const routines = await page.evaluate(() => window.__app.routines.map(r => ({ id: r.id, type: r.type || "" })));
    for (const r of routines.filter(r => r.type !== "checkoff")) await runRoutine(page, r.id);
    // week view shows the logged workouts
    ok((await page.$$(".days .dot:not(.empty)")).length > 0, "week view shows today's dots");

    // preview from the overview
    await page.click(`[data-act=open][data-r="${routines[0].id}"]`);
    await page.click(".ex-row");
    ok(!!(await page.waitForSelector("#fig svg", { timeout: 3000 })), "exercise preview draws the figure");
    await page.click("[data-act=exit]");
    await page.click("[data-act=home]");

    // check-off routine
    for (const r of routines.filter(r => r.type === "checkoff")) {
      await page.click(`[data-act=open][data-r="${r.id}"]`);
      await page.click("[data-act=kind] >> nth=1");
      await page.click("[data-act=clog]");
      ok((await page.$$(".entry")).length === 1, `check-off "${r.id}": entry logged`);
      await page.click("[data-act=cdel]");
      ok((await page.$$(".entry")).length === 0, `check-off "${r.id}": entry deleted`);
      await page.click("[data-act=home]");
    }

    // weight stepper
    const withEq = await page.evaluate(() => { for (const r of window.__app.routines) for (const s of r.sections || []) for (const it of s.items) if (window.__app.exercises[it.ex].equipment) return r.id; return null; });
    if (withEq) {
      await page.click(`[data-act=open][data-r="${withEq}"]`);
      await page.click("[data-act=start]");
      while (!(await page.$("#wkg"))) await page.click("[data-act=skip]");
      await page.click("[data-act=wplus]");
      await page.click("[data-act=wplus]");
      ok(+(await page.inputValue("#wkg")).replace(",", ".") > 0, "weight stepper stores a weight");
      await page.click("[data-act=exit]");
      await page.click("[data-act=home]");
    }

    // settings: export, language, reset
    await page.click("[data-act=settings]");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-act=export]")]);
    const backup = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    ok(backup.data && backup.data.log && JSON.parse(backup.data.log).length >= routines.length - 1, "export contains the workout log");
    await page.click('[data-act=lang][data-v="en"]');
    ok((await page.textContent("h1")) === "Settings", "language switch to English");
    await page.click("[data-act=reset]");
    await page.click("[data-act=reset-yes]");
    ok((await page.textContent(".status")).includes("deleted"), "reset with in-page confirm");
    await page.setInputFiles("#importFile", { name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
    await page.waitForFunction(() => document.querySelector(".status") && document.querySelector(".status").textContent.length > 0);
    ok((await page.textContent(".status")).length > 0 && (await page.evaluate(() => JSON.parse(localStorage.getItem(window.__app.config.storageKey + "-log") || "[]").length)) > 0, "import restores the log");
    ok(page.errors.length === 0, "no console errors (German run)" + (page.errors.length ? ": " + page.errors.join(" | ") : ""));
    await ctx.close();
  }

  // 2. English, from the browser language
  {
    const { ctx, page } = await newPage(browser, base, { locale: "en-US", init: "localStorage.setItem('ut-lang','en')" });
    await page.goto(base);
    await acceptDisclaimer(page);
    ok(await page.textContent("h1") === "What's on today?", "English home screen");
    const first = await page.evaluate(() => window.__app.routines[0].id);
    await page.click(`[data-act=open][data-r="${first}"]`);
    await page.click("[data-act=start]");
    await page.waitForTimeout(300);
    const phase = await page.textContent("#phase");
    ok(/[a-z]/i.test(phase) && !/[äöüß]/.test(phase + await page.textContent(".cues")), `English exercise text ("${phase}")`);
    await runRoutine(page, (await page.evaluate(() => window.__app.routines.find(r => r.type !== "checkoff").id)).toString()).catch(() => {});
    ok(page.errors.length === 0, "no console errors (English run)");
    await ctx.close();
  }

  // 3. Reduced motion: key poses instead of a loop
  {
    const { ctx, page } = await newPage(browser, base, { reducedMotion: "reduce" });
    await page.goto(base);
    await acceptDisclaimer(page);
    const first = await page.evaluate(() => window.__app.routines[0].id);
    await page.click(`[data-act=open][data-r="${first}"]`);
    await page.click("[data-act=start]");
    await page.waitForTimeout(500);
    ok((await page.$$(".keys .key")).length >= 2 && !!(await page.$(".keys .key.on")), "reduced motion shows a static key-pose sequence");
    ok(page.errors.length === 0, "no console errors (reduced motion)");
    await ctx.close();
  }

  // 4. Text-only exercises (the blank starter) via swapped config files
  {
    const { ctx, page } = await newPage(browser, base);
    await page.route(/\/config\/(exercises|routines)\.js$/, (route, req) => route.fulfill({ path: path.join(root, "examples/blank-starter", path.basename(new URL(req.url()).pathname)), contentType: "text/javascript" }));
    await page.goto(base);
    await acceptDisclaimer(page);
    const rid = await page.evaluate(() => window.__app.routines[0].id);
    await page.click(`[data-act=open][data-r="${rid}"]`);
    await page.click("[data-act=start]");
    await page.waitForTimeout(300);
    ok(!!(await page.$(".noanim")), "text-only exercise shows the placeholder");
    await page.click("[data-act=exit]");
    await page.click("[data-act=home]");
    await runRoutine(page, rid);
    ok(page.errors.length === 0, "no console errors (text-only)");
    await ctx.close();
  }

  // 5. Broken config shows a readable error
  {
    const { ctx, page } = await newPage(browser, base);
    await page.route(/\/config\/exercises\.js$/, route => route.fulfill({ contentType: "text/javascript", body: 'export default { "x": { name: "X", poses: { a: { hip: [1, 2], t: 0 } }, loop: [["a", "top", 500]] } };' }));
    await page.goto(base);
    await page.waitForSelector(".errors");
    const msg = await page.textContent(".errors");
    ok(msg.includes(`Exercise "x": loop step 1 references unknown pose "top"`), "broken config shows a readable error");
    await page.route(/\/config\/routines\.js$/, route => route.fulfill({ contentType: "text/javascript", body: "export default [ { id: 'a', " }));
    await page.goto(base);
    await page.waitForSelector(".errors");
    ok((await page.textContent(".errors")).includes("config/routines.js could not be loaded"), "syntax error in config is reported on screen");
    await ctx.close();
  }

  // 6. Pose editor loads every exercise
  {
    const { ctx, page } = await newPage(browser, base);
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(base + "editor.html");
    await page.waitForSelector("#stage");
    const n = await page.evaluate(() => {
      const sel = document.getElementById("pick"), ids = [...sel.options].map(o => o.value);
      for (const id of ids) { sel.value = id; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      return ids.length;
    });
    ok(n > 0 && (await page.textContent("#checks")).includes("All checks passed"), `pose editor opens all ${n} exercises`);
    await page.click("#play");
    await page.waitForTimeout(400);
    await page.click("#play");
    ok(page.errors.length === 0, "no console errors (editor)" + (page.errors.length ? ": " + page.errors.join(" | ") : ""));
    await ctx.close();
  }

  // 7. Offline after the first load (service worker; ?sw enables it on localhost)
  {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + "?sw");
    await acceptDisclaimer(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await page.waitForTimeout(500);
    await ctx.setOffline(true);
    await page.reload();
    ok(!!(await page.waitForSelector(".tiles", { timeout: 5000 }).catch(() => null)), "works offline after the first load");
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nSmoke test passed");
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main().catch(e => { console.error(e); process.exit(1); });
