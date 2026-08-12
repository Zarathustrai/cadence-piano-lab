# Cadence

Cadence is a browser-based piano education studio built for a Casio CT-S1 or any class-compliant MIDI keyboard. It combines real-time Web MIDI input, structured classical study, theory and harmony, ear and touch training, improvisation, composition projects, production thinking, and device-local progress.

**Live app:** [cadence-piano-lab.vercel.app](https://cadence-piano-lab.vercel.app)

## Run locally

Requirements:

- Node.js 22.13 or newer
- Chrome or Edge for Web MIDI
- A USB data cable for the keyboard

Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Connect the keyboard

1. Connect the Casio CT-S1 to the computer with a USB-C data cable.
2. Open Cadence in Chrome or Edge.
3. Select **Connect MIDI**.
4. Allow MIDI access when the browser asks.
5. Play a note. The live readout should show its name immediately.

No keyboard is required for testing. Click the on-screen piano or use the computer keys `A W S E D F T G Y H U J K`.

## Learning flow

The curriculum covers:

1. Keyboard geography
2. Intervals
3. Scales
4. Chords
5. Rhythm
6. Bach, Prelude in C
7. Minuet in G
8. Beethoven, Ode to Joy
9. Satie, Gymnopédie No. 1
10. Chopin, Prelude in E minor
11. Improvisation
12. Composition

The full local score library includes Beethoven's *Ode to Joy*, Bach's *Prelude in C major*, Petzold's *Minuet in G*, Satie's *Gymnopédie No. 1*, and Chopin's *Prelude in E minor*. Each work has section-level harmonic analysis, voice-leading explanations, listening prompts, and playable experiments.

The **Musicianship Lab** contains adaptive Ear, Touch, Theory, Improvisation, and Harmony studios. The Theory Atlas covers all twelve tonal centers, major, natural minor, harmonic minor, Dorian, and Mixolydian scales, correctly spelled diatonic harmony, eleven chord qualities and extensions, inversions, function, production translation, and MIDI or on-screen chord-building proofs. Improvised phrases and chord progressions can be saved as expressive source material.

The **Composition Project Studio** develops that material through an A–A′–B–A form. It teaches source selection, motif transformation, harmonic function, texture, dynamics, arrangement roles, listening reflections, and a revision ledger. A complete project can be rendered as an expressive rehearsal sketch, refined in the phrase editor, and exported as MIDI for a DAW.

The **Music microscope** explains chord function and suggests listening experiments. The drill generator uses deterministic local coaching in this MVP, isolated in `app/coach.ts` so a server-side LLM provider can replace it later without changing the lesson interface.

## Data and privacy

Progress, practice time, score sessions, lab history, sketches, and composition projects are stored in the browser under `cadence.education.v2`. Cadence has no account system and does not send practice data to a server.

## Verification

```bash
npm run lint
npm test
```

`npm test` creates the production build and checks the rendered app, Web MIDI progression, chord recognition, full score archives, expressive MIDI, adaptive review, harmony and improvisation analysis, composition form assembly, local persistence, and the isolated coaching layer.
