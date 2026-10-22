// Shared exercise library. Copy any exercise you like into your config/exercises.js.
// Want to add one? See CONTRIBUTING.md: it must pass `npm run check`.

export default {
  "forearm-plank": {
    name: { de: "Unterarmstütz", en: "Forearm plank" },
    target: { de: "Ganzer Rumpf", en: "Whole core" },
    scene: "mat", highlight: "core",
    base: { ank: [70, 6], A1: { ua: 0, fa: 90 }, A2: { ua: 0, fa: 90 } },
    poses: {
      hold: { t: 100, L1: { th: -78, sh: -78, ft: 50 }, L2: { th: -78, sh: -78, ft: 50 }, g: .7 },
      brace: { t: 100.8, L1: { th: -77.4, sh: -77.4, ft: 50 }, L2: { th: -77.4, sh: -77.4, ft: 50 }, g: .9 },
    },
    loop: [
      ["hold", "brace", 3000, { de: "Halten, Bauch fest", en: "Hold, brace your core" }, "in"],
      ["brace", "hold", 3000, { de: "Halten, weiteratmen", en: "Hold, keep breathing" }, "out"],
    ],
    cues: {
      de: ["Ellbogen unter den Schultern, Körper in einer Linie.", "Po nicht hochschieben und nicht durchhängen lassen.", "Atmung: ruhig weiteratmen."],
      en: ["Elbows under your shoulders, body in one line.", "Don't pike your hips up or let them sag.", "Breathing: keep breathing calmly."],
    },
  },

  "air-squat": {
    name: { de: "Kniebeuge", en: "Air squat" },
    target: { de: "Beine & Po", en: "Legs & glutes" },
    scene: "floor", highlight: "hip",
    base: "standing",
    poses: {
      stand: { A1: { ua: 10, fa: 10 }, A2: { ua: 10, fa: 10 }, g: .2 },
      squat: { t: 150, L1: { sh: -35, th: 100, ft: 90 }, L2: { sh: -35, th: 100, ft: 90 }, A1: { ua: 80, fa: 85 }, A2: { ua: 80, fa: 85 }, g: .9 },
    },
    loop: [
      ["stand", "squat", 1800, { de: "Po nach hinten unten setzen", en: "Sit your hips back and down" }, "in"],
      ["squat", "squat", 300, { de: "Unten kurz halten", en: "Pause at the bottom" }, "hold"],
      ["squat", "stand", 1400, { de: "Über die Fersen hochdrücken", en: "Drive up through your heels" }, "out"],
      ["stand", "stand", 400, { de: "Oben aufrichten", en: "Stand tall" }, "in"],
    ],
    cues: {
      de: ["Füße hüftbreit, Fersen bleiben am Boden.", "Arme zum Ausbalancieren nach vorn.", "Atmung: runter einatmen, hoch ausatmen."],
      en: ["Feet hip-width, heels stay down.", "Reach your arms forward for balance.", "Breathing: in on the way down, out on the way up."],
    },
  },

  "calf-raise": {
    name: { de: "Wadenheben", en: "Calf raises" },
    target: { de: "Waden & Fußgelenke", en: "Calves & ankles" },
    scene: "floor", highlight: "hip",
    base: "standing",
    poses: {
      flat: { g: .2 },
      toes: { ank: [182.5, 8], L1: { ft: 55 }, L2: { ft: 55 }, g: .8 },
    },
    loop: [
      ["flat", "toes", 900, { de: "Auf die Zehenspitzen", en: "Rise onto your toes" }, "out"],
      ["toes", "toes", 500, { de: "Oben halten", en: "Hold at the top" }, "hold"],
      ["toes", "flat", 1200, { de: "Langsam absenken", en: "Lower slowly" }, "in"],
    ],
    cues: {
      de: ["Aufrecht stehen, gern mit einer Hand an der Wand.", "Gerade nach oben, nicht nach außen kippen."],
      en: ["Stand tall, a hand on the wall is fine.", "Rise straight up, don't roll outwards."],
    },
  },

  // A text-only exercise: no poses yet. It shows a placeholder, the cues and the counter.
  "jumping-jacks": {
    name: { de: "Hampelmann", en: "Jumping jacks" },
    target: { de: "Kreislauf", en: "Cardio warm-up" },
    scene: "floor", repSeconds: 1,
    cues: {
      de: ["Locker auf den Fußballen springen.", "Arme über den Kopf, Beine auseinander, dann zurück."],
      en: ["Jump lightly on the balls of your feet.", "Arms overhead and feet apart, then back."],
    },
  },
};
