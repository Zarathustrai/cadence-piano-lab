/**
 * Decide how one MIDI note advances a lesson sequence. Keeping this tiny state
 * transition pure makes rapid hardware input deterministic and testable.
 *
 * @param {number[]} sequence
 * @param {number} index
 * @param {number} midi
 * @returns {{ accepted: boolean; complete: boolean; expectedNote: number; nextIndex: number }}
 */
export function getProgressionStep(sequence, index, midi) {
  const safeIndex = Math.max(0, Math.min(index, sequence.length - 1));
  const expectedNote = sequence[safeIndex] ?? sequence[0];
  const accepted = midi === expectedNote;
  const nextIndex = accepted ? safeIndex + 1 : safeIndex;

  return {
    accepted,
    complete: accepted && nextIndex >= sequence.length,
    expectedNote,
    nextIndex,
  };
}
