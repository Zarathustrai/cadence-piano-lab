import assert from "node:assert/strict";
import test from "node:test";
import { notesForHand, seekHandTarget } from "../app/score-hands.mjs";

const upper = {}, lower = {};
const note = (midi, staff) => ({ ParentStaff: staff, Pitch: { Frequency: 440 * 2 ** ((midi - 69) / 12) }, isRest: () => false });

test("hand selection follows written staff even when the hands cross middle C", () => {
  const notes = [note(48, upper), note(76, lower), note(48, upper), { isRest: () => true }];
  assert.deepEqual(notesForHand(notes, [upper, lower], "right"), [48]);
  assert.deepEqual(notesForHand(notes, [upper, lower], "left"), [76]);
  assert.deepEqual(notesForHand(notes, [upper, lower], "both"), [48, 76]);
  assert.deepEqual(notesForHand(notes, [upper], "left"), []);
});

function fixture(positions) {
  let index = 0;
  const cursor = { Iterator: {
    get EndReached() { return index >= positions.length; },
    get CurrentMeasureIndex() { return (positions[index]?.measure ?? positions.at(-1).measure) - 1; },
  }, next() { index++; } };
  return { cursor, read: () => positions[index]?.notes ?? [], index: () => index };
}

test("rest and other-hand passages longer than twelve positions are skipped without input", () => {
  const f = fixture([...Array.from({ length: 24 }, () => ({ measure: 1, notes: [] })), { measure: 2, notes: [71] }]);
  assert.deepEqual(seekHandTarget(f.cursor, f.read), [71]);
  assert.equal(f.index(), 24);
});

test("seeking respects section boundaries and gracefully reaches the end", () => {
  const f = fixture([{ measure: 1, notes: [] }, { measure: 2, notes: [60] }]);
  assert.deepEqual(seekHandTarget(f.cursor, f.read, 1), []);
  assert.equal(f.index(), 1);
  assert.deepEqual(seekHandTarget(f.cursor, f.read), [60]);
  f.cursor.next();
  assert.deepEqual(seekHandTarget(f.cursor, f.read), []);
  const silence = fixture([{ measure: 1, notes: [] }]);
  assert.deepEqual(seekHandTarget(silence.cursor, silence.read), []);
  assert.equal(silence.cursor.Iterator.EndReached, true);
});
