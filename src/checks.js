// Animation sanity checks, shared by tools/check-poses.js (CI) and the pose editor.
// Steps through an exercise in 50 ms frames and reports broken poses, clipped
// figures and figures sinking into the floor.

import { solve, jointPoints, SCENES, frameBox } from "./rig.js";
import { evalAnim } from "./exercise.js";

/** @returns {string[]} problems, empty if fine */
export function checkExercise(def, scene) {
  if (!def.animated || def.custom) return [];
  scene = scene || def.scene;
  const vb = frameBox(def).split(" ").map(Number);
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, nan = false;
  for (let t = 0; t < def.I + def.L; t += 50) {
    const s = solve(evalAnim(def, scene, t).pose);
    for (const q of jointPoints(s)) {
      if (!isFinite(q[0]) || !isFinite(q[1])) { nan = true; continue; }
      minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]);
      minY = Math.min(minY, q[1] - (q === s.head ? 11 : 4)); maxY = Math.max(maxY, q[1] + 4);
    }
  }
  const issues = [];
  if (nan) issues.push("broken pose (a joint position is not a number)");
  if (minX < vb[0] || maxX > vb[0] + vb[2] || minY < vb[1] || maxY > vb[1] + vb[3]) issues.push("figure goes outside the picture");
  const floor = SCENES[scene].floorY;
  if (maxY > floor + 4) issues.push(`sinks ${(maxY - floor).toFixed(0)} px below the floor`);
  return issues;
}
