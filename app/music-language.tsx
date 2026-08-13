import type { LessonStep, MusicTerm } from "./curriculum";

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
};

const NATURAL_LETTERS: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function staffTop(midi: number) {
  const octave = Math.floor(midi / 12) - 1;
  const pitch = midi % 12;
  const naturalPitch = NATURAL_LETTERS[pitch] ?? NATURAL_LETTERS[(pitch + 11) % 12] ?? 0;
  const diatonicPosition = octave * 7 + naturalPitch;
  const e4Position = 4 * 7 + 2;
  return 80 - (diatonicPosition - e4Position) * 7.5;
}

export function NotationStaff({ notes, currentIndex, complete, showNames = true }: NotationStaffProps) {
  const width = Math.max(520, notes.length * 52 + 92);

  return (
    <div className="notation-reader">
      <div className="notation-scroll">
        <div className="notation-track" style={{ width }} role="img" aria-label={`Written notes: ${notes.map(noteName).join(", ")}`}>
          <span className="treble-clef" aria-hidden="true">𝄞</span>
          <div className="staff-lines" aria-hidden="true">{[0, 1, 2, 3, 4].map((line) => <i key={line} />)}</div>
          {notes.map((note, index) => {
            const state = index < currentIndex || complete ? "read" : index === currentIndex ? "current" : "waiting";
            return (
              <span
                key={`${note}-${index}`}
                className={`staff-note ${state} ${note === 60 ? "middle-c" : ""}`}
                style={{ left: 82 + index * 52, top: `${staffTop(note)}%` }}
                aria-label={`${index + 1}: ${noteName(note)}, ${state}`}
              >
                <i aria-hidden="true" />
                {showNames && <small>{noteName(note)}</small>}
              </span>
            );
          })}
        </div>
      </div>
      <div className="notation-key">
        <span><i className="notation-current" /> Read this note now</span>
        <span>Higher symbol = move right on the keyboard</span>
        <span>C4 = middle C</span>
      </div>
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
