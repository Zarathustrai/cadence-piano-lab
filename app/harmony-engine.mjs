const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

const MAJOR_PATTERN = [
  { roman: "I", offset: 0, quality: "major", function: "Tonic", tension: 12 },
  { roman: "ii", offset: 2, quality: "minor", function: "Predominant", tension: 45 },
  { roman: "iii", offset: 4, quality: "minor", function: "Tonic color", tension: 30 },
  { roman: "IV", offset: 5, quality: "major", function: "Predominant", tension: 48 },
  { roman: "V", offset: 7, quality: "major", function: "Dominant", tension: 82 },
  { roman: "vi", offset: 9, quality: "minor", function: "Tonic substitute", tension: 28 },
  { roman: "vii°", offset: 11, quality: "diminished", function: "Dominant", tension: 92 },
];

const MINOR_PATTERN = [
  { roman: "i", offset: 0, quality: "minor", function: "Tonic", tension: 15 },
  { roman: "ii°", offset: 2, quality: "diminished", function: "Predominant", tension: 58 },
  { roman: "III", offset: 3, quality: "major", function: "Tonic color", tension: 30 },
  { roman: "iv", offset: 5, quality: "minor", function: "Predominant", tension: 50 },
  { roman: "V", offset: 7, quality: "major", function: "Dominant", tension: 88 },
  { roman: "VI", offset: 8, quality: "major", function: "Tonic substitute", tension: 32 },
  { roman: "VII", offset: 10, quality: "major", function: "Modal dominant", tension: 62 },
];

export const HARMONY_KEYS = [
  { id: "C-major", name: "C major", tonic: 0, mode: "major" },
  { id: "G-major", name: "G major", tonic: 7, mode: "major" },
  { id: "F-major", name: "F major", tonic: 5, mode: "major" },
  { id: "A-minor", name: "A minor", tonic: 9, mode: "minor" },
  { id: "E-minor", name: "E minor", tonic: 4, mode: "minor" },
  { id: "D-minor", name: "D minor", tonic: 2, mode: "minor" },
];

function triadIntervals(quality) {
  return quality === "major" ? [0, 4, 7] : quality === "minor" ? [0, 3, 7] : [0, 3, 6];
}

export function chordsForKey(keyId) {
  const key = HARMONY_KEYS.find((item) => item.id === keyId) ?? HARMONY_KEYS[0];
  const pattern = key.mode === "major" ? MAJOR_PATTERN : MINOR_PATTERN;
  return pattern.map((degree) => {
    const rootPc = (key.tonic + degree.offset) % 12;
    const suffix = degree.quality === "major" ? "" : degree.quality === "minor" ? "m" : "dim";
    return { ...degree, id: `${key.id}-${degree.roman}`, name: `${NOTE_NAMES[rootPc]}${suffix}`, rootPc, keyId: key.id };
  });
}

export function voiceChord(chord, inversion = 0) {
  let root = 60 + chord.rootPc;
  while (root > 64) root -= 12;
  while (root < 52) root += 12;
  const notes = triadIntervals(chord.quality).map((interval) => root + interval);
  for (let index = 0; index < inversion; index += 1) notes.push(notes.shift() + 12);
  while (notes[0] < 52) notes.forEach((_, index) => { notes[index] += 12; });
  while (Math.max(...notes) > 72) notes.forEach((_, index) => { notes[index] -= 12; });
  const slash = inversion ? `/${NOTE_NAMES[notes[0] % 12]}` : "";
  return { notes, label: `${chord.name}${slash}`, inversion, bassName: NOTE_NAMES[notes[0] % 12] };
}

export function voiceLeadingDistance(left, right) {
  if (!left || !right) return 0;
  return left.notes.reduce((sum, note, index) => sum + Math.abs(note - right.notes[index]), 0);
}

