"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { derivePlacementProfile } from "./learning-engine.mjs";
import type { LivePlayedNote } from "./musicianship-lab";

export type PlacementProfile = ReturnType<typeof derivePlacementProfile> & {
  completedAt: string;
};

type Props = {
  playedNote: LivePlayedNote;
  playNotes: (notes: number[], together?: boolean) => void;
  onInputNote: (midi: number) => void;
  midiConnected: boolean;
  onConnectMidi: () => void;
  onComplete: (profile: PlacementProfile) => void;
  onExit: () => void;
};

const GEOGRAPHY_TARGETS = [60, 65, 67];
const NOTE_NAMES = ["C4", "C♯4", "D4", "E♭4", "E4", "F4", "F♯4", "G4", "A♭4", "A4", "B♭4", "B4"];
const SCREEN_NOTES = [60, 62, 64, 65, 67, 69, 71];

function noteName(midi: number) {
  return NOTE_NAMES[(midi - 60 + 12) % 12] ?? `MIDI ${midi}`;
}

export function PlacementAssessment({ playedNote, playNotes, onInputNote, midiConnected, onConnectMidi, onComplete, onExit }: Props) {
  const [stage, setStage] = useState(0);
  const [scores, setScores] = useState({ geography: 0, ear: 0, chords: 0, theory: 0 });
  const [geographyIndex, setGeographyIndex] = useState(0);
  const [geographyMistakes, setGeographyMistakes] = useState(0);
  const [chordNotes, setChordNotes] = useState<number[]>([]);
  const [chordMistakes, setChordMistakes] = useState(0);
  const [earAttempts, setEarAttempts] = useState(0);
  const [theoryAttempts, setTheoryAttempts] = useState(0);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState("This is a calibration, not an exam. It only changes what Cadence recommends first.");
  const receivedTokenRef = useRef(0);

  const profile = useMemo(() => derivePlacementProfile(scores), [scores]);

  useEffect(() => {
    if (!playedNote || playedNote.token === receivedTokenRef.current || complete) return;
    receivedTokenRef.current = playedNote.token;
    window.queueMicrotask(() => {
      if (stage === 1) {
      const expected = GEOGRAPHY_TARGETS[geographyIndex];
      if (playedNote.midi === expected) {
        const nextIndex = geographyIndex + 1;
        if (nextIndex === GEOGRAPHY_TARGETS.length) {
          setGeographyIndex(nextIndex);
          setScores((current) => ({ ...current, geography: Math.max(45, 100 - geographyMistakes * 20) }));
          setComplete(true);
          setFeedback("The three landmarks are in place. Cadence is measuring how directly you found them, not how fast you played.");
        } else {
          setGeographyIndex(nextIndex);
          setFeedback(`Found ${noteName(playedNote.midi)}. Now find ${noteName(GEOGRAPHY_TARGETS[nextIndex])}.`);
        }
      } else {
        setGeographyMistakes((value) => value + 1);
        setFeedback(`${noteName(playedNote.midi)} arrived. Look for ${noteName(expected)} from its black-key landmark and try again.`);
      }
      }
      if (stage === 3) {
      const pitch = playedNote.midi % 12;
      const next = [...new Set([...chordNotes, pitch])];
      setChordNotes(next);
      const required = [0, 4, 7];
      if (required.every((item) => next.includes(item))) {
        const extras = next.filter((item) => !required.includes(item)).length;
        setScores((current) => ({ ...current, chords: Math.max(45, 100 - (chordMistakes + extras) * 18) }));
        setComplete(true);
        setFeedback("C major is complete: root, major third, and fifth. Inversions would count too because pitch function matters more than shape.");
      } else if (!required.includes(pitch)) {
        setChordMistakes((value) => value + 1);
        setFeedback(`${noteName(playedNote.midi)} is outside C major. Keep C, E, and G in the sound.`);
      } else {
        const missing = required.filter((item) => !next.includes(item)).map((item) => NOTE_NAMES[item]);
        setFeedback(`${noteName(playedNote.midi)} is part of the chord. Add ${missing.join(" and ")}.`);
      }
      }
    });
  }, [chordMistakes, chordNotes, complete, geographyIndex, geographyMistakes, playedNote, stage]);

  const answerEar = (answer: string) => {
    if (complete) return;
    const attempts = earAttempts + 1;
    setEarAttempts(attempts);
    if (answer === "Perfect fifth") {
      setScores((current) => ({ ...current, ear: attempts === 1 ? 100 : attempts === 2 ? 72 : 50 }));
      setComplete(true);
      setFeedback("Yes. C to G is seven semitones and five letter names: a perfect fifth. Its openness becomes the frame of many chords and bass relationships.");
    } else {
      setFeedback("Listen once more. Is the upper note close, moderately open, or as stable as the outer frame of a triad?");
      playNotes([60, 67]);
    }
  };

  const answerTheory = (answer: string) => {
    if (complete) return;
    const attempts = theoryAttempts + 1;
    setTheoryAttempts(attempts);
    if (answer === "Lower the third") {
      setScores((current) => ({ ...current, theory: attempts === 1 ? 100 : attempts === 2 ? 72 : 50 }));
      setComplete(true);
      setFeedback("Exactly. C–E–G becomes C–E♭–G. One semitone in the middle changes the chord’s quality while root and fifth remain.");
    } else {
      setFeedback("Keep the chord’s identity and outer frame in mind. Which single inner note carries major or minor quality?");
    }
  };

  const advance = () => {
    setComplete(false);
    setFeedback(stage === 0 ? "Find each note from the two-black and three-black key pattern rather than counting from the edge." : "Take one breath, then continue when the sound is clear in your mind.");
    setStage((value) => value + 1);
    setChordNotes([]);
  };

  const finish = () => onComplete({ ...profile, completedAt: new Date().toISOString() });

  return (
    <section className="placement-view">
      <div className="placement-topbar"><button className="rail-back" onClick={onExit}>← Today</button><span>Private · saved only in this browser</span></div>
      <div className="placement-heading"><p className="eyebrow">Starting-point calibration</p><h1>Show what already feels<br />available to you.</h1><p>Four small musical tasks reveal where instruction should begin. Nothing is locked or skipped permanently.</p></div>

      <div className="placement-progress" aria-label="Assessment progress">{["Orient", "Hear", "Build", "Explain"].map((label, index) => <div key={label} className={stage > index ? "complete" : stage === index + 1 ? "active" : ""}><i>{stage > index + 1 ? "✓" : index + 1}</i><span>{label}</span></div>)}</div>

      {stage === 0 && <section className="placement-intro-card"><div><p className="eyebrow">About five minutes</p><h2>This will not test repertoire or speed.</h2><p>It samples four prerequisites: keyboard geography, interval hearing, chord construction, and causal theory. Your classical and creative path stays visible whatever the result.</p></div><ol><li><span>01</span>Play three landmark notes</li><li><span>02</span>Identify one interval by ear</li><li><span>03</span>Build a major triad</li><li><span>04</span>Explain what makes it minor</li></ol><button className="primary-button" onClick={advance}>Begin calibration →</button></section>}

      {stage > 0 && stage < 5 && <div className="placement-workspace">
        <section className="placement-task">
          <p className="eyebrow">Task {stage} of 4</p>
          {stage === 1 && <><h2>Find C4, then F4, then G4.</h2><p>Use the black-key groups as landmarks. The keyboard or computer keys both count.</p><div className="placement-target"><span>{complete ? "Landmarks found" : "Now find"}</span><strong>{complete ? "C · F · G" : noteName(GEOGRAPHY_TARGETS[geographyIndex])}</strong><small>{Math.min(3, geographyIndex)} of 3 found</small></div></>}
          {stage === 2 && <><h2>What interval opens from C to this note?</h2><p>Listen for size and stability before choosing a name.</p><button className="listen-orb placement-listen" onClick={() => playNotes([60, 67])}><i>▶</i><small>Hear C, then the interval</small></button><div className="placement-answers">{["Major third", "Perfect fourth", "Perfect fifth"].map((answer) => <button key={answer} onClick={() => answerEar(answer)} disabled={complete}>{answer}</button>)}</div></>}
          {stage === 3 && <><h2>Build C major from meaning, not shape.</h2><p>Add its root, major third, and fifth. Any octave or inversion is accepted from MIDI.</p><div className="placement-chord"><span>{["C", "E", "G"].map((name, index) => <i key={name} className={chordNotes.includes([0, 4, 7][index]) ? "found" : ""}>{chordNotes.includes([0, 4, 7][index]) ? "✓" : name}</i>)}</span><strong>{chordNotes.length ? chordNotes.map((pitch) => NOTE_NAMES[pitch].replace("4", "")).join(" · ") : "Waiting for chord tones"}</strong></div></>}
          {stage === 4 && <><h2>How does C major become C minor?</h2><p>Choose the mechanism you could demonstrate immediately at the keyboard.</p><div className="placement-answers theory">{["Lower the third", "Raise the root", "Remove the fifth"].map((answer) => <button key={answer} onClick={() => answerTheory(answer)} disabled={complete}>{answer}</button>)}</div></>}
          <div className={complete ? "placement-feedback complete" : "placement-feedback"}><span>{complete ? "✓" : "→"}</span><p>{feedback}</p></div>
          {complete && <button className="primary-button placement-continue" onClick={advance}>{stage === 4 ? "See my starting profile" : "Continue →"}</button>}
        </section>
        <aside className="placement-input">
          <div><p className="eyebrow">Input</p><strong>{midiConnected ? "MIDI keyboard connected" : "Use these keys or connect MIDI"}</strong>{!midiConnected && <button className="quiet-button" onClick={onConnectMidi}>Connect keyboard</button>}</div>
          <div className="assessment-keys">{SCREEN_NOTES.map((midi) => <button key={midi} onClick={() => onInputNote(midi)} aria-label={`Play ${noteName(midi)}`}><span>{noteName(midi)}</span></button>)}</div>
          <p>Computer keys A S D F G H J play the same white notes.</p>
        </aside>
      </div>}

      {stage === 5 && <section className="placement-result">
        <div className="placement-result-main"><p className="eyebrow">Your starting profile</p><strong>{profile.overall}%</strong><h2>Begin with {profile.recommendedCourseId === "keyboard" ? "keyboard geography" : profile.recommendedCourseId === "intervals" ? "intervals and hearing" : profile.recommendedCourseId === "triads" ? "triads from first principles" : "functional harmony"}.</h2><p>{profile.reason}</p><button className="primary-button" onClick={finish}>Use this starting point →</button></div>
        <dl>{(["geography", "ear", "chords", "theory"] as const).map((skill) => <div key={skill}><dt>{skill[0].toUpperCase() + skill.slice(1)}</dt><dd>{profile[skill]}%</dd><span><i style={{ width: `${profile[skill]}%` }} /></span></div>)}</dl>
        <p className="placement-result-note">This recommendation changes the next lesson and practice plan. It does not erase earlier courses, and your composition and production direction remains part of every stage.</p>
      </section>}
    </section>
  );
}
