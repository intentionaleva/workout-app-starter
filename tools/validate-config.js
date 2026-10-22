#!/usr/bin/env node
// Checks config/ (and every examples/<name>/ that has routines.js) the same way the
// app does on load, plus that manifest.webmanifest matches the app name.
// Usage: node tools/validate-config.js

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { compileExercises } from "../src/exercise.js";
import { validateAppConfig, validateRoutines } from "../src/validate.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const load = async f => (await import(pathToFileURL(path.join(root, f)))).default;

const sets = ["config"];
const ex = path.join(root, "examples");
if (fs.existsSync(ex)) for (const d of fs.readdirSync(ex).sort())
  if (fs.existsSync(path.join(ex, d, "routines.js"))) sets.push(`examples/${d}`);

let errors = 0;
for (const dir of sets) {
  const cfgFile = fs.existsSync(path.join(root, dir, "app.config.js")) ? `${dir}/app.config.js` : "config/app.config.js";
  const cfg = await load(cfgFile);
  const lib = compileExercises(await load(`${dir}/exercises.js`), `${dir}/exercises.js`);
  const list = [...validateAppConfig(cfg), ...lib.errors, ...validateRoutines(await load(`${dir}/routines.js`), lib.exercises, cfg)];
  console.log(`${list.length ? "FAIL" : "ok  "} ${dir} (${Object.keys(lib.exercises).length} exercises)`);
  for (const m of list) console.log("     " + m);
  errors += list.length;
}

// The manifest is read by phones when installing; keep its name in sync with app.config.js.
const cfg = await load("config/app.config.js");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
if (manifest.name !== cfg.name || manifest.short_name !== cfg.shortName) {
  console.log(`FAIL manifest.webmanifest: name/short_name ("${manifest.name}" / "${manifest.short_name}") don't match app.config.js ("${cfg.name}" / "${cfg.shortName}")`);
  errors++;
} else console.log("ok   manifest.webmanifest matches app.config.js");

console.log(errors ? `\n${errors} problem(s)` : "\nConfig OK");
process.exit(errors ? 1 : 0);