export function analyzeHarmonyProgression(slots) {
  const active = slots.filter(Boolean);
  if (!active.length) return { motion: 0, smoothness: 0, peakTension: 0, arc: "Empty progression", cadence: "No cadence yet", observation: "Add a tonic chord to establish a center.", nextMove: "Begin with I or i, then choose a chord with a different function." };
  const distances = active.slice(1).map((slot, index) => voiceLeadingDistance(active[index].voicing, slot.voicing));
  const motion = distances.reduce((sum, value) => sum + value, 0);
  const smoothness = distances.length ? Math.max(0, Math.min(100, Math.round(100 - (motion / distances.length) * 8))) : 100;
  const peak = active.reduce((best, slot, index) => slot.chord.tension > best.tension ? { tension: slot.chord.tension, index } : best, { tension: -1, index: 0 });
  const first = active[0].chord.function;
  const last = active.at(-1).chord.function;
  const hasDominantBeforeTonic = active.length > 1 && active.at(-2).chord.function.includes("Dominant") && last === "Tonic";
  const cadence = hasDominantBeforeTonic ? "Authentic arrival" : last === "Dominant" || last === "Modal dominant" ? "Open ending" : last.includes("Tonic") ? "Tonic ending without dominant preparation" : "Continuing motion";
  const arc = `${first} → ${active.map((slot) => slot.chord.function).filter((value, index, array) => index === 0 || value !== array[index - 1]).slice(1).join(" → ") || "same function"}`;
  let observation;
  let nextMove;
  if (active.length < 3) {
    observation = "Two chords establish a color relationship, but not yet a complete harmonic sentence.";
    nextMove = "Add a third function: predominant before dominant, or dominant before tonic.";
  } else if (smoothness < 55) {
    observation = "The functions are legible, but the voices leap enough that the progression sounds like separate blocks.";
    nextMove = "Change one inversion. Keep two notes near their previous register and move only what the new chord requires.";
  } else if (!active.some((slot) => slot.chord.function.includes("Dominant"))) {
    observation = "The progression moves smoothly but avoids focused dominant tension, so it behaves more like a loop than a cadence.";
    nextMove = "Decide whether that suspended loop is intentional. To create arrival, place V before I or i.";
  } else if (!hasDominantBeforeTonic) {
    observation = `The strongest tension occurs at chord ${peak.index + 1}, but the ending redirects or postpones its expected release.`;
    nextMove = "Try the tonic after the dominant, then compare direct closure with your current ending.";
  } else {
    observation = "Function and voice-leading agree: preparation increases tension, nearby voices connect the chords, and dominant resolves into tonic.";
    nextMove = "Preserve the voice-leading and replace one middle chord with a tonic substitute to change color without losing the arc.";
  }
  return { motion, smoothness, peakTension: peak.tension, peakIndex: peak.index, arc, cadence, observation, nextMove };
}

export const HARMONY_PRESETS = [
  { id: "classical", title: "Classical cadence", direction: "Classical foundations", keyId: "C-major", degrees: ["I", "IV", "V", "I"], inversions: [0, 1, 1, 0], intent: "Departure, focused tension, and unmistakable return." },
  { id: "cinematic", title: "Cinematic minor arc", direction: "Film & game music", keyId: "E-minor", degrees: ["i", "VI", "III", "VII"], inversions: [0, 1, 1, 0], intent: "A broad minor loop that changes emotional scale without closing fully." },
  { id: "ambient", title: "Suspended ambient loop", direction: "Ambient", keyId: "D-minor", degrees: ["i", "VI", "III", "VII"], inversions: [1, 1, 0, 1], intent: "Shared tones and an open ending keep color moving without a hard cadence." },
  { id: "songwriting", title: "Verse to lift", direction: "Songwriting", keyId: "G-major", degrees: ["I", "vi", "IV", "V"], inversions: [0, 1, 1, 0], intent: "Stable opening, relative-minor contrast, then a dominant that asks for the next line." },
  { id: "production", title: "Production-friendly loop", direction: "Music production", keyId: "C-major", degrees: ["vi", "IV", "I", "V"], inversions: [0, 1, 1, 1], intent: "A familiar functional loop voiced compactly enough to split into production layers." },
];

export function buildPreset(preset) {
  const chords = chordsForKey(preset.keyId);
  return preset.degrees.map((roman, index) => {
    const chord = chords.find((item) => item.roman === roman);
    return { chord, inversion: preset.inversions[index], voicing: voiceChord(chord, preset.inversions[index]) };
  });
}
