"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeImprovisation } from "./improvisation-engine.mjs";
import type { EditableSketch, PerformanceNote } from "./composition-workbench";
import type { LivePlayedNote } from "./musicianship-lab";

type HarmonyChord = { name: string; notes: number[]; pitchClasses: number[] };

type ImprovScenario = {
  id: string;
  title: string;
  subtitle: string;
  center: string;
  bpm: number;
  beatsPerChord: number;
  palette: number[];
  homePitchClasses: number[];
  chords: HarmonyChord[];
  call: number[];
  goal: string;
  theory: string;
};

type Sample = { midi: number; velocity: number; at: number };

export type ImprovisationResult = ReturnType<typeof analyzeImprovisation> & {
  scenarioId: string;
  scenarioTitle: string;
  completedAt: string;
};

type Props = {
  playedNote: LivePlayedNote;
  preferences: string[];
  playNotes: (notes: number[], together?: boolean) => void;
  playContext: (chords: number[][], bpm: number, beatsPerChord: number) => void;
  onScreenNote: (midi: number) => void;
  onResult: (result: ImprovisationResult) => void;
  onSaveSketch: (sketch: EditableSketch) => void;
};

const SCENARIOS: ImprovScenario[] = [
  {
    id: "motif-answer",
    title: "Motif and answer",
    subtitle: "Make one small idea recognizable",
    center: "C major",
    bpm: 72,
    beatsPerChord: 4,
    palette: [60, 62, 64, 67, 69, 72],
    homePitchClasses: [0, 4, 7],
    chords: [{ name: "C", notes: [48, 55, 60, 64], pitchClasses: [0, 4, 7] }],
    call: [60, 62, 64, 62, 60],
    goal: "Play a three-to-five-note statement, leave a breath, then answer it. Preserve one rhythm and change the ending.",
    theory: "Repetition establishes identity. One controlled change makes the second phrase feel like an answer instead of new material.",
  },
  {
    id: "chord-targets",
    title: "Follow the harmony",
    subtitle: "Land deliberately as chords change",
    center: "C major",
    bpm: 76,
    beatsPerChord: 4,
    palette: [60, 62, 64, 65, 67, 69, 71, 72],
    homePitchClasses: [0, 4, 7],
    chords: [
      { name: "C", notes: [48, 55, 60, 64], pitchClasses: [0, 4, 7] },
      { name: "Am", notes: [45, 52, 57, 60], pitchClasses: [9, 0, 4] },
      { name: "F", notes: [41, 48, 53, 57], pitchClasses: [5, 9, 0] },
      { name: "G", notes: [43, 50, 55, 59], pitchClasses: [7, 11, 2] },
    ],
    call: [64, 62, 60, 64, 67, 69, 67, 64],
    goal: "Keep one motif across C, A minor, F, and G. At each change, aim for one of the highlighted chord tones.",
    theory: "A melody belongs to the progression when important landings acknowledge the current chord. Passing notes can remain free between those points.",
  },
  {
    id: "cinematic-minor",
    title: "Cinematic minor arc",
    subtitle: "Control emotional scale with register",
    center: "E minor",
    bpm: 68,
    beatsPerChord: 4,
    palette: [59, 62, 64, 66, 67, 71, 74, 76],
    homePitchClasses: [4, 7, 11],
    chords: [
      { name: "Em", notes: [40, 47, 52, 55, 59], pitchClasses: [4, 7, 11] },
      { name: "Cmaj7", notes: [36, 43, 48, 52, 59], pitchClasses: [0, 4, 7, 11] },
      { name: "G", notes: [43, 50, 55, 59], pitchClasses: [7, 11, 2] },
      { name: "D", notes: [38, 45, 50, 54], pitchClasses: [2, 6, 9] },
    ],
    call: [59, 62, 64, 62, 59, 67, 66, 64],
    goal: "Begin in a narrow middle register. Repeat the motif higher only when the harmony reaches its third chord, then return toward E.",
    theory: "Register is dramatic structure. Saving the high point gives a simple motif a larger emotional arc without adding complexity.",
  },
  {
    id: "ambient-space",
    title: "Harmony and decay",
    subtitle: "Let silence reveal changing color",
    center: "D minor",
    bpm: 58,
    beatsPerChord: 4,
    palette: [57, 60, 62, 64, 65, 69, 72, 74],
    homePitchClasses: [2, 5, 9],
    chords: [
      { name: "Dm9", notes: [38, 45, 50, 53, 60], pitchClasses: [2, 5, 9, 0, 4] },
      { name: "B♭maj7", notes: [34, 41, 46, 50, 57], pitchClasses: [10, 2, 5, 9] },
    ],
    call: [62, 65, 64, 60],
    goal: "Use no more than four notes per chord. Let at least one full beat pass in silence, then reuse one pitch as a color tone over both harmonies.",
    theory: "A sustained or repeated note changes meaning when the chord beneath it changes. Space lets the ear perceive that transformation.",
  },
];

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

