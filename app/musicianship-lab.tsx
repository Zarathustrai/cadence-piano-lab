"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EditableSketch } from "./composition-workbench";
import { HarmonyLab, type HarmonyResult } from "./harmony-lab";
import { ImprovisationLab, type ImprovisationResult } from "./improvisation-lab";
import { analyzeTechnique } from "./learning-engine.mjs";
import { TheoryLab, type TheoryProgress } from "./theory-lab";

export type LivePlayedNote = { midi: number; velocity: number; token: number } | null;

export type EarProgress = {
  attempted: number;
  correct: number;
  streak: number;
  intervalLevel: number;
};

export type TechniqueResult = ReturnType<typeof analyzeTechnique> & {
  mode: "evenness" | "pulse" | "dynamics";
  notes: number;
  completedAt: string;
};

type TechniqueSample = { midi: number; velocity: number; at: number };

type LabProps = {
  playedNote: LivePlayedNote;
  earProgress: EarProgress;
  onEarProgress: (progress: EarProgress) => void;
  playNotes: (notes: number[], together?: boolean) => void;
  midiConnected: boolean;
  onConnectMidi: () => void;
  preferences: string[];
  onTechniqueResult: (result: TechniqueResult) => void;
  playContext: (chords: number[][], bpm: number, beatsPerChord: number) => void;
  onScreenNote: (midi: number) => void;
  onImprovisationResult: (result: ImprovisationResult) => void;
  onSaveImprovisation: (sketch: EditableSketch) => void;
  onHarmonyResult: (result: HarmonyResult) => void;
  activeNotes: number[];
  theoryProgress: TheoryProgress;
  onTheoryProgress: (progress: TheoryProgress) => void;
};

const INTERVALS = [
  { semitones: 1, name: "Minor second", character: "Close friction", example: "A sigh or leaning tone" },
  { semitones: 2, name: "Major second", character: "Open step", example: "Scale movement" },
  { semitones: 3, name: "Minor third", character: "Dark, vocal leap", example: "Minor triad edge" },
  { semitones: 4, name: "Major third", character: "Bright, settled leap", example: "Major triad edge" },
  { semitones: 5, name: "Perfect fourth", character: "Open and suspended", example: "Questioning space" },
  { semitones: 6, name: "Tritone", character: "Unstable symmetry", example: "The tension inside V7" },
  { semitones: 7, name: "Perfect fifth", character: "Wide stability", example: "Root and harmonic support" },
  { semitones: 8, name: "Minor sixth", character: "Expansive and dark", example: "Expressive melodic reach" },
  { semitones: 9, name: "Major sixth", character: "Expansive and warm", example: "Open lyrical reach" },
  { semitones: 12, name: "Octave", character: "Same identity, new register", example: "Register transfer" },
];

const CHORD_QUESTIONS = [
  { name: "Major", notes: [60, 64, 67], answer: "major", reason: "The root-to-third distance is four semitones." },
  { name: "Minor", notes: [60, 63, 67], answer: "minor", reason: "The third is one semitone lower than major." },
  { name: "Dominant seventh", notes: [55, 59, 62, 65], answer: "dominant", reason: "The major triad plus minor seventh creates a tritone that asks to resolve." },
  { name: "Diminished", notes: [59, 62, 65], answer: "diminished", reason: "Two stacked minor thirds create compressed instability." },
];

function techniqueAdvice(result: ReturnType<typeof analyzeTechnique>, samples: TechniqueSample[]) {
  if (samples.length < 8) return "Play at least eight notes so the pattern is long enough to reveal something useful.";
  if (result.timing < 68) return "Your pulse is the clearest opportunity. Use less hand motion, halve the tempo, and listen for equal space between attacks.";
  if (result.evenness < 68) return "The rhythm is stable, but some notes project more than others. Keep the fingertips close and let arm weight travel across the hand.";
  if (result.dynamicRange < 12) return "Your control is consistent. Next, make the phrase speak by planning one clear rise and one release in volume.";
  return "Timing and touch are both reliable. Repeat once while shaping a longer phrase rather than monitoring individual notes.";
}

