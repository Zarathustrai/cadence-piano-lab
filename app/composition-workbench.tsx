"use client";

import { useMemo, useState } from "react";
import { analyzePerformance, createMidiFile } from "./learning-engine.mjs";

export type PerformanceNote = {
  midi: number;
  start: number;
  duration: number;
  velocity: number;
};

export type EditableSketch = {
  id: string;
  title: string;
  course: string;
  createdAt: string;
  notes: number[];
  duration: number;
  prompt: string;
  performance?: PerformanceNote[];
  tempo?: number;
};

type Props = {
  sketch: EditableSketch;
  preferences: string[];
  onUpdate: (sketch: EditableSketch) => void;
  onClose: () => void;
  onPlay: (performance: PerformanceNote[]) => void;
};

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function musicalProfile(notes: number[]) {
  const counts = Array(12).fill(0) as number[];
  notes.forEach((note) => { counts[note % 12] += 1; });
  const centers = [
    { name: "C major / A minor", tonic: 0, scale: [0, 2, 4, 5, 7, 9, 11] },
    { name: "G major / E minor", tonic: 7, scale: [7, 9, 11, 0, 2, 4, 6] },
    { name: "F major / D minor", tonic: 5, scale: [5, 7, 9, 10, 0, 2, 4] },
    { name: "D minor color", tonic: 2, scale: [2, 4, 5, 7, 9, 10, 0] },
  ];
  const center = centers
    .map((item) => ({ ...item, score: item.scale.reduce((sum, pitch) => sum + counts[pitch], 0) + counts[item.tonic] * 0.6 }))
    .sort((a, b) => b.score - a.score)[0];
  const unique = counts.filter(Boolean).length;
  const repeated = Math.max(...counts, 0);
  return {
    center: center?.name ?? "Open tonal field",
    vocabulary: unique,
    motifStrength: notes.length ? Math.round((repeated / notes.length) * 100) : 0,
    range: notes.length ? Math.max(...notes) - Math.min(...notes) : 0,
  };
}

function safeFilename(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cadence-sketch";
}

function performanceFromSketch(sketch: EditableSketch): PerformanceNote[] {
  if (sketch.performance?.length) return sketch.performance.map((event) => ({ ...event }));
  return sketch.notes.map((midi, index) => ({ midi, start: index * 500, duration: 280, velocity: 88 }));
}

