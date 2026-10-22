// Exercise library. Every exercise is plain data — no code needed.
//
// Quick reference (full docs in README.md → "Exercise format"):
//   name, target      text, or { de: "…", en: "…" }
//   scene             "bed" | "mat" | "floor"
//   highlight         glowing circle on the working area: "hip" | "core" | "sho"
//   equipment         null | "dumbbell" | "dumbbells" | "kettlebell" | any text
//   props             [["db" | "kb", "h1" | "h2"]]  dumbbell/kettlebell in the near (h1) or far (h2) hand
//   alternating       true = both sides happen inside one rep (bird dog), no side switch
//   sideWord          "side" (default) | "direction" (used for "per side" texts)
//   base              shared pose data merged into every pose: "quadruped" | "supine" | "standing" | { … } | [ "supine", { … } ]
//   poses             { name: pose } keyframes. Positions: x from the left, y = height above the floor.
//   loop              [[from, to, ms, label, breath, easing?]]  breath: "in" | "out" | "hold" | "calm"
//   intro             like loop, plays once at the start (e.g. getting into position)
//   cues              tips shown under the player: ["…"] or { de: ["…"], en: ["…"] }
//   repsPerLoop       how many reps one loop counts as (default 1)
//   extends           "other-id": reuse another exercise's poses and look
//
// No poses? Then it is a text-only exercise: it shows a placeholder (or `image`),
// the cues and the counter. Add `repSeconds: 3` to set the pace of the rep counter.

const armOut = { ua: 100, fa: 100 };            // arm reaching forward on all fours
const legOut = { th: -90, sh: -90, ft: -90 };   // leg reaching back on all fours
const standLeg = { th: 0, sh: 0, ft: 90 };
const hang = { ua: 0, fa: 0 };                  // arm hanging straight down
const up = { ua: 180, fa: 180 };                // arm pointing at the ceiling

