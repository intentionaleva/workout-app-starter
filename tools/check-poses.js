#!/usr/bin/env node
// Animation sanity check for every exercise in config/ and examples/.
// Usage: node tools/check-poses.js
// For every exercise and every scene it is used in, steps through the animation
// in 50 ms frames and reports:
//   - NaN / non-finite joint positions (broken pose or IK)
//   - joints outside the SVG viewBox (figure clipped)
//   - joints more than 4 px below the floor line (figure sinking into the mat)
// Also reports data errors (unknown poses, typos in field names, …).
// Exit code 1 if anything is wrong.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { compileExercises } from "../src/exercise.js";
import { checkExercise } from "../src/checks.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

/** Folders that contain an exercises.js (config/, examples/<name>/) plus loose library files. */
function sources() {
  const out = [{ dir: "config", file: "config/exercises.js" }];
  const ex = path.join(root, "examples");
  if (fs.existsSync(ex)) for (const d of fs.readdirSync(ex).sort()) {
    const full = path.join(ex, d);
    if (!fs.statSync(full).isDirectory()) continue;
    if (fs.existsSync(path.join(full, "exercises.js"))) out.push({ dir: `examples/${d}`, file: `examples/${d}/exercises.js` });
    else for (const f of fs.readdirSync(full).sort()) if (f.endsWith(".js")) out.push({ dir: `examples/${d}`, file: `examples/${d}/${f}` });
  }
  return out;
}

let problems = 0;
for (const src of sources()) {
  const raw = (await import(pathToFileURL(path.join(root, src.file)))).default;
  const { exercises, errors } = compileExercises(raw, src.file);
  console.log(`\n${src.file}`);
  for (const e of errors) { console.log(`FAIL ${e}`); problems++; }

  // scenes each exercise is used in, from the routines next to it
  const used = {};
  const rfile = path.join(root, src.dir, "routines.js");
  if (fs.existsSync(rfile)) {
    const routines = (await import(pathToFileURL(rfile))).default || [];
    for (const r of routines) for (const s of r.sections || []) for (const it of s.items || []) if (it.scene) (used[it.ex] = used[it.ex] || new Set()).add(it.scene);
  }
  for (const id in exercises) {
    const def = exercises[id];
    const scenes = new Set([def.scene, ...(used[id] || [])]);
    for (const sc of scenes) {
      const issues = checkExercise(def, sc);
      if (issues.length) problems++;
      const kind = !def.animated ? "text-only" : def.custom ? "custom" : "";
      console.log(`${issues.length ? "FAIL" : "ok  "} ${id.padEnd(26)} ${sc.padEnd(5)} ${kind}${issues.join(", ")}`);
    }
  }
}
console.log(problems ? `\n${problems} problem(s) need attention` : "\nAll animations OK");
process.exit(problems ? 1 : 0);
