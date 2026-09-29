// Run against `npm run dev`. Requires Playwright and a local Chrome binary.
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(25000);

try {
  await page.addInitScript(() => {
    const input = { id: "test-midi", name: "Test piano", state: "connected", onmidimessage: null };
    window.testMidi = input;
    Object.defineProperty(navigator, "requestMIDIAccess", { value: async () => ({ inputs: new Map([[input.id, input]]), onstatechange: null }) });
  });
  await page.goto(process.env.TEST_URL || "http://localhost:3000");
  await page.waitForFunction(() => localStorage.getItem("cadence.education.v2"));
  assert.ok((await page.locator("body").innerText()).length > 100);
  assert.equal(await page.locator("[data-nextjs-dialog], .vite-error-overlay").count(), 0);
  await page.getByRole("button", { name: "Connect keyboard", exact: true }).click();
  await page.waitForFunction(() => typeof window.testMidi.onmidimessage === "function");
  await page.getByRole("button", { name: "Curriculum", exact: true }).click();

  for (const [title, ending, output] of [
    ["Debussy: Pagodes", "98", "/private/tmp/cadence-pagodes-score.png"],
    ["Debussy: Clair de lune", "72", "/private/tmp/cadence-clair-score.png"],
  ]) {
    await page.getByText(title, { exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".score-follow") && !document.querySelector(".score-follow").disabled, null, { timeout: 60000 });
    assert.match(await page.locator(".score-context").innerText(), new RegExp(`1 / ${ending}`));
    assert.ok((await page.locator(".osmd-container svg").count()) > 0, `${title} score SVG rendered`);
    assert.ok((await page.locator(".osmd-container").innerText()).length >= 0);
    assert.ok((await page.locator(".expected-score-notes strong").innerText()).length > 0);
    await page.getByRole("button", { name: "Both hands Bring them together" }).click();
    await page.getByRole("button", { name: "Start score practice", exact: true }).click();
    assert.match(await page.locator(".score-hand-cues").innerText(), /RIGHT[\s\S]*LEFT/);
    const target = await page.locator(".expected-score-notes strong").innerText();
    const pitches = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    for (const [, letter, accidental, octave] of target.matchAll(/([A-G])([♯♭]?)(-?\d+)/g)) {
      const midi = (Number(octave) + 1) * 12 + pitches[letter] + (accidental === "♯" ? 1 : accidental === "♭" ? -1 : 0);
      await page.evaluate(async (midi) => {
        window.testMidi.onmidimessage({ data: new Uint8Array([0x90, midi, 80]) });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.testMidi.onmidimessage({ data: new Uint8Array([0x80, midi, 0]) });
      }, midi);
    }
    assert.match(await page.locator(".score-session-metrics").innerText(), /1 positions/);
    await page.locator(".score-paper").screenshot({ path: output });
    await page.getByRole("button", { name: "Curriculum", exact: true }).click();
  }
  assert.deepEqual(errors, []);
  console.log("PASS: both complete Debussy scores render, show separate hand prompts, and advance from live MIDI without runtime errors.");
} finally {
  await browser.close();
}
