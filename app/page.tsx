"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generatePracticeDrill,
  getMusicExplanation,
  type PracticeDrill,
} from "./coach";

type MidiInputLike = {
  id: string;
  name?: string | null;
  manufacturer?: string | null;
  state?: string;
  onmidimessage: ((event: { data: Uint8Array }) => void) | null;
};

type MidiAccessLike = {
  inputs: Map<string, MidiInputLike>;
  onstatechange: (() => void) | null;
};

declare global {
  interface Navigator {
    requestMIDIAccess?: () => Promise<MidiAccessLike>;
  }
}

type Lesson = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  focus: string;
  duration: string;
  sequence: number[];
  chapter: string;
};

const LESSONS: Lesson[] = [
  {
    id: "geography",
    number: "01",
    title: "Keyboard geography",
    shortTitle: "Find the landmarks",
    focus: "Middle C, groups of black keys, and note direction",
    duration: "8 min",
    sequence: [60, 62, 64, 65, 67, 65, 64, 62, 60],
    chapter: "Foundations",
  },
  {
    id: "intervals",
    number: "02",
    title: "Intervals",
    shortTitle: "Hear the distance",
    focus: "Seconds, thirds, fourths, and fifths",
    duration: "10 min",
    sequence: [60, 64, 62, 65, 60, 67, 64, 67],
    chapter: "Foundations",
  },
  {
    id: "scales",
    number: "03",
    title: "Scales",
    shortTitle: "C major in one octave",
    focus: "Thumb crossing and even tone",
    duration: "12 min",
    sequence: [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60],
    chapter: "Foundations",
  },
  {
    id: "chords",
    number: "04",
    title: "Chords",
    shortTitle: "Build harmony",
    focus: "Major, minor, and dominant function",
    duration: "12 min",
    sequence: [60, 64, 67, 59, 62, 67, 60, 64, 67],
    chapter: "Language",
  },
  {
    id: "rhythm",
    number: "05",
    title: "Rhythm",
    shortTitle: "Make time audible",
    focus: "Pulse, subdivisions, and rests",
    duration: "10 min",
    sequence: [60, 60, 62, 60, 64, 64, 62, 62],
    chapter: "Language",
  },
  {
    id: "bach-prelude",
    number: "06",
    title: "Bach: Prelude in C",
    shortTitle: "Harmony in motion",
    focus: "Broken chords and harmonic function",
    duration: "18 min",
    sequence: [60, 64, 67, 72, 76, 72, 67, 64],
    chapter: "Classics",
  },
  {
    id: "minuet",
    number: "07",
    title: "Minuet in G",
    shortTitle: "Two hands, one dance",
    focus: "Articulation and hand independence",
    duration: "18 min",
    sequence: [67, 64, 65, 67, 69, 71, 72, 67],
    chapter: "Classics",
  },
  {
    id: "ode",
    number: "08",
    title: "Beethoven: Ode to Joy",
    shortTitle: "Shape a melody",
    focus: "Phrase direction and repeated notes",
    duration: "14 min",
    sequence: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64],
    chapter: "Classics",
  },
  {
    id: "satie",
    number: "09",
    title: "Satie: Gymnopédie No. 1",
    shortTitle: "Space and color",
    focus: "Pedal, voicing, and calm pulse",
    duration: "20 min",
    sequence: [67, 71, 62, 66, 69, 61, 64, 67],
    chapter: "Classics",
  },
  {
    id: "chopin",
    number: "10",
    title: "Chopin: Prelude in E minor",
    shortTitle: "Inner voices",
    focus: "Emotional harmony and voice leading",
    duration: "22 min",
    sequence: [64, 67, 71, 66, 69, 72, 64, 67],
    chapter: "Classics",
  },
  {
    id: "improv",
    number: "11",
    title: "Improvisation",
    shortTitle: "Answer your own phrase",
    focus: "Motif, variation, and call-and-response",
    duration: "15 min",
    sequence: [60, 62, 64, 67, 64, 62, 60],
    chapter: "Create",
  },
  {
    id: "compose",
    number: "12",
    title: "Composition",
    shortTitle: "Write eight meaningful bars",
    focus: "Form, tension, release, and revision",
    duration: "20 min",
    sequence: [60, 64, 67, 71, 69, 65, 62, 60],
    chapter: "Create",
  },
];

