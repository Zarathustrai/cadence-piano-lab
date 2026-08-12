const NATURAL_PCS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

export const THEORY_ROOTS = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export const SCALE_MODES = [
  { id: "major", name: "Major", pattern: [0, 2, 4, 5, 7, 9, 11], character: "Stable tonic, bright third, and a leading tone that pulls home.", application: "Classical foundation, tonal songwriting, and clear functional harmony." },
  { id: "natural-minor", name: "Natural minor", pattern: [0, 2, 3, 5, 7, 8, 10], character: "Minor third and flat seventh create a darker center with a softer return.", application: "Modal minor loops, folk color, ambient writing, and cinematic restraint." },
  { id: "harmonic-minor", name: "Harmonic minor", pattern: [0, 2, 3, 5, 7, 8, 11], character: "A raised seventh restores dominant pull while preserving the minor tonic.", application: "Classical minor cadences, dramatic scoring, and strong V to i motion." },
  { id: "dorian", name: "Dorian", pattern: [0, 2, 3, 5, 7, 9, 10], character: "Minor center with a raised sixth, darker than major but more open than natural minor.", application: "Improvisation, restrained film color, modal jazz, and evolving loops." },
  { id: "mixolydian", name: "Mixolydian", pattern: [0, 2, 4, 5, 7, 9, 10], character: "Major center with a flat seventh, grounded without a strong leading-tone demand.", application: "Rock, folk, groove writing, and dominant-colored vamps." },
];

export const CHORD_QUALITIES = [
  { id: "major", name: "Major triad", symbol: "", intervals: [0, 4, 7], steps: [0, 2, 4], mechanism: "A major third establishes brightness; the perfect fifth stabilizes the root.", function: "Tonic, predominant, or dominant depending on scale degree.", production: "Keep the third audible. Omitting it removes the chord's major identity." },
  { id: "minor", name: "Minor triad", symbol: "m", intervals: [0, 3, 7], steps: [0, 2, 4], mechanism: "Lowering only the third by one semitone changes the color while root and fifth remain.", function: "Minor tonic, predominant, or tonic substitute.", production: "Double the root before the third in dense low registers to keep the color clear." },
  { id: "diminished", name: "Diminished triad", symbol: "dim", intervals: [0, 3, 6], steps: [0, 2, 4], mechanism: "Two stacked minor thirds compress the fifth and create directional instability.", function: "Usually leading-tone or passing tension.", production: "Treat it as motion, not a place to rest, unless instability is the intended atmosphere." },
  { id: "augmented", name: "Augmented triad", symbol: "+", intervals: [0, 4, 8], steps: [0, 2, 4], mechanism: "Two major thirds divide the octave symmetrically, weakening one obvious root direction.", function: "Chromatic expansion or dominant color.", production: "Excellent for transitions because any chord tone can move by semitone into a new harmony." },
  { id: "sus2", name: "Suspended second", symbol: "sus2", intervals: [0, 2, 7], steps: [0, 1, 4], mechanism: "The third is replaced by a second, withholding major or minor identity.", function: "Open tonic color or a suspension awaiting resolution.", production: "Useful under a melody when a fixed major or minor third would compete." },
  { id: "sus4", name: "Suspended fourth", symbol: "sus4", intervals: [0, 5, 7], steps: [0, 3, 4], mechanism: "The fourth occupies the third's place and often leans downward into it.", function: "Prepared tension over tonic or dominant.", production: "Automate or perform the fourth resolving to the third for motion inside one chord." },
  { id: "dominant7", name: "Dominant seventh", symbol: "7", intervals: [0, 4, 7, 10], steps: [0, 2, 4, 6], mechanism: "Major third and minor seventh form a tritone whose voices tend to move inward by semitone.", function: "Focused dominant tension that points a fifth downward.", production: "The third and seventh carry the function; bass and fifth can be simplified or reassigned." },
  { id: "major7", name: "Major seventh", symbol: "maj7", intervals: [0, 4, 7, 11], steps: [0, 2, 4, 6], mechanism: "A major triad gains a note one semitone below its octave, combining stability with a soft internal rub.", function: "Colored tonic or predominant sonority.", production: "Place the seventh above the third when you want atmosphere without low-register mud." },
  { id: "minor7", name: "Minor seventh", symbol: "m7", intervals: [0, 3, 7, 10], steps: [0, 2, 4, 6], mechanism: "A minor triad plus minor seventh softens the edge and adds two shared-tone pathways.", function: "Minor tonic color, predominant, or modal loop harmony.", production: "Open voicings work well for pads because the seventh gives motion without demanding immediate resolution." },
  { id: "half-diminished7", name: "Half-diminished seventh", symbol: "ø7", intervals: [0, 3, 6, 10], steps: [0, 2, 4, 6], mechanism: "A diminished triad gains a minor seventh, retaining instability while creating smoother voice-leading options.", function: "Predominant in minor or leading-tone harmony in major.", production: "Move individual voices by semitone into the next chord instead of shifting the whole shape." },
  { id: "add9", name: "Add nine", symbol: "add9", intervals: [0, 4, 7, 14], steps: [0, 2, 4, 8], mechanism: "A major triad keeps its identity while a ninth adds open melodic color above it.", function: "Expanded tonic or non-urgent harmonic color.", production: "Keep the ninth above the triad. A close low second often masks the clarity you wanted." },
];

const DEGREE_NAMES = ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading tone"];
const DEGREE_TENDENCIES = [
  "Home and final reference.",
  "Moves easily to 1 or 3; often part of predominant harmony.",
  "Defines major or minor color and can settle into 2 or 1.",
  "Leans to 3 and supports departure from tonic.",
  "Strong structural support; asks for tonic when harmonized as V.",
  "Relative-minor color in major, or a warm upper neighbor to 5.",
  "Pulls by semitone to tonic when it is a true leading tone.",
];

