import { ODE_TO_JOY_SCORE } from "./score-practice.mjs";

export type StepKind =
  | "learn"
  | "listen"
  | "sequence"
  | "chord"
  | "quiz"
  | "improv"
  | "compose";

export type Choice = {
  label: string;
  correct?: boolean;
};

export type MusicTerm = {
  term: string;
  plain: string;
};

export type LessonStep = {
  id: string;
  kind: StepKind;
  eyebrow: string;
  title: string;
  body: string;
  why: string;
  listenFor?: string;
  hint?: string;
  sequence?: number[];
  demo?: number[] | number[][];
  targetChord?: number[];
  targetName?: string;
  allowedNotes?: number[];
  minNotes?: number;
  prompt?: string;
  choices?: Choice[];
  answerExplanation?: string;
  terms?: MusicTerm[];
  notation?: {
    showNames?: boolean;
    spellings?: string[];
  };
};

export type ScoreSection = {
  title: string;
  measures: [number, number];
  focus: string;
  harmony: string;
};

export type ScorePosition = {
  midi: number;
  measure: number;
  beats: number;
};

export type Course = {
  id: string;
  number: string;
  chapter: "Foundations" | "Harmony" | "Repertoire" | "Create";
  title: string;
  subtitle: string;
  duration: string;
  outcome: string;
  tags: string[];
  steps: LessonStep[];
  prerequisites?: string[];
  resources?: {
    label: string;
    url: string;
    description: string;
  }[];
  repertoire?: {
    composer: string;
    edition: string;
    scoreUrl: string;
    totalMeasures: number;
    practiceBpm: number;
    sections: ScoreSection[];
    completeWork: boolean;
    practiceSequence?: ScorePosition[];
  };
};

const learn = (
  id: string,
  title: string,
  body: string,
  why: string,
  demo?: number[] | number[][],
  listenFor?: string,
): LessonStep => ({ id, kind: "learn", eyebrow: "Understand", title, body, why, demo, listenFor });

const sequence = (
  id: string,
  title: string,
  body: string,
  notes: number[],
  why: string,
  hint?: string,
): LessonStep => ({ id, kind: "sequence", eyebrow: "Play", title, body, sequence: notes, why, hint });

const chord = (
  id: string,
  title: string,
  body: string,
  notes: number[],
  name: string,
  why: string,
  hint?: string,
): LessonStep => ({
  id,
  kind: "chord",
  eyebrow: "Build at the keyboard",
  title,
  body,
  targetChord: notes,
  targetName: name,
  why,
  hint,
  demo: [notes],
});

const quiz = (
  id: string,
  title: string,
  body: string,
  choices: Choice[],
  explanation: string,
  why: string,
): LessonStep => ({
  id,
  kind: "quiz",
  eyebrow: "Explain it back",
  title,
  body,
  choices,
  answerExplanation: explanation,
  why,
});

