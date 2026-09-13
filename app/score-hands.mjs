/** Select by written staff, never by pitch: a right-hand melody can cross middle C. */
export function notesForHand(notes, staves, hand = "both") {
  const staff = hand === "right" ? staves[0] : hand === "left" ? staves[1] : null;
  return [...new Set(notes
    .filter((note) => !note.isRest() && note.Pitch?.Frequency && (hand === "both" || note.ParentStaff === staff))
    .map((note) => Math.round(69 + 12 * Math.log2(note.Pitch.Frequency / 440))))].sort((a, b) => a - b);
}

/** Skip rests and the other hand's onsets before asking the player for input. */
export function seekHandTarget(cursor, readNotes, endMeasure = Infinity) {
  while (!cursor.Iterator.EndReached && cursor.Iterator.CurrentMeasureIndex + 1 <= endMeasure) {
    const notes = readNotes();
    if (notes.length) return notes;
    cursor.next();
  }
  return [];
}
