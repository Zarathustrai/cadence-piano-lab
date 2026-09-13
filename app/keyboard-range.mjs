export const CT_S1_RANGE = { min: 36, max: 96 };

export function fitMidiToRange(midi, range = CT_S1_RANGE) {
  let fitted = midi;
  while (fitted < range.min) fitted += 12;
  while (fitted > range.max) fitted -= 12;
  return fitted;
}

export function adaptNotesToRange(notes, enabled, range = CT_S1_RANGE) {
  const fitted = enabled ? notes.map((note) => fitMidiToRange(note, range)) : notes;
  return [...new Set(fitted)].sort((a, b) => a - b);
}

export function noteRangeAdaptations(notes, enabled, range = CT_S1_RANGE) {
  if (!enabled) return [];
  return notes
    .map((written) => ({ written, played: fitMidiToRange(written, range) }))
    .filter(({ written, played }) => written !== played);
}
