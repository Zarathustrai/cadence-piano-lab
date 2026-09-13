import assert from "node:assert/strict";
import test from "node:test";
import { autoPedalGroup, toneReleaseSeconds } from "../app/pedal-assist.mjs";

test("pedal modes preserve explicit playback and sustain score-following voices", () => {
  assert.equal(toneReleaseSeconds("continuous"), 2.6);
  assert.equal(toneReleaseSeconds("off"), 0.42);
  assert.equal(toneReleaseSeconds("auto", undefined, false), 2.6);
  assert.equal(toneReleaseSeconds("auto", undefined, true), 12);
  assert.equal(toneReleaseSeconds("auto", 0.1, true), 0.1);
});

test("auto pedal changes with harmony, or once per measure for a single line", () => {
  assert.equal(autoPedalGroup([52, 55, 59], 1), "harmony:52,55,59");
  assert.equal(autoPedalGroup([59, 52, 55], 1), "harmony:52,55,59");
  assert.equal(autoPedalGroup([59], 3), "measure:3");
  assert.equal(autoPedalGroup([], 3), null);
});
