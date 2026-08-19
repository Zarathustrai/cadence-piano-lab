import { useEffect, useId, useMemo, useRef } from "react";
import type { LessonStep, MusicTerm } from "./curriculum";
import { ledgerLinesForMidi, STAFF_LINE_Y, STAFF_UNIT_HEIGHT, staffYForMidi } from "./notation-geometry.mjs";

export const MUSIC_GLOSSARY: MusicTerm[] = [
  { term: "Note", plain: "One musical sound. On the page, it is shown by a small oval symbol." },
  { term: "Pitch", plain: "How high or low a note sounds." },
  { term: "Staff", plain: "The five horizontal lines where written notes are placed." },
  { term: "Treble clef", plain: "The curled sign at the start of the staff. It tells us which line represents which note." },
  { term: "Beat", plain: "The steady pulse you could tap with your foot." },
  { term: "Rhythm", plain: "The pattern of sounds and silences placed on the beat." },
  { term: "Bar (measure)", plain: "A small box of musical time between two vertical lines." },
  { term: "Phrase", plain: "A short musical thought, like a line you could sing in one breath." },
  { term: "Musical sentence", plain: "An informal comparison: several short musical thoughts joined into a larger idea. You do not need to memorize this as a rule." },
  { term: "Interval", plain: "The distance from one note to another." },
  { term: "Scale", plain: "A family of notes arranged from low to high or high to low." },
  { term: "Home note (tonic)", plain: "The note that feels most settled in a piece. Tonic is simply the teacher word for home." },
  { term: "Chord", plain: "Several notes sounding together." },
  { term: "Triad", plain: "A three-note chord built from a starting note, a middle note, and a top note." },
  { term: "Melody", plain: "The line of notes you would hum or sing." },
  { term: "Harmony", plain: "Notes heard together underneath or around the melody." },
  { term: "Motif", plain: "A very short, recognizable musical idea that can return or change." },
  { term: "Cadence", plain: "The way a musical thought pauses or ends." },
  { term: "Dominant", plain: "A tense note or chord that strongly wants to return home." },
  { term: "Voice leading", plain: "How each note inside one chord moves to a note in the next chord." },
  { term: "Register", plain: "The low, middle, or high area of the keyboard." },
  { term: "Inversion", plain: "The same chord with a different chord note placed at the bottom." },
  { term: "Dynamics", plain: "How softly or loudly you play, including changes between them." },
  { term: "Articulation", plain: "How notes begin and end: connected, separate, gentle, or crisp." },
  { term: "Pedal", plain: "The foot control that lets notes continue ringing after the keys are released." },
];

const TERM_ALIASES: Record<string, string[]> = {
  "Staff": ["staff"],
  "Treble clef": ["treble clef", "clef"],
  "Beat": ["beat", "pulse"],
  "Rhythm": ["rhythm"],
  "Bar (measure)": ["bar", "measure"],
  "Phrase": ["phrase"],
  "Musical sentence": ["musical sentence"],
  "Interval": ["interval"],
  "Scale": ["scale"],
  "Home note (tonic)": ["tonic", "home note", "home chord"],
  "Chord": ["chord"],
  "Triad": ["triad"],
  "Melody": ["melody"],
  "Harmony": ["harmony", "harmonic"],
  "Motif": ["motif"],
  "Cadence": ["cadence", "cadential"],
  "Dominant": ["dominant"],
  "Voice leading": ["voice leading"],
  "Register": ["register"],
  "Inversion": ["inversion"],
  "Dynamics": ["dynamic"],
  "Articulation": ["articulation"],
  "Pedal": ["pedal"],
};

export function getLessonTerms(step: LessonStep) {
  const text = [step.title, step.body, step.why, step.listenFor, step.hint, step.answerExplanation].filter(Boolean).join(" ").toLowerCase();
  const automatic = MUSIC_GLOSSARY.filter((item) => TERM_ALIASES[item.term]?.some((alias) => text.includes(alias)));
  const combined = [...(step.terms ?? []), ...automatic];
  return combined.filter((item, index) => combined.findIndex((candidate) => candidate.term === item.term) === index);
}

type NotationStaffProps = {
  notes: number[];
  currentIndex: number;
  complete: boolean;
  showNames?: boolean;
  measureNumbers?: number[];
  durations?: number[];
  showLegend?: boolean;
  ariaLabel?: string;
};

const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function accidentalForMidi(midi: number) {
  return NOTE_NAMES[((midi % 12) + 12) % 12].slice(1);
}

function directionCue(notes: number[], currentIndex: number, complete: boolean) {
  if (complete) return `All ${notes.length} symbols have been read.`;
  if (currentIndex === 0) return `Symbol 1 of ${notes.length} is highlighted.`;
  const previousY = staffYForMidi(notes[currentIndex - 1]);
  const currentY = staffYForMidi(notes[currentIndex]);
  const direction = currentY < previousY ? "higher" : currentY > previousY ? "lower" : "at the same height";
  return `Symbol ${currentIndex + 1} of ${notes.length} is highlighted. It is ${direction} than the previous symbol.`;
}

