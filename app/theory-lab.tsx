"use client";

import { useMemo, useState } from "react";
import { samePitchSet } from "./music-engine.mjs";
import { buildChord, buildDiatonicHarmony, buildScale, CHORD_QUALITIES, diatonicChordToMidi, SCALE_MODES, THEORY_ROOTS } from "./theory-engine.mjs";

export type TheoryProgress = {
  exploredKeys: string[];
  exploredChords: string[];
  attempts: number;
  correct: number;
};

type Props = {
  activeNotes: number[];
  playNotes: (notes: number[], together?: boolean) => void;
  onScreenNote: (midi: number) => void;
  preferences: string[];
  progress: TheoryProgress;
  onProgress: (progress: TheoryProgress) => void;
};

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function TheoryLab({ activeNotes, playNotes, onScreenNote, preferences, progress, onProgress }: Props) {
  const [root, setRoot] = useState("C");
  const [mode, setMode] = useState("major");
  const [selectedDegree, setSelectedDegree] = useState(0);
  const [builderRoot, setBuilderRoot] = useState("C");
  const [quality, setQuality] = useState("major");
  const [inversion, setInversion] = useState(0);
  const [challengeSeed, setChallengeSeed] = useState(0);
  const [screenHeld, setScreenHeld] = useState<number[]>([]);
  const [challengeResult, setChallengeResult] = useState<"correct" | "incorrect" | null>(null);

  const scale = useMemo(() => buildScale(root, mode), [root, mode]);
  const harmony = useMemo(() => buildDiatonicHarmony(root, mode), [root, mode]);
  const selectedHarmony = harmony[selectedDegree];
  const selectedHarmonyMidi = useMemo(() => diatonicChordToMidi(selectedHarmony), [selectedHarmony]);
  const builtChord = useMemo(() => buildChord(builderRoot, quality, inversion), [builderRoot, quality, inversion]);
  const challengeDegree = (challengeSeed * 3 + 4) % 7;
  const challengeChord = harmony[challengeDegree];
  const challengeMidi = useMemo(() => diatonicChordToMidi(challengeChord), [challengeChord]);
  const responseNotes = useMemo(
    () => [...new Map([...screenHeld, ...activeNotes].map((note) => [note % 12, note])).values()],
    [activeNotes, screenHeld],
  );
  const modeInfo = SCALE_MODES.find((item) => item.id === mode) ?? SCALE_MODES[0];

  const personalizedApplication = preferences.includes("Film & game music")
    ? `For scoring: audition ${root} ${modeInfo.name.toLowerCase()} as a scene color, then borrow one chord from its parallel mode when the emotional frame changes.`
    : preferences.includes("Ambient")
      ? `For ambient writing: treat ${root} ${modeInfo.name.toLowerCase()} as a pitch field. Let common tones persist while bass and texture create the harmonic change.`
      : preferences.includes("Music production")
        ? `For production: write the bass from roots first, then voice the third and color tones above C4 so the harmonic identity survives the mix.`
        : `Transfer this key immediately: play its tonic, predominant, dominant, and tonic as one harmonic sentence.`;

  const exploreKey = (nextRoot: string, nextMode = mode) => {
    setRoot(nextRoot);
    setMode(nextMode);
    setSelectedDegree(0);
    setScreenHeld([]);
    setChallengeResult(null);
    onProgress({ ...progress, exploredKeys: unique([...progress.exploredKeys, `${nextRoot}:${nextMode}`]) });
  };

  const chooseMode = (nextMode: string) => exploreKey(root, nextMode);

  const chooseHarmony = (index: number) => {
    const chord = harmony[index];
    setSelectedDegree(index);
    playNotes(diatonicChordToMidi(chord), true);
    onProgress({ ...progress, exploredChords: unique([...progress.exploredChords, `${root}:${mode}:${chord.roman}`]) });
  };

  const chooseQuality = (nextQuality: string) => {
    setQuality(nextQuality);
    setInversion(0);
    const chord = buildChord(builderRoot, nextQuality, 0);
    onProgress({ ...progress, exploredChords: unique([...progress.exploredChords, `${builderRoot}:${nextQuality}`]) });
    playNotes(chord.midi, true);
  };

  const toggleResponsePitch = (pitchClass: number) => {
    const midi = 60 + pitchClass;
    setScreenHeld((current) => current.some((note) => note % 12 === pitchClass) ? current.filter((note) => note % 12 !== pitchClass) : [...current, midi]);
    setChallengeResult(null);
    onScreenNote(midi);
  };

  const checkChallenge = () => {
    const correct = samePitchSet(responseNotes, challengeMidi);
    setChallengeResult(correct ? "correct" : "incorrect");
    onProgress({
      ...progress,
      attempts: progress.attempts + 1,
      correct: progress.correct + (correct ? 1 : 0),
      exploredChords: correct ? unique([...progress.exploredChords, `${root}:${mode}:${challengeChord.roman}`]) : progress.exploredChords,
    });
  };

  const nextChallenge = () => {
    setChallengeSeed((value) => value + 1);
    setScreenHeld([]);
    setChallengeResult(null);
  };

  return (
    <div className="theory-lab">
      <header className="theory-heading">
        <div><p className="eyebrow">Interactive theory atlas</p><h2>Every key is one system moved to a new home.</h2><p>Construct the scale, see which chords belong to it, hear their function, then prove the relationship at the keyboard.</p></div>
        <div className="theory-key-controls">
          <label><span>Tonal center</span><select value={root} onChange={(event) => exploreKey(event.target.value)}>{THEORY_ROOTS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Scale system</span><select value={mode} onChange={(event) => chooseMode(event.target.value)}>{SCALE_MODES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
      </header>

      <section className="scale-map">
        <div className="scale-map-copy"><span>{root} {modeInfo.name}</span><strong>{modeInfo.character}</strong><p>{modeInfo.application}</p></div>
        <div className="scale-degrees">{scale.map((note) => <button key={`${note.degree}-${note.name}`} onClick={() => playNotes([60 + note.pitchClass])} aria-label={`Hear ${note.name}, degree ${note.degree}`}><span>{note.degree}</span><strong>{note.name}</strong><small>{note.degreeName}</small><i>{note.interval} st</i></button>)}</div>
      </section>

      <div className="theory-workspace">
        <section className="diatonic-harmony">
          <div className="theory-section-heading"><div><p className="eyebrow">Diatonic harmony</p><h3>Stack alternate scale notes.</h3></div><button className="secondary-button" onClick={() => playNotes(harmony.flatMap((chord, index) => diatonicChordToMidi(chord).map((note) => note + index * 0)), false)}>Hear chord roots</button></div>
          <div className="harmony-family" role="list">{harmony.map((chord, index) => <button key={`${chord.roman}-${chord.name}`} className={selectedDegree === index ? "active" : ""} onClick={() => chooseHarmony(index)} role="listitem"><span>{chord.roman}</span><strong>{chord.name}</strong><small>{chord.notes.join(" · ")}</small><i>{chord.function}</i></button>)}</div>
          <div className="harmony-microscope">
            <div><span>Selected harmony</span><strong>{selectedHarmony.roman} · {selectedHarmony.name}</strong><small>{selectedHarmony.quality} triad · {selectedHarmony.function}</small></div>
            <p>{selectedHarmony.explanation}</p>
            <button className="quiet-button" onClick={() => playNotes(selectedHarmonyMidi, true)}>▶ Hear together</button>
          </div>
          <div className="degree-tendency"><span>Melodic gravity of degree {selectedDegree + 1}</span><p>{scale[selectedDegree].tendency}</p></div>
        </section>

        <aside className="theory-transfer">
          <p className="eyebrow">Apply it</p>
          <h3>Knowledge becomes useful when it changes a choice.</h3>
          <p>{personalizedApplication}</p>
          <ol><li><span>1</span>Play I or i and listen for home.</li><li><span>2</span>Choose a predominant-family chord and notice departure.</li><li><span>3</span>Use dominant-family tension only when you want arrival.</li></ol>
          <div><span>Exploration evidence</span><strong>{progress.exploredKeys.length} key systems · {progress.exploredChords.length} chord relationships</strong></div>
        </aside>
      </div>

      <section className="chord-builder">
        <div className="builder-heading"><div><p className="eyebrow">Chord construction</p><h3>Change one ingredient, hear what it contributes.</h3><p>Chord symbols summarize intervals. The spelling shows how each tone functions.</p></div><button className="primary-button" onClick={() => playNotes(builtChord.midi, true)}>▶ Hear {builtChord.chordName}</button></div>
        <div className="builder-controls">
          <label><span>Root</span><select value={builderRoot} onChange={(event) => { setBuilderRoot(event.target.value); setInversion(0); }}>{THEORY_ROOTS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Quality or color</span><select value={quality} onChange={(event) => chooseQuality(event.target.value)}>{CHORD_QUALITIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span>Bass position</span><select value={inversion} onChange={(event) => setInversion(Number(event.target.value))}>{builtChord.notes.map((_, index) => <option key={index} value={index}>{index === 0 ? "Root position" : index === 1 ? "First inversion" : index === 2 ? "Second inversion" : "Third inversion"}</option>)}</select></label>
        </div>
        <div className="built-chord">
          <div className="chord-symbol"><strong>{builtChord.chordName}</strong><span>{builtChord.notes.join(" · ")}</span><small>{builtChord.inversionName}, {builtChord.bassName} in the bass</small></div>
          <div><span>Why it sounds this way</span><p>{builtChord.mechanism}</p></div>
          <div><span>Harmonic use</span><p>{builtChord.function}</p></div>
          <div><span>Production translation</span><p>{builtChord.production}</p></div>
        </div>
      </section>

      <section className="theory-challenge">
        <div className="challenge-brief"><p className="eyebrow">Keyboard proof</p><h3>Build {challengeChord.roman} in {root} {modeInfo.name.toLowerCase()}.</h3><p>Use the scale map and chord-stacking rule. Hold it on your MIDI keyboard, or select pitch classes below, then check the chord.</p><strong>{challengeChord.function}</strong></div>
        <div className="pitch-response" aria-label="On-screen chord response">{THEORY_ROOTS.map((name, pitchClass) => {
          const selected = responseNotes.some((note) => note % 12 === pitchClass);
          return <button key={name} className={selected ? "active" : ""} aria-pressed={selected} onClick={() => toggleResponsePitch(pitchClass)}><strong>{name}</strong><small>{selected ? "Held" : ""}</small></button>;
        })}</div>
        <div className="challenge-check"><div><span>Your chord</span><strong>{responseNotes.length ? responseNotes.map(noteName).join(" · ") : "No notes held yet"}</strong></div><button className="primary-button" disabled={!responseNotes.length} onClick={checkChallenge}>Check chord</button><button className="quiet-button" onClick={() => { setScreenHeld([]); setChallengeResult(null); }}>Clear</button></div>
        {challengeResult && <div className={`challenge-feedback ${challengeResult}`}><div><strong>{challengeResult === "correct" ? `${challengeChord.name} is correct.` : "The pitch set is not complete yet."}</strong><span>{challengeResult === "correct" ? challengeChord.notes.join(" · ") : "Stack every other note from the scale degree shown above."}</span></div><p>{challengeResult === "correct" ? `${challengeChord.explanation} Play it once more while listening from the bass upward.` : `You need ${challengeMidi.length} different pitch classes. Octave and inversion do not change the answer.`}</p>{challengeResult === "correct" && <button className="secondary-button" onClick={nextChallenge}>Next relationship →</button>}</div>}
      </section>
    </div>
  );
}
