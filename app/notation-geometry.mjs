// The staff uses one 170-unit coordinate space, regardless of its rendered width.
// C4 is the reference point; every adjacent letter moves by one staff step.
export const STAFF_UNIT_HEIGHT = 170;
export const STAFF_STEP = 7.5;
export const STAFF_LINE_Y = Object.freeze({ F5: 56, D5: 71, B4: 86, G4: 101, E4: 116 });

const DIATONIC_LETTER_FOR_PITCH_CLASS = [0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];
const DIATONIC_LETTER = Object.freeze({ C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 });
const C4_DIATONIC_POSITION = 4 * 7;
const BOTTOM_STAFF_LINE_POSITION = C4_DIATONIC_POSITION + 2; // E4
const TOP_STAFF_LINE_POSITION = C4_DIATONIC_POSITION + 10; // F5

export function diatonicPositionForMidi(midi) {
  return (Math.floor(midi / 12) - 1) * 7 + DIATONIC_LETTER_FOR_PITCH_CLASS[((midi % 12) + 12) % 12];
}

export function diatonicPositionForSpelling(spelling) {
  const match = /^([A-G])(?:[#♯♭b])?(-?\d+)$/.exec(spelling);
  if (!match) throw new Error(`Invalid written note spelling: ${spelling}`);
  return Number(match[2]) * 7 + DIATONIC_LETTER[match[1]];
}

function staffYForDiatonicPosition(position) {
  return STAFF_LINE_Y.E4 - (position - BOTTOM_STAFF_LINE_POSITION) * STAFF_STEP;
}

export function staffYForMidi(midi) {
  return staffYForDiatonicPosition(diatonicPositionForMidi(midi));
}

export function staffYForSpelling(spelling) {
  return staffYForDiatonicPosition(diatonicPositionForSpelling(spelling));
}

function ledgerLinesForDiatonicPosition(position) {
  const lines = [];

  if (position < BOTTOM_STAFF_LINE_POSITION) {
    for (let ledgerPosition = BOTTOM_STAFF_LINE_POSITION - 2; ledgerPosition >= position; ledgerPosition -= 2) {
      lines.push(STAFF_LINE_Y.E4 - (ledgerPosition - BOTTOM_STAFF_LINE_POSITION) * STAFF_STEP);
    }
  }

  if (position > TOP_STAFF_LINE_POSITION) {
    for (let ledgerPosition = TOP_STAFF_LINE_POSITION + 2; ledgerPosition <= position; ledgerPosition += 2) {
      lines.push(STAFF_LINE_Y.E4 - (ledgerPosition - BOTTOM_STAFF_LINE_POSITION) * STAFF_STEP);
    }
  }

  return lines;
}

export function ledgerLinesForMidi(midi) {
  return ledgerLinesForDiatonicPosition(diatonicPositionForMidi(midi));
}

export function ledgerLinesForSpelling(spelling) {
  return ledgerLinesForDiatonicPosition(diatonicPositionForSpelling(spelling));
}
