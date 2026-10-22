// UI strings. To add a language, copy the `en` block, translate it and add the
// language code to `language` in config/app.config.js. Exercise and routine texts
// use { de: "…", en: "…" } objects in the config files; a plain string works for every language.

export const STRINGS = {
  de: {
    langName: "Deutsch",
    // home
    homeTitle: "Was steht heute an?",
    settings: "Einstellungen",
    thisWeek: "Diese Woche",
    weekNo: "KW {n}",
    lastWeek: "Letzte Woche: {list}",
    nothingYet: "noch nichts eingetragen",
    perDevice: "Fortschritt wird auf jedem Handy separat gespeichert.",
    exercises: "{n} Übungen",
    today: "Heute",
    doneToday: "Heute erledigt",
    lastDone: "Zuletzt {date}",
    daily: "Täglich",
    times: "{n}×",
    rounds: "{n} Runden",
    // check-off tile and screen
    checkoffMeta: "{min} Min · diese Woche {n} / {goal}",
    perSession: "{min} Min pro Einheit",
    goalPerWeek: "Ziel: {n} pro Woche",
    minutesOf: "{m} von {total} Min",
    goalReached: "Wochenziel erreicht.",
    whatDidYouDo: "Was habt ihr gemacht?",
    logMinutes: "{min} Minuten abhaken",
    noSessions: "Noch keine Einheit diese Woche.",
    deleteEntry: "Eintrag löschen",
    checkoffNote: "Letzte Woche: {n} {sessions} ({m} Min). Zählt alles, wobei ihr etwas außer Atem kommt, aber noch sprechen könnt.",
    session: "Einheit",
    sessions: "Einheiten",
    // overview
    back: "Zurück zur Startseite",
    tapToPreview: "Tippe auf eine Übung, um sie dir vorab anzusehen.",
    markDone: "Ohne App gemacht? Heute abhaken",
    startRoutine: "Routine starten",
    startWorkout: "Training starten",
    emptyTitle: "Hier kommen eure Übungen hin",
    emptyText: "Diese Einheit hat noch keine Übungen. Trage sie in config/routines.js ein.",
    // dose
    doseMin: "{n} Min",
    doseSec: "{n} s",
    doseReps: "× {n}",
    perSide: " pro Seite",
    perDirection: " pro Richtung",
    // player
    close: "Beenden",
    preview: "Vorschau · {name}",
    roundOf: " · Runde {r} von {n}",
    done: "Geschafft",
    routineDone: "{name} erledigt",
    doneText: "{n} Übungen. Stark gemacht.",
    toHome: "Zur Startseite",
    roundRest: "Rundenpause",
    rest: "Pause",
    addRest: "+15 s",
    next: "Weiter",
    upNext: "Als Nächstes",
    upNextRound: "Als Nächstes · Runde {r}",
    upNextLine: "Als Nächstes: ",
    prevEx: "Vorherige Übung",
    pause: "Pause",
    resume: "Weiter",
    nextEx: "Nächste Übung",
    weight: "Gewicht",
    weightHint: "Alle Wiederholungen sauber und noch 1–2 in Reserve? Dann nächstes Mal schwerer.",
    weightLess: "Gewicht verringern",
    weightMore: "Gewicht erhöhen",
    weightInput: "Gewicht in {unit}",
    howTo: "So geht’s richtig",
    paused: "Pausiert",
    switchSide: "Seite wechseln",
    switchDirection: "Richtung wechseln",
    side: "Seite",
    direction: "Richtung",
    secondIn: "{word} 2 in",
    otherSideSoon: "Gleich geht’s mit der anderen Seite weiter",
    otherDirectionSoon: "Gleich andersherum weiter",
    sideOf: " · {word} {n} von 2",
    rep: "Wiederholung {n}",
    noAnimation: "Noch keine Animation",
    keyPoses: "Bewegungsablauf",
    // breathing
    breath_out: "Ausatmen",
    breath_in: "Einatmen",
    breath_hold: "Spannung halten",
    breath_calm: "Ruhig atmen",
    // equipment
    eq_dumbbell: "Kurzhantel",
    eq_dumbbells: "Kurzhanteln",
    eq_kettlebell: "Kettlebell",
    // settings
    language: "Sprache",
    theme: "Darstellung",
    themeAuto: "Automatisch",
    themeLight: "Hell",
    themeDark: "Dunkel",
    data: "Deine Daten",
    dataText: "Alles bleibt auf diesem Gerät. Wenn du die Browserdaten löschst, ist auch der Verlauf weg. Sichere ihn ab und zu als Datei.",
    exportData: "Daten exportieren",
    importData: "Daten importieren",
    imported: "Daten importiert.",
    importFailed: "Die Datei konnte nicht gelesen werden.",
    resetData: "Alle Daten löschen",
    resetConfirm: "Wirklich alles löschen? Verlauf und Gewichte sind danach weg.",
    resetYes: "Ja, löschen",
    cancel: "Abbrechen",
    resetDone: "Alle Daten gelöscht.",
    about: "Über die App",
    safetyNote: "Sicherheitshinweis",
    poseEditor: "Posen-Editor öffnen",
    sourceCode: "Quellcode",
    version: "Version {v}",
    // disclaimer
    disclaimerTitle: "Bevor es losgeht",
    disclaimer: [
      "Diese App ist keine medizinische Beratung. Die Übungen und Pläne sind ein persönliches Beispiel, kein Trainingsplan für dich.",
      "Nach einer Geburt: Lass dich vor Bauch- und Sprungübungen von deiner Ärztin oder einer Beckenboden-Physiotherapeutin freigeben (Rektusdiastase, Beckenboden).",
      "Nutzung auf eigene Verantwortung. Hör auf, wenn etwas weh tut.",
    ],
    understood: "Verstanden",
    // update banner + errors
    updateReady: "Update verfügbar · Tippen zum Neuladen",
    configError: "Fehler in der Konfiguration",
    configErrorHint: "Korrigiere die Datei und lade die Seite neu. Mehr Details findest du in der Browser-Konsole.",
  },

  en: {
    langName: "English",
    homeTitle: "What's on today?",
    settings: "Settings",
    thisWeek: "This week",
    weekNo: "Week {n}",
    lastWeek: "Last week: {list}",
    nothingYet: "nothing logged yet",
    perDevice: "Progress is saved separately on each phone.",
    exercises: "{n} exercises",
    today: "Today",
    doneToday: "Done today",
    lastDone: "Last: {date}",
    daily: "Daily",
    times: "{n}×",
    rounds: "{n} rounds",
    checkoffMeta: "{min} min · this week {n} / {goal}",
    perSession: "{min} min per session",
    goalPerWeek: "Goal: {n} per week",
    minutesOf: "{m} of {total} min",
    goalReached: "Weekly goal reached.",
    whatDidYouDo: "What did you do?",
    logMinutes: "Log {min} minutes",
    noSessions: "No sessions yet this week.",
    deleteEntry: "Delete entry",
    checkoffNote: "Last week: {n} {sessions} ({m} min). Anything counts that gets you a bit out of breath while you can still talk.",
    session: "session",
    sessions: "sessions",
    back: "Back to home",
    tapToPreview: "Tap an exercise to preview it.",
    markDone: "Did it without the app? Mark today as done",
    startRoutine: "Start routine",
    startWorkout: "Start workout",
    emptyTitle: "Your exercises go here",
    emptyText: "This routine has no exercises yet. Add them in config/routines.js.",
    doseMin: "{n} min",
    doseSec: "{n} s",
    doseReps: "× {n}",
    perSide: " per side",
    perDirection: " each direction",
    close: "Close",
    preview: "Preview · {name}",
    roundOf: " · Round {r} of {n}",
    done: "Done",
    routineDone: "{name} complete",
    doneText: "{n} exercises. Well done.",
    toHome: "Back to home",
    roundRest: "Round break",
    rest: "Rest",
    addRest: "+15 s",
    next: "Next",
    upNext: "Up next",
    upNextRound: "Up next · Round {r}",
    upNextLine: "Up next: ",
    prevEx: "Previous exercise",
    pause: "Pause",
    resume: "Resume",
    nextEx: "Next exercise",
    weight: "Weight",
    weightHint: "All reps clean with 1–2 left in the tank? Go heavier next time.",
    weightLess: "Decrease weight",
    weightMore: "Increase weight",
    weightInput: "Weight in {unit}",
    howTo: "How to do it",
    paused: "Paused",
    switchSide: "Switch sides",
    switchDirection: "Switch direction",
    side: "Side",
    direction: "Direction",
    secondIn: "{word} 2 in",
    otherSideSoon: "Other side coming up",
    otherDirectionSoon: "Other direction coming up",
    sideOf: " · {word} {n} of 2",
    rep: "Rep {n}",
    noAnimation: "No animation yet",
    keyPoses: "Movement sequence",
    breath_out: "Breathe out",
    breath_in: "Breathe in",
    breath_hold: "Hold tension",
    breath_calm: "Breathe calmly",
    eq_dumbbell: "Dumbbell",
    eq_dumbbells: "Dumbbells",
    eq_kettlebell: "Kettlebell",
    language: "Language",
    theme: "Appearance",
    themeAuto: "Automatic",
    themeLight: "Light",
    themeDark: "Dark",
    data: "Your data",
    dataText: "Everything stays on this device. If you clear your browser data, your history is gone too. Back it up as a file now and then.",
    exportData: "Export data",
    importData: "Import data",
    imported: "Data imported.",
    importFailed: "That file couldn't be read.",
    resetData: "Delete all data",
    resetConfirm: "Really delete everything? Your history and weights will be gone.",
    resetYes: "Yes, delete",
    cancel: "Cancel",
    resetDone: "All data deleted.",
    about: "About",
    safetyNote: "Safety note",
    poseEditor: "Open the pose editor",
    sourceCode: "Source code",
    version: "Version {v}",
    disclaimerTitle: "Before you start",
    disclaimer: [
      "This app is not medical advice. The exercises and plans are a personal example, not a training plan for you.",
      "After giving birth: get cleared by your doctor or a pelvic-floor physiotherapist before core and impact work (diastasis recti, pelvic floor).",
      "Use at your own risk. Stop if anything hurts.",
    ],
    understood: "Got it",
    updateReady: "Update available · Tap to reload",
    configError: "There's a problem in your config",
    configErrorHint: "Fix the file and reload the page. The browser console has more details.",
  },
};

