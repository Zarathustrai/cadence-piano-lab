import assert from "node:assert/strict";
import { TWIN_PEAKS_STUDIES } from "../app/twin-peaks-studies.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(20000);
try {
  await page.addInitScript(() => {
    const input = { id: "test-midi", name: "Test piano", state: "connected", onmidimessage: null };
    window.testMidi = input;
    Object.defineProperty(navigator, "requestMIDIAccess", { value: async () => ({ inputs: new Map([[input.id, input]]), onstatechange: null }) });
  });
  await page.goto(process.env.TEST_URL || "http://localhost:3000");
  await page.waitForFunction(() => localStorage.getItem("cadence.education.v2"));
  await page.getByRole("button", { name: "Connect keyboard", exact: true }).click();
  await page.waitForFunction(() => typeof window.testMidi.onmidimessage === "function");
  const names = ["Twin Peaks: Laura Palmer's Theme", "Twin Peaks: Main Theme / Falling"];
  for (const [index, study] of TWIN_PEAKS_STUDIES.entries()) {
    await page.getByRole("button", { name: "Curriculum", exact: true }).click();
    await page.getByText(names[index], { exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".score-follow") && !document.querySelector(".score-follow").disabled);
    assert.match(await page.locator(".score-reader-heading").innerText(), /Original preparation study/i);
    assert.equal(await page.locator('.course-resources a[href^="https://"]').count(), 2);
    await page.getByRole("button", { name: "Play whole study", exact: true }).click();
    for (const [barIndex, bar] of study.bars.entries()) {
      await page.waitForFunction((measure) => document.querySelector(".score-context > div:nth-child(2) strong")?.textContent === `${measure} / 8`, barIndex + 1);
      const actual = await page.locator(".expected-score-notes strong").innerText();
      const pcs = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      const pitches = [...actual.matchAll(/([A-G])([♯♭]?)(-?\d+)/g)].map(([, letter, accidental, octave]) => (Number(octave) + 1) * 12 + pcs[letter] + (accidental === "♯" ? 1 : accidental === "♭" ? -1 : 0));
      assert.deepEqual(pitches, [...new Set([...bar.left, ...bar.right])].sort((a, b) => a - b));
      assert.match(await page.locator(".score-hand-cues").innerText(), /RIGHT[\s\S]*LEFT/);
      for (const midi of pitches) await page.evaluate(async (midi) => {
        window.testMidi.onmidimessage({ data: new Uint8Array([0x90, midi, 80]) });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.testMidi.onmidimessage({ data: new Uint8Array([0x80, midi, 0]) });
      }, midi);
    }
    await page.waitForFunction(() => document.querySelector(".expected-score-notes strong")?.textContent === "Finished");
    assert.match(await page.locator(".score-session-metrics").innerText(), /8 positions/);
  }
  assert.deepEqual(errors, []);
  console.log("PASS: both Twin Peaks study paths; 16 full two-hand measures; exact score targets, MIDI progression, study labels, score links and completion.");
} finally { await browser.close(); }
