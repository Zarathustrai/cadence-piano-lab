import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getProgressionStep } from "../app/midi-progression.mjs";
import { analyzePerformance, analyzeTechnique, buildPracticePlan, chooseRecommendedCourse, createMidiFile, derivePlacementProfile, dueReviewEntries, evaluateScoreSession, scheduleReview } from "../app/learning-engine.mjs";
import { detectChord, samePitchSet } from "../app/music-engine.mjs";
import { analyzeImprovisation } from "../app/improvisation-engine.mjs";
import { analyzeHarmonyProgression, buildPreset, chordsForKey, HARMONY_PRESETS, voiceChord, voiceLeadingDistance } from "../app/harmony-engine.mjs";
import { analyzeProject, assembleProject, PROJECT_BRIEFS, PROJECT_TRANSFORMS, transformPerformance } from "../app/composition-project-engine.mjs";
import { buildChord, buildDiatonicHarmony, buildScale, CHORD_QUALITIES, SCALE_MODES, THEORY_ROOTS } from "../app/theory-engine.mjs";
import { getPersonalizedRepertoireTransfer, getRepertoireAnalysis, REPERTOIRE_ANALYSIS, repertoireAnalysisCount } from "../app/repertoire-analysis.mjs";
import { ledgerLinesForMidi, staffYForMidi } from "../app/notation-geometry.mjs";
import { getScorePracticeStep, ODE_TO_JOY_SCORE, scoreTimeAtPosition } from "../app/score-practice.mjs";

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
  assert.match(html, /Start with no assumed/);
  assert.match(html, /Romanas/);
  assert.match(html, /Every new music word is translated/);
  assert.match(html, /Built around what you want to become/);
  assert.match(html, /Musicianship Lab/);
  assert.match(html, /Calibrate my starting point/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("teaches notation and translates vocabulary before Beethoven", async () => {
  const [curriculum, page, language] = await Promise.all([
    readFile(new URL("../app/curriculum.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/music-language.tsx", import.meta.url), "utf8"),
  ]);

  const notationAt = curriculum.indexOf('id: "notation"');
  const odeAt = curriculum.indexOf('id: "ode"');
  assert.ok(notationAt > 0 && notationAt < odeAt, "notation is taught before repertoire");
  assert.match(curriculum, /The page is a height map/);
  assert.match(curriculum, /What does E4 mean/);
  assert.match(curriculum, /prerequisites: \["keyboard", "notation", "rhythm"\]/);
  assert.match(curriculum, /Phrase.*A short musical thought/);
  assert.doesNotMatch(curriculum, /heard as four sentences/);
  assert.match(page, /<NotationStaff/);
  assert.match(page, /<LessonTerms/);
  assert.match(page, /Music words/);
  assert.match(page, /This lesson uses ideas taught earlier/);
  assert.match(language, /Home note \(tonic\).*teacher word for home/);
  assert.match(language, /Musical sentence.*informal comparison/);
  assert.match(language, /Higher symbol = move right on the keyboard/);
});

test("maps notation to one diatonic staff and draws only needed ledger lines", async () => {
  assert.equal(staffYForMidi(77), 56, "F5 is the top staff line");
  assert.equal(staffYForMidi(74), 71, "D5 is the fourth staff line");
  assert.equal(staffYForMidi(71), 86, "B4 is the middle staff line");
  assert.equal(staffYForMidi(67), 101, "G4 is the second staff line");
  assert.equal(staffYForMidi(64), 116, "E4 is the bottom staff line");
  assert.equal(staffYForMidi(60), 131, "C4 is one ledger line below");
  assert.equal(staffYForMidi(62), 123.5, "D4 is the space above middle C");
  assert.equal(staffYForMidi(55), 153.5, "G3 keeps the same seven-and-a-half-unit diatonic spacing");
  assert.deepEqual(ledgerLinesForMidi(60), [131]);
  assert.deepEqual(ledgerLinesForMidi(55), [131, 146], "G3 uses C4 and A3 ledgers");
  assert.ok(!ledgerLinesForMidi(55).includes(153.5), "a ledger line never runs through G3");

  const [language, styles] = await Promise.all([
    readFile(new URL("../app/music-language.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(language, /<svg className="notation-score"[\s\S]*viewBox=\{`0 0 \$\{width\} \$\{STAFF_UNIT_HEIGHT\}`\}/);
  assert.match(language, /<title id=\{summaryId\}>\{scoreSummary\}<\/title>/);
  assert.match(language, /<p className="sr-only" aria-live="polite">\{currentCue\}<\/p>/);
  assert.match(language, /showNames && !complete[\s\S]*noteName\(currentNote\)/);
  assert.match(language, /directionCue\(notes, currentIndex, complete\)/);
  assert.match(styles, /\.notation-score \{[^}]*height: 170px;[^}]*margin-inline: auto;[^}]*\}/);
  assert.doesNotMatch(styles, /\.notation-score \{[^}]*min-width:/);
});

test("auto-follows long repertoire notation and evaluates the same Ode melody shown on the staff", async () => {
  assert.equal(ODE_TO_JOY_SCORE.length, 62);
  assert.deepEqual([...new Set(ODE_TO_JOY_SCORE.map((position) => position.measure))], Array.from({ length: 17 }, (_, index) => index + 1));
  assert.deepEqual(ODE_TO_JOY_SCORE.slice(0, 15).map((position) => position.midi), [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62]);
  assert.deepEqual(getScorePracticeStep(ODE_TO_JOY_SCORE, 0, 62), {
    accepted: false,
    complete: false,
    expectedMidi: 64,
    nextIndex: 0,
    completedMeasure: null,
  });
  assert.equal(getScorePracticeStep(ODE_TO_JOY_SCORE, 0, 64).nextIndex, 1);
  assert.equal(getScorePracticeStep(ODE_TO_JOY_SCORE, 3, 67).completedMeasure, 1);
  assert.equal(scoreTimeAtPosition(ODE_TO_JOY_SCORE, 4), 1);

  const [curriculum, language, page, reader, styles] = await Promise.all([
    readFile(new URL("../app/curriculum.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/music-language.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/score-reader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(curriculum, /practiceSequence: ODE_TO_JOY_SCORE/);
  assert.match(curriculum, /ode-complete[\s\S]*notation: \{ showNames: true \}/);
  assert.match(language, /viewport\.scrollTo\(\{ left: nextLeft/);
  assert.match(language, /data-current-index=\{currentIndex\}/);
  assert.match(page, /course\.repertoire && sequenceNotes\.length >= 10/);
  assert.match(page, /key=\{`\$\{course\.id\}:\$\{step\.id\}:\$\{activityRunning \? "guided" : "idle"\}`\}/);
  assert.match(reader, /Start score practice/);
  assert.match(reader, /getScorePracticeStep\(practiceSequence, practiceIndex, playedNote\.midi\)/);
  assert.match(reader, /measureNumbers=\{practiceSequence\.map/);
  assert.match(styles, /\.notation-scroll \{[^}]*scroll-behavior: smooth/);
  assert.match(styles, /\.score-paper:has\(\.notation-reader\)/);
});

test("keeps a readable live keyboard visible throughout every lesson", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  const dockAt = page.indexOf('className="practice-dock"');
  const lessonAt = page.indexOf('className="lesson-stage"');
  assert.ok(dockAt > 0 && dockAt < lessonAt, "the live piano appears before the lesson content");
  assert.match(page, /Current key/);
  assert.match(page, /Next in lesson/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /<span>\{noteName\(note\)\}<\/span>/);
  assert.match(styles, /\.practice-dock \{[^}]*position: sticky;[^}]*top: 130px;/);
  assert.match(styles, /\.live-key-readout strong \{[^}]*font-size: 30px;/);
  assert.match(styles, /\.lesson-body \{[^}]*font-size: 19px;/);
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
  assert.match(page, /handleNoteOnRef\.current\(note, "midi", velocity\)/);
  assert.match(page, /handleNoteOffRef\.current\(note\)/);
  assert.match(page, /sequenceIndexRef\.current = result\.nextIndex/);
  assert.match(page, /activityRunningRef\.current = true/);
  assert.match(page, /samePitchSet\(nextActive, activeStep\.targetChord\)/);
  assert.match(page, /setSketches/);
  assert.match(page, /<ScoreReader/);
  assert.match(page, /scoreMeasures/);
  assert.match(page, /<MusicianshipLab/);
  assert.match(page, /<CompositionWorkbench/);
  assert.match(page, /earProgress/);
  assert.match(page, /activeCreativeNotesRef/);
  assert.match(page, /velocity: event\.velocity/);
  assert.match(page, /performance: events\.map/);
  assert.match(page, /scoreSessions/);
  assert.match(page, /techniqueHistory/);
  assert.match(page, /buildPracticePlan/);
  assert.match(page, /<PlacementAssessment/);
  assert.match(page, /reviewSchedule/);
  assert.match(page, /scheduleReview/);
  assert.match(page, /getReviewTeachingVariant/);
  assert.match(page, /I attempted recall · show support/);
  assert.match(page, /reviewMode \? reviewConfidence : 88/);
  assert.match(page, /setStepComplete\(false\)/);
  assert.match(page, /<RepertoireMicroscope/);
  assert.match(page, /exploredAnalysis/);
  assert.match(page, /improvisationHistory/);
  assert.match(page, /playImprovisationContext/);
  assert.match(page, /harmonyHistory/);
  assert.match(page, /onHarmonyResult/);
  assert.match(page, /<CompositionProjectStudio/);
  assert.match(page, /compositionProjects/);
  assert.match(page, /Start a composition project/);
  assert.match(page, /theoryProgress/);
  assert.match(page, /onTheoryProgress/);
  assert.match(page, /Theory fluency/);
  assert.match(curriculum, /Triads from first principles/);
  assert.match(curriculum, /Harmony that goes somewhere/);
  assert.match(curriculum, /Bach: Prelude in C major/);
  assert.match(curriculum, /Chopin: Prelude in E minor/);
  assert.match(curriculum, /Improvisation as conversation/);
  assert.match(curriculum, /From piano idea to production/);
  assert.match(curriculum, /completeWork: true/g);
  assert.equal((curriculum.match(/scoreUrl: "\/scores\//g) ?? []).length, 5);
  assert.match(coach, /Drop-in AI boundary/);
  assert.match(coach, /Reduce and rebuild/);
  assert.match(coach, /Transfer without cues/);
  assert.match(coach, /Scoring transfer/);
  assert.match(coach, /Production transfer/);
  const hostingConfig = JSON.parse(hosting);
  assert.equal(hostingConfig.d1, null);
  assert.equal(hostingConfig.r2, null);
  assert.match(hostingConfig.project_id, /^appgprj_/);
});

test("analyzes improvised identity, breath, harmonic timing, and endings separately", () => {
  const scenario = {
    bpm: 60,
    beatsPerChord: 4,
    chords: [{ pitchClasses: [0, 4, 7] }],
    homePitchClasses: [0, 4, 7],
  };
  const coherent = analyzeImprovisation([
    { midi: 60, velocity: 80, at: 0 },
    { midi: 62, velocity: 84, at: 420 },
    { midi: 64, velocity: 88, at: 840 },
    { midi: 60, velocity: 78, at: 1900 },
    { midi: 62, velocity: 82, at: 2320 },
    { midi: 64, velocity: 90, at: 2740 },
    { midi: 67, velocity: 86, at: 3200 },
    { midi: 60, velocity: 72, at: 3700 },
  ], scenario);
  assert.ok(coherent.motifScore >= 25);
  assert.equal(coherent.breathCount, 1);
  assert.equal(coherent.phraseCount, 2);
  assert.ok(coherent.harmonicFit >= 70);
  assert.equal(coherent.endingResolved, true);
  const unresolved = analyzeImprovisation([
    { midi: 61, velocity: 80, at: 0 },
    { midi: 63, velocity: 80, at: 400 },
    { midi: 66, velocity: 80, at: 800 },
    { midi: 70, velocity: 80, at: 1200 },
    { midi: 61, velocity: 80, at: 1600 },
    { midi: 63, velocity: 80, at: 2000 },
    { midi: 66, velocity: 80, at: 2400 },
    { midi: 70, velocity: 80, at: 2800 },
  ], scenario);
  assert.equal(unresolved.harmonicFit, 0);
  assert.equal(unresolved.endingResolved, false);
  assert.match(unresolved.nextPass, /highlighted chord tone|first three notes/i);
});

test("builds transposable harmony and evaluates function separately from voice leading", () => {
  const cChords = chordsForKey("C-major");
  assert.deepEqual(cChords.map((chord) => chord.roman), ["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  assert.deepEqual(cChords.map((chord) => chord.name), ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);
  const c = cChords[0];
  assert.deepEqual(voiceChord(c, 0).notes, [60, 64, 67]);
  assert.deepEqual(voiceChord(c, 1).notes, [64, 67, 72]);
  assert.deepEqual(voiceChord(c, 2).notes, [55, 60, 64]);
  assert.equal(voiceChord(c, 2).label, "C/G");
  assert.equal(voiceLeadingDistance(voiceChord(c, 0), voiceChord(c, 1)), 12);
  const classical = buildPreset(HARMONY_PRESETS.find((preset) => preset.id === "classical"));
  const analysis = analyzeHarmonyProgression(classical);
  assert.equal(analysis.cadence, "Authentic arrival");
  assert.match(analysis.arc, /Tonic.*Predominant.*Dominant.*Tonic/);
  assert.ok(analysis.peakTension >= 80);
  assert.ok(analysis.smoothness > 0);
  const loop = buildPreset(HARMONY_PRESETS.find((preset) => preset.id === "ambient"));
  assert.notEqual(analyzeHarmonyProgression(loop).cadence, "Authentic arrival");
});

test("spells and explains scales, diatonic harmony, extensions, and inversions in every key", () => {
  assert.equal(THEORY_ROOTS.length, 12);
  assert.equal(SCALE_MODES.length, 5);
  assert.equal(CHORD_QUALITIES.length, 11);
  assert.deepEqual(buildScale("C", "major").map((note) => note.name), ["C", "D", "E", "F", "G", "A", "B"]);
  assert.deepEqual(buildScale("F♯", "major").map((note) => note.name), ["F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯"]);
  assert.deepEqual(buildScale("E♭", "major").map((note) => note.name), ["E♭", "F", "G", "A♭", "B♭", "C", "D"]);
  assert.deepEqual(buildScale("A", "harmonic-minor").map((note) => note.name), ["A", "B", "C", "D", "E", "F", "G♯"]);
  const harmonicMinor = buildDiatonicHarmony("A", "harmonic-minor");
  assert.deepEqual(harmonicMinor.map((chord) => chord.roman), ["i", "ii°", "III+", "iv", "V", "VI", "vii°"]);
  assert.deepEqual(harmonicMinor[4].notes, ["E", "G♯", "B"]);
  assert.equal(harmonicMinor[4].function, "Dominant family");
  const altered = buildChord("F♯", "major7", 2);
  assert.equal(altered.chordName, "F♯maj7/C♯");
  assert.deepEqual(altered.notes, ["F♯", "A♯", "C♯", "E♯"]);
  assert.deepEqual(altered.midi.map((note) => note % 12).sort((a, b) => a - b), [1, 5, 6, 10]);
  assert.match(buildChord("C", "dominant7").mechanism, /tritone/i);
  assert.match(buildChord("C", "add9").production, /ninth above the triad/i);
});

test("develops one musical seed into a timed multi-section composition form", () => {
  const seed = [
    { midi: 60, start: 0, duration: 300, velocity: 76 },
    { midi: 62, start: 400, duration: 300, velocity: 80 },
    { midi: 64, start: 800, duration: 300, velocity: 84 },
    { midi: 67, start: 1200, duration: 500, velocity: 88 },
  ];
  assert.deepEqual(transformPerformance(seed, "transpose").map((note) => note.midi), [62, 64, 66, 69]);
  assert.deepEqual(transformPerformance(seed, "answer").map((note) => note.midi), [60, 58, 56, 53]);
  assert.equal(transformPerformance(seed, "distill").length, 2);
  assert.equal(transformPerformance(seed, "return").at(-1).midi % 12, 0);

  const sections = [
    { sourceSketchId: "seed", transformation: "original", bars: 4, harmony: "I: home", texture: "Solo piano", dynamic: "Hold", reflection: "The motif establishes a calm home." },
    { sourceSketchId: "seed", transformation: "transpose", bars: 4, harmony: "vi: recolor", texture: "Inner voice added", dynamic: "Build", reflection: "The lift creates forward motion." },
    { sourceSketchId: "harmony", transformation: "open", bars: 4, harmony: "V: tension", texture: "Bass-led contrast", dynamic: "Build", reflection: "" },
    { sourceSketchId: "seed", transformation: "return", bars: 4, harmony: "V-I: release", texture: "Opening texture, quieter", dynamic: "Release", reflection: "" },
  ];
  const project = { tempo: 60, sections };
  const sketches = [
    { id: "seed", notes: seed.map((note) => note.midi), performance: seed },
    { id: "harmony", notes: [48, 55, 60], performance: [{ midi: 48, start: 0, duration: 1800, velocity: 72 }, { midi: 55, start: 0, duration: 1800, velocity: 72 }, { midi: 60, start: 0, duration: 1800, velocity: 72 }] },
  ];
  const assembled = assembleProject(project, sketches);
  assert.ok(assembled.length > seed.length * 4);
  assert.ok(assembled.some((note) => note.start >= 48000), "return begins after three four-bar sections");
  assert.ok(Math.max(...assembled.map((note) => note.start + note.duration)) <= 64000);
  const analysis = analyzeProject(project);
  assert.equal(analysis.developed, true);
  assert.equal(analysis.contrasted, true);
  assert.equal(analysis.returned, true);
  assert.equal(analysis.arranged, true);
  assert.equal(analysis.reflected, 2);
  assert.equal(analysis.completed, analysis.total);
  assert.equal(PROJECT_BRIEFS.length, 5);
  assert.equal(PROJECT_TRANSFORMS.length, 7);
});

test("scores stable timing and touch separately", () => {
  const even = Array.from({ length: 12 }, (_, index) => ({ midi: 60 + (index % 5), velocity: 80, at: index * 500 }));
  const uneven = [
    { midi: 60, velocity: 35, at: 0 },
    { midi: 62, velocity: 115, at: 180 },
    { midi: 64, velocity: 48, at: 910 },
    { midi: 65, velocity: 108, at: 1220 },
    { midi: 67, velocity: 42, at: 2100 },
    { midi: 65, velocity: 120, at: 2310 },
    { midi: 64, velocity: 40, at: 2980 },
    { midi: 62, velocity: 111, at: 3400 },
  ];

  const stable = analyzeTechnique(even);
  const unstable = analyzeTechnique(uneven);
  assert.equal(stable.timing, 100);
  assert.equal(stable.evenness, 100);
  assert.ok(unstable.timing < stable.timing);
  assert.ok(unstable.evenness < stable.evenness);
  assert.equal(stable.averageVelocity, 80);
});

test("exports a valid format-zero MIDI file with every captured note", () => {
  const notes = [60, 62, 64, 67];
  const midi = createMidiFile(notes, 96);
  assert.equal(Buffer.from(midi.subarray(0, 4)).toString(), "MThd");
  assert.equal(Buffer.from(midi.subarray(14, 18)).toString(), "MTrk");
  assert.equal(midi.filter((byte, index) => byte === 0x90 && midi[index + 1] >= 60).length, notes.length);
  assert.deepEqual(
    notes.map((note) => Array.from(midi).includes(note)),
    [true, true, true, true],
  );
});

test("preserves expressive timing, duration, overlap, and velocity in analysis and MIDI", () => {
  const performance = [
    { midi: 60, start: 0, duration: 500, velocity: 30 },
    { midi: 64, start: 250, duration: 750, velocity: 110 },
    { midi: 67, start: 1000, duration: 300, velocity: 72 },
  ];
  const profile = analyzePerformance(performance);
  assert.equal(profile.duration, 1300);
  assert.equal(profile.dynamicRange, 80);
  assert.equal(profile.averageVelocity, 71);
  assert.equal(profile.overlapCount, 1);

  const bytes = Array.from(createMidiFile(performance, 120));
  const sequenceAt = (sequence) => bytes.findIndex((_, index) => sequence.every((byte, offset) => bytes[index + offset] === byte));
  assert.ok(sequenceAt([0x00, 0x90, 60, 30]) >= 0, "first touch is retained");
  assert.ok(sequenceAt([0x81, 0x70, 0x90, 64, 110]) >= 0, "second note begins 240 ticks later with its velocity");
  assert.ok(sequenceAt([0x81, 0x70, 0x80, 60, 0]) >= 0, "first note ends independently while the second overlaps");
});

test("keeps foundations sequential, then uses Romanas's selected direction", () => {
  const courses = [
    { id: "keyboard", steps: [{ id: "a" }] },
    { id: "intervals", steps: [{ id: "b" }] },
    { id: "rhythm", steps: [{ id: "c" }] },
    { id: "scales", steps: [{ id: "d" }] },
    { id: "triads", steps: [{ id: "e" }] },
    { id: "satie", steps: [{ id: "f" }] },
    { id: "production", steps: [{ id: "g" }] },
  ];
  assert.equal(chooseRecommendedCourse(courses, {}, ["Ambient"]).id, "keyboard");
  const foundationsDone = { keyboard: ["a"], intervals: ["b"], rhythm: ["c"], scales: ["d"], triads: ["e"] };
  assert.equal(chooseRecommendedCourse(courses, foundationsDone, ["Ambient"]).id, "satie");
  assert.equal(chooseRecommendedCourse(courses, { ...foundationsDone, satie: ["f"] }, ["Music production"]).id, "production");
  assert.equal(chooseRecommendedCourse(courses, {}, ["Ambient"], "satie").id, "satie");
});

test("derives a playable starting point without removing earlier curriculum", () => {
  assert.equal(derivePlacementProfile({ geography: 40, ear: 100, chords: 100, theory: 100 }).recommendedCourseId, "keyboard");
  assert.equal(derivePlacementProfile({ geography: 90, ear: 45, chords: 100, theory: 100 }).recommendedCourseId, "intervals");
  assert.equal(derivePlacementProfile({ geography: 90, ear: 90, chords: 55, theory: 80 }).recommendedCourseId, "triads");
  const advanced = derivePlacementProfile({ geography: 100, ear: 100, chords: 100, theory: 100 });
  assert.equal(advanced.recommendedCourseId, "progressions");
  assert.equal(advanced.overall, 100);
});

test("spaces reliable recall farther apart and returns due experiences in order", () => {
  const first = scheduleReview(null, 88, "2026-01-01T10:00:00.000Z");
  assert.equal(first.intervalDays, 1);
  const second = scheduleReview(first, 96, "2026-01-02T10:00:00.000Z");
  assert.equal(second.intervalDays, 2);
  const difficult = scheduleReview(second, 45, "2026-01-04T10:00:00.000Z");
  assert.equal(difficult.intervalDays, 1);
  const schedule = {
    later: { ...second, dueAt: "2026-01-08T10:00:00.000Z", title: "Later" },
    due: { ...difficult, dueAt: "2026-01-05T10:00:00.000Z", title: "Due" },
  };
  assert.deepEqual(dueReviewEntries(schedule, "2026-01-06T10:00:00.000Z").map((item) => item.key), ["due"]);
});

test("evaluates score pitch, timing, and continuity as separate evidence", () => {
  const fluent = evaluateScoreSession({ correct: 12, mistakes: 0, timingRatios: [1, .98, 1.03, .96], pauses: 0, tempo: 72 });
  const hesitant = evaluateScoreSession({ correct: 12, mistakes: 3, timingRatios: [1.7, .55, 1.45, .62], pauses: 4, tempo: 72 });
  assert.equal(fluent.accuracy, 100);
  assert.ok(fluent.rhythm > 90);
  assert.equal(fluent.continuity, 100);
  assert.equal(hesitant.accuracy, 80);
  assert.ok(hesitant.rhythm < fluent.rhythm);
  assert.ok(hesitant.continuity < fluent.continuity);
});

test("builds the daily plan from the weakest recent evidence and creative direction", () => {
  const plan = buildPracticePlan({
    nextCourse: { title: "Triads from first principles", outcome: "Build and explain major and minor triads." },
    earProgress: { attempted: 12, correct: 10 },
    latestScore: { section: "Phrase A", rhythm: 58, timingSamples: 4 },
    latestTechnique: { control: 91 },
    hasSketch: true,
    preferences: ["Music production", "Film & game music"],
  });
  assert.equal(plan.totalMinutes, 25);
  assert.equal(plan.items[0].destination, "score");
  assert.match(plan.items[0].reason, /Phrase A rhythm is 58%/);
  assert.equal(plan.items[1].title, "Triads from first principles");
  assert.equal(plan.items[2].title, "Score one emotional change");
  assert.equal(plan.items.reduce((sum, item) => sum + item.minutes, 0), 25);
  const freshPlan = buildPracticePlan({ nextCourse: null, earProgress: { attempted: 0, correct: 0 }, latestScore: null, latestTechnique: null, hasSketch: false, preferences: ["Music production"] });
  assert.equal(freshPlan.items[2].title, "Capture a first production seed");
  assert.match(freshPlan.items[2].reason, /Capture a first phrase/);
  const reviewPlan = buildPracticePlan({ nextCourse: null, earProgress: { attempted: 0, correct: 0 }, latestScore: null, latestTechnique: null, hasSketch: false, preferences: [], dueReviews: [{ title: "Why thirds define chord color" }] });
  assert.equal(reviewPlan.items[0].destination, "review");
  assert.match(reviewPlan.items[0].title, /Why thirds define chord color/);
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
  assert.match(reader, /Start score practice/);
  assert.match(reader, /NotesUnderCursor/);
  assert.match(reader, /onMeasureComplete/);
  assert.match(reader, /CurrentSourceTimestamp\.RealValue/);
  assert.match(reader, /evaluateScoreSession/);
  assert.match(reader, /Score practice tempo/);
  assert.match(reader, /onSessionResult/);
  assert.equal((await readFile(new URL("../app/curriculum.ts", import.meta.url), "utf8")).match(/practiceBpm: \d/g)?.length, 5);
  for (const archive of archives) {
    assert.equal(archive.subarray(0, 2).toString(), "PK");
    assert.ok(archive.length > 3000);
  }
});

test("maps every complete repertoire section to causal theory and personalized transfer", () => {
  assert.deepEqual(Object.keys(REPERTOIRE_ANALYSIS), ["ode", "bach", "minuet", "satie", "chopin"]);
  assert.deepEqual(Object.values(REPERTOIRE_ANALYSIS).map((sections) => sections.length), [4, 5, 4, 6, 6]);
  assert.deepEqual(
    Object.fromEntries(Object.entries(REPERTOIRE_ANALYSIS).map(([course, sections]) => [course, sections.map((section) => section.sectionTitle)])),
    {
      ode: ["Phrase A", "Phrase A varied", "Phrase B", "Final cadence"],
      bach: ["Home", "Departure", "Sequence", "Deep tension", "Return"],
      minuet: ["Opening dance", "First cadence", "Contrasting sequence", "Return and close"],
      satie: ["Opening atmosphere", "Theme A", "Cadential expansion", "Contrasting middle", "Return", "Final release"],
      chopin: ["Opening suspension", "Inner descent", "First cadence", "Climactic expansion", "Final return", "Coda"],
    },
  );
  assert.equal(repertoireAnalysisCount(), 25);
  for (const sections of Object.values(REPERTOIRE_ANALYSIS)) {
    for (const section of sections) {
      assert.ok(section.mechanism.length > 80);
      assert.ok(section.voiceLeading.length > 60);
      assert.ok(section.listenFor.length > 50);
      assert.ok(section.experiment.length > 50);
      assert.ok(section.demo.length >= 2);
      assert.ok(section.functionPath.length >= 3);
    }
  }
  const bachReturn = getRepertoireAnalysis("bach", 4);
  assert.equal(bachReturn.sectionTitle, "Return");
  assert.match(bachReturn.mechanism, /cadential six-four/i);
  assert.match(getPersonalizedRepertoireTransfer(bachReturn, ["Music production"]), /separate bass, inner motion, and focal voice/i);
  assert.match(getPersonalizedRepertoireTransfer(bachReturn, ["Music production", "Film & game music"]), /Scoring study/i);
});