export function MusicianshipLab({ playedNote, earProgress, onEarProgress, playNotes, midiConnected, onConnectMidi, preferences, onTechniqueResult, playContext, onScreenNote, onImprovisationResult, onSaveImprovisation, onHarmonyResult, activeNotes, theoryProgress, onTheoryProgress }: LabProps) {
  const [lab, setLab] = useState<"ear" | "technique" | "theory" | "improvisation" | "harmony">("ear");
  const [earMode, setEarMode] = useState<"interval" | "chord">("interval");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionSeed, setQuestionSeed] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [techniqueMode, setTechniqueMode] = useState<"evenness" | "pulse" | "dynamics">("evenness");
  const [recording, setRecording] = useState(false);
  const [samples, setSamples] = useState<TechniqueSample[]>([]);
  const receivedTokenRef = useRef(0);

  const intervalPool = INTERVALS.slice(0, Math.min(INTERVALS.length, Math.max(4, earProgress.intervalLevel + 3)));
  const intervalQuestion = intervalPool[(questionIndex * 3 + questionSeed) % intervalPool.length];
  const intervalRoot = 52 + ((questionIndex * 5 + questionSeed * 2) % 9);
  const chordQuestion = CHORD_QUESTIONS[(questionIndex * 3 + questionSeed) % CHORD_QUESTIONS.length];
  const currentAnswer = earMode === "interval" ? intervalQuestion.name : chordQuestion.answer;

  const intervalChoices = useMemo(() => {
    const targetIndex = INTERVALS.findIndex((item) => item.name === intervalQuestion.name);
    return [
      INTERVALS[(targetIndex + INTERVALS.length - 2) % INTERVALS.length].name,
      intervalQuestion.name,
      INTERVALS[(targetIndex + 2) % INTERVALS.length].name,
    ].sort((a, b) => a.localeCompare(b));
  }, [intervalQuestion]);

  const playQuestion = () => {
    if (earMode === "interval") playNotes([intervalRoot, intervalRoot + intervalQuestion.semitones]);
    else playNotes(chordQuestion.notes, true);
  };

  const chooseAnswer = (choice: string) => {
    if (revealed) return;
    const correct = choice === currentAnswer;
    setAnswer(choice);
    setRevealed(true);
    const nextStreak = correct ? earProgress.streak + 1 : 0;
    onEarProgress({
      attempted: earProgress.attempted + 1,
      correct: earProgress.correct + (correct ? 1 : 0),
      streak: nextStreak,
      intervalLevel: correct && nextStreak > 0 && nextStreak % 4 === 0 ? Math.min(7, earProgress.intervalLevel + 1) : earProgress.intervalLevel,
    });
  };

  const nextQuestion = () => {
    setQuestionIndex((value) => value + 1);
    setQuestionSeed((value) => (value + 2) % 7);
    setAnswer(null);
    setRevealed(false);
  };

  useEffect(() => {
    if (!recording || !playedNote || playedNote.token === receivedTokenRef.current) return;
    receivedTokenRef.current = playedNote.token;
    setSamples((current) => [...current, { midi: playedNote.midi, velocity: playedNote.velocity, at: performance.now() }].slice(-64));
  }, [playedNote, recording]);

  const result = analyzeTechnique(samples);
  const accuracy = earProgress.attempted ? Math.round((earProgress.correct / earProgress.attempted) * 100) : 0;
  const creativeDirection = preferences.includes("Ambient")
    ? "Your ambient interest makes timbre and decay especially useful listening targets."
    : preferences.includes("Film & game music")
      ? "For film and game music, notice how interval size changes emotional scale before harmony even arrives."
      : preferences.includes("Music production")
        ? "Treat these as production decisions too: interval, register, and voicing change a sound before any plug-in does."
        : "Connect every sound to a physical shape and a musical function.";

  const toggleTechniqueCapture = () => {
    if (recording && samples.length >= 8) {
      onTechniqueResult({ ...result, mode: techniqueMode, notes: samples.length, completedAt: new Date().toISOString() });
    }
    setRecording((value) => !value);
  };

  return (
    <section className="lab-view">
      <div className="view-intro lab-intro">
        <p className="eyebrow">Musicianship lab</p>
        <h1>Train the part of you<br />that notices.</h1>
        <p>Hearing and physical control are measured separately, then brought back into repertoire and creation.</p>
      </div>

      <div className="lab-tabs" role="tablist" aria-label="Musicianship labs">
        <button className={lab === "ear" ? "active" : ""} onClick={() => setLab("ear")} role="tab" aria-selected={lab === "ear"}><span>01</span><div><strong>Ear laboratory</strong><small>Intervals, color, and function</small></div></button>
        <button className={lab === "technique" ? "active" : ""} onClick={() => setLab("technique")} role="tab" aria-selected={lab === "technique"}><span>02</span><div><strong>Touch laboratory</strong><small>Pulse, evenness, and dynamics</small></div></button>
        <button className={lab === "theory" ? "active" : ""} onClick={() => setLab("theory")} role="tab" aria-selected={lab === "theory"}><span>03</span><div><strong>Theory atlas</strong><small>All keys, chords, and function</small></div></button>
        <button className={lab === "improvisation" ? "active" : ""} onClick={() => setLab("improvisation")} role="tab" aria-selected={lab === "improvisation"}><span>04</span><div><strong>Improvisation studio</strong><small>Motif, harmony, and phrase</small></div></button>
        <button className={lab === "harmony" ? "active" : ""} onClick={() => setLab("harmony")} role="tab" aria-selected={lab === "harmony"}><span>05</span><div><strong>Harmony studio</strong><small>Chords, function, and voice leading</small></div></button>
      </div>

      {lab === "ear" && (
        <div className="ear-lab">
          <aside className="lab-brief">
            <p className="eyebrow">How to listen</p>
            <h2>Do not guess the label first.</h2>
            <ol><li><span>1</span>Hear whether the sound contracts or opens.</li><li><span>2</span>Sing or imagine the upper note.</li><li><span>3</span>Name it, then play it back.</li></ol>
            <p>{creativeDirection}</p>
          </aside>
          <div className="ear-workbench">
            <div className="lab-mode-switch"><button className={earMode === "interval" ? "active" : ""} onClick={() => { setEarMode("interval"); setRevealed(false); setAnswer(null); }}>Intervals</button><button className={earMode === "chord" ? "active" : ""} onClick={() => { setEarMode("chord"); setRevealed(false); setAnswer(null); }}>Chord quality</button></div>
            <div className="ear-question">
              <span>Question {questionIndex + 1}</span>
              <h2>{earMode === "interval" ? "What distance did you hear?" : "What gives this chord its color?"}</h2>
              <button className="listen-orb" onClick={playQuestion} aria-label="Play ear-training question"><i>▶</i><small>Listen again</small></button>
            </div>
            <div className="ear-choices">
              {(earMode === "interval" ? intervalChoices : ["major", "minor", "dominant", "diminished"]).map((choice) => {
                const correct = revealed && choice === currentAnswer;
                const incorrect = revealed && choice === answer && choice !== currentAnswer;
                return <button key={choice} className={correct ? "correct" : incorrect ? "incorrect" : ""} onClick={() => chooseAnswer(choice)} disabled={revealed}><span>{correct ? "✓" : "○"}</span><strong>{choice}</strong></button>;
              })}
            </div>
            {revealed && (
              <div className={answer === currentAnswer ? "ear-explanation correct" : "ear-explanation"}>
                <div><strong>{answer === currentAnswer ? "You heard it." : `This was ${currentAnswer}.`}</strong><span>{earMode === "interval" ? intervalQuestion.character : chordQuestion.name}</span></div>
                <p>{earMode === "interval" ? `${intervalQuestion.semitones} ${intervalQuestion.semitones === 1 ? "semitone" : "semitones"}. ${intervalQuestion.example}. Play the same distance from another root before continuing.` : chordQuestion.reason}</p>
                <button className="primary-button" onClick={nextQuestion}>Next sound →</button>
              </div>
            )}
          </div>
          <div className="ear-score">
            <div><span>Accuracy</span><strong>{accuracy || "–"}{accuracy ? "%" : ""}</strong></div>
            <div><span>Current run</span><strong>{earProgress.streak}</strong></div>
            <div><span>Vocabulary</span><strong>{Math.min(INTERVALS.length, earProgress.intervalLevel + 3)}</strong></div>
            <p>Difficulty expands after four correct answers in a row. An incorrect answer resets the run while preserving everything you have learned.</p>
          </div>
        </div>
      )}

      {lab === "technique" && (
        <div className="technique-lab">
          <div className="technique-header">
            <div><p className="eyebrow">Live analysis</p><h2>Measure the movement, not your worth.</h2><p>Cadence listens for timing and velocity patterns in a short sample. It cannot see posture, fingering, or tension, so those remain your physical checks.</p></div>
            {!midiConnected && <button className="secondary-button" onClick={onConnectMidi}>Connect MIDI for touch data</button>}
          </div>
          <div className="technique-modes">
            {([
              ["evenness", "Scale evenness", "Play C major up and down, slowly"],
              ["pulse", "Repeated-note pulse", "Repeat one note sixteen times"],
              ["dynamics", "Dynamic control", "Four quiet, four medium, four full notes"],
            ] as const).map(([id, title, description]) => <button key={id} className={techniqueMode === id ? "active" : ""} onClick={() => { setTechniqueMode(id); setSamples([]); setRecording(false); }}><strong>{title}</strong><small>{description}</small></button>)}
          </div>
          <div className="technique-capture">
            <div className="capture-status"><span className={recording ? "recording active" : "recording"}><i />{recording ? "Listening to touch" : samples.length ? "Sample paused" : "Ready for a sample"}</span><strong>{samples.length}</strong><small>note attacks</small></div>
            <div className="velocity-trace" aria-label="Velocity trace">{samples.length ? samples.slice(-32).map((sample, index) => <i key={`${sample.at}-${index}`} style={{ height: `${Math.max(8, (sample.velocity / 127) * 100)}%` }} />) : <p>Each bar will show how firmly a note arrived.</p>}</div>
            <div className="capture-actions"><button className="primary-button" onClick={toggleTechniqueCapture} disabled={!midiConnected}>{recording ? "Pause & save sample" : samples.length ? "Continue sample" : "Begin sample"}</button><button className="quiet-button" onClick={() => { setSamples([]); setRecording(false); }}>Clear</button></div>
          </div>
          <div className="technique-results">
            <TechniqueMetric label="Pulse" value={samples.length >= 8 ? result.timing : 0} detail={result.averageGap ? `${result.averageGap} ms average spacing` : "Waiting for a pattern"} />
            <TechniqueMetric label="Touch evenness" value={samples.length >= 8 ? result.evenness : 0} detail={samples.length ? `Velocity center ${result.averageVelocity}` : "Waiting for touch data"} />
            <TechniqueMetric label="Overall control" value={samples.length >= 8 ? result.control : 0} detail={samples.length ? `${result.range} semitone hand range` : "Eight notes minimum"} />
            <article className="technique-advice"><p className="eyebrow">Teacher’s observation</p><p>{techniqueAdvice(result, samples)}</p><span>{techniqueMode === "dynamics" ? `${result.dynamicRange} velocity levels between quietest and strongest` : "Repeat only while the body remains easy"}</span></article>
          </div>
        </div>
      )}

      {lab === "improvisation" && (
        <ImprovisationLab
          playedNote={playedNote}
          preferences={preferences}
          playNotes={playNotes}
          playContext={playContext}
          onScreenNote={onScreenNote}
          onResult={onImprovisationResult}
          onSaveSketch={onSaveImprovisation}
        />
      )}

      {lab === "theory" && (
        <TheoryLab activeNotes={activeNotes} playNotes={playNotes} onScreenNote={onScreenNote} preferences={preferences} progress={theoryProgress} onProgress={onTheoryProgress} />
      )}

      {lab === "harmony" && (
        <HarmonyLab preferences={preferences} playProgression={playContext} onResult={onHarmonyResult} onSaveSketch={onSaveImprovisation} />
      )}
    </section>
  );
}

function TechniqueMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="technique-metric"><div className="metric-dial" style={{ "--metric": `${value * 3.6}deg` } as React.CSSProperties}><span>{value || "–"}{value ? "%" : ""}</span></div><div><strong>{label}</strong><small>{detail}</small></div></article>;
}