function mod(value, base = 12) {
  return ((value % base) + base) % base;
}

export function pitchClassForName(name) {
  const natural = NATURAL_PCS[name[0]];
  const accidental = name.slice(1).split("").reduce((sum, symbol) => sum + (symbol === "♯" ? 1 : symbol === "♭" ? -1 : 0), 0);
  return mod(natural + accidental);
}

function accidentalForDifference(difference) {
  const normalized = difference > 6 ? difference - 12 : difference < -6 ? difference + 12 : difference;
  if (normalized === 0) return "";
  if (normalized === 1) return "♯";
  if (normalized === 2) return "♯♯";
  if (normalized === -1) return "♭";
  if (normalized === -2) return "♭♭";
  return normalized > 0 ? "♯".repeat(normalized) : "♭".repeat(-normalized);
}

export function spellPitch(rootName, pitchClass, letterOffset) {
  const rootLetterIndex = LETTERS.indexOf(rootName[0]);
  const letter = LETTERS[mod(rootLetterIndex + letterOffset, 7)];
  return `${letter}${accidentalForDifference(mod(pitchClass - NATURAL_PCS[letter]))}`;
}

export function buildScale(rootName, modeId = "major") {
  const mode = SCALE_MODES.find((item) => item.id === modeId) ?? SCALE_MODES[0];
  const rootPc = pitchClassForName(rootName);
  return mode.pattern.map((interval, index) => ({
    degree: index + 1,
    name: spellPitch(rootName, mod(rootPc + interval), index),
    pitchClass: mod(rootPc + interval),
    interval,
    degreeName: DEGREE_NAMES[index],
    tendency: index === 6 && mode.pattern[6] === 10 ? "Subtonic: a whole step below home, so the pull is gentler." : DEGREE_TENDENCIES[index],
  }));
}

function qualityFromIntervals(intervals) {
  const normalized = intervals.map((value) => mod(value)).sort((a, b) => a - b).join(",");
  return normalized === "0,4,7" ? "major" : normalized === "0,3,7" ? "minor" : normalized === "0,3,6" ? "diminished" : normalized === "0,4,8" ? "augmented" : "other";
}

function romanForDegree(index, quality) {
  const base = ["I", "II", "III", "IV", "V", "VI", "VII"][index];
  if (quality === "minor") return base.toLowerCase();
  if (quality === "diminished") return `${base.toLowerCase()}°`;
  if (quality === "augmented") return `${base}+`;
  return base;
}

function functionForDegree(index, modeId) {
  if (index === 0) return "Tonic";
  if (index === 4 || index === 6) return "Dominant family";
  if (index === 1 || index === 3) return "Predominant family";
  if (modeId.includes("minor") && index === 2) return "Relative-major color";
  return "Tonic color";
}

export function buildDiatonicHarmony(rootName, modeId = "major") {
  const scale = buildScale(rootName, modeId);
  return scale.map((root, index) => {
    const degreeIndexes = [index, index + 2, index + 4].map((value) => mod(value, 7));
    const pitchClasses = degreeIndexes.map((value) => scale[value].pitchClass);
    const intervals = pitchClasses.map((pitch) => mod(pitch - root.pitchClass));
    const quality = qualityFromIntervals(intervals);
    const notes = degreeIndexes.map((value) => scale[value].name);
    return {
      degree: index + 1,
      roman: romanForDegree(index, quality),
      name: `${root.name}${quality === "minor" ? "m" : quality === "diminished" ? "dim" : quality === "augmented" ? "+" : ""}`,
      rootName: root.name,
      rootPc: root.pitchClass,
      notes,
      pitchClasses,
      intervals,
      quality,
      function: functionForDegree(index, modeId),
      explanation: `${root.degreeName} harmony built by taking alternating notes of the ${rootName} ${SCALE_MODES.find((item) => item.id === modeId)?.name.toLowerCase()} scale: ${notes.join("–")}.`,
    };
  });
}

export function buildChord(rootName, qualityId = "major", inversion = 0) {
  const quality = CHORD_QUALITIES.find((item) => item.id === qualityId) ?? CHORD_QUALITIES[0];
  const rootPc = pitchClassForName(rootName);
  const notes = quality.intervals.map((interval, index) => spellPitch(rootName, mod(rootPc + interval), quality.steps[index]));
  let midi = quality.intervals.map((interval) => 60 + rootPc + interval);
  while (midi[0] > 64) midi = midi.map((note) => note - 12);
  for (let index = 0; index < Math.min(inversion, midi.length - 1); index += 1) midi.push(midi.shift() + 12);
  const inversionName = inversion === 0 ? "Root position" : inversion === 1 ? "First inversion" : inversion === 2 ? "Second inversion" : "Third inversion";
  const bassName = notes[Math.min(inversion, notes.length - 1)];
  return {
    ...quality,
    rootName,
    chordName: `${rootName}${quality.symbol}${inversion ? `/${bassName}` : ""}`,
    notes,
    midi,
    inversion,
    inversionName,
    bassName,
  };
}

export function diatonicChordToMidi(chord, inversion = 0) {
  let midi = chord.intervals.map((interval) => 60 + chord.rootPc + interval);
  while (midi[0] > 64) midi = midi.map((note) => note - 12);
  for (let index = 0; index < Math.min(inversion, midi.length - 1); index += 1) midi.push(midi.shift() + 12);
  return midi;
}