const KEY_START = 48;
const KEY_END = 76;
const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);
const TYPE_KEYS: Record<string, number> = {
  a: 60,
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72,
};

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function detectChord(notes: number[]) {
  const pcs = [...new Set(notes.map((note) => note % 12))].sort((a, b) => a - b);
  if (pcs.length < 3) return null;

  const patterns = [
    { intervals: [0, 4, 7], suffix: "major" },
    { intervals: [0, 3, 7], suffix: "minor" },
    { intervals: [0, 4, 7, 10], suffix: "7" },
    { intervals: [0, 3, 6], suffix: "diminished" },
  ];

  for (const root of pcs) {
    const normalized = pcs
      .map((pitch) => (pitch - root + 12) % 12)
      .sort((a, b) => a - b);
    for (const pattern of patterns) {
      if (
        pattern.intervals.every((interval) => normalized.includes(interval)) &&
        normalized.length === pattern.intervals.length
      ) {
        const rootName = NOTE_NAMES[root].replace("♯", "♯");
        if (pattern.suffix === "7") return `${rootName}7`;
        return `${rootName} ${pattern.suffix}`;
      }
    }
  }
  return "Open voicing";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const initialDrill: PracticeDrill = {
  eyebrow: "Ready when you are",
  title: "Landmark loop",
  instruction:
    "Play C, F, and G in the middle octave. Look away between notes and find each landmark by the black-key pattern.",
  repetitions: "3 calm rounds",
  reason:
    "Reliable landmarks make every later reading task faster and reduce hand tension.",
};

export default function Home() {
  const [view, setView] = useState<"today" | "curriculum" | "progress">("today");
  const [selectedLessonId, setSelectedLessonId] = useState("geography");
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [chord, setChord] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiInputLike[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [midiStatus, setMidiStatus] = useState<
    "idle" | "requesting" | "connected" | "unsupported" | "denied"
  >("idle");
  const [sessionRunning, setSessionRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timedAttempts, setTimedAttempts] = useState(0);
  const [onTime, setOnTime] = useState(0);
  const [feedback, setFeedback] = useState(
    "Connect your keyboard or use the on-screen keys, then begin the lesson.",
  );
  const [bpm, setBpm] = useState(88);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const [browserSound, setBrowserSound] = useState(true);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [practiceMinutes, setPracticeMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState("C major");
  const [drill, setDrill] = useState<PracticeDrill>(initialDrill);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const lastCorrectAtRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const heldTypeKeys = useRef<Set<string>>(new Set());

  const lesson = useMemo(
    () => LESSONS.find((item) => item.id === selectedLessonId) ?? LESSONS[0],
    [selectedLessonId],
  );
  const targetNote = lesson.sequence[currentIndex] ?? lesson.sequence[0];
  const accuracy = attempts ? clampScore((correct / attempts) * 100) : 100;
  const timingScore = timedAttempts ? clampScore((onTime / timedAttempts) * 100) : 100;
  const overallProgress = Math.round(
    LESSONS.reduce((sum, item) => sum + (progress[item.id] ?? 0), 0) /
      LESSONS.length,
  );
  const explanation = getMusicExplanation(selectedConcept);

  const pianoNotes = useMemo(
    () =>
      Array.from({ length: KEY_END - KEY_START + 1 }, (_, index) => KEY_START + index),
    [],
  );
  const whiteNotes = useMemo(
    () => pianoNotes.filter((note) => !BLACK_PITCHES.has(note % 12)),
    [pianoNotes],
  );
  const blackNotes = useMemo(
    () => pianoNotes.filter((note) => BLACK_PITCHES.has(note % 12)),
    [pianoNotes],
  );

  useEffect(() => {
    let savedState: {
      progress?: Record<string, number>;
      practiceMinutes?: number;
      streak?: number;
      selectedLessonId?: string;
    } = {};
    try {
      const saved = localStorage.getItem("cadence.progress.v1");
      if (saved) savedState = JSON.parse(saved);
    } catch {
      // A damaged local save should never block practice.
    }
    window.queueMicrotask(() => {
      setProgress(savedState.progress ?? {});
      setPracticeMinutes(savedState.practiceMinutes ?? 0);
      setStreak(savedState.streak ?? 0);
      setSelectedLessonId(savedState.selectedLessonId ?? "geography");
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      "cadence.progress.v1",
      JSON.stringify({ progress, practiceMinutes, streak, selectedLessonId }),
    );
  }, [hydrated, practiceMinutes, progress, selectedLessonId, streak]);

  const playTone = useCallback(
    (midi: number, duration = 0.45, gainValue = 0.075) => {
      if (!browserSound) return;
      const AudioContextCtor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = "triangle";
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    },
    [browserSound],
  );

  useEffect(() => {
    if (!metronomeOn) return;
    const interval = window.setInterval(() => {
      setBeat((value) => (value + 1) % 4);
      playTone(84, 0.06, 0.035);
    }, 60000 / bpm);
    return () => window.clearInterval(interval);
  }, [bpm, metronomeOn, playTone]);

  const refreshDrill = useCallback(
    (nextMistakes: Record<string, number>, nextTimingScore: number) => {
      const topMistake = Object.entries(nextMistakes).sort((a, b) => b[1] - a[1])[0];
      generatePracticeDrill({
        wrongNote: topMistake?.[0],
        timingScore: nextTimingScore,
        lessonTitle: lesson.title,
      }).then(setDrill);
    },
    [lesson.title],
  );

  const finishLesson = useCallback(() => {
    setSessionRunning(false);
    const elapsedMinutes = sessionStartedAtRef.current
      ? Math.max(1, Math.round((performance.now() - sessionStartedAtRef.current) / 60000))
      : 1;
    setPracticeMinutes((value) => value + elapsedMinutes);
    setStreak((value) => Math.max(1, value));
    setProgress((current) => ({
      ...current,
      [lesson.id]: Math.max(current[lesson.id] ?? 0, accuracy >= 85 ? 100 : accuracy),
    }));
    setFeedback(
      accuracy >= 85
        ? `Phrase complete. ${accuracy}% accuracy, now listen for shape rather than individual notes.`
        : `Phrase complete. Slow it down and repeat the smallest uncertain transition.`,
    );
    refreshDrill(mistakes, timingScore);
  }, [accuracy, lesson.id, mistakes, refreshDrill, timingScore]);

  const handleNoteOn = useCallback(
    (midi: number, source: "midi" | "screen" | "typing" = "screen") => {
      setActiveNotes((current) => {
        const next = current.includes(midi) ? current : [...current, midi];
        setChord(detectChord(next));
        return next;
      });
      setLastNote(midi);
      if (source !== "midi" || browserSound) playTone(midi);

      if (!sessionRunning) {
        setFeedback(`${noteName(midi)} detected. Press “Begin lesson” when you’re ready.`);
        return;
      }

      setAttempts((value) => value + 1);
      if (midi === targetNote) {
        const now = performance.now();
        let nextTimingScore = timingScore;
        if (lastCorrectAtRef.current !== null) {
          const expectedGap = 60000 / bpm;
          const timingError = Math.abs(now - lastCorrectAtRef.current - expectedGap);
          setTimedAttempts((value) => value + 1);
          if (timingError <= expectedGap * 0.28) {
            setOnTime((value) => value + 1);
            nextTimingScore = clampScore(((onTime + 1) / (timedAttempts + 1)) * 100);
          } else {
            nextTimingScore = clampScore((onTime / (timedAttempts + 1)) * 100);
          }
        }
        lastCorrectAtRef.current = now;
        setCorrect((value) => value + 1);
        const nextIndex = currentIndex + 1;
        if (nextIndex >= lesson.sequence.length) {
          window.setTimeout(finishLesson, 120);
        } else {
          setCurrentIndex(nextIndex);
          setFeedback(
            nextTimingScore >= 80
              ? `Good. ${noteName(midi)} was clear and settled.`
              : `Correct note. Let the pulse carry you into ${noteName(
                  lesson.sequence[nextIndex],
                )}.`,
          );
        }
      } else {
        const wrongName = noteName(midi);
        const expectedName = noteName(targetNote);
        const nextMistakes = { ...mistakes, [wrongName]: (mistakes[wrongName] ?? 0) + 1 };
        setMistakes(nextMistakes);
        setFeedback(`${wrongName} is nearby. Listen, then find ${expectedName} without rushing.`);
        refreshDrill(nextMistakes, timingScore);
      }
    },
    [
      bpm,
      browserSound,
      currentIndex,
      finishLesson,
      lesson.sequence,
      mistakes,
      onTime,
      playTone,
      refreshDrill,
      sessionRunning,
      targetNote,
      timedAttempts,
      timingScore,
    ],
  );

  const handleNoteOff = useCallback((midi: number) => {
    setActiveNotes((current) => {
      const next = current.filter((note) => note !== midi);
      setChord(detectChord(next));
      return next;
    });
  }, []);

  const attachMidiInput = useCallback(
    (input: MidiInputLike | undefined) => {
      if (!input) return;
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((item) => {
          item.onmidimessage = null;
        });
      }
      input.onmidimessage = (event) => {
        const [status, note, velocity] = Array.from(event.data);
        const command = status & 0xf0;
        if (command === 0x90 && velocity > 0) handleNoteOn(note, "midi");
        if (command === 0x80 || (command === 0x90 && velocity === 0)) handleNoteOff(note);
      };
      setDeviceId(input.id);
      setMidiStatus("connected");
      setFeedback(`${input.name ?? "MIDI keyboard"} connected. Play any note to test it.`);
    },
    [handleNoteOff, handleNoteOn],
  );

  const refreshDevices = useCallback(() => {
    const access = midiAccessRef.current;
    if (!access) return;
    const next = Array.from(access.inputs.values()).filter(
      (input) => input.state !== "disconnected",
    );
    setDevices(next);
    if (next.length === 1) attachMidiInput(next[0]);
    if (next.length === 0) {
      setMidiStatus("idle");
      setDeviceId("");
    }
  }, [attachMidiInput]);

  const connectMidi = useCallback(async () => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("unsupported");
      return;
    }
    setMidiStatus("requesting");
    try {
      const access = await navigator.requestMIDIAccess();
      midiAccessRef.current = access;
      access.onstatechange = refreshDevices;
      const next = Array.from(access.inputs.values());
      setDevices(next);
      if (next.length) attachMidiInput(next[0]);
      else setMidiStatus("idle");
    } catch {
      setMidiStatus("denied");
    }
  }, [attachMidiInput, refreshDevices]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea")) return;
      const key = event.key.toLowerCase();
      const midi = TYPE_KEYS[key];
      if (midi === undefined || heldTypeKeys.current.has(key)) return;
      heldTypeKeys.current.add(key);
      event.preventDefault();
      handleNoteOn(midi, "typing");
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const midi = TYPE_KEYS[key];
      if (midi === undefined) return;
      heldTypeKeys.current.delete(key);
      handleNoteOff(midi);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [handleNoteOff, handleNoteOn]);

  const beginLesson = () => {
    if (sessionRunning) {
      setSessionRunning(false);
      setFeedback("Paused. Keep your hands in place and continue when ready.");
      return;
    }
    if (currentIndex >= lesson.sequence.length - 1) setCurrentIndex(0);
    sessionStartedAtRef.current = performance.now();
    lastCorrectAtRef.current = null;
    setSessionRunning(true);
    setFeedback(`Begin with ${noteName(lesson.sequence[currentIndex])}. Hear it before you play.`);
  };

  const chooseLesson = (id: string) => {
    const nextLesson = LESSONS.find((item) => item.id === id) ?? LESSONS[0];
    setSelectedLessonId(id);
    setCurrentIndex(0);
    setAttempts(0);
    setCorrect(0);
    setTimedAttempts(0);
    setOnTime(0);
    setSessionRunning(false);
    lastCorrectAtRef.current = null;
    setFeedback(`Next: ${nextLesson.focus}. Begin when your hands feel ready.`);
    setView("today");
  };

  const deviceLabel =
    midiStatus === "connected"
      ? devices.find((item) => item.id === deviceId)?.name ?? "MIDI connected"
      : "No keyboard connected";

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("today")} aria-label="Cadence home">
          <span className="brand-mark" aria-hidden="true">♪</span>
          <span>Cadence</span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          {(["today", "curriculum", "progress"] as const).map((item) => (
            <button
              key={item}
              className={view === item ? "nav-button active" : "nav-button"}
              onClick={() => setView(item)}
            >
              {item === "today" ? "Today" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <button
          className={`device-pill ${midiStatus === "connected" ? "connected" : ""}`}
          onClick={connectMidi}
          disabled={midiStatus === "requesting"}
        >
          <span className="status-dot" aria-hidden="true" />
          <span>{midiStatus === "requesting" ? "Looking for MIDI…" : deviceLabel}</span>
        </button>
      </header>

      {view === "today" && (
        <div className="practice-layout">
          <aside className="lesson-rail" aria-label="Learning path">
            <div className="rail-heading">
              <p className="eyebrow">Learning path</p>
              <span>{overallProgress}%</span>
            </div>
            <div className="rail-progress" aria-label={`${overallProgress}% course progress`}>
              <span style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="lesson-list">
              {LESSONS.map((item) => {
                const itemProgress = progress[item.id] ?? 0;
                const selected = item.id === lesson.id;
                return (
                  <button
                    key={item.id}
                    className={`lesson-row ${selected ? "selected" : ""}`}
                    onClick={() => chooseLesson(item.id)}
                  >
                    <span className="lesson-number">
                      {itemProgress >= 100 ? "✓" : item.number}
                    </span>
                    <span className="lesson-copy">
                      <strong>{item.title}</strong>
                      <small>{itemProgress ? `${itemProgress}% complete` : item.chapter}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="practice-workspace">
            <div className="connection-strip">
              <div>
                <span className={`connection-icon ${midiStatus === "connected" ? "ready" : ""}`}>
                  {midiStatus === "connected" ? "✓" : "⌁"}
                </span>
                <div>
                  <strong>
                    {midiStatus === "connected"
                      ? `${deviceLabel} is ready`
                      : midiStatus === "unsupported"
                        ? "Web MIDI is unavailable in this browser"
                        : midiStatus === "denied"
                          ? "MIDI permission was not granted"
                          : "Connect your Casio CT-S1"}
                  </strong>
                  <span>
                    {midiStatus === "connected"
                      ? "Live notes and timing are being measured."
                      : "Use Chrome or Edge, connect USB, then allow MIDI access. The screen keyboard always works."}
                  </span>
                </div>
              </div>
              <div className="connection-actions">
                {devices.length > 1 && (
                  <label className="device-select">
                    <span className="sr-only">Choose MIDI device</span>
                    <select
                      value={deviceId}
                      onChange={(event) =>
                        attachMidiInput(devices.find((item) => item.id === event.target.value))
                      }
                    >
                      {devices.map((device) => (
                        <option value={device.id} key={device.id}>
                          {device.name ?? "MIDI input"}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button className="secondary-button compact" onClick={connectMidi}>
                  {midiStatus === "connected" ? "Reconnect" : "Connect MIDI"}
                </button>
              </div>
            </div>

            <div className="lesson-heading">
              <div>
                <p className="eyebrow">
                  Lesson {lesson.number} · {lesson.duration}
                </p>
                <h1>{lesson.shortTitle}</h1>
                <p>{lesson.focus}</p>
              </div>
              <div className="lesson-controls">
                <label className="bpm-control">
                  <span>Tempo</span>
                  <strong>{bpm} BPM</strong>
                  <input
                    type="range"
                    min="48"
                    max="132"
                    value={bpm}
                    onChange={(event) => setBpm(Number(event.target.value))}
                    aria-label="Lesson tempo"
                  />
                </label>
                <button
                  className={metronomeOn ? "icon-button active" : "icon-button"}
                  onClick={() => setMetronomeOn((value) => !value)}
                  aria-pressed={metronomeOn}
                  aria-label="Toggle metronome"
                >
                  <span className={`beat-light beat-${beat}`} aria-hidden="true" />
                  {metronomeOn ? "Metronome on" : "Metronome"}
                </button>
                <button className="primary-button" onClick={beginLesson}>
                  {sessionRunning ? "Pause lesson" : "Begin lesson"}
                </button>
              </div>
            </div>

            <section className="lesson-player" aria-label="Lesson player">
              <div className="player-status">
                <div className={`play-state ${sessionRunning ? "live" : ""}`}>
                  <span aria-hidden="true">{sessionRunning ? "▶" : "Ⅱ"}</span>
                  {sessionRunning ? "Listening" : "Ready"}
                </div>
                <div className="target-readout">
                  <span>Next note</span>
                  <strong>{noteName(targetNote)}</strong>
                </div>
                <div className="live-readout" aria-live="polite">
                  <span>You played</span>
                  <strong>{chord ?? (lastNote !== null ? noteName(lastNote) : "—")}</strong>
                </div>
              </div>

              <div className="note-sequence" aria-label="Target note sequence">
                {lesson.sequence.map((note, index) => {
                  const state =
                    index < currentIndex
                      ? "complete"
                      : index === currentIndex
                        ? "current"
                        : "upcoming";
                  return (
                    <div className={`note-step ${state}`} key={`${note}-${index}`}>
                      <span>{index + 1}</span>
                      <strong>{noteName(note)}</strong>
                      <small>
                        {state === "complete" ? "Done" : state === "current" ? "Next" : "Wait"}
                      </small>
                    </div>
                  );
                })}
              </div>

              <div className="piano-wrap">
                <div className="keyboard-tools">
                  <span>Live keyboard · A–K keys also work</span>
                  <button
                    className="sound-toggle"
                    onClick={() => setBrowserSound((value) => !value)}
                    aria-pressed={browserSound}
                  >
                    {browserSound ? "Sound on" : "Sound off"}
                  </button>
                </div>
                <div className="piano" role="group" aria-label="Interactive piano keyboard">
                  <div className="white-keys">
                    {whiteNotes.map((note) => (
                      <button
                        key={note}
                        className={[
                          "white-key",
                          activeNotes.includes(note) ? "pressed" : "",
                          targetNote === note && sessionRunning ? "target" : "",
                        ].join(" ")}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          handleNoteOn(note);
                        }}
                        onPointerUp={() => handleNoteOff(note)}
                        onPointerCancel={() => handleNoteOff(note)}
                        aria-label={`Play ${noteName(note)}`}
                      >
                        {(note % 12 === 0 || note === targetNote) && (
                          <span>{noteName(note)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {blackNotes.map((note) => {
                    const whiteBefore = whiteNotes.filter((item) => item < note).length;
                    const left = (whiteBefore / whiteNotes.length) * 100;
                    return (
                      <button
                        key={note}
                        className={[
                          "black-key",
                          activeNotes.includes(note) ? "pressed" : "",
                          targetNote === note && sessionRunning ? "target" : "",
                        ].join(" ")}
                        style={{ left: `calc(${left}% - 2.25%)` }}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          handleNoteOn(note);
                        }}
                        onPointerUp={() => handleNoteOff(note)}
                        onPointerCancel={() => handleNoteOff(note)}
                        aria-label={`Play ${noteName(note)}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="feedback-line" aria-live="polite">
                <span className={feedback.startsWith("Good") ? "feedback-mark good" : "feedback-mark"}>
                  {feedback.startsWith("Good") ? "✓" : "→"}
                </span>
                <p>{feedback}</p>
                <dl>
                  <div>
                    <dt>Accuracy</dt>
                    <dd>{accuracy}%</dd>
                  </div>
                  <div>
                    <dt>Timing</dt>
                    <dd>{timingScore}%</dd>
                  </div>
                  <div>
                    <dt>Notes</dt>
                    <dd>{correct}/{lesson.sequence.length}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="learning-grid">
              <section className="microscope">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Music microscope</p>
                    <h2>Why this chord?</h2>
                  </div>
                  <span className="ai-label">Guided explanation</span>
                </div>
                <div className="concept-tabs" role="tablist" aria-label="Harmony concepts">
                  {["C major", "G7", "A minor", "E minor"].map((concept) => (
                    <button
                      role="tab"
                      aria-selected={concept === selectedConcept}
                      className={concept === selectedConcept ? "selected" : ""}
                      key={concept}
                      onClick={() => setSelectedConcept(concept)}
                    >
                      {concept}
                    </button>
                  ))}
                </div>
                <div className="chord-explanation">
                  <div className="chord-identity">
                    <strong>{explanation.symbol}</strong>
                    <span>{explanation.role}</span>
                  </div>
                  <p>{explanation.explanation}</p>
                  <div className="listen-prompt">
                    <span aria-hidden="true">◉</span>
                    <div>
                      <strong>Listen for</strong>
                      <p>{explanation.listenFor}</p>
                    </div>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      const chordNotes =
                        selectedConcept === "G7"
                          ? [55, 59, 62, 65]
                          : selectedConcept === "A minor"
                            ? [57, 60, 64]
                            : selectedConcept === "E minor"
                              ? [52, 55, 59]
                              : [60, 64, 67];
                      chordNotes.forEach((note, index) =>
                        window.setTimeout(() => playTone(note, 1.2, 0.045), index * 45),
                      );
                    }}
                  >
                    Hear this harmony
                  </button>
                </div>
              </section>

              <section className="drill-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{drill.eyebrow}</p>
                    <h2>Your next drill</h2>
                  </div>
                  <span className="spark" aria-hidden="true">✦</span>
                </div>
                <div className="drill-content">
                  <span className="drill-number">01</span>
                  <div>
                    <h3>{drill.title}</h3>
                    <p>{drill.instruction}</p>
                    <strong>{drill.repetitions}</strong>
                  </div>
                </div>
                <p className="drill-reason">{drill.reason}</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setSessionRunning(true);
                    sessionStartedAtRef.current = performance.now();
                    setFeedback(`Drill started. Begin slowly with ${noteName(lesson.sequence[0])}.`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Practice this drill
                </button>
              </section>
            </div>
          </section>
        </div>
      )}

      {view === "curriculum" && (
        <section className="library-view">
          <div className="view-intro">
            <p className="eyebrow">Your route from first note to first composition</p>
            <h1>Learn the language, then say something of your own.</h1>
            <p>
              Twelve connected lessons move from keyboard fluency to classical repertoire,
              improvisation, and composition. Every piece teaches a musical idea.
            </p>
          </div>
          {["Foundations", "Language", "Classics", "Create"].map((chapter) => (
            <section className="curriculum-chapter" key={chapter}>
              <div className="chapter-title">
                <span>{chapter}</span>
                <small>{LESSONS.filter((item) => item.chapter === chapter).length} lessons</small>
              </div>
              <div className="chapter-lessons">
                {LESSONS.filter((item) => item.chapter === chapter).map((item) => (
                  <button key={item.id} onClick={() => chooseLesson(item.id)}>
                    <span className="curriculum-number">{item.number}</span>
                    <span className="curriculum-copy">
                      <strong>{item.title}</strong>
                      <small>{item.focus}</small>
                    </span>
                    <span className="curriculum-meta">
                      {progress[item.id] ? `${progress[item.id]}%` : item.duration}
                      <b aria-hidden="true">→</b>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </section>
      )}

      {view === "progress" && (
        <section className="progress-view">
          <div className="view-intro compact-intro">
            <p className="eyebrow">Progress</p>
            <h1>Small evidence of real fluency.</h1>
            <p>Your practice stays on this device. No account or cloud sync is required.</p>
          </div>
          <div className="progress-summary">
            <div>
              <span>Course</span>
              <strong>{overallProgress}%</strong>
              <p>Across all twelve lessons</p>
            </div>
            <div>
              <span>Practice</span>
              <strong>{practiceMinutes}<small> min</small></strong>
              <p>Measured completed sessions</p>
            </div>
            <div>
              <span>Continuity</span>
              <strong>{streak}<small> day</small></strong>
              <p>A gentle cue, never a penalty</p>
            </div>
          </div>
          <div className="skill-progress">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Musicianship map</p>
                <h2>What is becoming reliable</h2>
              </div>
            </div>
            {[
              ["Keyboard fluency", Math.max(12, progress.geography ?? 0)],
              ["Rhythm", Math.max(8, Math.round(timingScore * 0.55))],
              ["Harmony", Math.max(6, Math.round(((progress.chords ?? 0) + (progress["bach-prelude"] ?? 0)) / 2))],
              ["Repertoire", Math.max(4, Math.round(["bach-prelude", "minuet", "ode", "satie", "chopin"].reduce((sum, id) => sum + (progress[id] ?? 0), 0) / 5))],
              ["Creative language", Math.max(2, Math.round(((progress.improv ?? 0) + (progress.compose ?? 0)) / 2))],
            ].map(([label, value]) => (
              <div className="skill-row" key={String(label)}>
                <span>{label}</span>
                <div className="skill-bar"><i style={{ width: `${value}%` }} /></div>
                <strong>{value}%</strong>
              </div>
            ))}
          </div>
          <div className="local-note">
            <span aria-hidden="true">⌂</span>
            <div>
              <strong>Saved locally</strong>
              <p>
                Lesson completion, practice time, and your current place are stored only in
                this browser. Clearing site data resets the record.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