export function CompositionWorkbench({ sketch, preferences, onUpdate, onClose, onPlay }: Props) {
  const [performance, setPerformance] = useState(() => performanceFromSketch(sketch));
  const [title, setTitle] = useState(sketch.title);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [bpm, setBpm] = useState(sketch.tempo ?? 92);
  const [saved, setSaved] = useState(true);
  const notes = performance.map((event) => event.midi);
  const profile = useMemo(() => musicalProfile(notes), [notes]);
  const expressiveProfile = useMemo(() => analyzePerformance(performance), [performance]);
  const low = notes.length ? Math.min(...notes) : 48;
  const high = notes.length ? Math.max(...notes) : 72;
  const span = Math.max(12, high - low);
  const totalMs = Math.max(1000, ...performance.map((event) => event.start + event.duration));

  const changePerformance = (next: PerformanceNote[]) => {
    setPerformance(next.map((event) => ({
      ...event,
      midi: Math.max(24, Math.min(108, event.midi)),
      start: Math.max(0, event.start),
      duration: Math.max(40, event.duration),
      velocity: Math.max(1, Math.min(127, event.velocity)),
    })).sort((a, b) => a.start - b.start));
    setSaved(false);
    if (selectedIndex !== null && selectedIndex >= next.length) setSelectedIndex(null);
  };

  const updateSelectedPitch = (amount: number) => {
    if (selectedIndex === null) return;
    changePerformance(performance.map((event, index) => index === selectedIndex ? { ...event, midi: event.midi + amount } : event));
  };

  const updateSelectedExpression = (field: "duration" | "velocity", amount: number) => {
    if (selectedIndex === null) return;
    changePerformance(performance.map((event, index) => index === selectedIndex ? { ...event, [field]: event[field] + amount } : event));
  };

  const save = () => {
    const duration = Math.max(1, Math.round(totalMs / 1000));
    onUpdate({ ...sketch, title, notes, performance, duration, tempo: bpm });
    setSaved(true);
  };

  const exportMidi = () => {
    const bytes = createMidiFile(performance, bpm);
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/midi" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(title)}.mid`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const quantize = () => {
    const grid = 60000 / bpm / 2;
    changePerformance(performance.map((event) => ({
      ...event,
      start: Math.round(event.start / grid) * grid,
      duration: Math.max(grid / 2, Math.round(event.duration / grid) * grid),
    })));
  };

  const repeat = () => {
    const beat = 60000 / bpm;
    const offset = Math.ceil(totalMs / beat) * beat;
    changePerformance([...performance, ...performance.map((event) => ({ ...event, start: event.start + offset }))]);
  };

  const productionStyle = preferences.includes("Ambient")
    ? { bass: "Soft sine or felt low piano", harmony: "Long granular or analog pad", lead: "Felt piano with softened attack", space: "Long dark reverb, filtered return" }
    : preferences.includes("Film & game music")
      ? { bass: "Low piano doubled by cello", harmony: "Warm strings or evolving pad", lead: "Intimate piano or woodwind", space: "One shared scoring-stage reverb" }
      : preferences.includes("Songwriting")
        ? { bass: "Simple root movement", harmony: "Piano or guitar midrange", lead: "Voice owns the focal register", space: "Short plate and a quiet delay" }
        : { bass: "Round mono bass below C3", harmony: "Open pad or keys", lead: "Piano phrase above C4", space: "One intentional send, automated by section" };

  return (
    <section className="composition-workbench">
      <div className="workbench-topbar">
        <button className="rail-back" onClick={onClose}>← Sketchbook</button>
        <span>{saved ? "All changes saved locally" : "Unsaved changes"}</span>
        <div><button className="secondary-button" onClick={() => onPlay(performance)} disabled={!notes.length}>▶ Play with expression</button><button className="primary-button" onClick={save} disabled={saved}>Save revision</button></div>
      </div>

      <div className="workbench-title">
        <p className="eyebrow">Composition studio</p>
        <textarea rows={2} value={title} onChange={(event) => { setTitle(event.target.value); setSaved(false); }} aria-label="Sketch title" />
        <p>{sketch.prompt}</p>
      </div>

      <div className="workbench-grid">
        <section className="piano-roll-editor">
          <div className="editor-heading"><div><p className="eyebrow">Phrase editor</p><h2>Keep the identity, change one property.</h2></div><label><span>{bpm} BPM</span><input type="range" min="50" max="150" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /></label></div>
          <div className="piano-roll" aria-label="Editable note sequence">
            <div className="roll-lines">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ bottom: `${index * 12.5}%` }} />)}</div>
            {performance.map((event, index) => (
              <button key={`${index}-${event.midi}-${event.start}`} className={selectedIndex === index ? "selected" : ""} style={{ left: `${(event.start / totalMs) * 96}%`, bottom: `${((event.midi - low) / span) * 76 + 8}%`, width: `${Math.max(1.4, (event.duration / totalMs) * 96)}%`, opacity: Math.max(.48, event.velocity / 127) }} onClick={() => setSelectedIndex(index)} aria-label={`Note ${index + 1}: ${noteName(event.midi)}, ${Math.round(event.duration)} milliseconds, velocity ${event.velocity}`}><span>{noteName(event.midi)}</span></button>
            ))}
            {!notes.length && <p>There are no notes in this revision.</p>}
          </div>
          <div className="edit-tools">
            <div><span>Selected note</span><strong>{selectedIndex === null ? "Choose a note above" : `${selectedIndex + 1}. ${noteName(performance[selectedIndex].midi)} · ${Math.round(performance[selectedIndex].duration)} ms · v${performance[selectedIndex].velocity}`}</strong></div>
            <button onClick={() => updateSelectedPitch(-1)} disabled={selectedIndex === null}>− semitone</button>
            <button onClick={() => updateSelectedPitch(1)} disabled={selectedIndex === null}>+ semitone</button>
            <button onClick={() => updateSelectedExpression("duration", -80)} disabled={selectedIndex === null}>Shorter</button>
            <button onClick={() => updateSelectedExpression("duration", 80)} disabled={selectedIndex === null}>Longer</button>
            <button onClick={() => updateSelectedExpression("velocity", -8)} disabled={selectedIndex === null}>Softer</button>
            <button onClick={() => updateSelectedExpression("velocity", 8)} disabled={selectedIndex === null}>Stronger</button>
            <button onClick={() => selectedIndex !== null && changePerformance(performance.filter((_, index) => index !== selectedIndex))} disabled={selectedIndex === null}>Delete</button>
          </div>
          <div className="transform-row">
            <span>Develop the motif</span>
            <button onClick={quantize}>Quantize 1/8</button>
            <button onClick={repeat}>Repeat in time</button>
            <button onClick={() => changePerformance(performance.map((event, index) => ({ ...event, midi: performance[performance.length - index - 1].midi })))}>Reverse contour</button>
            <button onClick={() => changePerformance(performance.map((event) => ({ ...event, midi: event.midi + 2 })))}>Transpose +2</button>
            <button onClick={() => changePerformance(performance.map((event, index) => index % 2 ? { ...event, midi: event.midi + 12 } : event))}>Open register</button>
            <button onClick={() => changePerformance(performance.slice(0, Math.max(1, Math.ceil(performance.length / 2))))}>Distill</button>
          </div>
        </section>

        <aside className="composition-analysis">
          <p className="eyebrow">Music microscope</p>
          <h2>What the sketch already contains</h2>
          <dl><div><dt>Tonal field</dt><dd>{profile.center}</dd></div><div><dt>Pitch vocabulary</dt><dd>{profile.vocabulary} classes</dd></div><div><dt>Range</dt><dd>{profile.range} semitones</dd></div><div><dt>Phrase length</dt><dd>{(expressiveProfile.duration / 1000).toFixed(1)} sec</dd></div><div><dt>Dynamic range</dt><dd>{expressiveProfile.dynamicRange || "Even"}</dd></div><div><dt>Rhythmic variation</dt><dd>{expressiveProfile.gapVariation}%</dd></div><div><dt>Motif signal</dt><dd>{profile.motifStrength}% repetition</dd></div></dl>
          <div className="analysis-observation"><span>Observation</span><p>{expressiveProfile.dynamicRange < 10 ? "The touch is intentionally even. Plan one dynamic destination so the phrase has a foreground and a release." : profile.motifStrength < 18 ? "The pitch material changes often. Repeat a short cell before adding another idea." : profile.motifStrength > 45 ? "One pitch strongly anchors the phrase. Change its rhythm or harmony before changing the note." : "There is enough repetition to create identity without becoming static, and your timing remains visible rather than being flattened."}</p></div>
        </aside>
      </div>

      <section className="production-map">
        <div className="production-map-heading"><div><p className="eyebrow">Production handoff</p><h2>Turn one piano performance into four roles.</h2></div><button className="primary-button" onClick={exportMidi} disabled={!notes.length}>Export MIDI for your DAW ↓</button></div>
        <div className="production-roles">
          <article><span>01 · Bass</span><strong>{productionStyle.bass}</strong><p>Use the lowest structural notes, simplify rhythm, keep the center solid.</p></article>
          <article><span>02 · Harmony</span><strong>{productionStyle.harmony}</strong><p>Spread the chord tones above the bass. Remove notes that compete with the lead.</p></article>
          <article><span>03 · Lead</span><strong>{productionStyle.lead}</strong><p>Preserve the most memorable contour and give it the clearest articulation.</p></article>
          <article><span>04 · Space</span><strong>{productionStyle.space}</strong><p>Use silence and decay to reveal form, not to hide an unfinished arrangement.</p></article>
        </div>
      </section>
    </section>
  );
}
