// Run against `npm run dev`. Requires Playwright; CHROME_PATH can select local Chrome.
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.setDefaultTimeout(15000);

try {
  await page.addInitScript(() => {
    const input = { id: "test-midi", name: "Test piano", state: "connected", onmidimessage: null };
    window.testMidi = input;
    Object.defineProperty(navigator, "requestMIDIAccess", { value: async () => ({ inputs: new Map([[input.id, input]]), onstatechange: null }) });
    window.testSounds = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (...args) { window.testSounds++; return original.apply(this, args); };
  });
  await page.goto(process.env.TEST_URL || "http://localhost:3000");
  await page.waitForFunction(() => localStorage.getItem("cadence.education.v2"));
  await page.getByRole("button", { name: "Connect keyboard", exact: true }).click();
  await page.waitForFunction(() => typeof window.testMidi.onmidimessage === "function");
  await page.getByRole("button", { name: "Curriculum", exact: true }).click();
  await page.getByText("Chopin: Prelude in E minor", { exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".score-follow") && !document.querySelector(".score-follow").disabled);

  const target = () => page.locator(".expected-score-notes strong").innerText();
  const positions = async () => Number((await page.locator(".score-session-metrics > div").last().innerText()).match(/(\d+) positions/)[1]);
  const send = async (midi) => {
    await page.evaluate(async (midi) => {
      window.testMidi.onmidimessage({ data: new Uint8Array([0x90, midi, 80]) });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.testMidi.onmidimessage({ data: new Uint8Array([0x80, midi, 0]) });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }, midi);
  };
  const playTarget = async () => {
    const text = await target();
    const pcs = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const matches = [...text.matchAll(/([A-G])([♯♭]?)(-?\d+)/g)];
    assert.ok(matches.length, `Playable target: ${text}`);
    await page.waitForFunction((names) => JSON.stringify([...document.querySelectorAll('.piano button.target')].map((key) => key.getAttribute('aria-label')).sort()) === JSON.stringify(names), matches.map(([name]) => name).sort());
    for (const [, letter, accidental, octave] of matches) await send((Number(octave) + 1) * 12 + pcs[letter] + (accidental === "♯" ? 1 : accidental === "♭" ? -1 : 0));
  };
  assert.equal(await target(), "B3");
  await page.getByRole("button", { name: "Right hand Upper staff" }).click();
  assert.equal(await target(), "B3", "the low opening melody belongs to the upper staff");
  await page.getByRole("button", { name: "Left hand Lower staff" }).click();
  assert.equal(await target(), "G3 · B3 · E4", "left-hand pickup rest is skipped before input");

  await page.getByRole("button", { name: "Start score practice", exact: true }).click();
  const beforeHear = await target();
  await page.getByRole("button", { name: "Hear these notes" }).click();
  assert.equal(await target(), beforeHear);
  assert.equal(await positions(), 0, "hearing never earns a position");
  assert.ok(await page.evaluate(() => window.testSounds >= 3), "hearing triggers audio even with MIDI browser sound disabled");
  await page.locator(".expected-score-notes").scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => scrollY);
  await playTarget();
  assert.equal(await positions(), 1, "one chord advances once, including React rerenders");
  assert.equal(await target(), beforeHear, "repeated written chord still needs a fresh attack");
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - scrollBefore) < 2, "playing does not scroll the window");
  await playTarget();
  assert.equal(await positions(), 2);
  await page.getByRole("button", { name: "Right hand Upper staff" }).click();
  assert.equal(await page.getByRole("button", { name: "Start score practice", exact: true }).count(), 1, "switching hands pauses input");
  assert.equal(await positions(), 0, "switching hands starts a separate assessment");
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem("cadence.education.v2")));
  assert.equal(history.scoreSessions.chopin.at(-1).hand, "left");
  assert.deepEqual(history.scoreMeasures.chopin ?? [], [], "solo practice does not complete both-hand measures");

  await page.getByRole("button", { name: "Play full track", exact: true }).click();
  let played = 0;
  while ((await target()) !== "Finished" && played < 500) { await playTarget(); played++; }
  assert.ok(played > 20 && played < 500, `right hand reaches the complete score end (${played} positions)`);
  assert.equal(await target(), "Finished");
  assert.equal(await positions(), played, "every MIDI event counted exactly once across the full piece");
  await page.getByRole("button", { name: "Left hand Lower staff" }).click();
  await page.getByRole("button", { name: "Play full track", exact: true }).click();
  let leftPlayed = 0;
  let adaptedBassSeen = false;
  while ((await target()) !== "Finished" && leftPlayed < 500) {
    const adaptation = page.locator(".range-adaptation");
    if (await adaptation.count()) {
      const text = await adaptation.innerText();
      assert.match(text, /(?:B1 → B2|E1 → E2)/, "the written bass note is named beside its playable substitute");
      assert.doesNotMatch(await target(), /(?:B1|E1)/, "the requested key stays inside the CT-S1 range");
      adaptedBassSeen = true;
    }
    await playTarget();
    leftPlayed++;
  }
  assert.equal(await target(), "Finished", "left hand also passes its final rests without getting stuck");
  assert.equal(await positions(), leftPlayed);
  assert.ok(adaptedBassSeen, "the complete Chopin score reaches and accepts its octave-up CT-S1 bass substitute");
  await page.getByRole("button", { name: "Right hand Upper staff" }).click();
  await page.getByRole("button", { name: "Coda mm. 22–26" }).click();
  await page.getByRole("button", { name: "Loop section" }).click();
  await page.getByRole("button", { name: "Start score practice", exact: true }).click();
  const loopStart = await target();
  let looped = false;
  for (let i = 0; i < 100; i++) {
    const previousMeasure = Number((await page.locator('.score-context > div').nth(1).locator('strong').innerText()).split(' / ')[0]);
    await playTarget();
    const nextMeasure = Number((await page.locator('.score-context > div').nth(1).locator('strong').innerText()).split(' / ')[0]);
    if (nextMeasure < previousMeasure) { looped = true; break; }
  }
  assert.ok(looped, "final section loops instead of stopping at score end");
  assert.equal(await target(), loopStart);
  await page.getByRole("button", { name: "Play full track", exact: true }).click();
  assert.equal(await target(), "B3", "completed score can restart at the opening");
  await page.getByRole("button", { name: "Both hands Bring them together" }).click();
  await page.getByRole("button", { name: "Play full track", exact: true }).click();
  await playTarget();
  await playTarget();
  const combined = await page.evaluate(() => JSON.parse(localStorage.getItem("cadence.education.v2")));
  assert.ok(combined.scoreMeasures.chopin.length > 0, "both-hand practice still records measure progress");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Focus score", exact: true }).click();
  await page.locator(".score-rehearsal").scrollIntoViewIfNeeded();
  const controls = await page.locator(".score-rehearsal").boundingBox();
  assert.ok(controls.x >= 0 && controls.x + controls.width <= 391, "hand controls fit a narrow screen");
  await page.locator(".score-rehearsal").screenshot({ path: process.env.TEST_SCREENSHOT || "/tmp/cadence-hands-mobile.png" });
  assert.deepEqual(errors, [], "no browser runtime errors");
  console.log(`PASS: real Chopin score; ${played} right-hand and ${leftPlayed} left-hand positions; MIDI, 61-key bass substitution, exact key guidance, hearing, repeated chords, hand switching, persistence, scrolling, end loop, restart, and narrow-screen controls.`);
} finally {
  await browser.close();
}