export const COURSES: Course[] = [
  {
    id: "keyboard",
    number: "01",
    chapter: "Foundations",
    title: "The keyboard as a map",
    subtitle: "Find notes without counting keys",
    duration: "18 min",
    outcome: "You can orient yourself from any group of black keys and explain why C is not the musical beginning of everything.",
    tags: ["Geography", "Pitch", "First principles"],
    steps: [
      learn(
        "black-key-map",
        "The pattern is the map",
        "The keyboard repeats one visual pattern: two black keys, then three. C sits immediately to the left of every group of two; F sits immediately to the left of every group of three. The letter names then continue forward and repeat.",
        "Landmarks free you from counting individual keys. That matters when reading, changing hand position, and eventually producing ideas in any register.",
        [48, 53, 60, 65, 72],
        "The same note name returns higher or lower, but its musical identity stays recognizable.",
      ),
      sequence("find-cs", "Find three Cs", "Play C3, C4, then C5. Use the two-black-key landmark each time.", [48, 60, 72], "This teaches octave equivalence: different height, same note class.", "Look immediately left of each group of two black keys."),
      sequence("direction", "Make pitch direction physical", "Play C4, D4, E4, F4, G4, then return. Say the letter names quietly as you move.", [60, 62, 64, 65, 67, 65, 64, 62, 60], "Reading is mostly recognizing direction and distance, not decoding isolated letters."),
      quiz("octave-question", "What survives an octave?", "C3 and C4 sound different in height. What do they share?", [{ label: "Their note identity", correct: true }, { label: "Exactly the same frequency" }, { label: "The same finger" }], "An octave doubles frequency, but the ear groups both pitches as versions of C.", "This is the first abstraction behind scales, chords, and transposition."),
      {
        id: "geography-create",
        kind: "improv",
        eyebrow: "Create",
        title: "A conversation between registers",
        body: "Use only C, D, E, G, and A. Play a short idea near middle C, then answer it one octave higher.",
        allowedNotes: [60, 62, 64, 67, 69, 72, 74, 76, 79, 81],
        minNotes: 10,
        why: "You are already composing with register, repetition, and contrast rather than merely finding keys.",
        hint: "Repeat the rhythm of your first idea, but change its final note.",
      },
    ],
  },
  {
    id: "notation",
    number: "02",
    chapter: "Foundations",
    title: "How written music works",
    subtitle: "Read the page one symbol at a time",
    duration: "25 min",
    outcome: "You can follow notes moving up and down, find middle C, and read the opening of Ode to Joy without guessing from a letter list.",
    tags: ["No prior reading", "Staff", "Middle C"],
    prerequisites: ["keyboard"],
    steps: [
      {
        ...learn(
          "page-is-map",
          "The page is a height map",
          "A written note is a small oval placed on five lines called a staff. A symbol higher on the staff means a higher sound, so your hand usually moves right. A lower symbol means a lower sound, so your hand moves left. Start by seeing direction; letter names come second.",
          "Reading becomes much easier when you see a moving shape instead of decoding every symbol separately.",
          [60, 62, 64, 65, 67],
          "Hear the notes rise while the symbols would rise on the page.",
        ),
        terms: [
          { term: "Note", plain: "One musical sound. On the page, it is shown by a small oval." },
          { term: "Staff", plain: "The five horizontal lines where notes are placed." },
          { term: "Pitch", plain: "How high or low a note sounds." },
        ],
      },
      {
        ...sequence("read-up", "Follow five notes upward", "The highlighted symbol moves upward one step at a time. Begin on middle C, then move to the next white key on the right for each new symbol.", [60, 62, 64, 65, 67], "Your eye, ear, and hand are learning the same direction together.", "Do not memorize the row of letters. Watch whether the next symbol is higher or lower."),
        notation: { showNames: true },
        terms: [{ term: "Middle C (C4)", plain: "The C near the center of the keyboard. Cadence writes it as C4 so it is not confused with a lower or higher C." }],
      },
      {
        ...learn(
          "clef-landmarks",
          "Three landmarks are enough to begin",
          "The curled sign is the treble clef. It fixes the note names on the staff. Middle C sits just below the staff on one short extra line. E sits on the bottom line. G sits on the second line. You can find other notes by stepping up or down from these landmarks.",
          "Landmarks let you read relationships. You do not need to memorize every line and space before playing music.",
          [60, 64, 67],
          "Middle C, E, and G sound like every other white key from the same starting point.",
        ),
        terms: [
          { term: "Treble clef", plain: "The curled sign that tells us which staff position belongs to which note." },
          { term: "Landmark note", plain: "A note you recognize quickly and use to find nearby notes." },
        ],
      },
      {
        ...sequence("read-landmarks", "Read middle C, E, and G", "Look at each highlighted oval, then play its matching key. The labels stay visible while you learn the three landmarks.", [60, 64, 67, 64, 60], "Recognizing a few reliable places is faster than counting every line from scratch.", "C is below the staff, E is on the bottom line, G is on the second line."),
        notation: { showNames: true },
      },
      quiz("note-name", "What does E4 mean?", "Cadence sometimes writes a letter followed by a number. What is that number doing?", [{ label: "It identifies which E on the keyboard", correct: true }, { label: "It tells you to use finger four" }, { label: "It tells you to play four times" }], "The letter names the note. The number identifies its keyboard area. E4 is the E just above middle C; it is not a fingering instruction.", "This notation is used by MIDI apps. Printed scores normally show the height through staff position instead."),
      {
        ...sequence("ode-first-shape", "Read Beethoven's first shape", "Read only five symbols: E, E, F, G, G. Repeated symbols mean repeat the same key. A symbol one step higher means move to the next white key on the right.", [64, 64, 65, 67, 67], "You have now read the opening shape instead of copying an unexplained list of note names.", "The first two symbols stay in the same place; the next two steps rise."),
        notation: { showNames: false },
        terms: [{ term: "Melody", plain: "The line of notes you would hum or sing. This Beethoven opening is a melody." }],
      },
    ],
  },
  {
    id: "intervals",
    number: "03",
    chapter: "Foundations",
    title: "Intervals: music in distances",
    subtitle: "Hear and build the space between notes",
    duration: "24 min",
    outcome: "You can construct seconds through fifths and connect their sound to melody and harmony.",
    tags: ["Ear", "Reading", "Melody"],
    prerequisites: ["keyboard", "notation"],
    steps: [
      { ...learn("interval-idea", "A melody is a path of distances", "An interval is simply the distance from one note to another. C to D is called a second, C to E a third, C to F a fourth, and C to G a fifth. The number counts both note letters, including the starting note.", "Thinking in distances makes music transferable. A shape can begin on a new note and remain the same musical idea.", [[60, 62], [60, 64], [60, 65], [60, 67]], "Seconds feel close, thirds begin to sound like a chord, and fourths and fifths feel more open."), terms: [
        { term: "Interval", plain: "The distance from one note to another." },
        { term: "Melody", plain: "The line of notes you would hum or sing." },
      ] },
      sequence("melodic-intervals", "Play four distances", "Begin on C4 each time, then play D4, E4, F4, and G4.", [60, 62, 60, 64, 60, 65, 60, 67], "Your hand, eye, and ear are learning one shared vocabulary."),
      quiz("third-count", "Why is C to E a third?", "Choose the most useful explanation.", [{ label: "It spans C, D, E", correct: true }, { label: "There are three piano keys between them" }, { label: "E is always major" }], "Interval numbers count letter names inclusively: C(1), D(2), E(3). Its quality, major or minor, is a separate detail.", "Correct counting prevents confusion when accidentals enter later."),
      sequence("motif-third", "Hear a motif as shape", "Play C, E, D, F, E, G. Notice the repeated upward third.", [60, 64, 62, 65, 64, 67], "Motifs become easier to remember and vary when you recognize their interval pattern."),
      { id: "interval-improv", kind: "improv", eyebrow: "Create", title: "Question in seconds, answer in thirds", body: "Use C major. Make a four-note question using mostly steps, then answer with at least one leap of a third.", allowedNotes: [60, 62, 64, 65, 67, 69, 71, 72], minNotes: 12, why: "Constraint turns interval knowledge into expressive choice.", hint: "End the question on G and the answer on C." },
    ],
  },
  {
    id: "rhythm",
    number: "04",
    chapter: "Foundations",
    title: "Rhythm before notes",
    subtitle: "Build pulse, subdivision, and rests",
    duration: "22 min",
    outcome: "You can keep a steady beat and understand how measured silence belongs inside a short musical thought.",
    tags: ["Pulse", "Subdivisions", "Timing"],
    prerequisites: ["keyboard", "notation"],
    steps: [
      { ...learn("pulse", "Beat is the clock; rhythm is the pattern", "The beat is the steady clock you can tap with your foot. Rhythm is the pattern of notes and silences placed on that clock. First learn to keep the clock steady. Expressive timing comes later.", "Every later style, from Bach to electronic production, depends on feeling a steady beat underneath the notes.", [60, 60, 60, 60], "Four equal notes, each arriving with one metronome click."), terms: [
        { term: "Beat (pulse)", plain: "The steady clock underneath the music." },
        { term: "Rhythm", plain: "The pattern of sounds and silences placed on the beat." },
        { term: "Phrase", plain: "A short musical thought, like a line you could sing in one breath." },
      ] },
      sequence("quarters", "Four settled quarters", "Set the metronome near 72 BPM. Play C4 once on each beat, four times.", [60, 60, 60, 60], "Repetition exposes timing more clearly than a busy melody."),
      sequence("rhythm-phrase", "Make repeated notes speak", "Play E E F G, then hold the final G in your mind for two beats.", [64, 64, 65, 67], "Repeated pitches make rhythm and articulation carry the expression."),
      quiz("rest", "What does a rest do?", "Which description is closest to musical reality?", [{ label: "It gives silence a measured duration", correct: true }, { label: "It stops the pulse" }, { label: "It means the performer made a mistake" }], "A rest is timed silence. The underlying beat continues through it.", "Composers shape expectation as much with absence as with sound."),
      { id: "rhythm-compose", kind: "compose", eyebrow: "Create", title: "Write one pitch, three rhythms", body: "Record three short phrases using only C4. Change the rhythm each time while keeping the same pulse.", allowedNotes: [60], minNotes: 8, prompt: "Can the third version feel like an ending?", why: "This isolates rhythm as a compositional parameter, the same way a producer might audition rhythmic variations before choosing pitches." },
    ],
  },
  {
    id: "scales",
    number: "05",
    chapter: "Foundations",
    title: "Scales and tonal gravity",
    subtitle: "Why seven notes do not feel equally stable",
    duration: "28 min",
    outcome: "You can play C major with practical fingering and hear which notes feel settled or want to move.",
    tags: ["C major", "Fingering", "Tonic"],
    steps: [
      { ...learn("scale-pattern", "A scale is a family with a home", "A scale is a family of notes arranged in order. C major uses the white keys C D E F G A B. C feels most settled, so musicians call it the home note, or tonic. G supports that home feeling, while B strongly wants to rise into C.", "Improvisation becomes meaningful when notes have different jobs instead of all feeling equally important.", [60, 62, 64, 65, 67, 69, 71, 72], "Hear B as a question and the final C as its answer."), terms: [
        { term: "Scale", plain: "A family of notes arranged from low to high or high to low." },
        { term: "Home note (tonic)", plain: "The note that feels most settled. Tonic is the teacher word for home." },
      ] },
      sequence("scale-up", "C major ascending", "Right hand: 1 2 3, pass the thumb under, then 1 2 3 4 5.", [60, 62, 64, 65, 67, 69, 71, 72], "Efficient fingering lets phrasing continue without a visible bump."),
      sequence("scale-return", "Return without collapsing", "Descend with 5 4 3 2 1, cross finger 3 over, then 3 2 1.", [72, 71, 69, 67, 65, 64, 62, 60], "The crossover is a transfer of balance, not a twist of the wrist."),
      quiz("leading-tone", "Why does B want to rise?", "Choose the best explanation in C major.", [{ label: "It is the nearest key below the home note, C", correct: true }, { label: "It is the highest white key" }, { label: "All seventh notes must be loud" }], "B sits only one keyboard step below the home note, C. That closeness makes the ear strongly expect B to move upward into C.", "Notes that lean toward another note give both chords and melodies a sense of direction."),
      { id: "scale-improv", kind: "improv", eyebrow: "Create", title: "Make C feel inevitable", body: "Improvise only with C D E G A. End your first phrase on G, then make the second phrase settle on C.", allowedNotes: [60, 62, 64, 67, 69, 72], minNotes: 14, why: "You are practicing tonal direction, not random scale wandering.", hint: "Leave a breath between the two phrases." },
    ],
  },
  {
    id: "triads",
    number: "06",
    chapter: "Harmony",
    title: "Triads from first principles",
    subtitle: "Root, third, fifth, and musical color",
    duration: "32 min",
    outcome: "You can build major and minor triads without memorizing hand shapes and explain what the third changes.",
    tags: ["Chords", "Major/minor", "Construction"],
    steps: [
      { ...learn("stacked-thirds", "Build a three-note chord by skipping letters", "A chord is several notes heard together. A triad is a particular three-note chord. Start on C, skip D and choose E, then skip F and choose G. You get C E G. The bottom note names the chord; changing the middle note changes its bright or dark color.", "This method works from any starting note and prevents chord learning from becoming a collection of unrelated hand shapes.", [[60, 64, 67], [60, 63, 67]], "The outer C and G stay fixed while one nearby middle key changes the whole color."), terms: [
        { term: "Chord", plain: "Several notes sounding together." },
        { term: "Triad", plain: "A three-note chord built by choosing every other letter name." },
        { term: "Root", plain: "The note that names the chord. C is the root of C major." },
      ] },
      chord("build-c", "Build C major", "Hold C4, E4, and G4 together. The app waits for all three notes.", [60, 64, 67], "C major", "You are building from scale degrees 1, 3, and 5.", "Use fingers 1, 3, and 5 in the right hand."),
      chord("build-am", "Build A minor", "Hold A3, C4, and E4 together.", [57, 60, 64], "A minor", "A minor shares C and E with C major. One changed bass note creates a new center.", "Keep C and E where they are, then move C major's G down to A below."),
      quiz("major-minor", "Which note defines the color?", "C major becomes C minor when one chord tone moves. Which one?", [{ label: "E moves to E♭", correct: true }, { label: "C moves to C♯" }, { label: "G moves to F" }], "Lowering the major third E by one semitone gives E♭, the minor third. Root and fifth remain C and G.", "A one-note change can carry more expressive weight than an entirely new texture."),
      { id: "triad-improv", kind: "improv", eyebrow: "Create", title: "Melody from chord tones", body: "Alternate C major and A minor in your left hand if comfortable. In the right hand, create a melody using only their shared and chord tones: A C E G.", allowedNotes: [57, 60, 64, 67, 69, 72, 76, 79], minNotes: 16, why: "This connects vertical harmony to horizontal melody, a core skill for composing and producing." },
    ],
  },
  {
    id: "inversions",
    number: "07",
    chapter: "Harmony",
    title: "Inversions and voice leading",
    subtitle: "Move chords with less effort and more intention",
    duration: "34 min",
    outcome: "You can recognize root position and inversions, then connect I, IV, and V with economical motion.",
    tags: ["Inversions", "Voice leading", "Texture"],
    steps: [
      learn("bass-note", "The bass changes the chord's posture", "C E G, E G C, and G C E contain the same three pitch classes. We name them root position, first inversion, and second inversion according to the lowest note.", "Inversions preserve harmonic identity while reshaping bass motion and texture.", [[60, 64, 67], [64, 67, 72], [55, 60, 64]], "The color remains C major, but each lowest note changes the sense of balance."),
      chord("c-first", "Build C major, first inversion", "Hold E4, G4, and C5.", [64, 67, 72], "C/E", "The slash tells you the chord first, then the bass note."),
      chord("f-first", "Build F major, first inversion", "Hold A3, C4, and F4.", [57, 60, 65], "F/A", "This voicing keeps two notes near C major and makes the hand travel less."),
      sequence("voice-line", "Hear the hidden line", "Play E4, F4, F4, E4 over an imagined C, F, G7, C bass.", [64, 65, 65, 64], "Smooth inner lines make chord progressions feel composed rather than blocky."),
      quiz("inversion-name", "What makes an inversion?", "What determines the inversion of a chord?", [{ label: "Its lowest sounding chord tone", correct: true }, { label: "The right-hand fingering" }, { label: "How loudly it is played" }], "The bass note determines inversion, regardless of how the upper notes are spaced.", "This lets you analyze piano scores and arrange chords across many octaves."),
    ],
  },
  {
    id: "progressions",
    number: "08",
    chapter: "Harmony",
    title: "Harmony that goes somewhere",
    subtitle: "Home, travel, tension, return",
    duration: "38 min",
    outcome: "You can play and explain I–IV–V7–I, hear dominant tension, and vary a progression deliberately.",
    tags: ["Chord jobs", "Tension", "Songwriting"],
    steps: [
      { ...learn("function", "Chords can feel like home, travel, and return", "A short musical thought can begin at home, move away, build tension, then return. Musicians name those jobs tonic, predominant, and dominant. In C major, C is home (I), F moves away (IV), G7 creates the strongest pull back (V7), and C releases it.", "Hearing jobs instead of memorizing symbols helps you predict, improvise, and understand why a classical passage moves.", [[60, 64, 67], [60, 65, 69], [59, 62, 65, 67], [60, 64, 67]], "On G7, hear B rise to C and F fall to E."), terms: [
        { term: "Phrase", plain: "A short musical thought, like one line sung in a breath." },
        { term: "Home chord (tonic)", plain: "The chord that feels settled enough to begin or finish." },
        { term: "Dominant", plain: "A tense chord that strongly wants to return home." },
        { term: "Roman numerals", plain: "Labels such as I, IV, and V that show a chord's place in a key. You can treat them as road signs for now." },
      ] },
      chord("tonic", "I: establish home", "Hold C4, E4, and G4.", [60, 64, 67], "C major (I)", "Tonic is stable enough to begin or end a phrase."),
      chord("dominant", "V7: create the question", "Hold G3, B3, D4, and F4.", [55, 59, 62, 65], "G7 (V7)", "The tritone B–F carries the chord's strongest instability."),
      chord("resolve", "I: release the tension", "Resolve to C4, E4, and G4.", [60, 64, 67], "C major (I)", "Two tendency tones move by semitone: B to C, F to E."),
      quiz("function-check", "Why does G7 pull toward C?", "Choose the strongest explanation.", [{ label: "B and F resolve by semitone to C and E", correct: true }, { label: "G7 is always played louder" }, { label: "It uses more notes" }], "Voice leading creates the pull. The chord label describes a sound relationship, not an arbitrary rule.", "This same tension and release underlies Bach, Chopin, jazz standards, film cues, and pop harmony."),
      { id: "progression-compose", kind: "compose", eyebrow: "Create", title: "Write a four-chord emotional arc", body: "Record a four-chord sketch beginning and ending on C. Use F, A minor, or G7 in the middle. Then name the moment of greatest tension.", allowedNotes: [48, 52, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72], minNotes: 12, prompt: "What changed when you delayed the final C?", why: "Composition begins when harmonic function becomes a choice rather than a formula." },
    ],
  },
  {
    id: "ode",
    number: "09",
    chapter: "Repertoire",
    title: "Beethoven: Ode to Joy",
    subtitle: "Your first readable classical melody",
    duration: "3 sessions",
    outcome: "You can read and perform the beginner melody in four short musical thoughts, then hear what repeats and what changes.",
    tags: ["First score", "Melody", "Repetition"],
    prerequisites: ["keyboard", "notation", "rhythm"],
    repertoire: {
      composer: "L. van Beethoven",
      edition: "Complete right-hand melody study",
      scoreUrl: "/scores/ode-to-joy.mxl",
      totalMeasures: 17,
      practiceBpm: 88,
      completeWork: true,
      practiceSequence: ODE_TO_JOY_SCORE,
      sections: [
        { title: "Phrase A", measures: [1, 4], focus: "Repeated notes with direction", harmony: "Tonic to dominant" },
        { title: "Phrase A varied", measures: [5, 8], focus: "Recognize the changed cadence", harmony: "Return to tonic" },
        { title: "Phrase B", measures: [9, 12], focus: "Build toward the high point", harmony: "Predominant expansion" },
        { title: "Final cadence", measures: [13, 17], focus: "Keep pulse through the ending", harmony: "Dominant to tonic" },
      ],
    },
    steps: [
      { ...learn("ode-map", "Hear four short musical thoughts", "A phrase is a short musical thought, like one line you could sing in a breath. This melody has four. The first introduces the idea. The second begins the same way but changes its ending. The third reaches higher. The fourth brings the melody to a clear finish.", "Breaking music into thoughts reduces memory load and shows you sensible places to pause while practicing.", [64, 64, 65, 67, 67, 65, 64, 62]), terms: [
        { term: "Phrase", plain: "A short musical thought, like a line you could sing in one breath." },
        { term: "Form", plain: "The large shape of a piece: which ideas appear, repeat, change, or return." },
      ] },
      { ...sequence("ode-a", "Read the first musical thought", "Follow the highlighted notes on the staff. Equal-height symbols repeat the same key. A symbol one step higher or lower moves to the neighboring white key.", [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62], "The line rises, turns, and settles while the beat continues."), notation: { showNames: true } },
      { ...sequence("ode-a2", "Read the familiar opening with a new ending", "The beginning matches the first thought. Near the end, the note shape changes and settles on middle C.", [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60], "A familiar opening plus a changed ending creates recognition without exact repetition."), notation: { showNames: true }, terms: [{ term: "Variation", plain: "A recognizable idea repeated with something changed." }] },
      { ...sequence("ode-b", "Read the higher contrasting thought", "Watch the staff shape reach upward, then come back down. Let the higher point sound a little stronger instead of simply louder everywhere.", [62, 62, 64, 60, 62, 64, 65, 64, 60, 62, 64, 65, 64, 62, 60, 62, 55], "The new shape extends the range and postpones the feeling of home."), notation: { showNames: true } },
      { ...sequence("ode-complete", "Join the four thoughts", "Play the complete melody without stopping. If you make a mistake, continue to the next note. Pause only at the ends of the four musical thoughts.", [64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60,62,62,64,60,62,64,65,64,60,62,64,65,64,62,60,62,55,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60], "A full performance trains recovery, continuity, and musical memory."), notation: { showNames: true } },
      quiz("ode-form", "Why does the second thought sound related?", "Choose what your ear and the staff both show.", [{ label: "It repeats the opening and changes the ending", correct: true }, { label: "Every note is different" }, { label: "The steady beat disappears" }], "Beethoven repeats the recognizable opening, then gives it a different ending. This is one of composition's most useful techniques.", "You can use the same repeat-and-change principle in your own short ideas."),
    ],
  },
  {
    id: "bach",
    number: "10",
    chapter: "Repertoire",
    title: "Bach: Prelude in C major",
    subtitle: "Read a complete work as harmonic motion",
    duration: "8 sessions",
    outcome: "You can learn the complete prelude in sections, name its harmonic journey, and keep an even five-note texture.",
    tags: ["Complete work path", "Broken chords", "Harmony"],
    repertoire: {
      composer: "J. S. Bach",
      edition: "BWV 846 complete guided study",
      scoreUrl: "/scores/bach-prelude-c.mxl",
      totalMeasures: 34,
      practiceBpm: 60,
      completeWork: true,
      sections: [
        { title: "Home", measures: [1, 4], focus: "Establish the five-note pattern", harmony: "C major and first departure" },
        { title: "Departure", measures: [5, 11], focus: "Follow the bass line", harmony: "Circle motion toward G" },
        { title: "Sequence", measures: [12, 19], focus: "Preserve texture through change", harmony: "Sequential predominant motion" },
        { title: "Deep tension", measures: [20, 27], focus: "Voice the dissonances without accenting", harmony: "Diminished and dominant regions" },
        { title: "Return", measures: [28, 34], focus: "Shape one long arrival", harmony: "Cadential six-four to C" },
      ],
    },
    steps: [
      learn("bach-texture", "One pattern reveals many harmonies", "Each measure repeats a five-note broken-chord shape. The surface pattern stays nearly constant while the bass and inner voices change underneath. Learn the shape once, then read each measure as a chord and voice-leading event.", "Chunking by harmony is faster and more musical than memorizing 560 isolated notes.", [60,64,67,72,76,67,72,76], "Keep every note equal enough that harmonic changes, not accents, shape the line."),
      sequence("bach-m1", "Measure 1: C major", "Use the opening five-note cell, then repeat its upper three notes.", [48,52,55,60,64,55,60,64,55,60,64,55,60,64,55,60], "The entire work begins from transparent tonic stability."),
      chord("bach-dominant", "Hear the structural G7", "Build G, B, D, F. Then imagine B rising and F falling into C major.", [55,59,62,65], "G7", "The long prelude gains direction from dominant arrival and delayed resolution."),
      sequence("bach-sequence", "Sequential motion", "Play this bass outline slowly: C, B, A, D, G, C. Hear departure and return.", [48,47,45,50,43,48], "A sequence repeats an idea at new pitch levels, generating motion with recognizable logic."),
      quiz("bach-method", "What should remain constant?", "When the harmony changes each measure, what anchors the prelude?", [{ label: "The recurring arpeggio texture", correct: true }, { label: "A repeated melody on top" }, { label: "The sustain pedal held throughout" }], "The repeated figuration is the stable frame. Harmonic change becomes the expressive subject.", "Separating texture from harmony is useful in classical analysis and music production alike."),
      { id: "bach-compose", kind: "compose", eyebrow: "Create", title: "Write a Bach-inspired four-measure loop", body: "Choose four triads. Apply one consistent broken-chord pattern to every chord and record the result.", allowedNotes: [48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76], minNotes: 20, prompt: "Which single moving inner note creates the strongest change?", why: "You are borrowing a compositional process, not copying a surface style." },
    ],
  },
  {
    id: "minuet",
    number: "11",
    chapter: "Repertoire",
    title: "Minuet in G major",
    subtitle: "Dance pulse and independent voices",
    duration: "6 sessions",
    outcome: "You can learn both repeated sections, coordinate hands, and make three beats feel like a dance rather than a count.",
    tags: ["Complete work path", "Two hands", "Articulation"],
    repertoire: {
      composer: "C. Petzold, formerly attributed to Bach",
      edition: "BWV Anh. 114 complete guided study",
      scoreUrl: "/scores/minuet-in-g.mxl",
      totalMeasures: 32,
      practiceBpm: 92,
      completeWork: true,
      sections: [
        { title: "Opening dance", measures: [1, 8], focus: "Light pickup and three-beat direction", harmony: "G major to D" },
        { title: "First cadence", measures: [9, 16], focus: "Coordinate voices at the cadence", harmony: "Dominant confirmation" },
        { title: "Contrasting sequence", measures: [17, 24], focus: "Balance the imitative lines", harmony: "E minor and related colors" },
        { title: "Return and close", measures: [25, 32], focus: "Recover the opening character", harmony: "Dominant to G major" },
      ],
    },
    steps: [
      learn("minuet-pulse", "Three beats with lift", "A minuet is in triple meter: one primary beat followed by two lighter beats. The phrase should move through each bar rather than land heavily three times.", "Style is encoded in weight, articulation, and direction, not only correct pitches.", [67,64,65,67,69,71,72,67], "Feel ONE two three, with the third beat leading forward."),
      sequence("minuet-opening", "Opening question", "Right hand only. Keep the pickup light and aim toward the upper D.", [67,64,65,67,69,71,72,67,67,64,65,67,69,71,72], "A rising sequence gives the opening its poised, conversational energy."),
      sequence("minuet-bass", "Bass as dance partner", "Play the bass outline G, D, G, C, D, G with a light release.", [43,50,43,48,50,43], "The left hand clarifies harmonic rhythm and the first beat without overpowering the melody."),
      quiz("minuet-weight", "Which beat carries the natural weight?", "In a minuet bar, where is the primary metric accent?", [{ label: "Beat one", correct: true }, { label: "Every beat equally" }, { label: "Only beat three" }], "Beat one anchors the bar; beats two and three move away and lead onward.", "Meter becomes musical when weight and direction replace verbal counting."),
      { id: "minuet-variation", kind: "improv", eyebrow: "Create", title: "Turn the dance into your own answer", body: "Use G A B D E. Improvise two three-beat phrases: a question ending on D, then an answer ending on G.", allowedNotes: [55,57,59,62,64,67,69,71,74,76], minNotes: 12, why: "This transfers meter, phrase function, and tonal center into improvisation." },
    ],
  },
  {
    id: "satie",
    number: "12",
    chapter: "Repertoire",
    title: "Satie: Gymnopédie No. 1",
    subtitle: "Time, resonance, and restrained color",
    duration: "8 sessions",
    outcome: "You can study the complete form, voice melody above accompaniment, and use pedal as harmonic punctuation.",
    tags: ["Complete work path", "Pedal", "Voicing"],
    repertoire: {
      composer: "Erik Satie",
      edition: "Gymnopédie No. 1 complete form study",
      scoreUrl: "/scores/gymnopedie-no-1.mxl",
      totalMeasures: 47,
      practiceBpm: 68,
      completeWork: true,
      sections: [
        { title: "Opening atmosphere", measures: [1, 8], focus: "Separate bass, chord, and silence", harmony: "Alternating extended sonorities" },
        { title: "Theme A", measures: [9, 16], focus: "Float melody above accompaniment", harmony: "Modal color over pedal points" },
        { title: "Cadential expansion", measures: [17, 24], focus: "Change pedal with harmony", harmony: "Suspended cadential motion" },
        { title: "Contrasting middle", measures: [25, 32], focus: "Let the new register change the light", harmony: "Chromatic color shift" },
        { title: "Return", measures: [33, 40], focus: "Recover the original distance", harmony: "Opening sonorities return" },
        { title: "Final release", measures: [41, 47], focus: "Allow the ending to settle", harmony: "Quiet tonal closure" },
      ],
    },
    steps: [
      learn("satie-space", "Slow music exposes every decision", "The left hand alternates low bass and soft chords while the melody enters above. The challenge is not speed; it is balancing layers and allowing resonance without blurring harmony.", "Production calls this managing foreground, background, and space. Piano technique calls it voicing and pedal.", [[43,50,54], [38,45,49]], "The melody should remain present even at a quiet dynamic; accompaniment should feel farther away."),
      sequence("satie-bass", "The opening harmonic breath", "Play low G, the upper chord, low D, the upper chord. Release the pedal when harmony changes.", [43,50,54,38,45,49], "Pedal follows harmonic meaning, not an automatic foot pattern."),
      chord("satie-color", "Build the open sonority", "Hold G, B, and F♯ across a comfortable register.", [55,59,66], "G major 7 color", "Added tones soften functional urgency and create suspended color."),
      quiz("pedal-change", "When should the pedal clear?", "What is the most musical default for this texture?", [{ label: "At a meaningful harmony change", correct: true }, { label: "Never" }, { label: "After every individual note" }], "Pedal can connect notes within a harmony, then clear as the harmony changes so resonance does not become mud.", "Listening must lead the foot."),
      { id: "satie-compose", kind: "compose", eyebrow: "Create", title: "Design foreground and atmosphere", body: "Record a low two-chord loop, then add a sparse three-note melody above it. Leave at least one full beat of silence in the melody.", allowedNotes: [38,43,45,47,49,50,54,55,57,59,62,66,67,69,71,74], minNotes: 14, prompt: "Which notes belong in front, and which should feel distant?", why: "This connects Satie's pianistic texture directly to arrangement and production." },
    ],
  },
  {
    id: "chopin",
    number: "13",
    chapter: "Repertoire",
    title: "Chopin: Prelude in E minor",
    subtitle: "Expression through inner motion",
    duration: "10 sessions",
    outcome: "You can study the complete prelude, trace its chromatic voice leading, and shape a long phrase over changing harmony.",
    tags: ["Complete work path", "Chromatic harmony", "Expression"],
    repertoire: {
      composer: "Frédéric Chopin",
      edition: "Op. 28 No. 4 complete guided study",
      scoreUrl: "/scores/chopin-prelude-e-minor.mxl",
      totalMeasures: 26,
      practiceBpm: 52,
      completeWork: true,
      sections: [
        { title: "Opening suspension", measures: [1, 4], focus: "Keep the melody separate from the chord", harmony: "E minor with delayed resolution" },
        { title: "Inner descent", measures: [5, 8], focus: "Follow one chromatic middle voice", harmony: "Common tones over shifting bass" },
        { title: "First cadence", measures: [9, 12], focus: "Do not arrive too early", harmony: "Dominant tension and evasion" },
        { title: "Climactic expansion", measures: [13, 16], focus: "Grow through harmony, not speed", harmony: "Intensified chromatic sequence" },
        { title: "Final return", measures: [17, 21], focus: "Release weight gradually", harmony: "Tonic returns under suspension" },
        { title: "Coda", measures: [22, 26], focus: "Let silence complete the cadence", harmony: "Final dominant to E minor" },
      ],
    },
    steps: [
      learn("chopin-inner", "The melody barely moves, the harmony aches", "The upper melody is restrained. Much of the emotional motion comes from inner chord tones descending by semitone while common tones remain. Listen horizontally inside each chord.", "Voice leading explains expression more precisely than calling a chord simply sad.", [[52,55,59], [51,54,59], [50,53,59]], "Follow one middle note through several harmonies instead of hearing only vertical blocks."),
      chord("eminor", "Establish E minor", "Hold E3, G3, and B3.", [52,55,59], "E minor", "The tonic is present but deliberately weighted and unsettled by what follows."),
      sequence("chromatic-line", "Trace the inner descent", "Play G, F♯, F, E, D♯, D slowly while holding B above if comfortable.", [55,54,53,52,51,50], "Semitone motion creates continuity across complex chord labels."),
      quiz("chopin-expression", "Where is the expressive motion?", "What deserves special attention in this prelude?", [{ label: "The descending inner voices", correct: true }, { label: "Fast scales" }, { label: "A constantly changing tempo" }], "Chopin sustains a spare melody while harmony changes beneath it. Inner voices carry much of the tension.", "This is a reusable arranging technique: keep a focal line simple while the surrounding color evolves."),
      { id: "chopin-compose", kind: "compose", eyebrow: "Create", title: "Compose with one note held", body: "Hold B as a top note. Under it, create four slowly changing two-note shapes, moving at least one inner note by semitone each time.", allowedNotes: [47,48,49,50,51,52,53,54,55,57,59], minNotes: 12, prompt: "Which change felt inevitable, and which felt surprising?", why: "You are composing through parsimonious voice leading, the principle at the heart of the prelude." },
    ],
  },
  {
    id: "libets-delay",
    number: "14",
    chapter: "Repertoire",
    title: "Libet's Delay: the memory beneath the loop",
    subtitle: "Learn a clear piano reduction, then blur it on purpose",
    duration: "4 sessions",
    outcome: "You can play a beginner reduction of the harmony behind Libet's Delay, follow its upper voice on the staff, and explain how repetition and degraded texture change the meaning of the source recording.",
    tags: ["Personal study", "D major", "Memory loop"],
    prerequisites: ["scales", "triads", "inversions"],
    resources: [
      {
        label: "Hear the Russ Morgan source",
        url: "https://www.youtube.com/watch?v=nK2vJjpdYFE",
        description: "Goodnight, My Beautiful, the recording sampled by The Caretaker.",
      },
      {
        label: "Open a community piano score",
        url: "https://global.piastudy.com/musicDetail/VbKfxa10",
        description: "An external arrangement for comparison after you learn the reduction.",
      },
      {
        label: "Explore the harmonic analysis",
        url: "https://www.hooktheory.com/theorytab/view/russ-morgan/goodnight-my-beautiful",
        description: "A community analysis of the source song's chords and melody.",
      },
    ],
    steps: [
      {
        ...learn(
          "libet-source",
          "First separate the song from the memory of it",
          "Libet's Delay is not a conventional solo-piano composition. The Caretaker reshapes Russ Morgan's recording of Goodnight, My Beautiful, so a clear ballroom phrase feels distant, repeated, and unstable. Cadence will teach a playable reduction of that musical skeleton, then ask you to change its texture deliberately. It is a study arrangement, not a claim of note-for-note archival accuracy.",
          "Knowing what was transformed helps you hear composition and production as two connected layers: the underlying harmony carries the memory, while looping, filtering, reverb, and interruption change its emotional meaning.",
          [[50, 54, 57, 61], [59, 62, 66, 69], [52, 55, 59, 62], [57, 61, 64, 67]],
          "Hear four related colors leave D major and circle back toward it.",
        ),
        terms: [
          { term: "Sample", plain: "A piece of an existing recording reused as material inside a new recording." },
          { term: "Reduction", plain: "A simpler playable version that preserves the main musical jobs while leaving out some detail." },
          { term: "Loop", plain: "A recorded passage repeated so its return becomes part of the composition." },
        ],
      },
      {
        ...sequence(
          "libet-d-major",
          "Find the D-major room",
          "Begin on D4 and play one octave upward: D, E, F-sharp, G, A, B, C-sharp, D. The two black keys are not decoration; F-sharp and C-sharp are what keep this scale in D major.",
          [62, 64, 66, 67, 69, 71, 73, 74],
          "The reduction will make more sense when every melody note and chord color belongs to one familiar tonal room.",
          "F-sharp is the black key between F and G. C-sharp is the black key immediately to the right of C.",
        ),
        notation: { showNames: true, spellings: ["D4", "E4", "F♯4", "G4", "A4", "B4", "C♯5", "D5"] },
        terms: [
          { term: "Sharp", plain: "The sign ♯ raises a named note by one nearest keyboard step." },
          { term: "Key", plain: "The family of notes and chords that makes one note feel like home. Here, D is home." },
        ],
      },
      chord(
        "libet-home-color",
        "Build the first remembered color",
        "Hold D3, F-sharp3, A3, and C-sharp4 together. This is D major with a major seventh added. Let the notes ring without striking them hard.",
        [50, 54, 57, 61],
        "D major 7",
        "The plain D-major triad establishes home. C-sharp adds the suspended, late-night color that makes the harmony feel remembered rather than announced.",
        "Start with D, F-sharp, and A. Add C-sharp above them only after the hand feels settled.",
      ),
      {
        ...sequence(
          "libet-harmony-loop",
          "Walk through the four-chord memory loop",
          "Play each chord as four separate notes: Dmaj7, Bm7, Em7, then A7. Pause briefly after every four notes. You are hearing home, a darker relative, gentle departure, then a chord that wants to return.",
          [50, 54, 57, 61, 59, 62, 66, 69, 52, 55, 59, 62, 57, 61, 64, 67],
          "This I–vi–ii–V circle is the harmonic engine beneath the richer dance-band voicings. Learning the jobs first makes later extensions easier to understand.",
          "Count groups of four. The last group, A C-sharp E G, should feel unfinished until D returns.",
        ),
        notation: { showNames: true, spellings: ["D3", "F♯3", "A3", "C♯4", "B3", "D4", "F♯4", "A4", "E3", "G3", "B3", "D4", "A3", "C♯4", "E4", "G4"] },
        terms: [
          { term: "I–vi–ii–V", plain: "Home, relative minor, preparation, and dominant return. The symbols name chord jobs inside the key." },
          { term: "Seventh chord", plain: "A triad with one extra note stacked above it, creating more color and smoother movement." },
        ],
      },
      {
        ...sequence(
          "libet-upper-voice",
          "Let one fragile line float above the chords",
          "Play this Cadence study line slowly and legato. It is a beginner reduction of the source's melodic behavior, not a copied full transcription. Keep repeated notes quiet and let each four-note group sound like a memory returning with one detail changed.",
          [66, 64, 62, 66, 66, 64, 62, 61, 64, 66, 67, 66, 64, 61, 62, 62],
          "A simple upper voice gives your ear something to remember while the harmony changes underneath it.",
          "Use only the right hand at first. Aim for connected sound and one gentle high point on G4.",
        ),
        notation: { showNames: true, spellings: ["F♯4", "E4", "D4", "F♯4", "F♯4", "E4", "D4", "C♯4", "E4", "F♯4", "G4", "F♯4", "E4", "C♯4", "D4", "D4"] },
      },
      quiz(
        "libet-transformation",
        "What makes the memory feel unstable?",
        "The underlying phrase can be played clearly. Which change belongs mainly to The Caretaker's transformation rather than the original chord progression?",
        [
          { label: "Looping, filtering, reverberation, and interrupted continuity", correct: true },
          { label: "Using the D-major scale" },
          { label: "Putting a seventh above a triad" },
        ],
        "The scale and harmony belong to the musical material. The Caretaker changes how that material survives in time: repetitions arrive imperfectly, detail is obscured, and the room around the recording becomes part of the piece.",
        "This distinction lets you learn the piano part clearly before using production choices to change its meaning.",
      ),
      {
        id: "libet-memory-performance",
        kind: "compose",
        eyebrow: "Perform and transform",
        title: "Play it once clearly, then let it decay",
        body: "Record two passes with the D-major note family. First play the upper-voice study cleanly over the four-chord loop. Then repeat only fragments, leave longer gaps, soften the touch, and allow one phrase to stop before its expected ending.",
        allowedNotes: [50, 52, 54, 55, 57, 59, 61, 62, 64, 66, 67, 69, 71, 73, 74],
        minNotes: 24,
        prompt: "Which musical detail remained recognizable after you removed continuity?",
        why: "You are learning both the musical object and the compositional idea behind its transformation, which connects piano technique directly to sampling and production.",
        hint: "Do not add random wrong notes. Change memory through repetition, silence, register, dynamics, and timing first.",
      },
    ],
  },
  {
    id: "rivers-another-town",
    number: "15",
    chapter: "Repertoire",
    title: "Rivers of Another Town: the blue turn",
    subtitle: "Accompany the song, then hear one borrowed note change the light",
    duration: "4 sessions",
    outcome: "You can play a beginner accompaniment reduction in E major, move through its principal chord colors, and explain why A major turning into A minor changes the emotional light.",
    tags: ["Personal study", "E major", "Borrowed chord"],
    prerequisites: ["scales", "triads", "inversions"],
    resources: [
      {
        label: "Hear the official recording",
        url: "https://www.youtube.com/watch?v=EpFvJ33Jq2E",
        description: "Rivers of Another Town by jonatan leandoer96 and Frederik Valentin.",
      },
      {
        label: "Follow the community chord map",
        url: "https://chordify.net/chords/jonatan-leandoer96-songs/rivers-of-another-town-chords",
        description: "An external timeline for comparing the E-major chord changes.",
      },
      {
        label: "Check the release details",
        url: "https://www.beatport.com/track/rivers-of-another-town/17380990",
        description: "Release, key, tempo, and label information for the original mix.",
      },
    ],
    steps: [
      {
        ...learn(
          "rivers-source",
          "Learn the accompaniment before chasing the vocal",
          "Rivers of Another Town is a 2023 song by jonatan leandoer96 and Frederik Valentin, with writing and production contributions from Mathias Sarsgaard. No trustworthy public piano score surfaced, so Cadence teaches a beginner accompaniment reduction from the consistent E-major chord map. It preserves the harmonic jobs and piano feel without claiming to reproduce every recorded note.",
          "The voice, strings, drums, and piano each carry a different layer. A clear accompaniment gives you the structure first, leaving room to study or sing the melody later without turning the piano into a crowded imitation of the whole recording.",
          [[52, 56, 59], [56, 59, 63], [57, 61, 64, 68], [57, 60, 64]],
          "Hear the first three colors belong to E major. The final A-minor color introduces C natural, which does not belong to the key.",
        ),
        terms: [
          { term: "Accompaniment", plain: "The musical support under a melody or voice: harmony, bass, pulse, and texture." },
          { term: "Borrowed chord", plain: "A chord taken from a closely related scale to create a temporary color outside the home key." },
          { term: "Reduction", plain: "A simpler playable version that preserves the important musical roles while leaving out detail." },
        ],
      },
      {
        ...sequence(
          "rivers-e-major",
          "Map the four sharps of E major",
          "Play E, F-sharp, G-sharp, A, B, C-sharp, D-sharp, E. Do not rush past the black keys. Name each sharp while you play it.",
          [64, 66, 68, 69, 71, 73, 75, 76],
          "The song's brighter chords come from this note family. Knowing the map makes the later C natural sound like an intentional shadow rather than a wrong key.",
          "E major uses F-sharp, G-sharp, C-sharp, and D-sharp.",
        ),
        notation: { showNames: true, spellings: ["E4", "F♯4", "G♯4", "A4", "B4", "C♯5", "D♯5", "E5"] },
        terms: [
          { term: "E major", plain: "A key whose home note is E and whose scale contains four sharps." },
          { term: "Accidental", plain: "A sign or altered note that changes the expected pitch, such as C natural inside E major." },
        ],
      },
      chord(
        "rivers-home",
        "Build the clear home chord",
        "Hold E3, G-sharp3, and B3. Play quietly enough that a singer could remain in front of you.",
        [52, 56, 59],
        "E major",
        "E major is the tonic, or home. The accompaniment can move through richer colors because your ear keeps remembering this stable reference.",
        "Find E3, then skip to G-sharp and B. Use a relaxed 1–3–5 hand shape.",
      ),
      {
        ...sequence(
          "rivers-color-change",
          "Change one note and turn sunlight blue",
          "Arpeggiate Amaj7 as A, C-sharp, E, G-sharp. Then play A minor as A, C, E, A. Listen to C-sharp fall one keyboard step to C natural.",
          [57, 61, 64, 68, 57, 60, 64, 69],
          "That one descending inner note changes IV into borrowed iv. The bass can stay on A while the harmony moves from open and luminous to wistful.",
          "Keep A and E steady in your ear. Only C-sharp must fall to C natural for the essential color change.",
        ),
        notation: { showNames: true, spellings: ["A3", "C♯4", "E4", "G♯4", "A3", "C4", "E4", "A4"] },
        terms: [
          { term: "IV to iv", plain: "The major chord on scale step four changes to minor. In E major, A major becomes A minor." },
          { term: "Inner voice", plain: "A note moving inside a chord, between the bass and the highest note." },
        ],
      },
      {
        ...sequence(
          "rivers-accompaniment",
          "Play the road away and back home",
          "Play each harmony as a slow four-note arpeggio: E, G-sharp minor, Amaj7, A minor, F-sharp minor, then E. Practice near 72 BPM before approaching the recording's slow-feeling pulse around 80 BPM.",
          [52, 56, 59, 64, 56, 59, 63, 68, 57, 61, 64, 68, 57, 60, 64, 69, 54, 57, 61, 66, 52, 56, 59, 64],
          "The progression travels I–iii–IVmaj7–iv–ii–I. Its emotional force comes from smooth voice movement, especially the borrowed minor turn, rather than from many unrelated chords.",
          "Pause after every four notes. Let the final E chord feel like arrival, not simply the next group.",
        ),
        notation: { showNames: true, spellings: ["E3", "G♯3", "B3", "E4", "G♯3", "B3", "D♯4", "G♯4", "A3", "C♯4", "E4", "G♯4", "A3", "C4", "E4", "A4", "F♯3", "A3", "C♯4", "F♯4", "E3", "G♯3", "B3", "E4"] },
      },
      {
        ...sequence(
          "rivers-piano-pattern",
          "Keep the piano moving without crowding the voice",
          "Use bass, upper note, chord tone, upper note. Keep the touch even and light. This Cadence pattern captures the accompaniment's role, not a copied note-for-note transcription of the record.",
          [52, 59, 64, 59, 56, 63, 68, 63, 57, 64, 68, 64, 57, 64, 69, 64],
          "A recurring pattern gives the song continuity while the voice and strings carry the long expressive arc.",
          "Count four quiet pulses. Make the bass present but never heavier than the upper notes.",
        ),
        notation: { showNames: true, spellings: ["E3", "B3", "E4", "B3", "G♯3", "D♯4", "G♯4", "D♯4", "A3", "E4", "G♯4", "E4", "A3", "E4", "A4", "E4"] },
      },
      quiz(
        "rivers-blue-turn",
        "Why does A minor sound suddenly more vulnerable?",
        "A major and A minor share two notes. Which event creates the essential change inside E major?",
        [
          { label: "C-sharp falls to C natural", correct: true },
          { label: "The bass moves from A to E" },
          { label: "Every note becomes lower" },
        ],
        "A and E remain. Lowering C-sharp to C natural changes the chord's third from major to minor and introduces a note outside E major. The ear hears continuity and disturbance at the same time.",
        "This borrowed-major-to-minor gesture is a reusable songwriting tool: keep the chord root, move one inner voice, and let the emotional meaning change.",
      ),
      {
        id: "rivers-performance",
        kind: "compose",
        eyebrow: "Perform and arrange",
        title: "Leave a river of space around the melody",
        body: "Record two passes of the accompaniment. First play the six-chord road steadily. Then repeat it with a quieter second half, a longer pause before A minor, and a simple high-note answer only after each chord settles.",
        allowedNotes: [52, 54, 56, 57, 59, 60, 61, 63, 64, 66, 68, 69, 71, 73, 75, 76],
        minNotes: 28,
        prompt: "Where did restraint make the borrowed A-minor chord feel stronger?",
        why: "The recording gains scale from arrangement: piano supplies motion, strings widen the horizon, and the vocal remains exposed. Your performance should preserve those roles instead of filling every silence.",
        hint: "Keep the first pass clear. In the second, change dynamics and space before adding any new notes.",
      },
    ],
  },
  {
    id: "improv",
    number: "16",
    chapter: "Create",
    title: "Improvisation as conversation",
    subtitle: "Motif, space, variation, response",
    duration: "5 sessions",
    outcome: "You can improvise coherent phrases over a tonal center without running scales or waiting for inspiration.",
    tags: ["Motif", "Call and response", "Constraint"],
    steps: [
      learn("motif", "Freedom needs something to remember", "A motif is a small recognizable idea: a rhythm, contour, or interval. Improvisation becomes coherent when you repeat it, vary one feature, leave space, and answer it.", "Listeners need memory to perceive meaning. Constraint gives both you and the listener something to hold.", [60,62,64,62,60]),
      { id: "three-note", kind: "improv", eyebrow: "Improvise", title: "Three notes, many meanings", body: "Use only C, D, and E. Create a short question, pause, then answer it. Repeat one rhythm exactly.", allowedNotes: [60,62,64], minNotes: 12, why: "Limiting pitch directs attention toward rhythm, contour, and phrasing.", hint: "A question can end on D; an answer can return to C." },
      { id: "minor-world", kind: "improv", eyebrow: "Improvise", title: "Change the emotional center", body: "Use A, C, D, E, and G over an imagined A-minor drone. Begin sparsely and let one repeated note become the motif.", allowedNotes: [57,60,62,64,67,69,72,74,76,79], minNotes: 18, why: "A minor pentatonic removes fragile clashes while leaving strong expressive intervals." },
      quiz("improv-coherence", "What makes improvisation coherent?", "Which strategy is most reliable?", [{ label: "Repeat and vary a small motif", correct: true }, { label: "Avoid every repeated note" }, { label: "Use as many notes as possible" }], "Repetition establishes identity; variation creates development.", "This principle scales from a two-bar solo to an entire composition."),
      { id: "form-improv", kind: "compose", eyebrow: "Capture", title: "Record an A–A′–B–A improvisation", body: "Play four short sections. Repeat A with one change, contrast it with B, then return home. Cadence will preserve the note event list locally as a sketch.", allowedNotes: [57,59,60,62,64,65,67,69,71,72,74,76], minNotes: 28, prompt: "Could someone recognize A when it returned?", why: "Large-scale form turns spontaneous material into something revisable." },
    ],
  },
  {
    id: "composition",
    number: "17",
    chapter: "Create",
    title: "Composition: from seed to form",
    subtitle: "Develop, harmonize, arrange, revise",
    duration: "8 sessions",
    outcome: "You can turn one motif into an eight-bar sketch with harmonic direction and a deliberate texture.",
    tags: ["Form", "Harmony", "Revision"],
    steps: [
      learn("seed", "Do less, then develop it", "Start with a motif short enough to remember. Preserve one property while changing another: transpose the pitches, stretch the rhythm, invert the contour, or change the harmony beneath it.", "Development creates identity and momentum without requiring a constant stream of new material.", [60,64,62,67]),
      { id: "motif-capture", kind: "compose", eyebrow: "Compose", title: "Capture a four-note seed", body: "Record a motif of four to eight notes. Sing it once, then play a varied answer that keeps its rhythm.", allowedNotes: [60,62,64,65,67,69,71,72], minNotes: 10, prompt: "What stayed the same in the answer?", why: "A clear transformation is more useful than accidental difference." },
      { id: "harmonize", kind: "compose", eyebrow: "Harmonize", title: "Give the motif two meanings", body: "Play your motif over C major, then imagine or play it over A minor. Keep the melody, change the harmonic center.", allowedNotes: [48,52,55,57,60,64,67,69,72,76], minNotes: 16, prompt: "Which melody note changed its emotional role most?", why: "Harmony changes the meaning of a note without changing the note itself." },
      quiz("revision", "What is revision for?", "Choose the most productive definition.", [{ label: "Making the musical intention clearer", correct: true }, { label: "Adding more notes" }, { label: "Correcting any unusual choice" }], "Revision compares what the music communicates with what you intended, then changes only what closes that gap.", "A strong personal style depends on editing, not only generating ideas."),
      { id: "eight-bars", kind: "compose", eyebrow: "Complete the study", title: "Record an eight-bar sketch", body: "Create A, vary it as A′, introduce B, then return to A. Use at least two harmonies and one intentional silence.", allowedNotes: [48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76], minNotes: 32, prompt: "Name the piece and write one sentence describing its emotional movement.", why: "This is a complete miniature: material, development, contrast, return, and reflection." },
    ],
  },
  {
    id: "production",
    number: "18",
    chapter: "Create",
    title: "From piano idea to production",
    subtitle: "Turn harmony and performance into arrangement choices",
    duration: "6 sessions",
    outcome: "You can translate a piano sketch into parts, register, texture, and an arrangement plan for a DAW.",
    tags: ["Music production", "Arrangement", "Texture"],
    steps: [
      learn("layers", "A piano sketch contains several instruments", "A left-hand bass can become a bass instrument. Inner chord tones can become a pad or strings. The top note can become a lead. Rhythm can be separated into percussion. Production starts by hearing functional layers inside one performance.", "This preserves musical intention when sound design and arrangement become complex.", [[48,55,60,64,67], [45,52,60,64,69]], "Identify foreground, support, bass, and pulse rather than treating the piano as one block."),
      chord("production-voicing", "Build a production-friendly voicing", "Hold C3, G3, E4, and D5. Notice the open low register and color above.", [48,55,64,74], "C add9", "Wide lower intervals reduce mud; color tones often read clearly in upper registers."),
      quiz("arrangement", "What should enter first?", "When arranging a sketch, what is the most useful first decision?", [{ label: "Which musical layer carries the focus", correct: true }, { label: "How many plug-ins to use" }, { label: "Making every layer equally loud" }], "A clear focal hierarchy guides register, sound choice, dynamics, and density.", "Production serves musical attention."),
      { id: "arrangement-sketch", kind: "compose", eyebrow: "Produce on the keyboard", title: "Perform three arrangement passes", body: "Record the same eight-bar idea three ways: bass only, harmony only, then melody plus harmony. Keep the register of each role distinct.", allowedNotes: [36,40,43,45,48,52,55,57,60,62,64,65,67,69,71,72,74,76,79,81], minNotes: 28, prompt: "Which layer can disappear without losing the identity of the piece?", why: "Subtractive arranging reveals the essential material before sound design distracts from it." },
      { id: "export-plan", kind: "compose", eyebrow: "Finish", title: "Make a DAW handoff plan", body: "Play your final sketch once. Cadence will summarize its range, note vocabulary, chord detections, and duration so you can recreate the parts in your production setup.", allowedNotes: Array.from({ length: 49 }, (_, index) => 36 + index), minNotes: 24, prompt: "Choose one sound for each role: bass, harmony, lead, and space.", why: "A specific handoff turns practice into a bridge toward finished music." },
    ],
  },
];

export const CHAPTERS = ["Foundations", "Harmony", "Repertoire", "Create"] as const;

export function getCourse(id: string) {
  return COURSES.find((course) => course.id === id) ?? COURSES[0];
}

export function getStepCount() {
  return COURSES.reduce((total, course) => total + course.steps.length, 0);
}
