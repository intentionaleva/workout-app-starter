// IDs used by the original single-file version of the app (v1). Data saved by v1
// (workout log, weights, cardio type) is renamed to the new IDs once, on first launch.
// Harmless for new installs: if no v1 data exists, nothing happens.

export const LEGACY_ROUTINES = { morgen: "morning", a: "strength-a", b: "strength-b", rb: "postpartum", cardio: "cardio" };

export const LEGACY_EXERCISES = {
  gb: "glute-bridge", wiper: "knee-wipers", rc: "reverse-crunch", catcow: "cat-cow", bdreach: "bird-dog-reach",
  wgs: "worlds-greatest-stretch", pigeon: "seated-pigeon", yogi: "yogi-squat", goblet: "goblet-squat",
  rdl: "romanian-deadlift", row: "one-arm-row", press: "shoulder-press", carry: "suitcase-carry", deadbug: "dead-bug",
  birddog: "bird-dog", sideplank: "side-plank", lunge: "reverse-lunge", swing: "kettlebell-swing", pushup: "push-up",
  pullover: "bridge-pullover", march: "single-arm-march", heelslide: "heel-slides", slbridge: "single-leg-bridge",
  halo: "kneeling-halo", bdrow: "bird-dog-row", splift: "side-plank-hip-lift", slrdl: "single-leg-rdl", halfgu: "half-get-up",
};

export const LEGACY_KINDS = { Gehen: "walk", Rad: "bike", Laufen: "run", Schwimmen: "swim", Anderes: "other" };
