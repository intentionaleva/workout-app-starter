// One routine with three text-only exercises. Copy this file to config/routines.js
// (together with exercises.js) to start from scratch.

export default [
  {
    id: "full-body",
    name: { de: "Ganzkörper", en: "Full body" },
    tone: "blue", icon: "star",
    duration: { de: "ca. 10 Min", en: "~10 min" },
    rest: 20, roundRest: 60,
    goal: { group: "full-body", perWeek: 3 },
    sections: [
      {
        title: { de: "Zirkel", en: "Circuit" },
        rounds: 3,
        items: [
          { ex: "squat", reps: 12 },
          { ex: "push-up", reps: 8 },
          { ex: "plank", secs: 30 },
        ],
      },
    ],
  },
];
