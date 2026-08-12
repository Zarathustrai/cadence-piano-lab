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
};

export type ScoreSection = {
  title: string;
  measures: [number, number];
  focus: string;
  harmony: string;
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
  repertoire?: {
    composer: string;
    edition: string;
    scoreUrl: string;
    totalMeasures: number;
    practiceBpm: number;
    sections: ScoreSection[];
    completeWork: boolean;
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
    id: "intervals",
    number: "02",
    chapter: "Foundations",
    title: "Intervals: music in distances",
    subtitle: "Hear and build the space between notes",
    duration: "24 min",
    outcome: "You can construct seconds through fifths and connect their sound to melody and harmony.",
    tags: ["Ear", "Reading", "Melody"],
    steps: [
      learn("interval-idea", "A melody is a path of distances", "An interval names the distance from one letter to another. C to D is a second, C to E a third, C to F a fourth, and C to G a fifth. The number counts both endpoints.", "Thinking in intervals makes music transferable. A shape can begin on a new note and remain the same musical idea.", [[60, 62], [60, 64], [60, 65], [60, 67]], "Seconds feel close, thirds begin to imply harmony, fourths and fifths feel open."),
      sequence("melodic-intervals", "Play four distances", "Begin on C4 each time, then play D4, E4, F4, and G4.", [60, 62, 60, 64, 60, 65, 60, 67], "Your hand, eye, and ear are learning one shared vocabulary."),
      quiz("third-count", "Why is C to E a third?", "Choose the most useful explanation.", [{ label: "It spans C, D, E", correct: true }, { label: "There are three piano keys between them" }, { label: "E is always major" }], "Interval numbers count letter names inclusively: C(1), D(2), E(3). Its quality, major or minor, is a separate detail.", "Correct counting prevents confusion when accidentals enter later."),
      sequence("motif-third", "Hear a motif as shape", "Play C, E, D, F, E, G. Notice the repeated upward third.", [60, 64, 62, 65, 64, 67], "Motifs become easier to remember and vary when you recognize their interval pattern."),
      { id: "interval-improv", kind: "improv", eyebrow: "Create", title: "Question in seconds, answer in thirds", body: "Use C major. Make a four-note question using mostly steps, then answer with at least one leap of a third.", allowedNotes: [60, 62, 64, 65, 67, 69, 71, 72], minNotes: 12, why: "Constraint turns interval knowledge into expressive choice.", hint: "End the question on G and the answer on C." },
    ],
  },
  {
    id: "rhythm",
    number: "03",
    chapter: "Foundations",
    title: "Rhythm before notes",
    subtitle: "Build pulse, subdivision, and rests",
    duration: "22 min",
    outcome: "You can keep a steady quarter-note pulse and understand how silence belongs to the phrase.",
    tags: ["Pulse", "Subdivisions", "Timing"],
    steps: [
      learn("pulse", "Pulse is the grid, rhythm is the drawing", "The pulse is a regular underlying beat. Rhythm is the pattern of sound and silence placed on that beat. Good time does not mean mechanical playing; it means choosing when to bend time from a stable center.", "Every later style, from Bach to electronic production, depends on an internal grid.", [60, 60, 60, 60], "Four equal attacks with no early third beat or late fourth beat."),
      sequence("quarters", "Four settled quarters", "Set the metronome near 72 BPM. Play C4 once on each beat, four times.", [60, 60, 60, 60], "Repetition exposes timing more clearly than a busy melody."),
      sequence("rhythm-phrase", "Make repeated notes speak", "Play E E F G, then hold the final G in your mind for two beats.", [64, 64, 65, 67], "Repeated pitches make rhythm and articulation carry the expression."),
      quiz("rest", "What does a rest do?", "Which description is closest to musical reality?", [{ label: "It gives silence a measured duration", correct: true }, { label: "It stops the pulse" }, { label: "It means the performer made a mistake" }], "A rest is timed silence. The underlying beat continues through it.", "Composers shape expectation as much with absence as with sound."),
      { id: "rhythm-compose", kind: "compose", eyebrow: "Create", title: "Write one pitch, three rhythms", body: "Record three short phrases using only C4. Change the rhythm each time while keeping the same pulse.", allowedNotes: [60], minNotes: 8, prompt: "Can the third version feel like an ending?", why: "This isolates rhythm as a compositional parameter, the same way a producer might audition rhythmic variations before choosing pitches." },
    ],
  },
  {
    id: "scales",
    number: "04",
    chapter: "Foundations",
    title: "Scales and tonal gravity",
    subtitle: "Why seven notes do not feel equally stable",
    duration: "28 min",
    outcome: "You can play C major with a practical fingering and hear tonic, tendency, and scale degree.",
    tags: ["C major", "Fingering", "Tonic"],
    steps: [
      learn("scale-pattern", "A scale is a hierarchy, not a list", "C major uses the white keys C D E F G A B. But C feels like home, G supports it, and B leans strongly upward into C. These roles create tonal gravity.", "Improvisation becomes meaningful when notes have different jobs rather than equal permission.", [60, 62, 64, 65, 67, 69, 71, 72], "Hear B as a question and the final C as its answer."),
      sequence("scale-up", "C major ascending", "Right hand: 1 2 3, pass the thumb under, then 1 2 3 4 5.", [60, 62, 64, 65, 67, 69, 71, 72], "Efficient fingering lets phrasing continue without a visible bump."),
      sequence("scale-return", "Return without collapsing", "Descend with 5 4 3 2 1, cross finger 3 over, then 3 2 1.", [72, 71, 69, 67, 65, 64, 62, 60], "The crossover is a transfer of balance, not a twist of the wrist."),
      quiz("leading-tone", "Why does B want to rise?", "Choose the best explanation in C major.", [{ label: "It is a half step below the tonic", correct: true }, { label: "It is the highest white key" }, { label: "All seventh notes must be loud" }], "B is the leading tone: only a semitone below C, so the ear strongly predicts resolution upward.", "Tendency tones are the engine of both functional harmony and melodic direction."),
      { id: "scale-improv", kind: "improv", eyebrow: "Create", title: "Make C feel inevitable", body: "Improvise only with C D E G A. End your first phrase on G, then make the second phrase settle on C.", allowedNotes: [60, 62, 64, 67, 69, 72], minNotes: 14, why: "You are practicing tonal direction, not random scale wandering.", hint: "Leave a breath between the two phrases." },
    ],
  },
  {
    id: "triads",
    number: "05",
    chapter: "Harmony",
    title: "Triads from first principles",
    subtitle: "Root, third, fifth, and musical color",
    duration: "32 min",
    outcome: "You can build major and minor triads without memorizing hand shapes and explain what the third changes.",
    tags: ["Chords", "Major/minor", "Construction"],
    steps: [
      learn("stacked-thirds", "A triad is two stacked thirds", "Start on a root, skip one scale letter to find the third, then skip another to find the fifth. C E G is a triad. The root names it, the third gives it major or minor color, and the fifth stabilizes it.", "This method works from any root and prevents chord learning from becoming a collection of unrelated shapes.", [[60, 64, 67], [60, 63, 67]], "The outer C and G stay fixed while one semitone in the middle changes the whole color."),
      chord("build-c", "Build C major", "Hold C4, E4, and G4 together. The app waits for all three notes.", [60, 64, 67], "C major", "You are building from scale degrees 1, 3, and 5.", "Use fingers 1, 3, and 5 in the right hand."),
      chord("build-am", "Build A minor", "Hold A3, C4, and E4 together.", [57, 60, 64], "A minor", "A minor shares C and E with C major. One changed bass note creates a new center.", "Keep C and E where they are, then move C major's G down to A below."),
      quiz("major-minor", "Which note defines the color?", "C major becomes C minor when one chord tone moves. Which one?", [{ label: "E moves to E♭", correct: true }, { label: "C moves to C♯" }, { label: "G moves to F" }], "Lowering the major third E by one semitone gives E♭, the minor third. Root and fifth remain C and G.", "A one-note change can carry more expressive weight than an entirely new texture."),
      { id: "triad-improv", kind: "improv", eyebrow: "Create", title: "Melody from chord tones", body: "Alternate C major and A minor in your left hand if comfortable. In the right hand, create a melody using only their shared and chord tones: A C E G.", allowedNotes: [57, 60, 64, 67, 69, 72, 76, 79], minNotes: 16, why: "This connects vertical harmony to horizontal melody, a core skill for composing and producing." },
    ],
  },
  {
    id: "inversions",
    number: "06",
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
    number: "07",
    chapter: "Harmony",
    title: "Harmony that goes somewhere",
    subtitle: "Tonic, predominant, dominant, return",
    duration: "38 min",
    outcome: "You can play and explain I–IV–V7–I, hear dominant tension, and vary a progression deliberately.",
    tags: ["Function", "Cadence", "Songwriting"],
    steps: [
      learn("function", "Chords have jobs in a phrase", "Tonic feels like home. Predominant moves away and prepares motion. Dominant creates focused tension. Returning to tonic releases it. In C: C is I, F is IV, G7 is V7.", "Functional hearing lets you predict, improvise, reharmonize, and understand long classical phrases.", [[60, 64, 67], [60, 65, 69], [59, 62, 65, 67], [60, 64, 67]], "On G7, hear B rise to C and F fall to E."),
      chord("tonic", "I: establish home", "Hold C4, E4, and G4.", [60, 64, 67], "C major (I)", "Tonic is stable enough to begin or end a phrase."),
      chord("dominant", "V7: create the question", "Hold G3, B3, D4, and F4.", [55, 59, 62, 65], "G7 (V7)", "The tritone B–F carries the chord's strongest instability."),
      chord("resolve", "I: release the tension", "Resolve to C4, E4, and G4.", [60, 64, 67], "C major (I)", "Two tendency tones move by semitone: B to C, F to E."),
      quiz("function-check", "Why does G7 pull toward C?", "Choose the strongest explanation.", [{ label: "B and F resolve by semitone to C and E", correct: true }, { label: "G7 is always played louder" }, { label: "It uses more notes" }], "Voice leading creates the pull. The chord label describes a sound relationship, not an arbitrary rule.", "This same tension and release underlies Bach, Chopin, jazz standards, film cues, and pop harmony."),
      { id: "progression-compose", kind: "compose", eyebrow: "Create", title: "Write a four-chord emotional arc", body: "Record a four-chord sketch beginning and ending on C. Use F, A minor, or G7 in the middle. Then name the moment of greatest tension.", allowedNotes: [48, 52, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72], minNotes: 12, prompt: "What changed when you delayed the final C?", why: "Composition begins when harmonic function becomes a choice rather than a formula." },
    ],
  },
  {
    id: "ode",
    number: "08",
    chapter: "Repertoire",
    title: "Beethoven: Ode to Joy",
    subtitle: "A complete melody study in four phrases",
    duration: "3 sessions",
    outcome: "You can perform the complete beginner melody, shape its four phrases, and identify repetition and variation.",
    tags: ["Complete melody", "Phrasing", "Form"],
    repertoire: {
      composer: "L. van Beethoven",
      edition: "Complete right-hand melody study",
      scoreUrl: "/scores/ode-to-joy.mxl",
      totalMeasures: 17,
      practiceBpm: 88,
      completeWork: true,
      sections: [
        { title: "Phrase A", measures: [1, 4], focus: "Repeated notes with direction", harmony: "Tonic to dominant" },
        { title: "Phrase A varied", measures: [5, 8], focus: "Recognize the changed cadence", harmony: "Return to tonic" },
        { title: "Phrase B", measures: [9, 12], focus: "Build toward the high point", harmony: "Predominant expansion" },
        { title: "Final cadence", measures: [13, 17], focus: "Keep pulse through the ending", harmony: "Dominant to tonic" },
      ],
    },
    steps: [
      learn("ode-map", "Four phrases, not sixty notes", "The melody becomes manageable when heard as four sentences. Phrase A establishes the idea. Its varied repeat changes the ending. Phrase B climbs toward the high point. The final phrase closes more decisively.", "Form reduces memory load and tells you where to breathe.", [64, 64, 65, 67, 67, 65, 64, 62]),
      sequence("ode-a", "Phrase A", "Keep repeated notes alive by gently leaning toward G.", [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62], "The phrase rises, turns, and settles without losing the pulse."),
      sequence("ode-a2", "Phrase A, changed ending", "Notice the familiar opening and different cadence.", [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60], "Variation creates recognition without exact repetition."),
      sequence("ode-b", "Phrase B and high point", "Let the line grow through D and release after the repeated E notes.", [62, 62, 64, 60, 62, 64, 65, 64, 60, 62, 64, 65, 64, 62, 60, 62, 55], "The contrasting phrase extends the range and delays home."),
      sequence("ode-complete", "Complete performance", "Play all four phrases without stopping. Breathe at phrase boundaries, not after every mistake.", [64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60,62,62,64,60,62,64,65,64,60,62,64,65,64,62,60,62,55,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60], "A full performance trains recovery, continuity, and large-scale memory."),
      quiz("ode-form", "What made the second phrase coherent?", "Why does it sound related to the first?", [{ label: "It repeats the opening and changes the cadence", correct: true }, { label: "Every pitch is different" }, { label: "It has no pulse" }], "Beethoven balances repetition with a changed ending, one of composition's most durable techniques.", "You can use the same principle in your own motifs."),
    ],
  },
  {
    id: "bach",
    number: "09",
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
    number: "10",
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
    number: "11",
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
    number: "12",
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
    id: "improv",
    number: "13",
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
    number: "14",
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
    number: "15",
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
