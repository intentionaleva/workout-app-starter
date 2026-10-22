// Your routines. Each one becomes a tile on the home screen, in this order.
// The first routine (or the one with `featured: true`) gets the wide tile.
//
// A section item looks like:
//   { ex: "glute-bridge", reps: 15 }                 15 reps
//   { ex: "side-plank", secs: 20, perSide: true }    20 seconds, then the other side
//   { ex: "glute-bridge", reps: 30, scene: "bed" }   show it in a different scene
//   { ex: "yogi-squat", secs: 30, label: { de: "30 s halten", en: "Hold 30 s" } }   custom dose text
// `ex` is an id from config/exercises.js.

// Blocks used by more than one routine.
const warmup = {
  title: { de: "Aufwärmen", en: "Warm-up" },
  badge: { de: "Ohne Gerät", en: "No equipment" },
  rounds: 1,
  items: [
    { ex: "cat-cow", reps: 10 },
    { ex: "worlds-greatest-stretch", reps: 5, perSide: true },
    { ex: "yogi-squat", secs: 30, label: { de: "30 s halten", en: "Hold 30 s" } },
    { ex: "glute-bridge", reps: 15, scene: "mat" },
  ],
};

const core = {
  title: "Core",
  rounds: 2,
  items: [
    { ex: "dead-bug", reps: 10 },
    { ex: "bird-dog", reps: 10, perSide: true },
    { ex: "side-plank", secs: 20, perSide: true },
  ],
};

export default [
  {
    id: "morning",
    name: { de: "Morgenroutine", en: "Morning routine" },
    tone: "orange", icon: "sunrise", featured: true,
    frequency: "daily",
    duration: { de: "ca. 8 Min", en: "~8 min" },
    gear: { de: "Ohne Gerät", en: "No equipment" },
    tileNote: { de: "ohne Gerät", en: "no equipment" },
    rest: 5, roundRest: 5,
    goal: { group: "morning", perWeek: 7 },
    sections: [
      {
        title: { de: "Im Bett", en: "In bed" },
        items: [
          { ex: "glute-bridge", reps: 30, scene: "bed" },
          { ex: "knee-wipers", reps: 10, perSide: true },
          { ex: "reverse-crunch", reps: 20, scene: "bed" },
        ],
      },
      {
        title: { de: "Auf der Matte", en: "On the mat" },
        items: [
          { ex: "cat-cow", reps: 5 },
          { ex: "bird-dog-reach", secs: 60 },
          { ex: "worlds-greatest-stretch", secs: 30, perSide: true },
          { ex: "seated-pigeon", secs: 30, perSide: true },
        ],
      },
    ],
  },

  {
    id: "strength-a",
    name: "Training A",
    tone: "blue", icon: "dumbbell",
    duration: { de: "ca. 35 Min", en: "~35 min" },
    gear: { de: "Kettlebell · Kurzhanteln", en: "Kettlebell · dumbbells" },
    rest: 15, roundRest: 45,
    goal: { group: "strength", perWeek: 2 },
    sections: [
      warmup,
      {
        title: { de: "Hauptteil", en: "Main block" },
        rounds: 3,
        items: [
          { ex: "goblet-squat", reps: 10 },
          { ex: "romanian-deadlift", reps: 10 },
          { ex: "single-leg-rdl", reps: 8, perSide: true },
          { ex: "one-arm-row", reps: 10, perSide: true },
          { ex: "shoulder-press", reps: 10 },
          { ex: "suitcase-carry", secs: 30, perSide: true },
        ],
      },
      core,
    ],
  },

  {
    id: "strength-b",
    name: "Training B",
    tone: "green", icon: "kettlebell",
    duration: { de: "ca. 35 Min", en: "~35 min" },
    gear: { de: "Kettlebell · Kurzhanteln", en: "Kettlebell · dumbbells" },
    rest: 15, roundRest: 45,
    goal: { group: "strength", perWeek: 2 },
    sections: [
      warmup,
      {
        title: { de: "Hauptteil", en: "Main block" },
        rounds: 3,
        items: [
          { ex: "reverse-lunge", reps: 8, perSide: true },
          { ex: "kettlebell-swing", reps: 15 },
          { ex: "push-up", reps: 10 },
          { ex: "bridge-pullover", reps: 10 },
          { ex: "single-arm-march", secs: 30, perSide: true },
          { ex: "half-get-up", reps: 3, perSide: true },
        ],
      },
      core,
    ],
  },

  // A check-off tile instead of a guided workout: tap to log 30 minutes.
  {
    id: "cardio",
    type: "checkoff",
    name: { de: "Ausdauer", en: "Cardio" },
    tone: "cyan", icon: "run",
    minutes: 30,
    goal: { group: "cardio", perWeek: 5 },   // 5 × 30 min = 150 min, the WHO recommendation
    kinds: [
      { id: "walk", name: { de: "Gehen", en: "Walking" } },
      { id: "bike", name: { de: "Rad", en: "Cycling" } },
      { id: "run", name: { de: "Laufen", en: "Running" } },
      { id: "swim", name: { de: "Schwimmen", en: "Swimming" } },
      { id: "other", name: { de: "Anderes", en: "Other" } },
    ],
  },

  {
    id: "postpartum",
    name: { de: "Rückbildung", en: "Postpartum" },
    tone: "purple", icon: "lotus",
    duration: { de: "15 Min", en: "15 min" },
    gear: { de: "Kurzhantel · Kettlebell", en: "Dumbbell · kettlebell" },
    rest: 10, roundRest: 30,
    goal: { group: "postpartum", perWeek: 0 },   // 0 = no target, just count
    sections: [
      {
        title: { de: "Zirkel", en: "Circuit" },
        rounds: 3,
        items: [
          { ex: "heel-slides", reps: 10, perSide: true },
          { ex: "single-leg-bridge", reps: 10, perSide: true },
          { ex: "kneeling-halo", reps: 8, perSide: true },
          { ex: "bird-dog-row", reps: 8, perSide: true },
          { ex: "side-plank-hip-lift", reps: 10, perSide: true },
        ],
      },
    ],
  },
];