export default {
  /* ---------------- Morning routine: in bed ---------------- */

  "glute-bridge": {
    name: { de: "Glute Bridges", en: "Glute bridges" },
    target: { de: "Po & Beinrückseite", en: "Glutes & hamstrings" },
    scene: "bed", highlight: "hip",
    base: "supine",
    poses: {
      down: { t: -90, g: .1 },
      up: { t: -50, g: .9 },
    },
    loop: [
      ["down", "up", 1000, { de: "Über die Fersen: Hüfte hoch", en: "Drive through your heels, hips up" }, "out"],
      ["up", "up", 700, { de: "Oben halten, Po anspannen", en: "Hold at the top, squeeze your glutes" }, "hold"],
      ["up", "down", 1500, { de: "Langsam absenken", en: "Lower slowly" }, "in"],
      ["down", "down", 300, { de: "Kurz ablegen", en: "Rest briefly" }, "in"],
    ],
    cues: {
      de: ["Füße hüftbreit aufstellen, Fersen nah am Po.", "Über die Fersen hochdrücken und den Po fest anspannen.", "Oben eine Linie Knie – Hüfte – Schulter, kein Hohlkreuz.", "Atmung: hoch ausatmen, runter einatmen."],
      en: ["Feet hip-width apart, heels close to your bum.", "Push up through your heels and squeeze your glutes hard.", "At the top: knees, hips and shoulders in one line, no arched back.", "Breathing: out on the way up, in on the way down."],
    },
  },

  "knee-wipers": {
    name: { de: "Knie-Scheibenwischer", en: "Knee wipers" },
    target: { de: "Rumpf & seitlicher Bauch", en: "Core & obliques" },
    scene: "bed", custom: "wiper", alternating: true,
    view: { de: "Ansicht von oben", en: "Top view" },
    poses: {
      center: { w: 0, g: .2 },
      right: { w: 1, g: .8 },
      left: { w: -1, g: .8 },
    },
    loop: [
      ["center", "right", 1600, { de: "Knie zur einen Seite sinken lassen", en: "Let your knees drop to one side" }, "out"],
      ["right", "right", 400, { de: "Kurz halten", en: "Hold briefly" }, "hold"],
      ["right", "center", 1400, { de: "Zurück zur Mitte", en: "Back to the middle" }, "in"],
      ["center", "left", 1600, { de: "Knie zur anderen Seite", en: "Knees to the other side" }, "out"],
      ["left", "left", 400, { de: "Kurz halten", en: "Hold briefly" }, "hold"],
      ["left", "center", 1400, { de: "Zurück zur Mitte", en: "Back to the middle" }, "in"],
    ],
    cues: {
      de: ["Schultern und Arme bleiben flach auf der Unterlage.", "Knie geschlossen, nur so weit sinken lassen, wie es angenehm ist.", "Atmung: zur Seite ausatmen, zur Mitte einatmen."],
      en: ["Shoulders and arms stay flat on the surface.", "Knees together, only drop them as far as feels comfortable.", "Breathing: out to the side, in back to the middle."],
    },
  },

  "reverse-crunch": {
    name: { de: "Reverse Crunches", en: "Reverse crunches" },
    target: { de: "Unterer Bauch", en: "Lower abs" },
    scene: "bed", highlight: "core",
    base: "supine",
    poses: {
      table: { t: -90, L1: { th: 180, sh: 90, ft: 180 }, L2: { th: 180, sh: 90, ft: 180 }, g: .15 },
      curl: { t: -78, L1: { th: 225, sh: 135, ft: 225 }, L2: { th: 225, sh: 135, ft: 225 }, g: .9 },
    },
    loop: [
      ["table", "curl", 1200, { de: "Knie zur Brust, Becken einrollen", en: "Knees to chest, curl your pelvis up" }, "out"],
      ["curl", "curl", 400, { de: "Kurz halten", en: "Hold briefly" }, "hold"],
      ["curl", "table", 1400, { de: "Kontrolliert zurück", en: "Back with control" }, "in"],
      ["table", "table", 300, { de: "Tischposition", en: "Tabletop" }, "in"],
    ],
    cues: {
      de: ["Arme flach neben dem Körper, der untere Rücken bleibt unten.", "Die Bewegung kommt aus dem Bauch, nicht aus dem Schwung.", "Knie bleiben im 90°-Winkel gebeugt.", "Atmung: beim Einrollen ausatmen, beim Zurückgehen einatmen."],
      en: ["Arms flat beside you, lower back stays down.", "The movement comes from your abs, not from swinging.", "Knees stay bent at 90°.", "Breathing: out as you curl up, in as you go back."],
    },
  },

  /* ---------------- Morning routine: on the mat ---------------- */

  "cat-cow": {
    name: { de: "Cat Cow", en: "Cat cow" },
    target: { de: "Wirbelsäule mobilisieren", en: "Spine mobility" },
    scene: "mat", highlight: "core",
    base: "quadruped",
    poses: {
      cat: { tc: 16, h: 45, g: .8 },
      cow: { tc: -12, h: 140, g: .35 },
    },
    loop: [
      ["cat", "cow", 2200, { de: "Bauch sinken lassen, Blick nach vorn", en: "Let your belly sink, look forward" }, "in"],
      ["cow", "cat", 2200, { de: "Rücken rund, Kinn zur Brust", en: "Round your back, chin to chest" }, "out"],
    ],
    cues: {
      de: ["Hände unter den Schultern, Knie unter der Hüfte.", "Wirbel für Wirbel bewegen, vom Becken bis zum Kopf.", "Atmung: ins Hohlkreuz einatmen, in den Katzenbuckel ausatmen."],
      en: ["Hands under your shoulders, knees under your hips.", "Move one vertebra at a time, from pelvis to head.", "Breathing: in as you arch, out as you round."],
    },
  },

  "bird-dog": {
    name: { de: "Bird Dog", en: "Bird dog" },
    target: { de: "Rumpf & Rücken", en: "Core & back" },
    scene: "mat", highlight: "core", alternating: true,
    base: "quadruped",
    poses: {
      neutral: {},
      reach1: { A1: armOut, L2: legOut, g: .9 },
      reach2: { A2: armOut, L1: legOut, g: .9 },
    },
    loop: [
      ["neutral", "reach1", 1200, { de: "Arm und Gegenbein lang machen", en: "Reach out with one arm and the opposite leg" }, "out"],
      ["reach1", "reach1", 1000, { de: "Halten, Becken bleibt gerade", en: "Hold, keep your pelvis level" }, "hold"],
      ["reach1", "neutral", 1200, { de: "Zurück", en: "Back" }, "in"],
      ["neutral", "reach2", 1200, { de: "Andere Seite", en: "Other side" }, "out"],
      ["reach2", "reach2", 1000, { de: "Halten", en: "Hold" }, "hold"],
      ["reach2", "neutral", 1200, { de: "Zurück", en: "Back" }, "in"],
    ],
    cues: {
      de: ["Rücken bleibt gerade wie eine Tischplatte.", "Oben kurz halten, das Becken kippt nicht zur Seite.", "Atmung: beim Strecken ausatmen, zurück einatmen."],
      en: ["Keep your back flat like a tabletop.", "Pause at the top, don't let your pelvis tip to the side.", "Breathing: out as you reach, in on the way back."],
    },
  },

  // Same movement as bird dog, flowing without the hold.
  "bird-dog-reach": {
    extends: "bird-dog",
    name: { de: "Bird Dog Reach", en: "Bird dog reach" },
    target: { de: "Rumpfstabilität", en: "Core stability" },
    poses: {
      reach1: { g: .85 },
      reach2: { g: .85 },
    },
    loop: [
      ["neutral", "reach1", 1200, { de: "Arm und Gegenbein lang machen", en: "Reach out with one arm and the opposite leg" }, "out"],
      ["reach1", "neutral", 1000, { de: "Zurück in den Vierfüßlerstand", en: "Back onto all fours" }, "in"],
      ["neutral", "reach2", 1200, { de: "Andere Seite: Arm und Gegenbein", en: "Other side: arm and opposite leg" }, "out"],
      ["reach2", "neutral", 1000, { de: "Zurück", en: "Back" }, "in"],
    ],
    cues: {
      de: ["Rücken bleibt gerade wie eine Tischplatte.", "Arm und Gegenbein lang nach vorn und hinten schieben, nicht hochreißen.", "Atmung: beim Strecken ausatmen, zurück einatmen."],
      en: ["Keep your back flat like a tabletop.", "Push the arm forward and the leg back, long rather than high.", "Breathing: out as you reach, in on the way back."],
    },
  },

  "worlds-greatest-stretch": {
    name: { de: "World's Greatest Stretch", en: "World's greatest stretch" },
    target: { de: "Hüfte, Brustwirbelsäule", en: "Hips & upper back" },
    scene: "mat", highlight: "hip",
    base: { hip: [135, 37], L1: { to: [205, 0], s: -1, ft: 90 }, L2: { th: -43.4, sh: -90, ft: -90 }, A2: { to: [200, 1], s: 1 } },
    poses: {
      low: { t: 110, h: 110, A1: { ua: 20, fa: 60 }, g: .4 },
      elbow: { t: 95, h: 95, A1: { ua: 10, fa: 150 }, g: .6 },
      open: { t: 112, h: 160, A1: { ua: 180, fa: 180 }, g: .9 },
    },
    loop: [
      ["low", "elbow", 1500, { de: "Ellbogen Richtung Fußinnenseite", en: "Elbow towards the inside of your foot" }, "out"],
      ["elbow", "elbow", 600, { de: "Kurz halten", en: "Hold briefly" }, "hold"],
      ["elbow", "open", 1800, { de: "Arm zur Decke aufdrehen, Blick folgt", en: "Rotate your arm to the ceiling, eyes follow" }, "in"],
      ["open", "open", 900, { de: "Oben halten", en: "Hold at the top" }, "hold"],
      ["open", "low", 1200, { de: "Hand zurück neben den Fuß", en: "Hand back down beside your foot" }, "out"],
    ],
    cues: {
      de: ["Großer Ausfallschritt, vorderes Knie über dem Fuß.", "Ellbogen Richtung Fußinnenseite sinken lassen.", "Atmung: beim Aufdrehen einatmen, beim Absenken ausatmen."],
      en: ["Long lunge, front knee over your foot.", "Let your elbow sink towards the inside of your foot.", "Breathing: in as you rotate up, out as you come down."],
    },
  },

  "seated-pigeon": {
    name: { de: "Seated Pigeon Rocks", en: "Seated pigeon rocks" },
    target: { de: "Hüfte & Po dehnen", en: "Hip & glute stretch" },
    scene: "mat", highlight: "hip",
    base: { hip: [130, 4], L1: { to: [205, 0], s: -1, ft: 90 }, L2: { th: 144.5, tl: .65, sh: 118.6, sl: .5, ft: 100 }, A1: { to: [110, 1], s: 1 }, A2: { to: [116, 1], s: 1 } },
    poses: {
      back: { t: 200, g: .3 },
      forward: { t: 174, g: .85 },
    },
    loop: [
      ["back", "forward", 2000, { de: "Mit langem Rücken nach vorn", en: "Lean forward with a long back" }, "out"],
      ["forward", "forward", 500, { de: "Dehnung im Po spüren", en: "Feel the stretch in your glute" }, "hold"],
      ["forward", "back", 2000, { de: "Zurück rollen", en: "Rock back" }, "in"],
    ],
    cues: {
      de: ["Im Sitzen einen Knöchel auf das andere Knie legen, Hände hinter dem Körper.", "Mit langem Rücken nach vorn kippen, nicht rund machen.", "Atmung: nach vorn ausatmen, zurück einatmen."],
      en: ["Sitting, cross one ankle over the other knee, hands behind you.", "Tip forward with a long back, don't round it.", "Breathing: out going forward, in coming back."],
    },
  },

  /* ---------------- Warm-up ---------------- */

  "yogi-squat": {
    name: { de: "Yogi Squat", en: "Yogi squat" },
    target: { de: "Hüfte & Fußgelenke", en: "Hips & ankles" },
    scene: "mat", highlight: "hip",
    base: { ank: [190, 0], L1: { sh: -25, th: 110, ft: 90 }, L2: { sh: -25, th: 110, ft: 90 }, A1: { ua: 35, fa: 195 }, A2: { ua: 35, fa: 195 } },
    poses: {
      sink: { t: 165, g: .45 },
      tall: { t: 171, g: .8 },
    },
    loop: [
      ["sink", "tall", 4000, { de: "Brust aufrichten", en: "Lift your chest" }, "in"],
      ["tall", "sink", 4000, { de: "Tiefer sinken lassen", en: "Sink a little deeper" }, "out"],
    ],
    cues: {
      de: ["Füße etwas weiter als hüftbreit, Fersen bleiben am Boden.", "Hände vor der Brust, Ellbogen drücken die Knie sanft nach außen.", "Atmung: ruhig und tief, mit jedem Ausatmen etwas tiefer sinken."],
      en: ["Feet a bit wider than hips, heels stay on the floor.", "Hands in front of your chest, elbows gently push your knees out.", "Breathing: slow and deep, sink a little lower with every breath out."],
    },
  },

  /* ---------------- Strength A ---------------- */

  "goblet-squat": {
    name: { de: "Goblet Squat", en: "Goblet squat" },
    target: { de: "Beine & Po", en: "Legs & glutes" },
    scene: "floor", highlight: "hip", equipment: "kettlebell",
    props: [["kb", "h1"]],
    base: "standing",
    poses: {
      stand: { A1: { ua: 20, fa: 170 }, A2: { ua: 20, fa: 170 }, g: .2 },
      squat: { t: 150, L1: { sh: -35, th: 100, ft: 90 }, L2: { sh: -35, th: 100, ft: 90 }, A1: { ua: -10, fa: 140 }, A2: { ua: -10, fa: 140 }, g: .9 },
    },
    loop: [
      ["stand", "squat", 2000, { de: "Po nach hinten unten setzen", en: "Sit your hips back and down" }, "in"],
      ["squat", "squat", 400, { de: "Unten kurz halten", en: "Pause at the bottom" }, "hold"],
      ["squat", "stand", 1500, { de: "Über die Fersen hochdrücken", en: "Drive up through your heels" }, "out"],
      ["stand", "stand", 500, { de: "Oben aufrichten", en: "Stand tall" }, "in"],
    ],
    cues: {
      de: ["Kettlebell eng vor der Brust halten.", "Knie zeigen in Richtung Zehen, Fersen bleiben unten.", "Atmung: runter einatmen, hoch ausatmen."],
      en: ["Hold the kettlebell close to your chest.", "Knees track over your toes, heels stay down.", "Breathing: in on the way down, out on the way up."],
    },
  },

  "romanian-deadlift": {
    name: { de: "RDL", en: "Romanian deadlift" },
    target: { de: "Beinrückseite & Po", en: "Hamstrings & glutes" },
    scene: "floor", highlight: "hip", equipment: "dumbbells",
    props: [["db", "h2"], ["db", "h1"]],
    base: "standing",
    poses: {
      stand: { g: .2 },
      hinge: { t: 105, L1: { sh: -8, th: 20, ft: 90 }, L2: { sh: -8, th: 20, ft: 90 }, g: .9 },
    },
    loop: [
      ["stand", "hinge", 2000, { de: "Hüfte nach hinten schieben, Rücken gerade", en: "Push your hips back, back straight" }, "in"],
      ["hinge", "hinge", 300, { de: "Dehnung hinten spüren", en: "Feel the stretch in your hamstrings" }, "hold"],
      ["hinge", "stand", 1500, { de: "Hüfte nach vorn, Po anspannen", en: "Hips forward, squeeze your glutes" }, "out"],
      ["stand", "stand", 400, { de: "Oben", en: "Top" }, "in"],
    ],
    cues: {
      de: ["Knie leicht gebeugt, Rücken bleibt die ganze Zeit gerade.", "Hanteln nah an den Beinen entlangführen.", "Atmung: runter einatmen, hoch ausatmen."],
      en: ["Knees slightly bent, back straight the whole time.", "Keep the dumbbells close to your legs.", "Breathing: in on the way down, out on the way up."],
    },
  },

  "single-leg-rdl": {
    name: { de: "Einbeiniges RDL", en: "Single-leg RDL" },
    target: { de: "Gleichgewicht, Po & Beinrückseite", en: "Balance, glutes & hamstrings" },
    scene: "floor", highlight: "hip", equipment: "dumbbell",
    props: [["db", "h2"]],
    base: { ank: [180, 0], A1: hang, A2: hang },
    poses: {
      stand: { t: 180, L1: { sh: 0, th: 0, ft: 90 }, L2: { th: 5, sh: -20, ft: 70 }, g: .2 },
      hinge: { t: 100, L1: { sh: -8, th: 20, ft: 90 }, L2: { th: -80, sh: -80, ft: 0 }, g: .9 },
    },
    loop: [
      ["stand", "hinge", 2000, { de: "Oberkörper vor, Bein lang nach hinten", en: "Chest forward, leg long behind you" }, "in"],
      ["hinge", "hinge", 400, { de: "Kurz halten, Hüfte waagerecht", en: "Hold, hips level" }, "hold"],
      ["hinge", "stand", 1600, { de: "Hüfte nach vorn, aufrichten", en: "Hips forward, stand up" }, "out"],
      ["stand", "stand", 500, { de: "Stabil stehen", en: "Stand steady" }, "in"],
    ],
    cues: {
      de: ["Standbein leicht gebeugt, die Hantel ist in der Hand gegenüber vom Standbein.", "Oberkörper und hinteres Bein bewegen sich wie eine Wippe, die Hüfte bleibt waagerecht.", "Anfangs gern mit einer Hand an der Wand abstützen.", "Atmung: runter einatmen, hoch ausatmen."],
      en: ["Standing knee slightly bent, dumbbell in the hand opposite the standing leg.", "Chest and back leg move like a seesaw, hips stay level.", "At first, feel free to steady yourself with one hand on a wall.", "Breathing: in on the way down, out on the way up."],
    },
  },

  "one-arm-row": {
    name: { de: "Einarmiges Rudern", en: "One-arm row" },
    target: { de: "Oberer Rücken", en: "Upper back" },
    scene: "floor", highlight: "sho", equipment: "dumbbell",
    props: [["db", "h1"]],
    base: { hip: [165, 92], t: 125, L1: { to: [140, 0], s: -1, ft: 90 }, L2: { to: [205, 0], s: -1, ft: 90 }, A2: { to: [195, 55], s: 1 } },
    poses: {
      down: { A1: { ua: 0, fa: 0 }, g: .2 },
      up: { A1: { ua: -80, fa: 0 }, g: .9 },
    },
    loop: [
      ["down", "up", 1000, { de: "Ellbogen zur Hüfte ziehen", en: "Pull your elbow to your hip" }, "out"],
      ["up", "up", 500, { de: "Schulterblatt zusammen", en: "Squeeze your shoulder blade" }, "hold"],
      ["up", "down", 1500, { de: "Arm lang werden lassen", en: "Let your arm get long" }, "in"],
      ["down", "down", 300, { de: "Unten", en: "Bottom" }, "in"],
    ],
    cues: {
      de: ["Versetzter Stand, freie Hand stützt sich auf dem vorderen Oberschenkel ab.", "Ellbogen eng am Körper Richtung Hüfte ziehen, Rücken gerade.", "Atmung: beim Ziehen ausatmen, beim Ablassen einatmen."],
      en: ["Staggered stance, free hand resting on your front thigh.", "Pull your elbow close to your body towards your hip, back straight.", "Breathing: out as you pull, in as you lower."],
    },
  },

  "shoulder-press": {
    name: { de: "Schulterdrücken", en: "Shoulder press" },
    target: { de: "Schultern", en: "Shoulders" },
    scene: "floor", highlight: "sho", equipment: "dumbbells", frame: "tall",
    props: [["db", "h2"], ["db", "h1"]],
    base: "standing",
    poses: {
      down: { A1: { ua: 15, fa: 180 }, A2: { ua: 15, fa: 180 }, g: .2 },
      up: { A1: up, A2: up, g: .9 },
    },
    loop: [
      ["down", "up", 1200, { de: "Nach oben drücken", en: "Press up" }, "out"],
      ["up", "up", 400, { de: "Oben, Bauch fest", en: "Top, brace your core" }, "hold"],
      ["up", "down", 1600, { de: "Kontrolliert ablassen", en: "Lower with control" }, "in"],
      ["down", "down", 300, { de: "Auf Schulterhöhe", en: "At shoulder height" }, "in"],
    ],
    cues: {
      de: ["Bauch und Po fest, kein Hohlkreuz.", "Hanteln starten auf Schulterhöhe und gehen gerade nach oben.", "Atmung: hoch ausatmen, runter einatmen."],
      en: ["Brace your core and glutes, no arched back.", "Dumbbells start at shoulder height and go straight up.", "Breathing: out on the way up, in on the way down."],
    },
  },

  "suitcase-carry": {
    name: { de: "Suitcase Carry", en: "Suitcase carry" },
    target: { de: "Seitlicher Rumpf & Griffkraft", en: "Obliques & grip" },
    scene: "floor", highlight: "core", equipment: "kettlebell",
    props: [["kb", "h1"]],
    base: { t: 180, A1: hang },
    poses: {
      step1: { hip: [180, 97], L1: { th: 20, sh: 12, ft: 100 }, L2: { th: -18, sh: -30, ft: 60 }, A2: { ua: 15, fa: 25 }, g: .6 },
      pass1: { hip: [180, 103], L1: { th: 0, sh: 0, ft: 90 }, L2: { th: 15, sh: -40, ft: 50 }, A2: { ua: 0, fa: 0 }, g: .7 },
      step2: { hip: [180, 97], L1: { th: -18, sh: -30, ft: 60 }, L2: { th: 20, sh: 12, ft: 100 }, A2: { ua: -15, fa: -10 }, g: .6 },
      pass2: { hip: [180, 103], L1: { th: 15, sh: -40, ft: 50 }, L2: { th: 0, sh: 0, ft: 90 }, A2: { ua: 0, fa: 0 }, g: .7 },
    },
    loop: [
      ["step1", "pass1", 320, { de: "Aufrecht gehen, nicht zur Seite kippen", en: "Walk tall, don't lean to the side" }, "calm", "linear"],
      ["pass1", "step2", 320, { de: "Aufrecht gehen, nicht zur Seite kippen", en: "Walk tall, don't lean to the side" }, "calm", "linear"],
      ["step2", "pass2", 320, { de: "Aufrecht gehen, nicht zur Seite kippen", en: "Walk tall, don't lean to the side" }, "calm", "linear"],
      ["pass2", "step1", 320, { de: "Aufrecht gehen, nicht zur Seite kippen", en: "Walk tall, don't lean to the side" }, "calm", "linear"],
    ],
    cues: {
      de: ["Kettlebell in einer Hand, aufrecht stehen und gehen.", "Nicht zur Gewichtsseite kippen, Schultern tief, Bauch fest.", "Atmung: ruhig weiteratmen."],
      en: ["Kettlebell in one hand, stand and walk tall.", "Don't lean towards the weight, shoulders down, core braced.", "Breathing: keep breathing calmly."],
    },
  },

  /* ---------------- Core block ---------------- */

  "dead-bug": {
    name: { de: "Deadbug", en: "Dead bug" },
    target: { de: "Tiefe Bauchmuskeln", en: "Deep core" },
    scene: "mat", highlight: "core", repsPerLoop: 2,
    base: { sho: [90, 0], t: -90, h: -107, A1: up, A2: up, L1: { th: 180, sh: 90, ft: 180 }, L2: { th: 180, sh: 90, ft: 180 }, g: .3 },
    poses: {
      neutral: {},
      reach1: { A1: { ua: 260, fa: 260 }, L2: { th: 100, sh: 100, ft: 180 }, g: .9 },
      reach2: { A2: { ua: 260, fa: 260 }, L1: { th: 100, sh: 100, ft: 180 }, g: .9 },
    },
    loop: [
      ["neutral", "reach1", 1500, { de: "Arm und Gegenbein lang strecken", en: "Extend one arm and the opposite leg" }, "out"],
      ["reach1", "reach1", 500, { de: "Kurz halten", en: "Hold briefly" }, "hold"],
      ["reach1", "neutral", 1500, { de: "Zurück", en: "Back" }, "in"],
      ["neutral", "reach2", 1500, { de: "Andere Seite strecken", en: "Extend the other side" }, "out"],
      ["reach2", "reach2", 500, { de: "Kurz halten", en: "Hold briefly" }, "hold"],
      ["reach2", "neutral", 1500, { de: "Zurück", en: "Back" }, "in"],
    ],
    cues: {
      de: ["Unterer Rücken bleibt die ganze Zeit am Boden.", "Arm und Gegenbein langsam strecken, nur so tief, wie der Rücken unten bleibt.", "Atmung: beim Strecken ausatmen, zurück einatmen."],
      en: ["Lower back stays on the floor the whole time.", "Extend arm and opposite leg slowly, only as low as your back stays down.", "Breathing: out as you extend, in on the way back."],
    },
  },

  "side-plank": {
    name: { de: "Seitstütz auf den Knien", en: "Kneeling side plank" },
    target: { de: "Seitlicher Rumpf", en: "Obliques" },
    scene: "mat", highlight: "hip",
    view: { de: "Ansicht von vorn", en: "Front view" },
    base: { A1: { ua: 0, fa: 90 }, A2: up },
    poses: {
      down: { hip: [162, 4], t: 119.7, L1: { th: -85.6, sh: -85.6, sl: .15 }, L2: { th: -85.6, sh: -85.6, sl: .15 }, g: .3 },
      up: { hip: [159.3, 16.4], t: 108.4, L1: { th: -71.6, sh: -71.6, sl: .15 }, L2: { th: -71.6, sh: -71.6, sl: .15 }, g: .85 },
      hold: { hip: [159.3, 18.2], t: 108.8, L1: { th: -70.8, sh: -70.8, sl: .15 }, L2: { th: -70.8, sh: -70.8, sl: .15 }, g: .95 },
    },
    intro: [
      ["down", "up", 1500, { de: "Hüfte hochschieben", en: "Push your hips up" }, "out"],
    ],
    loop: [
      ["up", "hold", 3000, { de: "Halten, Hüfte oben", en: "Hold, hips up" }, "in"],
      ["hold", "up", 3000, { de: "Halten, Hüfte oben", en: "Hold, hips up" }, "out"],
    ],
    cues: {
      de: ["Ellbogen direkt unter der Schulter, Knie gebeugt.", "Knie, Hüfte und Schulter bilden eine Linie.", "Atmung: ruhig weiteratmen, nicht die Luft anhalten."],
      en: ["Elbow right under your shoulder, knees bent.", "Knees, hips and shoulders form one line.", "Breathing: keep breathing calmly, don't hold your breath."],
    },
  },

  /* ---------------- Strength B ---------------- */

  "reverse-lunge": {
    name: { de: "Reverse Lunge", en: "Reverse lunge" },
    target: { de: "Beine & Po", en: "Legs & glutes" },
    scene: "floor", highlight: "hip", alternating: true, equipment: "dumbbells",
    props: [["db", "h2"], ["db", "h1"]],
    base: { A1: hang, A2: hang },
    poses: {
      stand: { hip: [180, 102], t: 180, L1: { to: [184, 0], s: -1, ft: 90 }, L2: { to: [176, 0], s: -1, ft: 90 }, g: .2 },
      lunge1: { hip: [168, 57], t: 174, L1: { to: [96, 10], s: -1, ft: 47 }, L2: { to: [188, 0], s: -1, ft: 90 }, g: .9 },
      lunge2: { hip: [168, 57], t: 174, L1: { to: [188, 0], s: -1, ft: 90 }, L2: { to: [96, 10], s: -1, ft: 47 }, g: .9 },
    },
    loop: [
      ["stand", "lunge1", 1500, { de: "Großer Schritt zurück", en: "Big step back" }, "in"],
      ["lunge1", "lunge1", 400, { de: "Unten, Oberkörper aufrecht", en: "Bottom, chest upright" }, "hold"],
      ["lunge1", "stand", 1200, { de: "Über die vordere Ferse hoch", en: "Up through your front heel" }, "out"],
      ["stand", "lunge2", 1500, { de: "Anderes Bein zurück", en: "Other leg back" }, "in"],
      ["lunge2", "lunge2", 400, { de: "Unten halten", en: "Hold at the bottom" }, "hold"],
      ["lunge2", "stand", 1200, { de: "Hoch", en: "Up" }, "out"],
    ],
    cues: {
      de: ["Großer Schritt nach hinten, hinteres Knie sinkt Richtung Boden.", "Oberkörper aufrecht, vorderes Knie bleibt über dem Fuß.", "Atmung: runter einatmen, hoch ausatmen."],
      en: ["Big step back, back knee sinks towards the floor.", "Chest upright, front knee stays over your foot.", "Breathing: in on the way down, out on the way up."],
    },
  },

  "kettlebell-swing": {
    name: { de: "KB Swing", en: "Kettlebell swing" },
    target: { de: "Po & Beinrückseite", en: "Glutes & hamstrings" },
    scene: "floor", highlight: "hip", equipment: "kettlebell",
    props: [["kb", "h1", "arm"]],
    base: { ank: [180, 0] },
    poses: {
      hike: { t: 100, L1: { sh: -12, th: 28, ft: 90 }, L2: { sh: -12, th: 28, ft: 90 }, A1: { ua: -20, fa: -25 }, A2: { ua: -20, fa: -25 }, g: .4 },
      float: { t: 180, L1: standLeg, L2: standLeg, A1: { ua: 90, fa: 90 }, A2: { ua: 90, fa: 90 }, g: .95 },
    },
    loop: [
      ["hike", "float", 600, { de: "Hüfte explosiv nach vorn", en: "Snap your hips forward" }, "out"],
      ["float", "float", 200, { de: "Oben Po und Bauch fest", en: "Glutes and core tight at the top" }, "out"],
      ["float", "hike", 700, { de: "Glocke zwischen die Beine", en: "Bell back between your legs" }, "in"],
    ],
    cues: {
      de: ["Die Kraft kommt aus der Hüfte, die Arme führen nur.", "Oben Po und Bauch fest, Glocke auf Brusthöhe.", "Atmung: hoch kräftig ausatmen, runter einatmen."],
      en: ["The power comes from your hips, your arms just guide.", "Glutes and core tight at the top, bell at chest height.", "Breathing: sharp breath out on the way up, in on the way down."],
    },
  },

  "push-up": {
    name: { de: "Liegestütz", en: "Push-up" },
    target: { de: "Brust, Arme, Rumpf", en: "Chest, arms & core" },
    scene: "mat", highlight: "sho",
    base: { ank: [72, 7], A1: { to: [224, 1], s: 1 }, A2: { to: [224, 1], s: 1 } },
    poses: {
      up: { t: 112.2, L1: { sh: -67.8, th: -67.8, ft: 50 }, L2: { sh: -67.8, th: -67.8, ft: 50 }, g: .3 },
      down: { t: 97, L1: { sh: -83, th: -83, ft: 50 }, L2: { sh: -83, th: -83, ft: 50 }, g: .9 },
    },
    loop: [
      ["up", "down", 1800, { de: "Brust Richtung Boden", en: "Chest towards the floor" }, "in"],
      ["down", "down", 200, { de: "Unten", en: "Bottom" }, "hold"],
      ["down", "up", 1200, { de: "Kräftig hochdrücken", en: "Push up strongly" }, "out"],
      ["up", "up", 400, { de: "Oben", en: "Top" }, "in"],
    ],
    cues: {
      de: ["Körper bildet eine Linie von Kopf bis Fuß.", "Ellbogen schräg nach hinten, nicht zur Seite.", "Gerne auch auf den Knien.", "Atmung: runter einatmen, hoch ausatmen."],
      en: ["Your body makes one line from head to heels.", "Elbows angle back, not out to the sides.", "Doing them on your knees is fine too.", "Breathing: in on the way down, out on the way up."],
    },
  },

  "bridge-pullover": {
    name: { de: "Bridge Pullover", en: "Bridge pullover" },
    target: { de: "Po, Rücken, Rumpf", en: "Glutes, back & core" },
    scene: "mat", highlight: "hip", equipment: "dumbbell",
    props: [["db", "h1"]],
    base: ["supine", { A1: up, A2: up }],
    poses: {
      down: { t: -90, g: .1 },
      bridge: { t: -50, g: .85 },
      over: { t: -50, A1: { ua: 262, fa: 262 }, A2: { ua: 262, fa: 262 }, g: .95 },
    },
    intro: [
      ["down", "bridge", 1500, { de: "Hüfte hoch in die Brücke", en: "Lift your hips into a bridge" }, "out"],
    ],
    loop: [
      ["bridge", "over", 2200, { de: "Hantel über den Kopf nach hinten", en: "Take the dumbbell back over your head" }, "in"],
      ["over", "over", 300, { de: "Hüfte bleibt oben", en: "Hips stay up" }, "hold"],
      ["over", "bridge", 1500, { de: "Zurück über die Brust", en: "Back over your chest" }, "out"],
    ],
    cues: {
      de: ["Die Hüfte bleibt die ganze Zeit oben in der Brücke.", "Arme fast gestreckt, nur so weit nach hinten, wie der Rücken flach bleibt.", "Atmung: nach hinten einatmen, zurück ausatmen."],
      en: ["Your hips stay up in the bridge the whole time.", "Arms almost straight, only go back as far as your back stays flat.", "Breathing: in going back, out coming forward."],
    },
  },

  "single-arm-march": {
    name: { de: "Single Arm March", en: "Single-arm march" },
    target: { de: "Rumpf & Hüftbeuger", en: "Core & hip flexors" },
    scene: "floor", highlight: "core", equipment: "dumbbell",
    props: [["db", "h1"]],
    base: { hip: [180, 102], t: 180, A1: { ua: 15, fa: 175 }, A2: { ua: 8, fa: 8 }, L1: standLeg, L2: standLeg },
    poses: {
      stand: { g: .4 },
      knee1: { L1: { th: 90, sh: 0, ft: 90 }, g: .85 },
      knee2: { L2: { th: 90, sh: 0, ft: 90 }, g: .85 },
    },
    loop: [
      ["stand", "knee1", 700, { de: "Knie auf Hüfthöhe heben", en: "Lift your knee to hip height" }, "calm"],
      ["knee1", "stand", 700, { de: "Absetzen", en: "Down" }, "calm"],
      ["stand", "knee2", 700, { de: "Anderes Knie hoch", en: "Other knee up" }, "calm"],
      ["knee2", "stand", 700, { de: "Absetzen", en: "Down" }, "calm"],
    ],
    cues: {
      de: ["Hantel in einer Hand auf Schulterhöhe halten.", "Knie abwechselnd auf Hüfthöhe heben, der Oberkörper bleibt ruhig und aufrecht.", "Atmung: ruhig weiteratmen."],
      en: ["Hold the dumbbell in one hand at shoulder height.", "Lift your knees to hip height in turn, upper body stays still and tall.", "Breathing: keep breathing calmly."],
    },
  },

  "half-get-up": {
    name: { de: "Half Get-up", en: "Half get-up" },
    target: { de: "Schulterstabilität & Aufstehen vom Boden", en: "Shoulder stability & getting up off the floor" },
    scene: "mat", highlight: "sho", equipment: "kettlebell",
    props: [["kb", "h1"]],
    base: { hip: [150, 0], A1: up, L1: { to: [214, 0], s: -1, ft: 90 }, L2: { th: 90, sh: 90, ft: 180 } },
    poses: {
      flat: { t: -90, h: -107, A2: { ua: -88, fa: -92 }, g: .2 },
      elbow: { t: -120, h: -125, A2: { ua: -39.8, fa: -90 }, g: .6 },
      hand: { t: -140, h: -145, A2: { ua: -47.2, fa: -47.2 }, g: .9 },
    },
    loop: [
      ["flat", "elbow", 1600, { de: "Auf den Ellbogen rollen", en: "Roll onto your elbow" }, "out"],
      ["elbow", "hand", 1100, { de: "Auf die Hand hochdrücken", en: "Push up onto your hand" }, "out"],
      ["hand", "hand", 1000, { de: "Oben halten, Arm senkrecht", en: "Hold, arm vertical" }, "hold"],
      ["hand", "elbow", 1100, { de: "Zurück auf den Ellbogen", en: "Back down to your elbow" }, "in"],
      ["elbow", "flat", 1600, { de: "Langsam ablegen", en: "Slowly lie back down" }, "in"],
      ["flat", "flat", 500, { de: "Liegen", en: "Lie flat" }, "in"],
    ],
    cues: {
      de: ["Der Arm mit der Kettlebell bleibt senkrecht, der Blick geht zur Glocke.", "Das Bein auf der Kettlebell-Seite ist aufgestellt, das andere bleibt lang am Boden.", "Erst auf den Ellbogen, dann auf die Hand. Ohne Gewicht üben, bis es sicher sitzt.", "Atmung: beim Hochkommen ausatmen, beim Ablegen einatmen."],
      en: ["The arm holding the kettlebell stays vertical, eyes on the bell.", "Knee bent on the kettlebell side, the other leg stays long on the floor.", "First onto the elbow, then the hand. Practise without weight until it feels solid.", "Breathing: out as you come up, in as you lie back down."],
    },
  },

  /* ---------------- Postpartum (Rückbildung) ---------------- */

  "heel-slides": {
    name: { de: "Heel Slides", en: "Heel slides" },
    target: { de: "Tiefe Bauchmuskeln & Beckenboden", en: "Deep core & pelvic floor" },
    scene: "mat", highlight: "core", alternating: true, equipment: "dumbbell",
    props: [["db", "h1"]],
    base: ["supine", { A1: up, A2: up }],
    poses: {
      bent: { g: .3 },
      slide1: { L1: { to: [246, 0], s: -1, ft: 170 }, g: .85 },
      slide2: { L2: { to: [246, 0], s: -1, ft: 170 }, g: .85 },
    },
    loop: [
      ["bent", "slide1", 2000, { de: "Ferse langsam ausschieben", en: "Slowly slide your heel out" }, "out"],
      ["slide1", "bent", 1800, { de: "Ferse zurückziehen", en: "Draw your heel back in" }, "in"],
      ["bent", "slide2", 2000, { de: "Andere Ferse ausschieben", en: "Slide the other heel out" }, "out"],
      ["slide2", "bent", 1800, { de: "Zurückziehen", en: "Draw it back" }, "in"],
    ],
    cues: {
      de: ["Hantel mit gestreckten Armen über der Brust halten.", "Der untere Rücken bleibt flach, das Becken kippt nicht.", "Atmung: beim Ausschieben ausatmen, Bauch und Beckenboden sanft nach innen ziehen."],
      en: ["Hold the dumbbell over your chest with straight arms.", "Lower back stays flat, pelvis doesn't tip.", "Breathing: out as you slide, gently draw your belly and pelvic floor in."],
    },
  },

  "single-leg-bridge": {
    name: { de: "Single Leg Bridge", en: "Single-leg bridge" },
    target: { de: "Po & Beckenstabilität", en: "Glutes & pelvic stability" },
    scene: "mat", highlight: "hip",
    base: "supine",
    poses: {
      down: { t: -90, L2: { th: 120, sh: 120, ft: 200 }, g: .1 },
      up: { t: -50, L2: { th: 130, sh: 130, ft: 210 }, g: .9 },
    },
    loop: [
      ["down", "up", 1100, { de: "Über die Ferse: Hüfte hoch", en: "Drive through your heel, hips up" }, "out"],
      ["up", "up", 700, { de: "Oben halten, Becken gerade", en: "Hold at the top, pelvis level" }, "hold"],
      ["up", "down", 1500, { de: "Langsam absenken", en: "Lower slowly" }, "in"],
      ["down", "down", 300, { de: "Kurz ablegen", en: "Rest briefly" }, "in"],
    ],
    cues: {
      de: ["Ein Fuß steht, das andere Bein ist gestreckt in Verlängerung des Oberschenkels.", "Über die Ferse des Standbeins hochdrücken, das Becken bleibt waagerecht.", "Atmung: hoch ausatmen, runter einatmen."],
      en: ["One foot planted, the other leg straight in line with its thigh.", "Push up through the heel of the planted foot, pelvis stays level.", "Breathing: out on the way up, in on the way down."],
    },
  },

  "kneeling-halo": {
    name: { de: "Halo im Kniestand", en: "Kneeling halo" },
    target: { de: "Schultern & Rumpf", en: "Shoulders & core" },
    scene: "mat", highlight: "sho", equipment: "kettlebell", sideWord: "direction",
    props: [["kb", "h1"]],
    base: { hip: [180, 52], t: 180, L1: { th: 0, sh: -90, ft: -90 }, L2: { th: 0, sh: -90, ft: -90 } },
    poses: {
      front: { A1: { ua: 30, fa: 170 }, A2: { ua: 30, fa: 170 }, g: .4 },
      side: { A1: { ua: 150, fa: 250 }, A2: { ua: 150, fa: 250 }, g: .8 },
      back: { A1: { ua: 165, fa: 270 }, A2: { ua: 165, fa: 270 }, g: .9 },
    },
    loop: [
      ["front", "side", 900, { de: "Glocke an einer Kopfseite vorbei", en: "Bell past one side of your head" }, "calm"],
      ["side", "back", 700, { de: "Hinter dem Kopf", en: "Behind your head" }, "calm"],
      ["back", "side", 700, { de: "An der anderen Kopfseite vorbei", en: "Past the other side of your head" }, "calm"],
      ["side", "front", 900, { de: "Zurück vor die Brust", en: "Back in front of your chest" }, "calm"],
    ],
    cues: {
      de: ["Aufrecht auf beiden Knien, Po und Bauch leicht angespannt.", "Kettlebell an den Hörnern halten und eng um den Kopf führen.", "Der Oberkörper bleibt ruhig, nur die Arme bewegen sich.", "Atmung: ruhig weiteratmen."],
      en: ["Tall on both knees, glutes and core lightly engaged.", "Hold the kettlebell by the horns and circle it close around your head.", "Your upper body stays still, only your arms move.", "Breathing: keep breathing calmly."],
    },
  },

  "bird-dog-row": {
    name: { de: "Bird Dog mit Rudern", en: "Bird dog row" },
    target: { de: "Rumpf & oberer Rücken", en: "Core & upper back" },
    scene: "mat", highlight: "core", equipment: "dumbbell",
    props: [["db", "h1"]],
    base: "quadruped",
    poses: {
      neutral: {},
      row: { A1: { ua: -80, fa: 0 }, L2: legOut, g: .9 },
    },
    loop: [
      ["neutral", "row", 1200, { de: "Hantel rudern, Gegenbein strecken", en: "Row the dumbbell, extend the opposite leg" }, "out"],
      ["row", "row", 600, { de: "Kurz halten, Becken gerade", en: "Hold, pelvis level" }, "hold"],
      ["row", "neutral", 1400, { de: "Kontrolliert zurück", en: "Back with control" }, "in"],
      ["neutral", "neutral", 300, { de: "Vierfüßlerstand", en: "All fours" }, "in"],
    ],
    cues: {
      de: ["Vierfüßlerstand, eine Hand hält die Hantel.", "Hantel zur Hüfte ziehen und gleichzeitig das Gegenbein lang nach hinten strecken.", "Rücken bleibt gerade wie eine Tischplatte.", "Atmung: beim Rudern ausatmen, zurück einatmen."],
      en: ["On all fours, one hand holds the dumbbell.", "Pull the dumbbell to your hip while extending the opposite leg back.", "Keep your back flat like a tabletop.", "Breathing: out as you row, in on the way back."],
    },
  },

  // Reuses the side plank's poses, but moves the hips up and down.
  "side-plank-hip-lift": {
    extends: "side-plank",
    name: { de: "Seitstütz mit Hüftheben", en: "Side plank hip lifts" },
    loop: [
      ["down", "up", 1200, { de: "Hüfte hochschieben", en: "Push your hips up" }, "out"],
      ["up", "up", 500, { de: "Oben halten", en: "Hold at the top" }, "hold"],
      ["up", "down", 1300, { de: "Hüfte kontrolliert absenken", en: "Lower your hips with control" }, "in"],
      ["down", "down", 300, { de: "Kurz ablegen", en: "Rest briefly" }, "in"],
    ],
    cues: {
      de: ["Ellbogen direkt unter der Schulter, Knie gebeugt.", "Hüfte hoch, bis Knie, Hüfte und Schulter eine Linie bilden, dann wieder absenken.", "Atmung: hoch ausatmen, runter einatmen."],
      en: ["Elbow right under your shoulder, knees bent.", "Lift your hips until knees, hips and shoulders are in line, then lower.", "Breathing: out on the way up, in on the way down."],
    },
  },
};