const WEEKDAYS = {
  de: { short: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] },
  en: { short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
};
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let lang = "de";

/** Pick the language: saved choice, then config, then the browser, then English. */
export function initLang(configured, saved) {
  const avail = Object.keys(STRINGS);
  const browser = (typeof navigator !== "undefined" && (navigator.languages || [navigator.language]) || [])
    .map(l => String(l || "").slice(0, 2).toLowerCase()).find(l => avail.includes(l));
  if (saved && avail.includes(saved)) lang = saved;
  else if (configured && configured !== "auto" && avail.includes(configured)) lang = configured;
  else lang = browser || "en";
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  return lang;
}
export function getLang() { return lang; }
export function languages() { return Object.keys(STRINGS).map(code => ({ code, name: STRINGS[code].langName })); }

/** UI string by key, with {placeholders}. */
export function t(key, vars) {
  let s = STRINGS[lang][key];
  if (s == null) s = STRINGS.en[key];
  if (s == null) return key;
  if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  return s;
}

/** Text from config data: a string, or { de, en, … }. */
export function tx(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && !Array.isArray(v)) {
    if (v[lang] != null) return v[lang];
    if (v.en != null) return v.en;
    if (v.de != null) return v.de;
    const first = Object.values(v)[0];
    return first == null ? "" : first;
  }
  return String(v);
}

/** A list from config data: ["…"], [{ de, en }], or { de: [...], en: [...] }. */
export function txList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(tx);
  const l = v[lang] || v.en || v.de || Object.values(v)[0] || [];
  return l.map(tx);
}

export function weekdayShort(d) { return (WEEKDAYS[lang] || WEEKDAYS.en).short[d.getDay()]; }
export function weekdaysMonFirst() { const s = (WEEKDAYS[lang] || WEEKDAYS.en).short; return s.slice(1).concat(s[0]); }

/** "Mo, 3.2." / "Mon, Feb 3" */
export function dayLabel(d) {
  if (lang === "de") return weekdayShort(d) + ", " + d.getDate() + "." + (d.getMonth() + 1) + ".";
  return weekdayShort(d) + ", " + MONTHS_EN[d.getMonth()] + " " + d.getDate();
}
/** "3.2." / "Feb 3" */
export function shortDate(d) {
  if (lang === "de") return d.getDate() + "." + (d.getMonth() + 1) + ".";
  return MONTHS_EN[d.getMonth()] + " " + d.getDate();
}
