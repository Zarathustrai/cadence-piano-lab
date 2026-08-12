"use client";

import { useMemo, useState } from "react";
import type { EditableSketch, PerformanceNote } from "./composition-workbench";
import { analyzeHarmonyProgression, buildPreset, chordsForKey, HARMONY_KEYS, HARMONY_PRESETS, voiceChord, voiceLeadingDistance } from "./harmony-engine.mjs";

type HarmonySlot = ReturnType<typeof buildPreset>[number];
export type HarmonyResult = ReturnType<typeof analyzeHarmonyProgression> & { keyId: string; chords: string[]; completedAt: string };

type Props = {
  preferences: string[];
  playProgression: (chords: number[][], bpm: number, beatsPerChord: number) => void;
  onResult: (result: HarmonyResult) => void;
  onSaveSketch: (sketch: EditableSketch) => void;
};

function orderedPresets(preferences: string[]) {
  return [...HARMONY_PRESETS].sort((a, b) => Number(preferences.includes(b.direction)) - Number(preferences.includes(a.direction)));
}

export function HarmonyLab({ preferences, playProgression, onResult, onSaveSketch }: Props) {
  const presets = useMemo(() => orderedPresets(preferences), [preferences]);
  const [presetId, setPresetId] = useState(presets[0].id);
  const startingPreset = HARMONY_PRESETS.find((item) => item.id === presetId) ?? presets[0];
  const [keyId, setKeyId] = useState(startingPreset.keyId);
  const [slots, setSlots] = useState<Array<HarmonySlot | null>>(() => buildPreset(startingPreset));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [bpm, setBpm] = useState(76);
  const [saved, setSaved] = useState(false);
  const chords = chordsForKey(keyId);
  const analysis = analyzeHarmonyProgression(slots);
  const activeSlots = slots.filter(Boolean) as HarmonySlot[];

  const loadPreset = (id: string) => {
    const preset = HARMONY_PRESETS.find((item) => item.id === id) ?? HARMONY_PRESETS[0];
    setPresetId(id);
    setKeyId(preset.keyId);
    setSlots(buildPreset(preset));
    setSelectedSlot(0);
    setSaved(false);
  };

  const changeKey = (nextKey: string) => {
    const nextChords = chordsForKey(nextKey);
    setKeyId(nextKey);
    setPresetId("");
    setSlots((current) => current.map((slot) => {
      if (!slot) return null;
      const chord = nextChords.find((item) => item.roman === slot.chord.roman) ?? nextChords[0];
      return { chord, inversion: slot.inversion, voicing: voiceChord(chord, slot.inversion) };
    }));
    setSaved(false);
  };

  const chooseChord = (chord: ReturnType<typeof chordsForKey>[number]) => {
    setSlots((current) => current.map((slot, index) => index === selectedSlot ? { chord, inversion: slot?.inversion ?? 0, voicing: voiceChord(chord, slot?.inversion ?? 0) } : slot));
    setPresetId("");
    setSaved(false);
  };

  const changeInversion = (inversion: number) => {
    setSlots((current) => current.map((slot, index) => index === selectedSlot && slot ? { ...slot, inversion, voicing: voiceChord(slot.chord, inversion) } : slot));
    setPresetId("");
    setSaved(false);
  };

  const hear = () => {
    playProgression(activeSlots.map((slot) => slot.voicing.notes), bpm, 4);
    onResult({ ...analysis, keyId, chords: activeSlots.map((slot) => slot.voicing.label), completedAt: new Date().toISOString() });
  };

  const saveSketch = () => {
    if (!activeSlots.length) return;
    const chordMs = 4 * (60000 / bpm);
    const performance: PerformanceNote[] = activeSlots.flatMap((slot, chordIndex) => slot.voicing.notes.map((midi) => ({ midi, start: chordIndex * chordMs, duration: chordMs * .9, velocity: 78 })));
    const title = HARMONY_PRESETS.find((item) => item.id === presetId)?.title ?? `${HARMONY_KEYS.find((item) => item.id === keyId)?.name} progression`;
    const sketch: EditableSketch = {
      id: `harmony-${Date.now()}`,
      title,
      course: "harmony-lab",
      createdAt: new Date().toISOString(),
      notes: performance.map((event) => event.midi),
      duration: Math.round((activeSlots.length * chordMs) / 1000),
      prompt: `${analysis.observation} Next: ${analysis.nextMove}`,
      performance,
      tempo: bpm,
    };
    onSaveSketch(sketch);
    setSaved(true);
  };

  const selected = slots[selectedSlot];
  const selectedKey = HARMONY_KEYS.find((item) => item.id === keyId) ?? HARMONY_KEYS[0];

  return (
    <div className="harmony-lab">
      <div className="harmony-heading">
        <div><p className="eyebrow">Applied harmony</p><h2>Build the emotional logic, then hear every voice move.</h2><p>Choose chords by function, change their inversion, and compare how the same Roman-numeral path sounds in another key. Cadence explains the cause rather than rating a taste decision.</p></div>
        <label><span>Key center</span><select value={keyId} onChange={(event) => changeKey(event.target.value)}>{HARMONY_KEYS.map((key) => <option key={key.id} value={key.id}>{key.name}</option>)}</select></label>
      </div>

      <div className="harmony-presets" role="tablist" aria-label="Harmony starting points">
        {presets.map((preset) => <button key={preset.id} className={presetId === preset.id ? "active" : ""} role="tab" aria-selected={presetId === preset.id} onClick={() => loadPreset(preset.id)}><span>{preset.direction}</span><strong>{preset.title}</strong><small>{preset.intent}</small></button>)}
      </div>

      <div className="progression-builder">
        <div className="progression-slots" aria-label="Four chord progression">
          {slots.map((slot, index) => {
            const previous = index > 0 ? slots[index - 1] : null;
            const distance = slot && previous ? voiceLeadingDistance(previous.voicing, slot.voicing) : 0;
            return <button key={index} className={selectedSlot === index ? "selected" : ""} onClick={() => setSelectedSlot(index)}><span>{index + 1}</span>{slot ? <><strong>{slot.chord.roman}</strong><b>{slot.voicing.label}</b><small>{slot.chord.function}{index > 0 ? ` · ${distance} semitones moved` : " · establishes center"}</small><i style={{ height: `${Math.max(8, slot.chord.tension)}%` }} aria-label={`${slot.chord.tension}% harmonic tension`} /></> : <><strong>+</strong><small>Add chord</small></>}</button>;
          })}
        </div>

        <section className="chord-editor">
          <div className="editor-title"><div><p className="eyebrow">Chord {selectedSlot + 1}</p><h3>{selected ? `${selected.chord.roman} · ${selected.voicing.label}` : "Choose a function"}</h3></div>{selected && <div className="inversion-switch" aria-label="Chord inversion">{["Root", "1st", "2nd"].map((label, inversion) => <button key={label} className={selected.inversion === inversion ? "active" : ""} onClick={() => changeInversion(inversion)}>{label}</button>)}</div>}</div>
          <div className="degree-palette">
            {chords.map((chord) => <button key={chord.id} className={selected?.chord.roman === chord.roman ? "active" : ""} onClick={() => chooseChord(chord)}><strong>{chord.roman}</strong><span>{chord.name}</span><small>{chord.function}</small></button>)}
          </div>
          {selected && <div className="chord-mechanism"><div><span>Spelling</span><strong>{selected.voicing.notes.map((note) => `${["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"][note % 12]}${Math.floor(note / 12) - 1}`).join(" · ")}</strong></div><p>{selected.chord.function === "Dominant" ? "Dominant function concentrates tendency tones that predict tonic." : selected.chord.function === "Predominant" ? "Predominant function increases motion and prepares a dominant." : selected.chord.function.includes("Tonic") ? "This chord shares tonic stability, but its inversion or quality changes the posture." : "This color can extend or redirect the phrase without erasing the key center."}</p></div>}
        </section>

        <aside className="harmony-analysis">
          <p className="eyebrow">What the progression is doing</p>
          <h3>{analysis.arc}</h3>
          <dl><div><dt>Voice motion</dt><dd>{analysis.motion} semitones</dd></div><div><dt>Smoothness</dt><dd>{analysis.smoothness}%</dd></div><div><dt>Peak tension</dt><dd>{analysis.peakTension}%</dd></div><div><dt>Cadence</dt><dd>{analysis.cadence}</dd></div></dl>
          <div><span>Teacher’s observation</span><p>{analysis.observation}</p></div>
          <div><span>Change one thing</span><p>{analysis.nextMove}</p></div>
        </aside>
      </div>

      <div className="harmony-transport"><label><span>{bpm} BPM</span><input type="range" min="48" max="120" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /></label><p>{selectedKey.name}: the Roman numerals keep their function when you change key, while note names and hand shapes move.</p><button className="secondary-button" onClick={() => selected && playProgression([selected.voicing.notes], bpm, 4)}>▶ Selected chord</button><button className="primary-button" onClick={hear}>▶ Hear progression</button><button className="primary-button" onClick={saveSketch} disabled={saved}>{saved ? "✓ Saved to Sketchbook" : "Save as composition seed"}</button></div>
    </div>
  );
}
