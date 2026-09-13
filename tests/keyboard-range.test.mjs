import test from "node:test";
import assert from "node:assert/strict";
import { adaptNotesToRange, fitMidiToRange, noteRangeAdaptations } from "../app/keyboard-range.mjs";

test("61-key fit folds unavailable bass notes into the CT-S1 range", () => {
  assert.equal(fitMidiToRange(28), 40);
  assert.equal(fitMidiToRange(35), 47);
  assert.equal(fitMidiToRange(36), 36);
  assert.equal(fitMidiToRange(96), 96);
});

test("adaptation keeps playable notes and removes octave-fold duplicates", () => {
  assert.deepEqual(adaptNotesToRange([35, 47, 52], true), [47, 52]);
  assert.deepEqual(adaptNotesToRange([35, 47, 52], false), [35, 47, 52]);
  assert.deepEqual(noteRangeAdaptations([35, 52], true), [{ written: 35, played: 47 }]);
});
