const PITCH_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export function getPitchSet(notes) {
  return [...new Set(notes.map((note) => note % 12))].sort((a, b) => a - b);
}

export function samePitchSet(a, b) {
  const left = getPitchSet(a);
  const right = getPitchSet(b);
  return left.length === right.length && left.every((note, index) => note === right[index]);
}

export function detectChord(notes) {
  const pcs = getPitchSet(notes);
  if (pcs.length < 3) return null;
  const patterns = [
    { intervals: [0, 4, 7, 10], suffix: "7" },
    { intervals: [0, 4, 7, 11], suffix: "maj7" },
    { intervals: [0, 3, 7, 10], suffix: "m7" },
    { intervals: [0, 4, 7], suffix: " major" },
    { intervals: [0, 3, 7], suffix: " minor" },
    { intervals: [0, 3, 6], suffix: " diminished" },
  ];

  for (const root of pcs) {
    const normalized = pcs.map((pitch) => (pitch - root + 12) % 12).sort((a, b) => a - b);
    for (const pattern of patterns) {
      if (normalized.length === pattern.intervals.length && pattern.intervals.every((item, index) => item === normalized[index])) {
        return `${PITCH_NAMES[root]}${pattern.suffix}`;
      }
    }
  }

  return `${pcs.map((note) => PITCH_NAMES[note]).join(" · ")} sonority`;
}
