"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePracticeDrill, getMusicExplanation, getReviewTeachingVariant, type PracticeDrill } from "./coach";
import { CompositionWorkbench, type EditableSketch, type PerformanceNote } from "./composition-workbench";
import { CompositionProjectStudio, createCompositionProject, type CompositionProject } from "./composition-project-studio";
import { analyzeProject, PROJECT_BRIEFS } from "./composition-project-engine.mjs";
import { CHAPTERS, COURSES, getCourse, getStepCount, type LessonStep } from "./curriculum";
import { analyzePerformance, buildPracticePlan, chooseRecommendedCourse, dueReviewEntries, scheduleReview } from "./learning-engine.mjs";
import { getProgressionStep } from "./midi-progression.mjs";
import { detectChord, getPitchSet, samePitchSet } from "./music-engine.mjs";
import type { ImprovisationResult } from "./improvisation-lab";
import type { HarmonyResult } from "./harmony-lab";
import { MusicianshipLab, type EarProgress, type LivePlayedNote, type TechniqueResult } from "./musicianship-lab";
import { PlacementAssessment, type PlacementProfile } from "./placement-assessment";
import { getRepertoireAnalysis, REPERTOIRE_ANALYSIS } from "./repertoire-analysis.mjs";
import { RepertoireMicroscope, type RepertoireAnalysis } from "./repertoire-microscope";
import { ScoreReader, type ScoreSessionResult } from "./score-reader";
import type { TheoryProgress } from "./theory-lab";

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

type NoteSource = "midi" | "screen" | "typing";
type AppView = "today" | "curriculum" | "studio" | "lab" | "assessment" | "sketchbook" | "progress";
type MidiStatus = "idle" | "requesting" | "connected" | "unsupported" | "denied";

type NoteEvent = { id: number; note: number; at: number; duration: number; velocity: number; chord?: string };
type Sketch = EditableSketch;
type ReviewRecord = {
  courseId: string;
  stepId: string;
  title: string;
  kind: LessonStep["kind"];
  dueAt: string;
  lastReviewedAt: string;
  intervalDays: number;
  repetitions: number;
  quality: number;
};

type SavedState = {
  completedSteps: Record<string, string[]>;
  selectedCourseId: string;
  stepIndex: number;
  practiceMinutes: number;
  sketches: Sketch[];
  scoreMeasures: Record<string, number[]>;
  scoreSessions: Record<string, ScoreSessionResult[]>;
  techniqueHistory: TechniqueResult[];
  improvisationHistory: ImprovisationResult[];
  harmonyHistory: HarmonyResult[];
  compositionProjects: CompositionProject[];
  placementProfile: PlacementProfile | null;
  reviewSchedule: Record<string, ReviewRecord>;
  exploredAnalysis: Record<string, string[]>;
  preferences: string[];
  earProgress: EarProgress;
  theoryProgress: TheoryProgress;
  firstVisit: string;
};

const KEY_START = 48;
const KEY_END = 76;
const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);
const TYPE_KEYS: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66,
  g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
};

const DEFAULT_PREFERENCES = ["Classical foundations", "Improvisation", "Composition", "Music production"];
const DEFAULT_EAR_PROGRESS: EarProgress = { attempted: 0, correct: 0, streak: 0, intervalLevel: 1 };
const DEFAULT_THEORY_PROGRESS: TheoryProgress = { exploredKeys: [], exploredChords: [], attempts: 0, correct: 0 };

const initialDrill: PracticeDrill = {
  eyebrow: "Personal practice idea",
  title: "Landmark loop",
  instruction: "Play C, F, and G in the middle octave. Look away between notes and find each landmark by the black-key pattern.",
  repetitions: "3 unhurried rounds",
  reason: "Reliable landmarks leave more attention for listening and musical shape.",
};

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function stepLabel(kind: LessonStep["kind"]) {
  return {
    learn: "Concept",
    listen: "Listening",
    sequence: "Guided playing",
    chord: "Chord lab",
    quiz: "Understanding check",
    improv: "Improvisation",
    compose: "Composition",
  }[kind];
}

function dayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const [view, setView] = useState<AppView>("today");
  const [selectedCourseId, setSelectedCourseId] = useState("keyboard");
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, string[]>>({});
  const [practiceMinutes, setPracticeMinutes] = useState(0);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [scoreMeasures, setScoreMeasures] = useState<Record<string, number[]>>({});
  const [scoreSessions, setScoreSessions] = useState<Record<string, ScoreSessionResult[]>>({});
  const [techniqueHistory, setTechniqueHistory] = useState<TechniqueResult[]>([]);
  const [improvisationHistory, setImprovisationHistory] = useState<ImprovisationResult[]>([]);
  const [harmonyHistory, setHarmonyHistory] = useState<HarmonyResult[]>([]);
  const [compositionProjects, setCompositionProjects] = useState<CompositionProject[]>([]);
  const [placementProfile, setPlacementProfile] = useState<PlacementProfile | null>(null);
  const [reviewSchedule, setReviewSchedule] = useState<Record<string, ReviewRecord>>({});
  const [exploredAnalysis, setExploredAnalysis] = useState<Record<string, string[]>>({});
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [earProgress, setEarProgress] = useState<EarProgress>(DEFAULT_EAR_PROGRESS);
  const [theoryProgress, setTheoryProgress] = useState<TheoryProgress>(DEFAULT_THEORY_PROGRESS);
  const [firstVisit, setFirstVisit] = useState("");
  const [editingSketchId, setEditingSketchId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [liveChord, setLiveChord] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiInputLike[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [midiStatus, setMidiStatus] = useState<MidiStatus>("idle");
  const [browserSound, setBrowserSound] = useState(true);

  const [activityRunning, setActivityRunning] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState("Read the idea, then begin when you are ready.");
  const [stepComplete, setStepComplete] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewRecordAtEntry, setReviewRecordAtEntry] = useState<ReviewRecord | null>(null);
  const [reviewRevealed, setReviewRevealed] = useState(false);
  const [reviewConfidence, setReviewConfidence] = useState(75);
  const [answerState, setAnswerState] = useState<{ index: number; correct: boolean } | null>(null);
  const [events, setEvents] = useState<NoteEvent[]>([]);
  const [creativeStartedAt, setCreativeStartedAt] = useState<number | null>(null);
  const [creativeCreatedAt, setCreativeCreatedAt] = useState("");
  const [bpm, setBpm] = useState(76);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState("C major");
  const [activeScoreSection, setActiveScoreSection] = useState(0);
  const [drill, setDrill] = useState<PracticeDrill>(initialDrill);
  const [scorePlayedNote, setScorePlayedNote] = useState<LivePlayedNote>(null);
  const [, setMistakes] = useState<Record<string, number>>({});

  const audioContextRef = useRef<AudioContext | null>(null);
  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const activeNotesRef = useRef<number[]>([]);
  const activityRunningRef = useRef(false);
  const sequenceIndexRef = useRef(0);
  const sequenceRef = useRef<number[]>([]);
  const currentStepRef = useRef<LessonStep | null>(null);
  const heldTypeKeys = useRef<Set<string>>(new Set());
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastCorrectAtRef = useRef<number | null>(null);
  const handleNoteOnRef = useRef<(midi: number, source?: NoteSource, velocity?: number) => void>(() => undefined);
  const handleNoteOffRef = useRef<(midi: number) => void>(() => undefined);
  const scorePlayedTokenRef = useRef(0);
  const activeCreativeNotesRef = useRef<Map<number, { id: number; at: number }>>(new Map());

  const course = useMemo(() => getCourse(selectedCourseId), [selectedCourseId]);
  const step = course.steps[Math.min(stepIndex, course.steps.length - 1)];
  const courseCompleted = completedSteps[course.id] ?? [];
  const sequenceNotes = step.sequence ?? [];
  const targetNote = sequenceNotes[sequenceIndex] ?? sequenceNotes[0];
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 100;
  const totalCompleted = Object.values(completedSteps).reduce((sum, ids) => sum + ids.length, 0);
  const overallProgress = Math.round((totalCompleted / getStepCount()) * 100);
  const creativeMinimum = step.minNotes ?? 8;
  const repertoireAnalysis = getRepertoireAnalysis(course.id, activeScoreSection) as RepertoireAnalysis | null;
  const courseAnalysisCount = REPERTOIRE_ANALYSIS[course.id]?.length ?? 0;
  const exploredAnalysisCount = Object.values(exploredAnalysis).reduce((sum, ids) => sum + ids.length, 0);
  const reviewVariant = getReviewTeachingVariant({
    title: step.title,
    kind: step.kind,
    body: step.body,
    why: step.why,
    hint: step.hint,
    listenFor: step.listenFor,
    quality: reviewRecordAtEntry?.quality ?? 75,
    repetitions: reviewRecordAtEntry?.repetitions ?? 1,
    preferences,
  });
  const eventNotes = events.map((event) => event.note);
  const range = eventNotes.length ? Math.max(...eventNotes) - Math.min(...eventNotes) : 0;
  const explanation = getMusicExplanation(selectedConcept);
  const latestExpressiveSketch = sketches.find((item) => item.performance?.length);
  const recentPerformance = useMemo(
    () => latestExpressiveSketch?.performance?.length ? analyzePerformance(latestExpressiveSketch.performance) : null,
    [latestExpressiveSketch],
  );
  const performanceGuidance = recentPerformance
    ? recentPerformance.dynamicRange < 10
      ? "Your last phrase used a narrow dynamic range. Repeat it with one deliberate high point, then release the sound instead of adding more notes."
      : recentPerformance.gapVariation > 75
        ? "Your rhythmic spacing is highly varied. Keep the contour, but repeat one rhythm exactly so the listener has something to remember."
        : recentPerformance.overlapCount > 4
          ? "Several notes overlap. That can become atmosphere, but test a drier version so the harmony remains legible."
          : "Your last phrase balances rhythmic identity and touch. Develop it by changing harmony while preserving its timing."
    : "Record an improvisation and Cadence will preserve the timing, duration, and touch of every note for the next recommendation.";

  const nextCourse = useMemo(
    () => chooseRecommendedCourse(COURSES, completedSteps, preferences, placementProfile?.recommendedCourseId),
    [completedSteps, placementProfile?.recommendedCourseId, preferences],
  );
  const recommendationReason = placementProfile && nextCourse.id === placementProfile.recommendedCourseId
    ? `Your calibration points here first: ${placementProfile.reason}`
    : preferences.includes("Music production") && ["production", "composition", "satie"].includes(nextCourse.id)
    ? "Chosen to connect keyboard craft with arrangement and production."
    : preferences.includes("Improvisation") && ["improv", "intervals", "scales"].includes(nextCourse.id)
      ? "Chosen to turn the next concept into something you can hear and invent with."
      : "Chosen because it is the next foundation the rest of your path depends on.";
  const latestScoreSession = useMemo(
    () => Object.entries(scoreSessions)
      .flatMap(([courseId, sessions]) => sessions.map((session) => ({ ...session, courseId })))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] ?? null,
    [scoreSessions],
  );
  const latestTechnique = techniqueHistory[0] ?? null;
  const latestImprovisation = improvisationHistory[0] ?? null;
  const latestHarmony = harmonyHistory[0] ?? null;
  const latestCompositionProject = compositionProjects[0] ?? null;
  const latestCompositionEvidence = useMemo(() => latestCompositionProject ? analyzeProject(latestCompositionProject) : null, [latestCompositionProject]);
  const dueReviews = useMemo(() => dueReviewEntries(reviewSchedule), [reviewSchedule]);
  const upcomingReviews = useMemo(
    () => Object.values(reviewSchedule).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 3),
    [reviewSchedule],
  );
  const practicePlan = useMemo(() => buildPracticePlan({
    nextCourse,
    earProgress,
    latestScore: latestScoreSession,
    latestTechnique,
    hasSketch: sketches.length > 0,
    preferences,
    dueReviews,
  }), [dueReviews, earProgress, latestScoreSession, latestTechnique, nextCourse, preferences, sketches.length]);

  const pianoNotes = useMemo(() => Array.from({ length: KEY_END - KEY_START + 1 }, (_, index) => KEY_START + index), []);
  const whiteNotes = useMemo(() => pianoNotes.filter((note) => !BLACK_PITCHES.has(note % 12)), [pianoNotes]);
  const blackNotes = useMemo(() => pianoNotes.filter((note) => BLACK_PITCHES.has(note % 12)), [pianoNotes]);

  useEffect(() => {
    window.queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("cadence.education.v2");
        if (raw) {
          const saved = JSON.parse(raw) as Partial<SavedState>;
          setCompletedSteps(saved.completedSteps ?? {});
          setSelectedCourseId(saved.selectedCourseId ?? "keyboard");
          setStepIndex(saved.stepIndex ?? 0);
          setPracticeMinutes(saved.practiceMinutes ?? 0);
          setSketches(saved.sketches ?? []);
          setScoreMeasures(saved.scoreMeasures ?? {});
          setScoreSessions(saved.scoreSessions ?? {});
          setTechniqueHistory(saved.techniqueHistory ?? []);
          setImprovisationHistory(saved.improvisationHistory ?? []);
          setHarmonyHistory(saved.harmonyHistory ?? []);
          setCompositionProjects(saved.compositionProjects ?? []);
          setPlacementProfile(saved.placementProfile ?? null);
          setReviewSchedule(saved.reviewSchedule ?? {});
          setExploredAnalysis(saved.exploredAnalysis ?? {});
          setPreferences(saved.preferences ?? DEFAULT_PREFERENCES);
          setEarProgress(saved.earProgress ?? DEFAULT_EAR_PROGRESS);
          setTheoryProgress(saved.theoryProgress ?? DEFAULT_THEORY_PROGRESS);
          setFirstVisit(saved.firstVisit ?? new Date().toISOString());
        } else {
          setFirstVisit(new Date().toISOString());
        }
      } catch {
        setFirstVisit(new Date().toISOString());
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    if (!hydrated) return;
    const state: SavedState = { completedSteps, selectedCourseId, stepIndex, practiceMinutes, sketches, scoreMeasures, scoreSessions, techniqueHistory, improvisationHistory, harmonyHistory, compositionProjects, placementProfile, reviewSchedule, exploredAnalysis, preferences, earProgress, theoryProgress, firstVisit };
    localStorage.setItem("cadence.education.v2", JSON.stringify(state));
  }, [completedSteps, compositionProjects, earProgress, exploredAnalysis, firstVisit, harmonyHistory, hydrated, improvisationHistory, placementProfile, practiceMinutes, preferences, reviewSchedule, scoreMeasures, scoreSessions, selectedCourseId, sketches, stepIndex, techniqueHistory, theoryProgress]);

  useEffect(() => {
    if (view !== "studio") return;
    const openedAsReview = courseCompleted.includes(step.id);
    const entryReview = reviewSchedule[`${course.id}:${step.id}`] ?? null;
    currentStepRef.current = step;
    sequenceRef.current = step.sequence ?? [];
    sequenceIndexRef.current = 0;
    activityRunningRef.current = false;
    window.queueMicrotask(() => {
      setSequenceIndex(0);
      setAttempts(0);
      setCorrect(0);
      setEvents([]);
      activeCreativeNotesRef.current.clear();
      setStepComplete(false);
      setReviewMode(openedAsReview);
      setReviewRecordAtEntry(entryReview);
      setReviewRevealed(false);
      setReviewConfidence(75);
      setActiveScoreSection(0);
      setAnswerState(null);
      setActivityRunning(false);
      setFeedback(openedAsReview
        ? "Retrieve the idea before revealing support. Your new evidence will set the next review interval."
        : step.kind === "learn" ? "Play the example, then continue when the idea makes sense." : "Read the idea, then begin when you are ready.");
    });
    // This reset belongs to navigation between learning experiences. Progress
    // updates within the active experience must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, step.id, view]);

  const playTone = useCallback((midi: number, delay = 0, duration = 0.42, gainValue = 0.065, force = false) => {
    if (!browserSound && !force) return;
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = "triangle";
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }, [browserSound]);

  const playLabNotes = useCallback((notes: number[], together = false) => {
    notes.forEach((note, index) => playTone(note, together ? 0 : index * 0.72, together ? 1.05 : 0.62, 0.055, true));
  }, [playTone]);

  const playImprovisationContext = useCallback((chords: number[][], contextBpm: number, beatsPerChord: number) => {
    const chordSeconds = beatsPerChord * (60 / contextBpm);
    chords.forEach((notes, chordIndex) => notes.forEach((note) => playTone(note, chordIndex * chordSeconds, chordSeconds * .92, .028, true)));
  }, [playTone]);

  const playDemo = useCallback((demo?: number[] | number[][]) => {
    if (!demo?.length) return;
    if (Array.isArray(demo[0])) {
      (demo as number[][]).forEach((notes, chordIndex) => notes.forEach((note) => playTone(note, chordIndex * 0.9, 0.72, 0.045)));
    } else {
      (demo as number[]).forEach((note, index) => playTone(note, index * 0.36));
    }
  }, [playTone]);

  useEffect(() => {
    if (!metronomeOn) return;
    const timer = window.setInterval(() => {
      setBeat((value) => (value + 1) % 4);
      playTone(84, 0, 0.055, 0.025);
    }, 60000 / bpm);
    return () => window.clearInterval(timer);
  }, [bpm, metronomeOn, playTone]);

  const markStepComplete = useCallback((stepToMark = step, reviewQuality = 85) => {
    setCompletedSteps((current) => {
      const existing = current[course.id] ?? [];
      if (existing.includes(stepToMark.id)) return current;
      return { ...current, [course.id]: [...existing, stepToMark.id] };
    });
    setStepComplete(true);
    const reviewKey = `${course.id}:${stepToMark.id}`;
    const reviewedAt = new Date().toISOString();
    setReviewSchedule((current) => ({
      ...current,
      [reviewKey]: {
        courseId: course.id,
        stepId: stepToMark.id,
        title: stepToMark.title,
        kind: stepToMark.kind,
        ...scheduleReview(current[reviewKey], reviewQuality, reviewedAt),
      },
    }));
    activityRunningRef.current = false;
    setActivityRunning(false);
    if (sessionStartedAtRef.current) {
      const elapsed = Math.max(1, Math.round((performance.now() - sessionStartedAtRef.current) / 60000));
      setPracticeMinutes((value) => value + elapsed);
      sessionStartedAtRef.current = null;
    }
  }, [course.id, step]);

  const createAdaptiveDrill = useCallback((wrongNote?: string) => {
    generatePracticeDrill({ wrongNote, timingScore: accuracy, lessonTitle: course.title }).then(setDrill);
  }, [accuracy, course.title]);

  const handleNoteOn = useCallback((midi: number, source: NoteSource = "screen", velocity = 92) => {
    const nextActive = activeNotesRef.current.includes(midi) ? activeNotesRef.current : [...activeNotesRef.current, midi];
    activeNotesRef.current = nextActive;
    setActiveNotes(nextActive);
    const chordName = detectChord(nextActive);
    setLiveChord(chordName);
    setLastNote(midi);
    scorePlayedTokenRef.current += 1;
    setScorePlayedNote({ midi, velocity, token: scorePlayedTokenRef.current });
    if (source !== "midi") playTone(midi);
    if (chordName && ["C major", "G7", "A minor", "E minor"].includes(chordName)) setSelectedConcept(chordName);

    if (!activityRunningRef.current) {
      setFeedback(`${noteName(midi)} detected. Begin the activity when you are ready.`);
      return;
    }

    const activeStep = currentStepRef.current;
    if (!activeStep) return;

    if (activeStep.kind === "sequence" && activeStep.sequence) {
      const result = getProgressionStep(sequenceRef.current, sequenceIndexRef.current, midi);
      setAttempts((value) => value + 1);
      if (result.accepted) {
        setCorrect((value) => value + 1);
        const now = performance.now();
        const gap = lastCorrectAtRef.current ? now - lastCorrectAtRef.current : null;
        lastCorrectAtRef.current = now;
        if (result.complete) {
          markStepComplete(activeStep, Math.round(((correct + 1) / (attempts + 1)) * 100));
          setFeedback("Phrase complete. Now hear it once as a musical sentence, not a row of correct notes.");
          createAdaptiveDrill();
        } else {
          sequenceIndexRef.current = result.nextIndex;
          setSequenceIndex(result.nextIndex);
          setFeedback(gap && gap < 130 ? `Correct. Give ${noteName(sequenceRef.current[result.nextIndex])} a little more time.` : `Good. Next, ${noteName(sequenceRef.current[result.nextIndex])}.`);
        }
      } else {
        const wrong = noteName(midi);
        const expected = noteName(result.expectedNote);
        setMistakes((current) => ({ ...current, [wrong]: (current[wrong] ?? 0) + 1 }));
        setFeedback(`${wrong} changed the shape. Pause, hear ${expected}, then find it without rushing.`);
        createAdaptiveDrill(wrong);
      }
      return;
    }

    if (activeStep.kind === "chord" && activeStep.targetChord) {
      setAttempts((value) => value + 1);
      if (samePitchSet(nextActive, activeStep.targetChord)) {
        setCorrect((value) => value + 1);
        markStepComplete(activeStep, Math.round(((correct + 1) / (attempts + 1)) * 100));
        setFeedback(`${activeStep.targetName ?? "Chord"} found. Release it, then play it once more while listening from the bass upward.`);
      } else if (getPitchSet(nextActive).length >= getPitchSet(activeStep.targetChord).length) {
        setFeedback(`You are holding ${nextActive.map(noteName).join(", ")}. ${activeStep.hint ?? "Check the root, third, and fifth."}`);
      } else {
        setFeedback(`${noteName(midi)} added. Keep holding notes until the chord is complete.`);
      }
      return;
    }

    if (activeStep.kind === "improv" || activeStep.kind === "compose") {
      const allowed = activeStep.allowedNotes ?? [];
      const accepted = !allowed.length || allowed.includes(midi);
      if (!accepted) {
        setFeedback(`${noteName(midi)} is outside this experiment. That is not a bad note, but use the given palette for now.`);
        return;
      }
      const at = performance.now();
      const id = scorePlayedTokenRef.current;
      activeCreativeNotesRef.current.set(midi, { id, at });
      const event: NoteEvent = { id, note: midi, at, duration: 280, velocity, chord: chordName ?? undefined };
      setEvents((current) => [...current, event]);
      setFeedback(`${noteName(midi)} captured. ${events.length + 1 >= (activeStep.minNotes ?? 8) ? "You have enough material to finish or keep developing it." : "Leave space when the phrase needs to breathe."}`);
    }
  }, [attempts, correct, createAdaptiveDrill, events.length, markStepComplete, playTone]);

  const handleNoteOff = useCallback((midi: number) => {
    const next = activeNotesRef.current.filter((note) => note !== midi);
    activeNotesRef.current = next;
    setActiveNotes(next);
    setLiveChord(detectChord(next));
    const captured = activeCreativeNotesRef.current.get(midi);
    if (captured) {
      const duration = Math.max(40, Math.min(8000, performance.now() - captured.at));
      setEvents((current) => current.map((event) => event.id === captured.id ? { ...event, duration } : event));
      activeCreativeNotesRef.current.delete(midi);
    }
  }, []);

  const playScreenLabNote = useCallback((midi: number) => {
    handleNoteOn(midi, "screen", 88);
    window.setTimeout(() => handleNoteOff(midi), 320);
  }, [handleNoteOff, handleNoteOn]);

  useEffect(() => {
    handleNoteOnRef.current = handleNoteOn;
    handleNoteOffRef.current = handleNoteOff;
  }, [handleNoteOff, handleNoteOn]);

  const attachMidiInput = useCallback((input: MidiInputLike | undefined) => {
    if (!input) return;
    midiAccessRef.current?.inputs.forEach((item) => { item.onmidimessage = null; });
    input.onmidimessage = (event) => {
      const [status, note, velocity] = Array.from(event.data);
      const command = status & 0xf0;
      if (command === 0x90 && velocity > 0) handleNoteOnRef.current(note, "midi", velocity);
      if (command === 0x80 || (command === 0x90 && velocity === 0)) handleNoteOffRef.current(note);
    };
    setDeviceId(input.id);
    setMidiStatus("connected");
    setBrowserSound(false);
    setFeedback(`${input.name ?? "MIDI keyboard"} connected. Play any note to confirm the signal.`);
  }, []);

  const refreshDevices = useCallback(() => {
    const available = Array.from(midiAccessRef.current?.inputs.values() ?? []).filter((input) => input.state !== "disconnected");
    setDevices(available);
    if (available.length === 1) attachMidiInput(available[0]);
    if (!available.length) {
      setMidiStatus("idle");
      setDeviceId("");
      setBrowserSound(true);
    }
  }, [attachMidiInput]);

  const connectMidi = useCallback(async () => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("unsupported");
      return;
    }
    setMidiStatus("requesting");
    try {
      const access = await navigator.requestMIDIAccess() as unknown as MidiAccessLike;
      midiAccessRef.current = access;
      access.onstatechange = refreshDevices;
      const available = Array.from(access.inputs.values());
      setDevices(available);
      if (available.length) attachMidiInput(available[0]);
      else setMidiStatus("idle");
    } catch {
      setMidiStatus("denied");
    }
  }, [attachMidiInput, refreshDevices]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.matches("input, select, textarea")) return;
      const key = event.key.toLowerCase();
      const midi = TYPE_KEYS[key];
      if (midi === undefined || heldTypeKeys.current.has(key)) return;
      heldTypeKeys.current.add(key);
      event.preventDefault();
      handleNoteOnRef.current(midi, "typing");
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const midi = TYPE_KEYS[key];
      if (midi === undefined) return;
      heldTypeKeys.current.delete(key);
      handleNoteOffRef.current(midi);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const openCourse = (courseId: string, requestedStep = 0) => {
    setSelectedCourseId(courseId);
    setStepIndex(requestedStep);
    setView("studio");
  };

  const beginActivity = () => {
    if (activityRunning) {
      activityRunningRef.current = false;
      setActivityRunning(false);
      setFeedback("Paused. Keep the musical idea in mind, then continue when ready.");
      return;
    }
    if (step.kind === "sequence" && sequenceIndexRef.current >= sequenceNotes.length) {
      sequenceIndexRef.current = 0;
      setSequenceIndex(0);
    }
    if ((step.kind === "improv" || step.kind === "compose") && events.length === 0) {
      setCreativeStartedAt(performance.now());
      setCreativeCreatedAt(new Date().toISOString());
    }
    sessionStartedAtRef.current ??= performance.now();
    lastCorrectAtRef.current = null;
    activityRunningRef.current = true;
    setActivityRunning(true);
    setStepComplete(false);
    if (step.kind === "sequence") setFeedback(`Begin with ${noteName(sequenceRef.current[sequenceIndexRef.current])}. Hear the direction before you play.`);
    else if (step.kind === "chord") setFeedback(`Build ${step.targetName}. Hold each note so Cadence can hear the complete chord.`);
    else setFeedback("Recording. Start with a clear idea, and let silence be part of it.");
  };

  const finishCreativeStep = () => {
    if (events.length < creativeMinimum) return;
    const duration = events.length
      ? Math.max(1, Math.round((events[events.length - 1].at + events[events.length - 1].duration - events[0].at) / 1000))
      : 1;
    const newSketch: Sketch = {
      id: `${creativeStartedAt ?? events[0]?.at ?? sketches.length}`,
      title: `${course.title}: ${step.title}`,
      course: course.id,
      createdAt: creativeCreatedAt || firstVisit,
      notes: events.map((event) => event.note),
      duration,
      prompt: step.prompt ?? step.why,
      tempo: bpm,
      performance: events.map((event) => ({
        midi: event.note,
        start: Math.round(event.at - events[0].at),
        duration: Math.round(event.duration),
        velocity: event.velocity,
      })),
    };
    setSketches((current) => [newSketch, ...current].slice(0, 24));
    markStepComplete(step, 85);
    setFeedback(`Sketch saved. You used ${new Set(eventNotes.map((note) => note % 12)).size} pitch classes across ${range} semitones. Listen once before judging it.`);
  };

  const selectAnswer = (choiceIndex: number) => {
    if (answerState?.correct) return;
    const isCorrect = Boolean(step.choices?.[choiceIndex]?.correct);
    const attemptNumber = attempts + 1;
    setAttempts(attemptNumber);
    setAnswerState({ index: choiceIndex, correct: isCorrect });
    if (isCorrect) {
      markStepComplete(step, Math.max(40, Math.round(100 / attemptNumber)));
      setFeedback("Yes. The explanation matters more than the score.");
    } else {
      setFeedback("Not quite. Read the explanation, then choose the idea you could demonstrate at the keyboard.");
    }
  };

  const continueStep = () => {
    if (!stepComplete && (step.kind === "learn" || step.kind === "listen")) {
      markStepComplete(step, reviewMode ? reviewConfidence : 88);
    }
    if (stepIndex < course.steps.length - 1) {
      setStepIndex((value) => value + 1);
      return;
    }
    const coursePosition = COURSES.findIndex((item) => item.id === course.id);
    const following = COURSES[coursePosition + 1];
    if (following) {
      setSelectedCourseId(following.id);
      setStepIndex(0);
      setView("today");
    } else {
      setView("progress");
    }
  };

  const playPerformance = useCallback((performanceNotes: PerformanceNote[]) => {
    performanceNotes.forEach((event) => playTone(
      event.midi,
      event.start / 1000,
      Math.max(.06, event.duration / 1000),
      Math.max(.018, (event.velocity / 127) * .075),
      true,
    ));
  }, [playTone]);

  const replaySketch = (sketch: Sketch) => playPerformance(
    sketch.performance?.length
      ? sketch.performance
      : sketch.notes.map((midi, index) => ({ midi, start: index * 220, duration: 320, velocity: 84 })),
  );

  const startCompositionProject = (sourceSketchId?: string) => {
    const project = createCompositionProject(sourceSketchId, preferences);
    setCompositionProjects((current) => [project, ...current].slice(0, 12));
    setEditingSketchId(null);
    setEditingProjectId(project.id);
  };

  const createProjectSketch = (sketch: Sketch) => {
    setSketches((current) => [sketch, ...current].slice(0, 24));
    setEditingProjectId(null);
    setEditingSketchId(sketch.id);
  };

  const completeScoreMeasure = useCallback((measure: number) => {
    setScoreMeasures((current) => {
      const existing = current[course.id] ?? [];
      return existing.includes(measure)
        ? current
        : { ...current, [course.id]: [...existing, measure].sort((a, b) => a - b) };
    });
  }, [course.id]);

  const recordScoreSession = useCallback((result: ScoreSessionResult) => {
    setScoreSessions((current) => ({
      ...current,
      [course.id]: [result, ...(current[course.id] ?? [])].slice(0, 24),
    }));
  }, [course.id]);

  const openPlanDestination = (destination: string) => {
    if (destination === "lab") {
      setView("lab");
      return;
    }
    if (destination === "score" && latestScoreSession?.courseId) {
      openCourse(latestScoreSession.courseId);
      return;
    }
    if (destination === "review" && dueReviews[0]) {
      const review = dueReviews[0];
      const reviewCourse = getCourse(review.courseId);
      const reviewStep = reviewCourse.steps.findIndex((item) => item.id === review.stepId);
      openCourse(review.courseId, Math.max(0, reviewStep));
      return;
    }
    if (destination === "sketchbook") {
      setView("sketchbook");
      return;
    }
    if (destination === "create") {
      openCourse("improv", 1);
      return;
    }
    openCourse(nextCourse.id, completedSteps[nextCourse.id]?.length ?? 0);
  };

  const deviceName = devices.find((item) => item.id === deviceId)?.name ?? "MIDI keyboard";
  const deviceLabel = midiStatus === "connected" ? deviceName : midiStatus === "requesting" ? "Looking for keyboard…" : "Connect keyboard";

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("today")} aria-label="Cadence home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Cadence</span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          {(["today", "curriculum", "lab", "sketchbook", "progress"] as const).map((item) => (
            <button key={item} className={view === item ? "nav-button active" : "nav-button"} onClick={() => setView(item)}>
              {item === "today" ? "Today" : item === "lab" ? "Musicianship Lab" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <button className={`device-pill ${midiStatus === "connected" ? "connected" : ""}`} onClick={connectMidi} disabled={midiStatus === "requesting"}>
          <span className="status-dot" aria-hidden="true" />
          <span>{deviceLabel}</span>
        </button>
      </header>

      {view === "today" && (
        <section className="today-view">
          <div className="today-intro">
            <p className="eyebrow">{hydrated ? dayGreeting() : "Welcome"}, Romanas</p>
            <h1>Learn the language,<br />then make it yours.</h1>
            <p>Classical craft, harmony, improvisation, composition, and production are one connected path here.</p>
          </div>

          <div className="today-grid">
            <article className="continue-panel">
              <div className="continue-topline">
                <span>Recommended next</span>
                <span>{nextCourse.number} / {COURSES.length}</span>
              </div>
              <div className="continue-copy">
                <p>{nextCourse.chapter} · {nextCourse.duration}</p>
                <h2>{nextCourse.title}</h2>
                <p>{nextCourse.subtitle}</p>
              </div>
              <div className="outcome-line"><span aria-hidden="true">→</span><p>{nextCourse.outcome}</p></div>
              <p className="recommendation-reason">{recommendationReason}</p>
              <button className="primary-button light" onClick={() => openCourse(nextCourse.id, completedSteps[nextCourse.id]?.length ?? 0)}>
                Continue learning
              </button>
            </article>

            <aside className="path-panel">
              <div className="section-heading">
                <div><p className="eyebrow">Your direction</p><h2>Built around what you want to become</h2></div>
                <span>{overallProgress}%</span>
              </div>
              <div className="path-line"><i style={{ width: `${overallProgress}%` }} /></div>
              <ol className="direction-list">
                <li><span>01</span><div><strong>Understand</strong><small>Harmony, rhythm, form, and why notes work</small></div></li>
                <li><span>02</span><div><strong>Interpret</strong><small>Beethoven, Bach, Petzold, Satie, and Chopin</small></div></li>
                <li><span>03</span><div><strong>Create</strong><small>Improvisation, composition, and production</small></div></li>
              </ol>
              <button className="placement-entry" onClick={() => setView("assessment")}><span>{placementProfile ? `${placementProfile.overall}%` : "≈"}</span><div><strong>{placementProfile ? "Recalibrate starting point" : "Calibrate my starting point"}</strong><small>{placementProfile ? `Current entry: ${getCourse(placementProfile.recommendedCourseId).title}` : "Four playable tasks · about five minutes"}</small></div><i>→</i></button>
            </aside>
          </div>

          <div className="today-lower">
            <div className="personalize-section">
              <div className="section-heading"><div><p className="eyebrow">Personalized for you</p><h2>What should shape the path?</h2></div></div>
              <p className="section-description">These choices influence recommendations and creative prompts. The classical-to-creation arc stays intact.</p>
              <div className="preference-chips">
                {["Classical foundations", "Improvisation", "Composition", "Music production", "Film & game music", "Ambient", "Jazz harmony", "Songwriting"].map((item) => {
                  const selected = preferences.includes(item);
                  return <button key={item} className={selected ? "preference-chip selected" : "preference-chip"} aria-pressed={selected} onClick={() => setPreferences((current) => selected ? current.filter((value) => value !== item) : [...current, item])}>{selected ? "✓ " : "+ "}{item}</button>;
                })}
              </div>
            </div>
            <div className="session-brief">
              <p className="eyebrow">Your adaptive session</p>
              <strong>{practicePlan.totalMinutes} minutes</strong>
              <p className="plan-reason">{practicePlan.reason}</p>
              <ol className="adaptive-plan">{practicePlan.items.map((item, index) => <li key={`${item.destination}-${index}`}><button onClick={() => openPlanDestination(item.destination)}><span>{item.minutes} min</span><div><strong>{item.title}</strong><small>{item.reason}</small></div><i>→</i></button></li>)}</ol>
            </div>
          </div>
          <section className="performance-callout">
            <div><p className="eyebrow">From your own playing</p><h2>{latestExpressiveSketch ? "One specific thing to develop next" : "Your performances will teach the teacher"}</h2><p>{performanceGuidance}</p></div>
            {recentPerformance ? <dl><div><dt>Phrase</dt><dd>{(recentPerformance.duration / 1000).toFixed(1)}s</dd></div><div><dt>Touch range</dt><dd>{recentPerformance.dynamicRange}</dd></div><div><dt>Rhythmic variation</dt><dd>{recentPerformance.gapVariation}%</dd></div></dl> : <button className="secondary-button" onClick={() => openCourse("improv", 1)}>Record a first phrase →</button>}
          </section>
          {upcomingReviews.length > 0 && <section className="review-horizon"><div><p className="eyebrow">Memory horizon</p><h2>{dueReviews.length ? `${dueReviews.length} ${dueReviews.length === 1 ? "idea is" : "ideas are"} ready for retrieval` : "Nothing is due yet"}</h2><p>Cadence spaces completed ideas farther apart when recall is strong and brings them back sooner after a difficult attempt.</p></div><div>{upcomingReviews.map((review) => <button key={`${review.courseId}:${review.stepId}`} onClick={() => openCourse(review.courseId, Math.max(0, getCourse(review.courseId).steps.findIndex((item) => item.id === review.stepId)))}><span>{new Date(review.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><strong>{review.title}</strong><small>{review.intervalDays}-day interval · attempt {review.repetitions}</small></button>)}</div></section>}
        </section>
      )}

      {view === "curriculum" && (
        <section className="curriculum-view">
          <div className="view-intro">
            <p className="eyebrow">The complete path</p>
            <h1>Technique serves understanding.<br />Understanding leads to a voice.</h1>
            <p>{COURSES.length} courses, {getStepCount()} guided learning experiences, five complete repertoire study paths, and a bridge into your production practice.</p>
          </div>
          {CHAPTERS.map((chapter) => (
            <section className="chapter-section" key={chapter}>
              <div className="chapter-title"><span>{CHAPTERS.indexOf(chapter) + 1}</span><div><p className="eyebrow">Chapter</p><h2>{chapter}</h2></div></div>
              <div className="course-list">
                {COURSES.filter((item) => item.chapter === chapter).map((item) => {
                  const done = completedSteps[item.id]?.length ?? 0;
                  const percent = Math.round((done / item.steps.length) * 100);
                  return (
                    <button className="course-row" key={item.id} onClick={() => openCourse(item.id, Math.min(done, item.steps.length - 1))}>
                      <span className="course-number">{percent === 100 ? "✓" : item.number}</span>
                      <span className="course-main"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                      <span className="course-tags">{item.tags.slice(0, 2).map((tag) => <i key={tag}>{tag}</i>)}</span>
                      <span className="course-meta"><b>{done}/{item.steps.length}</b><small>{item.duration}</small></span>
                      <span className="course-arrow" aria-hidden="true">→</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      )}

      {view === "studio" && (
        <div className="studio-layout">
          <aside className="lesson-rail">
            <button className="rail-back" onClick={() => setView("curriculum")}>← Curriculum</button>
            <div className="rail-course">
              <p>{course.chapter} · Course {course.number}</p>
              <h2>{course.title}</h2>
              <div className="course-progress"><i style={{ width: `${Math.round((courseCompleted.length / course.steps.length) * 100)}%` }} /></div>
              <small>{courseCompleted.length} of {course.steps.length} experiences complete</small>
            </div>
            <div className="step-list">
              {course.steps.map((item, index) => {
                const complete = courseCompleted.includes(item.id);
                return (
                  <button key={item.id} className={`${index === stepIndex ? "selected" : ""} ${complete ? "complete" : ""}`} onClick={() => setStepIndex(index)}>
                    <span>{complete ? "✓" : index + 1}</span>
                    <div><strong>{item.title}</strong><small>{stepLabel(item.kind)}</small></div>
                  </button>
                );
              })}
            </div>
            {course.repertoire && (
              <div className="edition-note">
                <p className="eyebrow">Study edition</p>
                <strong>{course.repertoire.edition}</strong>
                <span>{course.repertoire.sections.length} sections · complete path</span>
              </div>
            )}
          </aside>

          <section className="studio-main">
            <div className="studio-toolbar">
              <div className={`connection-state ${midiStatus === "connected" ? "ready" : ""}`}>
                <span className="status-dot" />
                <div><strong>{midiStatus === "connected" ? deviceName : "Screen keyboard ready"}</strong><small>{midiStatus === "connected" ? "Live MIDI is being heard" : "Connect MIDI when you want full-keyboard input"}</small></div>
              </div>
              <div className="toolbar-actions">
                {devices.length > 1 && <select aria-label="MIDI input" value={deviceId} onChange={(event) => attachMidiInput(devices.find((item) => item.id === event.target.value))}>{devices.map((device) => <option key={device.id} value={device.id}>{device.name ?? "MIDI input"}</option>)}</select>}
                <button className="quiet-button" onClick={() => setBrowserSound((value) => !value)}>{browserSound ? "Sound on" : "Sound off"}</button>
                <button className="quiet-button" onClick={connectMidi}>{midiStatus === "connected" ? "Reconnect" : "Connect MIDI"}</button>
              </div>
            </div>

            <div className="lesson-stage">
              <div className="lesson-copy-column">
                <p className="eyebrow">{reviewMode ? `Spaced review · attempt ${(reviewRecordAtEntry?.repetitions ?? 0) + 1}` : `${step.eyebrow} · ${stepIndex + 1} of ${course.steps.length}`}</p>
                <h1>{step.title}</h1>
                <p className="lesson-body">{reviewMode ? reviewVariant.diagnostic : step.body}</p>
              </div>

              {reviewMode && (
                <section className="review-teacher" aria-label="Adaptive review">
                  <div className="review-teacher-top">
                    <div><p className="eyebrow">{reviewVariant.strategy}</p><h2>{reviewVariant.title}</h2></div>
                    <span>{reviewRecordAtEntry?.quality ?? 75}% last evidence</span>
                  </div>
                  <p>{reviewVariant.whyChanged}</p>
                  {!reviewRevealed ? (
                    <div className="review-retrieval-gate">
                      <span>Do this before looking back</span>
                      <p>Say the answer aloud, imagine the sound, or test it once at the keyboard. Uncertain recall is useful evidence here.</p>
                      <button className="primary-button" onClick={() => setReviewRevealed(true)}>I attempted recall · show support</button>
                    </div>
                  ) : (
                    <div className="review-reframe">
                      <article><span>Another way in</span><p>{reviewVariant.explanation}</p></article>
                      <article><span>Transfer to your music</span><p>{reviewVariant.transfer}</p></article>
                    </div>
                  )}
                  {reviewRevealed && (step.kind === "learn" || step.kind === "listen") && (
                    <div className="review-confidence">
                      <span>How complete was your recall before the support appeared?</span>
                      <div>
                        {[{ value: 55, label: "Not yet" }, { value: 75, label: "Partial" }, { value: 92, label: "Clear" }].map(({ value, label }) => (
                          <button key={value} className={reviewConfidence === value ? "selected" : ""} aria-pressed={reviewConfidence === value} onClick={() => setReviewConfidence(value)}>{label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {(!reviewMode || reviewRevealed) && <div className={`activity-surface activity-${step.kind}`}>
                {(step.kind === "learn" || step.kind === "listen") && (
                  <div className="concept-activity">
                    <div className="concept-symbol">
                      <span>{step.demo ? "Listen before naming" : "Think, then test"}</span>
                      <strong>{step.demo && Array.isArray(step.demo[0]) ? (step.demo[0] as number[]).map(noteName).join(" · ") : step.demo ? (step.demo as number[]).slice(0, 5).map(noteName).join("  ") : "Sound → idea → language"}</strong>
                    </div>
                    {step.demo && <button className="primary-button" onClick={() => playDemo(step.demo)}>▶ Play the example</button>}
                  </div>
                )}

                {step.kind === "sequence" && (
                  <div className="play-activity">
                    <div className="note-path" aria-label="Lesson note sequence">
                      {sequenceNotes.map((note, index) => <span key={`${note}-${index}`} className={index < sequenceIndex ? "done" : index === sequenceIndex ? "current" : ""}><small>{index + 1}</small><strong>{noteName(note)}</strong></span>)}
                    </div>
                    <div className="activity-controls">
                      <div className="target-readout"><span>Now</span><strong>{stepComplete ? "✓" : noteName(targetNote)}</strong><small>{sequenceIndex}/{sequenceNotes.length} complete</small></div>
                      <button className="primary-button" onClick={beginActivity}>{activityRunning ? "Pause" : sequenceIndex ? "Continue playing" : "Begin playing"}</button>
                    </div>
                  </div>
                )}

                {step.kind === "chord" && (
                  <div className="chord-activity">
                    <div className="chord-formula">
                      {(step.targetChord ?? []).map((note, index) => <span key={note}><small>{["Root", "Third", "Fifth", "Seventh"][index] ?? `Tone ${index + 1}`}</small><strong>{noteName(note)}</strong></span>)}
                    </div>
                    <div className="chord-live"><span>You are holding</span><strong>{activeNotes.length ? activeNotes.map(noteName).join(" · ") : "Play the chord"}</strong><small>{liveChord ?? "Waiting for root, third, and fifth"}</small></div>
                    <button className="primary-button" onClick={beginActivity}>{activityRunning ? "Pause listening" : `Listen for ${step.targetName}`}</button>
                  </div>
                )}

                {step.kind === "quiz" && (
                  <div className="quiz-activity">
                    <div className="answer-list">
                      {step.choices?.map((choice, index) => (
                        <button key={choice.label} className={answerState?.index === index ? (answerState.correct ? "correct" : "incorrect") : ""} onClick={() => selectAnswer(index)} disabled={Boolean(answerState?.correct)}><span>{String.fromCharCode(65 + index)}</span><strong>{choice.label}</strong></button>
                      ))}
                    </div>
                    {answerState && <div className={`answer-explanation ${answerState.correct ? "correct" : ""}`}><strong>{answerState.correct ? "Yes. Here is the reason:" : "Look at the mechanism:"}</strong><p>{step.answerExplanation}</p></div>}
                  </div>
                )}

                {(step.kind === "improv" || step.kind === "compose") && (
                  <div className="creative-activity">
                    <div className="recording-line">
                      <span className={activityRunning ? "recording active" : "recording"}><i />{activityRunning ? "Listening" : "Ready"}</span>
                      <div><strong>{events.length}</strong><small>notes captured</small></div>
                      <div><strong>{new Set(eventNotes.map((note) => note % 12)).size}</strong><small>pitch classes</small></div>
                      <div><strong>{range}</strong><small>semitone range</small></div>
                    </div>
                    <div className="creative-stream">{events.length ? events.slice(-24).map((event, index) => <span key={`${event.at}-${index}`}>{noteName(event.note)}</span>) : <p>Your phrase will appear here. Do not try to make it impressive; make it recognizable.</p>}</div>
                    <div className="creative-actions">
                      <button className="primary-button" onClick={beginActivity}>{activityRunning ? "Pause recording" : events.length ? "Resume recording" : "Begin recording"}</button>
                      <button className="secondary-button" onClick={finishCreativeStep} disabled={events.length < creativeMinimum}>Save & reflect <span>{events.length}/{creativeMinimum} minimum</span></button>
                    </div>
                  </div>
                )}
              </div>}

              <div className={`feedback-line ${stepComplete ? "complete" : ""}`} role="status" aria-live="polite"><span>{stepComplete ? "✓" : liveChord ? "♫" : "→"}</span><p>{feedback}</p></div>

              {course.repertoire && (!reviewMode || reviewRevealed) && (
                <ScoreReader
                  key={course.id}
                  title={course.title}
                  composer={course.repertoire.composer}
                  scoreUrl={course.repertoire.scoreUrl}
                  totalMeasures={course.repertoire.totalMeasures}
                  practiceBpm={course.repertoire.practiceBpm}
                  sections={course.repertoire.sections}
                  playedNote={scorePlayedNote}
                  completedMeasures={scoreMeasures[course.id] ?? []}
                  onMeasureComplete={completeScoreMeasure}
                  onFeedback={setFeedback}
                  onSessionResult={recordScoreSession}
                  onSectionChange={setActiveScoreSection}
                  analysis={repertoireAnalysis ? (
                    <RepertoireMicroscope
                      analysis={repertoireAnalysis}
                      totalSections={courseAnalysisCount}
                      exploredIds={exploredAnalysis[course.id] ?? []}
                      preferences={preferences}
                      onPlay={playDemo}
                      onExplore={(analysisId) => setExploredAnalysis((current) => {
                        const existing = current[course.id] ?? [];
                        return existing.includes(analysisId) ? current : { ...current, [course.id]: [...existing, analysisId] };
                      })}
                    />
                  ) : undefined}
                />
              )}

              {(!reviewMode || reviewRevealed) && <div className="teaching-notes">
                <article><p className="eyebrow">Why this matters</p><p>{step.why}</p></article>
                <article><p className="eyebrow">Listen for</p><p>{step.listenFor ?? step.hint ?? "Notice what feels stable, what creates motion, and where the phrase wants to breathe."}</p></article>
                {step.prompt && <article><p className="eyebrow">Reflection</p><p>{step.prompt}</p></article>}
              </div>}

              <div className="lesson-footer">
                <span>{stepComplete ? (reviewMode ? "Review evidence saved · the next interval has been adjusted" : "Experience complete") : reviewMode && !reviewRevealed ? "Attempt recall before revealing support" : step.kind === "learn" ? "Continue when you can explain the idea in your own words" : "Complete the activity to continue"}</span>
                <button className="primary-button" disabled={(reviewMode && !reviewRevealed) || (!stepComplete && step.kind !== "learn" && step.kind !== "listen")} onClick={continueStep}>{stepIndex === course.steps.length - 1 ? "Finish course" : reviewMode ? "Save review & continue" : "Continue"} →</button>
              </div>
            </div>

            <section className="instrument-section">
              <div className="instrument-heading">
                <div><p className="eyebrow">Live instrument</p><h2>{liveChord ?? (lastNote !== null ? `${noteName(lastNote)} detected` : "Play any note")}</h2></div>
                <div className="metronome-control"><button className={metronomeOn ? "metronome active" : "metronome"} onClick={() => setMetronomeOn((value) => !value)}><i className={`beat beat-${beat}`} />{metronomeOn ? "Pulse on" : "Metronome"}</button><label><span>{bpm} BPM</span><input type="range" min="48" max="132" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} /></label></div>
              </div>
              <PianoKeyboard whiteNotes={whiteNotes} blackNotes={blackNotes} activeNotes={activeNotes} targetNotes={reviewMode && !reviewRevealed ? [] : step.kind === "chord" ? step.targetChord ?? [] : targetNote !== undefined ? [targetNote] : []} onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
              <p className="keyboard-help">Computer keys: A W S E D F T G Y H U J K · Your MIDI keyboard is used automatically once connected.</p>
            </section>

            {(!reviewMode || reviewRevealed) && <section className={`understanding-grid ${course.repertoire ? "repertoire-understanding" : ""}`}>
              {!course.repertoire && <article className="microscope">
                <div className="section-heading"><div><p className="eyebrow">Music microscope</p><h2>Why this chord?</h2></div><select value={selectedConcept} onChange={(event) => setSelectedConcept(event.target.value)}><option>C major</option><option>G7</option><option>A minor</option><option>E minor</option></select></div>
                <div className="microscope-symbol"><strong>{explanation.symbol}</strong><span>{explanation.role}</span></div>
                <p>{explanation.explanation}</p>
                <div className="microscope-detail"><span>Try it</span><p>{explanation.experiment}</p></div>
              </article>}
              <article className="coach-card">
                <p className="eyebrow">{drill.eyebrow}</p><h2>{drill.title}</h2><p>{drill.instruction}</p><strong>{drill.repetitions}</strong><div><span>Why this drill</span><p>{drill.reason}</p></div>
              </article>
            </section>}
          </section>
        </div>
      )}

      {view === "lab" && (
        <MusicianshipLab
          playedNote={scorePlayedNote}
          earProgress={earProgress}
          onEarProgress={setEarProgress}
          playNotes={playLabNotes}
          midiConnected={midiStatus === "connected"}
          onConnectMidi={connectMidi}
          preferences={preferences}
          onTechniqueResult={(result) => setTechniqueHistory((current) => [result, ...current].slice(0, 20))}
          playContext={playImprovisationContext}
          onScreenNote={playScreenLabNote}
          onImprovisationResult={(result) => setImprovisationHistory((current) => [result, ...current].slice(0, 24))}
          onSaveImprovisation={(sketch) => setSketches((current) => [sketch, ...current].slice(0, 24))}
          onHarmonyResult={(result) => setHarmonyHistory((current) => [result, ...current].slice(0, 24))}
          activeNotes={activeNotes}
          theoryProgress={theoryProgress}
          onTheoryProgress={setTheoryProgress}
        />
      )}

      {view === "assessment" && (
        <PlacementAssessment
          playedNote={scorePlayedNote}
          playNotes={playLabNotes}
          onInputNote={(midi) => { handleNoteOn(midi, "screen", 92); window.setTimeout(() => handleNoteOff(midi), 130); }}
          midiConnected={midiStatus === "connected"}
          onConnectMidi={connectMidi}
          onComplete={(profile) => { setPlacementProfile(profile); setSelectedCourseId(profile.recommendedCourseId); setStepIndex(0); setView("today"); }}
          onExit={() => setView("today")}
        />
      )}

      {view === "sketchbook" && (
        editingProjectId && compositionProjects.find((item) => item.id === editingProjectId) ? (
          <CompositionProjectStudio
            project={compositionProjects.find((item) => item.id === editingProjectId)!}
            sketches={sketches}
            preferences={preferences}
            onUpdate={(updated) => setCompositionProjects((current) => current.map((item) => item.id === updated.id ? updated : item))}
            onClose={() => setEditingProjectId(null)}
            onPlay={playPerformance}
            onCreateSketch={createProjectSketch}
          />
        ) : editingSketchId && sketches.find((item) => item.id === editingSketchId) ? (
          <CompositionWorkbench
            sketch={sketches.find((item) => item.id === editingSketchId)!}
            preferences={preferences}
            onUpdate={(updated) => setSketches((current) => current.map((item) => item.id === updated.id ? updated : item))}
            onClose={() => setEditingSketchId(null)}
            onPlay={playPerformance}
          />
        ) : <section className="sketchbook-view">
          <div className="view-intro sketchbook-intro"><div><p className="eyebrow">Sketchbook</p><h1>Ideas become pieces<br />through decisions.</h1><p>Sketches are raw musical material. Projects teach you how to shape that material into form, harmony, arrangement, and revision.</p></div><button className="primary-button" onClick={() => startCompositionProject(sketches[0]?.id)}>Start a composition project →</button></div>

          <section className="project-library">
            <div className="library-heading"><div><p className="eyebrow">Composition projects</p><h2>Longer work, with a reason for every section</h2></div><span>{compositionProjects.length ? `${compositionProjects.length} local project${compositionProjects.length === 1 ? "" : "s"}` : "A–A′–B–A form"}</span></div>
            {compositionProjects.length ? <div className="project-list">{compositionProjects.map((project) => {
              const evidence = analyzeProject(project);
              const projectBrief = PROJECT_BRIEFS.find((item) => item.id === project.briefId);
              return <article key={project.id}><div><span>{projectBrief?.title ?? "Composition project"} · {project.sections.reduce((sum, section) => sum + section.bars, 0)} bars</span><h3>{project.title}</h3><p>{evidence.observation}</p></div><div className="project-list-progress"><span><i style={{ width: `${(evidence.completed / evidence.total) * 100}%` }} /></span><small>{evidence.completed}/{evidence.total} structural decisions</small></div><button className="secondary-button" onClick={() => { setEditingSketchId(null); setEditingProjectId(project.id); }}>Continue project →</button></article>;
            })}</div> : <div className="project-empty"><div><strong>From a four-note seed to a complete miniature</strong><p>Choose an idea, develop A′, create contrast in B, plan the return, assign instrumental roles, and revise from listening evidence.</p></div><button className="secondary-button" onClick={() => startCompositionProject(sketches[0]?.id)}>Open the Project Studio</button></div>}
          </section>

          <section className="source-library"><div className="library-heading"><div><p className="eyebrow">Source material</p><h2>Improvisations, progressions, and captured phrases</h2></div><span>{sketches.length} saved</span></div>
          {sketches.length ? <div className="sketch-list">{sketches.map((sketch) => (
            <article key={sketch.id} className="sketch-row"><div><p>{new Date(sketch.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p><h2>{sketch.title}</h2><span>{sketch.notes.length} notes · {sketch.duration}s · range {Math.max(...sketch.notes) - Math.min(...sketch.notes)} semitones{sketch.performance?.length ? " · expression preserved" : ""}</span></div><div className="sketch-notes">{sketch.notes.slice(0, 16).map((note, index) => <i key={`${note}-${index}`}>{noteName(note)}</i>)}</div><div className="sketch-actions"><button className="secondary-button" onClick={() => replaySketch(sketch)}>▶ Replay</button><button className="quiet-button" onClick={() => startCompositionProject(sketch.id)}>Use in project</button><button className="primary-button" onClick={() => { setEditingProjectId(null); setEditingSketchId(sketch.id); }}>Edit phrase →</button></div></article>
          ))}</div> : <div className="empty-state"><span aria-hidden="true">♪</span><h2>You can begin without a saved idea.</h2><p>The Project Studio includes a plain six-note motif, or capture your own in the Improvisation Studio first.</p><div><button className="primary-button" onClick={() => startCompositionProject()}>Use starter motif</button><button className="secondary-button" onClick={() => openCourse("improv")}>Capture an improvisation</button></div></div>}</section>
        </section>
      )}

      {view === "progress" && (
        <section className="progress-view">
          <div className="view-intro"><p className="eyebrow">Musicianship</p><h1>Progress is what you can<br />hear, explain, and create.</h1><p>Completion matters less than connections becoming reliable.</p></div>
          <div className="progress-overview"><div className="progress-ring" style={{ "--progress": `${overallProgress * 3.6}deg` } as React.CSSProperties}><div><strong>{overallProgress}%</strong><span>whole path</span></div></div><div className="progress-facts"><div><strong>{totalCompleted}</strong><span>learning experiences</span></div><div><strong>{Object.values(scoreMeasures).reduce((sum, measures) => sum + measures.length, 0)}</strong><span>score measures followed</span></div><div><strong>{earProgress.attempted ? Math.round((earProgress.correct / earProgress.attempted) * 100) : "–"}{earProgress.attempted ? "%" : ""}</strong><span>ear-lab accuracy</span></div><div><strong>{sketches.length}</strong><span>creative sketches</span></div></div></div>
          <div className="musicianship-map">
            {CHAPTERS.map((chapter) => {
              const chapterCourses = COURSES.filter((item) => item.chapter === chapter);
              const total = chapterCourses.reduce((sum, item) => sum + item.steps.length, 0);
              const done = chapterCourses.reduce((sum, item) => sum + (completedSteps[item.id]?.length ?? 0), 0);
              const percent = Math.round((done / total) * 100);
              return <div className="skill-row" key={chapter}><span>{chapter}</span><div><i style={{ width: `${percent}%` }} /></div><strong>{percent}%</strong><small>{done}/{total} experiences</small></div>;
            })}
          </div>
          <section className="evidence-grid">
            <article><p className="eyebrow">Score performance</p><strong>{latestScoreSession ? (latestScoreSession.timingSamples ? `${latestScoreSession.rhythm}%` : "Calibrating") : "No session yet"}</strong><span>{latestScoreSession ? `${latestScoreSession.section} rhythm · ${latestScoreSession.accuracy}% pitch · ${latestScoreSession.tempo} BPM` : "Follow two or more score positions to establish a baseline."}</span></article>
            <article><p className="eyebrow">Physical control</p><strong>{latestTechnique ? `${latestTechnique.control}%` : "No sample yet"}</strong><span>{latestTechnique ? `${latestTechnique.mode} · ${latestTechnique.notes} notes · touch evenness ${latestTechnique.evenness}%` : "Connect MIDI and save a Touch laboratory sample."}</span></article>
            <article><p className="eyebrow">Aural vocabulary</p><strong>{earProgress.attempted ? `${Math.round((earProgress.correct / earProgress.attempted) * 100)}%` : "No answers yet"}</strong><span>{earProgress.attempted ? `${earProgress.attempted} comparisons · ${earProgress.intervalLevel + 3} active interval colors` : "The Ear laboratory adapts after each answer."}</span></article>
            <article><p className="eyebrow">Improvisation</p><strong>{latestImprovisation ? `${latestImprovisation.motifScore}% motif` : "No phrase yet"}</strong><span>{latestImprovisation ? `${latestImprovisation.scenarioTitle} · ${latestImprovisation.harmonicFit}% harmonic fit · ${latestImprovisation.phraseCount} phrases` : "The Improvisation Studio listens for identity, space, harmony, and endings."}</span></article>
            <article><p className="eyebrow">Applied harmony</p><strong>{latestHarmony ? `${latestHarmony.smoothness}% smooth` : "No progression yet"}</strong><span>{latestHarmony ? `${latestHarmony.chords.join(" → ")} · ${latestHarmony.cadence}` : "Build and audition a progression to measure function and voice-leading."}</span></article>
            <article><p className="eyebrow">Composition form</p><strong>{latestCompositionEvidence ? `${latestCompositionEvidence.completed}/${latestCompositionEvidence.total} decisions` : "No project yet"}</strong><span>{latestCompositionProject && latestCompositionEvidence ? `${latestCompositionProject.title} · ${latestCompositionEvidence.observation}` : "Develop a seed through identity, contrast, return, arrangement, and listening-based revision."}</span></article>
            <article><p className="eyebrow">Theory connections</p><strong>{exploredAnalysisCount ? `${exploredAnalysisCount} explored` : "Not started"}</strong><span>{exploredAnalysisCount ? "Section-level harmony, voice-leading, and creative transfers heard inside the complete scores." : "Open a repertoire score and audition its harmonic map."}</span></article>
            <article><p className="eyebrow">Theory fluency</p><strong>{theoryProgress.exploredKeys.length ? `${theoryProgress.exploredKeys.length} key systems` : "Not mapped yet"}</strong><span>{theoryProgress.attempts ? `${theoryProgress.correct}/${theoryProgress.attempts} keyboard proofs · ${theoryProgress.exploredChords.length} chord relationships explored` : "Use the Theory Atlas to construct scales, diatonic harmony, extensions, inversions, and function in every key."}</span></article>
            <article><p className="eyebrow">Long-term recall</p><strong>{Object.keys(reviewSchedule).length ? `${dueReviews.length} due` : "Not scheduled"}</strong><span>{Object.keys(reviewSchedule).length ? `${Object.keys(reviewSchedule).length} learned ideas in the memory cycle · next intervals grow with reliable recall` : "Complete a lesson experience to begin spaced review."}</span></article>
          </section>
          <div className="progress-principle"><span>Romanas’s path</span><p>Your selected direction: {preferences.join(", ")}. Progress and sketches stay in this browser, with no account required.</p></div>
          {recentPerformance && <div className="progress-principle performance-principle"><span>Latest performance</span><p>{performanceGuidance} Cadence measured {recentPerformance.dynamicRange} velocity levels of touch range and {recentPerformance.gapVariation}% relative variation in note spacing.</p></div>}
        </section>
      )}
    </main>
  );
}

function PianoKeyboard({
  whiteNotes,
  blackNotes,
  activeNotes,
  targetNotes,
  onNoteOn,
  onNoteOff,
}: {
  whiteNotes: number[];
  blackNotes: number[];
  activeNotes: number[];
  targetNotes: number[];
  onNoteOn: (note: number, source?: NoteSource) => void;
  onNoteOff: (note: number) => void;
}) {
  const blackPosition = (note: number) => {
    const whitesBefore = whiteNotes.filter((white) => white < note).length;
    return `${(whitesBefore / whiteNotes.length) * 100}%`;
  };
  return (
    <div className="piano" aria-label="Interactive piano keyboard">
      <div className="white-keys">
        {whiteNotes.map((note) => (
          <button key={note} aria-label={noteName(note)} className={`white-key ${activeNotes.includes(note) ? "active" : ""} ${targetNotes.some((target) => target % 12 === note % 12) ? "target" : ""}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onNoteOn(note); }} onPointerUp={() => onNoteOff(note)} onPointerCancel={() => onNoteOff(note)}>
            {(note % 12 === 0 || activeNotes.includes(note)) && <span>{noteName(note)}</span>}
          </button>
        ))}
      </div>
      {blackNotes.map((note) => <button key={note} aria-label={noteName(note)} className={`black-key ${activeNotes.includes(note) ? "active" : ""} ${targetNotes.some((target) => target % 12 === note % 12) ? "target" : ""}`} style={{ left: blackPosition(note) }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onNoteOn(note); }} onPointerUp={() => onNoteOff(note)} onPointerCancel={() => onNoteOff(note)}><span>{activeNotes.includes(note) ? noteName(note) : ""}</span></button>)}
    </div>
  );
}
