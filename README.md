# Cadence

Cadence is a browser-based piano learning studio built for a Casio CT-S1 or any class-compliant MIDI keyboard. It combines real-time Web MIDI input, a playable on-screen keyboard, structured classical lessons, theory explanations, timing and accuracy feedback, mistake-based drills, and device-local progress.

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

The **Music microscope** explains chord function and suggests listening experiments. The drill generator uses deterministic local coaching in this MVP, isolated in `app/coach.ts` so a server-side LLM provider can replace it later without changing the lesson interface.

## Data and privacy

Progress, practice time, and the current lesson are stored in the browser under `cadence.progress.v1`. Cadence has no account system and does not send practice data to a server.

## Verification

```bash
npm run lint
npm test
```

`npm test` creates the production build and checks the rendered app, Web MIDI integration surface, local persistence, and isolated coaching layer.
