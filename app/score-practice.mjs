function flattenMeasures(measures) {
  return measures.flatMap((measure, measureIndex) => measure.notes.map((midi, noteIndex) => ({
    midi,
    measure: measureIndex + 1,
    beats: measure.beats?.[noteIndex] ?? 1,
  })));
}

export const ODE_TO_JOY_SCORE = flattenMeasures([
  { notes: [64, 64, 65, 67] },
  { notes: [67, 65, 64, 62] },
  { notes: [60, 60, 62, 64] },
  { notes: [64, 62, 62], beats: [1, 1, 2] },
  { notes: [64, 64, 65, 67] },
  { notes: [67, 65, 64, 62] },
  { notes: [60, 60, 62, 64] },
  { notes: [62, 60, 60], beats: [1, 1, 2] },
  { notes: [62, 62, 64, 60] },
  { notes: [62, 64, 65, 64, 60], beats: [0.5, 0.5, 1, 1, 1] },
  { notes: [62, 64, 65, 64] },
  { notes: [62, 60, 62, 55] },
  { notes: [64, 64, 65, 67] },
  { notes: [67, 65, 64, 62] },
  { notes: [60, 60, 62, 64] },
  { notes: [62, 60], beats: [1, 3] },
  { notes: [60], beats: [4] },
]);

export function scoreTimeAtPosition(sequence, index) {
  let beats = 0;
  for (let position = 0; position < index; position += 1) beats += sequence[position]?.beats ?? 1;
  return beats / 4;
}

export function getScorePracticeStep(sequence, currentIndex, playedMidi) {
  const current = sequence[currentIndex];
  if (!current) return { accepted: false, complete: true, expectedMidi: null, nextIndex: currentIndex, completedMeasure: null };
  if (playedMidi !== current.midi) {
    return { accepted: false, complete: false, expectedMidi: current.midi, nextIndex: currentIndex, completedMeasure: null };
  }
  const nextIndex = currentIndex + 1;
  const next = sequence[nextIndex];
  return {
    accepted: true,
    complete: !next,
    expectedMidi: current.midi,
    nextIndex,
    completedMeasure: !next || next.measure !== current.measure ? current.measure : null,
  };
}
