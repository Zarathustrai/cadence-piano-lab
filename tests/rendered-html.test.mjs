import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getProgressionStep } from "../app/midi-progression.mjs";
import { detectChord, samePitchSet } from "../app/music-engine.mjs";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Cadence learning studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Cadence · Understand what you play<\/title>/i);
  assert.match(html, /Learn the language/);
  assert.match(html, /Romanas/);
  assert.match(html, /Classical craft, harmony, improvisation, composition, and production/);
  assert.match(html, /Built around what you want to become/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("keeps the AI boundary isolated and local persistence explicit", async () => {
  const [page, coach, curriculum, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/coach.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/curriculum.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /requestMIDIAccess/);
  assert.match(page, /cadence\.education\.v2/);
  assert.match(page, /generatePracticeDrill/);
  assert.match(page, /handleNoteOnRef\.current\(note, "midi"\)/);
  assert.match(page, /handleNoteOffRef\.current\(note\)/);
  assert.match(page, /sequenceIndexRef\.current = result\.nextIndex/);
  assert.match(page, /activityRunningRef\.current = true/);
  assert.match(page, /samePitchSet\(nextActive, activeStep\.targetChord\)/);
  assert.match(page, /setSketches/);
  assert.match(page, /<ScoreReader/);
  assert.match(page, /scoreMeasures/);
  assert.match(curriculum, /Triads from first principles/);
  assert.match(curriculum, /Harmony that goes somewhere/);
  assert.match(curriculum, /Bach: Prelude in C major/);
  assert.match(curriculum, /Chopin: Prelude in E minor/);
  assert.match(curriculum, /Improvisation as conversation/);
  assert.match(curriculum, /From piano idea to production/);
  assert.match(curriculum, /completeWork: true/g);
  assert.equal((curriculum.match(/scoreUrl: "\/scores\//g) ?? []).length, 5);
  assert.match(coach, /Drop-in AI boundary/);
  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, null);
  assert.equal(hostingConfig.r2, null);
  assert.match(hostingConfig.project_id, /^appgprj_/);
});

test("advances consecutive hardware notes without waiting for a render", () => {
  const sequence = [60, 62, 64, 65];
  let index = 0;

  for (const midi of [60, 62, 64]) {
    const step = getProgressionStep(sequence, index, midi);
    assert.equal(step.accepted, true);
    index = step.nextIndex;
  }

  assert.equal(index, 3);
  assert.equal(getProgressionStep(sequence, index, 65).complete, true);
  assert.equal(getProgressionStep(sequence, 1, 64).accepted, false);
});

test("recognizes held chords in any inversion or octave", () => {
  assert.equal(detectChord([60, 64, 67]), "C major");
  assert.equal(detectChord([64, 67, 72]), "C major");
  assert.equal(detectChord([55, 59, 62, 65]), "G7");
  assert.equal(detectChord([57, 60, 64]), "A minor");
  assert.equal(samePitchSet([60, 64, 67], [48, 55, 64]), true);
  assert.equal(samePitchSet([60, 64, 67], [60, 63, 67]), false);
});

test("ships five complete local MusicXML score archives and an interactive reader", async () => {
  const filenames = [
    "ode-to-joy.mxl",
    "bach-prelude-c.mxl",
    "minuet-in-g.mxl",
    "gymnopedie-no-1.mxl",
    "chopin-prelude-e-minor.mxl",
  ];
  const [reader, ...archives] = await Promise.all([
    readFile(new URL("../app/score-reader.tsx", import.meta.url), "utf8"),
    ...filenames.map((filename) => readFile(new URL(`../public/scores/${filename}`, import.meta.url))),
  ]);

  assert.match(reader, /OpenSheetMusicDisplay/);
  assert.match(reader, /Follow my playing/);
  assert.match(reader, /NotesUnderCursor/);
  assert.match(reader, /onMeasureComplete/);
  for (const archive of archives) {
    assert.equal(archive.subarray(0, 2).toString(), "PK");
    assert.ok(archive.length > 3000);
  }
});
