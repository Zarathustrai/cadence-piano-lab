import assert from "node:assert/strict";
import test from "node:test";
import { toneReleaseSeconds } from "../app/pedal-assist.mjs";

test("pedal feel lengthens only sounds without an explicit musical duration", () => {
  assert.equal(toneReleaseSeconds(true), 2.6);
  assert.equal(toneReleaseSeconds(false), 0.42);
  assert.equal(toneReleaseSeconds(true, 0.1), 0.1);
});
