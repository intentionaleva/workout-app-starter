// App-wide settings. If you change `name` or `shortName`, change them in
// manifest.webmanifest too (that file is what phones read when installing).

export default {
  name: "Unser Training",          // full app name (browser tab, install dialog)
  shortName: "Training",           // name under the home screen icon

  // "de" | "en" | "auto" (= the phone's language). People can still switch in Settings.
  language: "de",

  // Prefix for everything saved on the device. Give each app on the same domain its own prefix.
  storageKey: "ut",

  // Show the safety note (DISCLAIMER.md) once on first launch.
  showDisclaimer: true,

  // Link shown in Settings → About. Set to null to hide it.
  sourceUrl: "https://github.com/intentionaleva/workout-app-starter",

  // Fallbacks for routines that don't set their own values (seconds).
  defaults: {
    rest: 15,          // between exercises
    roundRest: 45,     // between rounds
    sideSwitch: 4,     // pause before the second side
    repSeconds: 3,     // pace of the rep counter for text-only exercises
  },

  // Weight log: unit and +/− step per equipment type.
  weightUnit: "kg",
  weightStep: { dumbbell: 1, dumbbells: 1, kettlebell: 2, default: 1 },

  // Labels for weekly goal groups shared by several routines (see `goal.group` in routines.js).
  // Groups not listed here use the routine's own name and colour.
  goals: {
    strength: {
      label: { de: "Kraft (A + B)", en: "Strength (A + B)" },   // above the progress bar
      short: { de: "Kraft", en: "Strength" },                   // in "last week" summary
    },
  },

  // Colour themes ("tones") for routines. Add your own: pick a light tint for the
  // tile background, a darker fg/deep for text and a strong solid for buttons.
  tones: {
    orange: { tint: "#FDECE3", fg: "#8A3410", deep: "#5E230A", solid: "#C4501F", dark: { tint: "#36231A", fg: "#F2A77F", deep: "#FBD3BE" } },
    blue:   { tint: "#E6EEF9", fg: "#1D4A86", deep: "#12345F", solid: "#2F64B3", dark: { tint: "#18263A", fg: "#9DBEF0", deep: "#CFE0FA" } },
    green:  { tint: "#E3F2EC", fg: "#14634B", deep: "#0C4434", solid: "#1A7A61", dark: { tint: "#14302A", fg: "#86D3B7", deep: "#C3EEDD" } },
    purple: { tint: "#F1EAFB", fg: "#5A3A9A", deep: "#3B2470", solid: "#6B47B8", dark: { tint: "#28203A", fg: "#C4AEF0", deep: "#E2D6FA" } },
    cyan:   { tint: "#DFF2F3", fg: "#0E5F66", deep: "#083E43", solid: "#157A82", dark: { tint: "#123030", fg: "#84D4D9", deep: "#C6EEF0" } },
  },
};