export function NotationStaff({
  notes,
  currentIndex,
  complete,
  showNames = true,
  measureNumbers,
  durations,
  showLegend = true,
  ariaLabel,
}: NotationStaffProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const summaryId = useId();
  const positions = useMemo(() => notes.map((_, index) => {
    const priorMeasureBreaks = measureNumbers
      ? measureNumbers
        .slice(1, index + 1)
        .filter((measure, breakIndex) => measure !== measureNumbers[breakIndex]).length
      : 0;
    return 96 + index * 52 + priorMeasureBreaks * 24;
  }), [measureNumbers, notes]);
  const width = Math.max(520, (positions.at(-1) ?? 96) + 72);
  const currentNote = notes[currentIndex];
  const scoreSummary = showNames
    ? `Written notes: ${notes.map(noteName).join(", ")}.`
    : `Written music exercise with ${notes.length} note symbols.`;
  const currentCue = showNames && !complete && currentNote !== undefined
    ? `Symbol ${currentIndex + 1} of ${notes.length}: ${noteName(currentNote)} is highlighted.`
    : directionCue(notes, currentIndex, complete);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || complete || currentIndex < 0) return;
    const targetX = positions[currentIndex] ?? 0;
    const nextLeft = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, targetX - viewport.clientWidth * 0.42));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({ left: nextLeft, behavior: reducedMotion ? "auto" : "smooth" });
  }, [complete, currentIndex, positions]);

  return (
    <div className="notation-reader" role={ariaLabel ? "group" : undefined} aria-label={ariaLabel}>
      <div className="notation-scroll" ref={scrollRef} data-current-index={currentIndex}>
        <svg className="notation-score" width={width} height={STAFF_UNIT_HEIGHT} viewBox={`0 0 ${width} ${STAFF_UNIT_HEIGHT}`} role="img" aria-labelledby={summaryId}>
          <title id={summaryId}>{scoreSummary}</title>
          <g className="notation-staff" aria-hidden="true">
            {Object.entries(STAFF_LINE_Y).map(([name, y]) => <line key={name} x1="70" x2={width - 20} y1={y} y2={y} />)}
            <text className="notation-clef" x="20" y="126">𝄞</text>
          </g>
          {notes.map((note, index) => {
            const state = index < currentIndex || complete ? "read" : index === currentIndex ? "current" : "waiting";
            const x = positions[index];
            const y = staffYForMidi(note);
            const accidental = accidentalForMidi(note);
            const labelY = y > 138 ? y - 12 : y + 22;
            const duration = durations?.[index] ?? 1;
            const beginsMeasure = Boolean(measureNumbers && (index === 0 || measureNumbers[index] !== measureNumbers[index - 1]));
            const stemUp = y >= STAFF_LINE_Y.B4;
            return (
              <g
                key={`${note}-${index}`}
                className={`notation-note ${state}`}
                data-note-index={index}
                aria-hidden="true"
              >
                {beginsMeasure && <>
                  <line className="notation-barline" x1={x - 27} x2={x - 27} y1={STAFF_LINE_Y.F5} y2={STAFF_LINE_Y.E4} />
                  <text className="notation-measure-number" x={x - 22} y="42">{measureNumbers?.[index]}</text>
                </>}
                {ledgerLinesForMidi(note).map((ledgerY) => <line key={ledgerY} className="notation-ledger" x1={x - 15} x2={x + 15} y1={ledgerY} y2={ledgerY} />)}
                {accidental && <text className="notation-accidental" x={x - 19} y={y + 4}>{accidental}</text>}
                {duration < 4 && <line className="notation-stem" x1={x + (stemUp ? 7 : -7)} x2={x + (stemUp ? 7 : -7)} y1={y} y2={y + (stemUp ? -31 : 31)} />}
                {duration < 1 && <path className="notation-flag" d={stemUp
                  ? `M ${x + 7} ${y - 31} q 14 8 5 20`
                  : `M ${x - 7} ${y + 31} q -14 -8 -5 -20`} />}
                <ellipse className={`notation-notehead ${duration >= 2 ? "open" : ""}`} cx={x} cy={y} rx="9" ry="6" transform={`rotate(-16 ${x} ${y})`} />
                {showNames && <text className="notation-label" x={x} y={labelY}>{noteName(note)}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="sr-only" aria-live="polite">{currentCue}</p>
      {showLegend && <div className="notation-key">
        <span><i className="notation-current" /> Read this note now</span>
        <span>Higher symbol = move right on the keyboard</span>
        <span>C4 = middle C</span>
      </div>}
    </div>
  );
}

export function LessonTerms({ terms }: { terms: MusicTerm[] }) {
  if (!terms.length) return null;
  return (
    <section className="lesson-terms" aria-labelledby="lesson-terms-title">
      <div>
        <p className="eyebrow">Words used here</p>
        <h2 id="lesson-terms-title">Plain language first</h2>
      </div>
      <dl>
        {terms.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.plain}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FullGlossary({ onClose }: { onClose: () => void }) {
  return (
    <section className="glossary-panel" aria-labelledby="glossary-title">
      <div className="glossary-heading">
        <div><p className="eyebrow">Keep this open while learning</p><h2 id="glossary-title">Music words, translated</h2></div>
        <button className="quiet-button" onClick={onClose}>Close glossary</button>
      </div>
      <dl>
        {MUSIC_GLOSSARY.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.plain}</dd></div>)}
      </dl>
    </section>
  );
}