function scenarioOrder(preferences: string[]) {
  if (preferences.includes("Ambient")) return [SCENARIOS[3], SCENARIOS[0], SCENARIOS[1], SCENARIOS[2]];
  if (preferences.includes("Film & game music")) return [SCENARIOS[2], SCENARIOS[0], SCENARIOS[1], SCENARIOS[3]];
  return SCENARIOS;
}

export function ImprovisationLab({ playedNote, preferences, playNotes, playContext, onScreenNote, onResult, onSaveSketch }: Props) {
  const orderedScenarios = useMemo(() => scenarioOrder(preferences), [preferences]);
  const [scenarioId, setScenarioId] = useState(orderedScenarios[0].id);
  const [recording, setRecording] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeImprovisation> | null>(null);
  const [saved, setSaved] = useState(false);
  const receivedTokenRef = useRef(0);
  const sessionStartRef = useRef(0);
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? orderedScenarios[0];
  const contextDuration = scenario.chords.length * scenario.beatsPerChord * (60000 / scenario.bpm);
  const displayDuration = Math.max(contextDuration, samples.at(-1)?.at ?? 0, 1000);
  const chordMs = scenario.beatsPerChord * (60000 / scenario.bpm);
  const activePaletteChord = scenario.chords[Math.floor((samples.at(-1)?.at ?? 0) / chordMs) % scenario.chords.length];

  useEffect(() => {
    if (!recording || !playedNote || playedNote.token === receivedTokenRef.current) return;
    receivedTokenRef.current = playedNote.token;
    setSamples((current) => [...current, { midi: playedNote.midi, velocity: playedNote.velocity, at: performance.now() - sessionStartRef.current }].slice(-120));
  }, [playedNote, recording]);

  const begin = () => {
    setSamples([]);
    setAnalysis(null);
    setSaved(false);
    sessionStartRef.current = performance.now();
    setRecording(true);
    playContext(scenario.chords.map((chord) => chord.notes), scenario.bpm, scenario.beatsPerChord);
  };

  const finish = () => {
    setRecording(false);
    const next = analyzeImprovisation(samples, scenario);
    setAnalysis(next);
    onResult({ ...next, scenarioId: scenario.id, scenarioTitle: scenario.title, completedAt: new Date().toISOString() });
  };

  const saveSketch = () => {
    if (!samples.length || !analysis) return;
    const performanceNotes: PerformanceNote[] = samples.map((sample, index) => ({
      midi: sample.midi,
      start: Math.round(sample.at),
      duration: Math.max(160, Math.min(900, (samples[index + 1]?.at ?? sample.at + 420) - sample.at - 40)),
      velocity: sample.velocity,
    }));
    const sketch: EditableSketch = {
      id: `improv-${Date.now()}`,
      title: `${scenario.title}: take`,
      course: "improvisation-lab",
      createdAt: new Date().toISOString(),
      notes: samples.map((sample) => sample.midi),
      duration: Math.max(1, Math.round((samples.at(-1)?.at ?? 1000) / 1000)),
      prompt: `${scenario.goal} Next development: ${analysis.nextPass}`,
      tempo: scenario.bpm,
      performance: performanceNotes,
    };
    onSaveSketch(sketch);
    setSaved(true);
  };

  const personalizedReason = preferences.includes("Film & game music")
    ? "The scenario order begins with emotional scoring because that is one of your selected directions."
    : preferences.includes("Ambient")
      ? "The scenario order begins with harmony and space because ambient music is one of your selected directions."
      : "The sequence begins with motif identity, then adds harmony, register, and space one decision at a time.";

  return (
    <div className="improv-lab">
      <div className="improv-heading">
        <div><p className="eyebrow">Guided improvisation</p><h2>Learn to invent while the music is happening.</h2><p>Cadence listens for a remembered motif, breathing space, harmonic landings, contour, and the shape of your ending. It does not score whether an idea is “good.”</p></div>
        <span>{personalizedReason}</span>
      </div>

      <div className="improv-scenarios" role="tablist" aria-label="Improvisation scenarios">
        {orderedScenarios.map((item, index) => <button key={item.id} role="tab" aria-selected={item.id === scenario.id} className={item.id === scenario.id ? "active" : ""} onClick={() => { setScenarioId(item.id); setSamples([]); setAnalysis(null); setRecording(false); setSaved(false); }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.subtitle}</small></button>)}
      </div>

      <div className="improv-workspace">
        <aside className="improv-brief">
          <p className="eyebrow">Current constraint</p>
          <h3>{scenario.center} · {scenario.bpm} BPM</h3>
          <p>{scenario.goal}</p>
          <div><span>Why it works</span><p>{scenario.theory}</p></div>
          <button className="secondary-button" onClick={() => playNotes(scenario.call)}>▶ Hear a model call</button>
        </aside>

        <section className="improv-capture">
          <div className="improv-context-line">
            {scenario.chords.map((chord, index) => <div key={`${chord.name}-${index}`}><strong>{chord.name}</strong><span>{scenario.beatsPerChord} beats</span></div>)}
          </div>
          <div className="phrase-canvas" aria-label="Captured improvisation phrase">
            {samples.length ? samples.map((sample, index) => {
              const low = Math.min(...scenario.palette) - 2;
              const high = Math.max(...scenario.palette) + 2;
              return <i key={`${sample.at}-${index}`} title={noteName(sample.midi)} style={{ left: `${Math.min(97, (sample.at / displayDuration) * 100)}%`, bottom: `${10 + ((sample.midi - low) / (high - low)) * 74}%`, opacity: Math.max(.45, sample.velocity / 127) }} />;
            }) : <p>{recording ? "Play a small idea. Silence is part of the phrase." : "Begin with harmony, then answer the musical problem rather than filling the bar."}</p>}
          </div>
          <div className="improv-palette" aria-label="Playable note palette">
            {scenario.palette.map((note) => {
              const chordTone = activePaletteChord.pitchClasses.includes(note % 12);
              return <button key={note} className={chordTone ? "chord-tone" : ""} onClick={() => onScreenNote(note)}><strong>{noteName(note)}</strong><small>{chordTone ? "chord" : "color"}</small></button>;
            })}
          </div>
          <div className="improv-controls">
            {!recording ? <button className="primary-button" onClick={begin}>{samples.length ? "Start a new pass with harmony" : "Begin with harmony"}</button> : <button className="primary-button stop" onClick={finish} disabled={samples.length < 3}>Stop & analyze phrase</button>}
            <span>{samples.length} notes captured{recording ? " · listening" : ""}</span>
            <button className="quiet-button" onClick={() => { setSamples([]); setAnalysis(null); setRecording(false); setSaved(false); }}>Clear</button>
          </div>
        </section>

        <aside className="improv-evidence">
          <p className="eyebrow">Live evidence</p>
          <dl>
            <div><dt>Motif echo</dt><dd>{analysis ? `${analysis.motifScore}%` : "–"}</dd></div>
            <div><dt>Harmony fit</dt><dd>{analysis ? `${analysis.harmonicFit}%` : "–"}</dd></div>
            <div><dt>Breaths</dt><dd>{analysis ? analysis.breathCount : "–"}</dd></div>
            <div><dt>Range</dt><dd>{analysis ? `${analysis.range} st` : "–"}</dd></div>
          </dl>
          <p>Motif echo finds repeated two-interval cells. Harmony fit checks notes against the chord sounding at that moment, while allowing passing color.</p>
        </aside>
      </div>

      {analysis && (
        <section className="improv-coaching">
          <div><p className="eyebrow">What this pass established</p><h3>{analysis.observation}</h3></div>
          <div><span>Change one thing next</span><p>{analysis.nextPass}</p></div>
          <div className="improv-result-actions"><button className="secondary-button" onClick={() => playNotes(samples.map((sample) => sample.midi))}>▶ Replay pitches</button><button className="primary-button" onClick={saveSketch} disabled={saved}>{saved ? "✓ Saved to Sketchbook" : "Save expressive take"}</button></div>
        </section>
      )}
    </div>
  );
}
