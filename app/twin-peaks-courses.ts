import type { Course, LessonStep } from "./curriculum";

const learn = (id: string, title: string, body: string, why: string, demo?: number[][]): LessonStep => ({ id, kind: "learn", eyebrow: "Listen and understand", title, body, why, demo });
const chord = (id: string, title: string, body: string, notes: number[], targetName: string, why: string): LessonStep => ({ id, kind: "chord", eyebrow: "Play with both hands", title, body, targetChord: notes, targetName, why, demo: [notes] });

export const TWIN_PEAKS_COURSES: Course[] = [
  {
    id: "laura-palmers-theme", number: "18", chapter: "Repertoire",
    title: "Twin Peaks: Laura Palmer's Theme",
    subtitle: "Darkness, tenderness, and the space between",
    duration: "4 sessions",
    outcome: "You can hear the contrast between dark and tender harmony, balance both hands, and play Night and clearing, an original eight-bar preparation for studying the song with a licensed score.",
    tags: ["Twin Peaks", "Original study", "Two hands"],
    resources: [
      { label: "Watch Badalamenti at the piano", url: "https://www.youtube.com/watch?v=rgXLEM8MhJo", description: "The composer demonstrates how Laura Palmer's Theme grew from a scene and a mood." },
      { label: "Full song: piano score", url: "https://www.musicnotes.com/sheetmusic/hdpiano/laura-palmers-theme/MN0186020", description: "HDpiano's purchasable piano arrangement on Musicnotes. Separate from the original Cadence exercises below." },
    ],
    repertoire: {
      composer: "Cadence · inspired by Angelo Badalamenti's atmosphere",
      edition: "Night and clearing · original preparation, not the song transcription",
      scoreUrl: "/scores/laura-palmer-study.musicxml", totalMeasures: 8, practiceBpm: 48, completeWork: false,
      sections: [
        { title: "Night", measures: [1, 4], focus: "Keep the bass quiet and listen to one inner note move", harmony: "C minor, suspended color, A-flat major 7, F minor 6" },
        { title: "Clearing", measures: [5, 8], focus: "Let the change to major sound warm, without rushing", harmony: "C major, A minor, F major, C major" },
      ],
    },
    steps: [
      { ...learn("laura-listen", "Hear the scene before learning the keys", "Open the composer-at-the-piano link. Listen for the change from a dark atmosphere into tenderness. Then return here: Night and clearing is an original Cadence exercise for those skills, not Laura Palmer's melody or complete arrangement. The full-song score is linked separately.", "Listening for an emotional turn gives slow practice a destination rather than a row of keys to finish."), terms: [
        { term: "Voicing", plain: "Making one note easier to hear than the other notes you play with it." },
        { term: "Inner voice", plain: "A note moving inside a chord, between its lowest and highest notes." },
        { term: "Register", plain: "The low, middle, or high part of the keyboard." },
      ] },
      chord("laura-night", "Give each hand a small job", "Left hand: C3 and G3. Right hand: E-flat4, G4, C5. Find each hand separately, then play the five keys together. Let the low notes feel farther away than the upper C.", [48, 55, 63, 67, 72], "C minor · study opening", "C and G provide a stable floor. E-flat gives this chord its minor color. The upper C can sing while the support stays soft."),
      chord("laura-inner", "Move one inner note", "Keep left-hand C3 and G3. In the right hand move E-flat4 down to D4, keeping G4 and C5. Compare the two shapes with the Hear example control.", [48, 55, 62, 67, 72], "C with D · suspended study color", "Removing the minor third makes the chord less clearly major or minor. One moving note changes the atmosphere while the other notes connect it."),
      { ...chord("laura-light", "Let the third brighten", "Left hand: C3 and G3. Right hand: E4, G4, C5. E is the white key immediately to the right of E-flat. Compare this with the first shape; keep volume and speed similar.", [48, 55, 64, 67, 72], "C major · study arrival", "The change from E-flat to E turns minor into major. You can create a strong emotional change with a small physical movement."), scoreSection: 1 },
      { ...learn("laura-join", "Join the two hands across eight bars", "Use Right hand in the practice score, then Left hand, then Both hands. The Right and Left prompts show the next keys separately. Each bar is one slow chord: count four quiet beats before the next one. The follower checks your key presses; you supply the held length. Loop Night, then Clearing, then use Play full track to join all eight study bars.", "Hand coordination grows from familiar shapes and deliberate timing. A quiet, connected pass matters more than speed.", [[48, 55, 63, 67, 72], [48, 55, 64, 67, 72]]), scoreSection: 0 },
      { id: "laura-check", kind: "quiz", eyebrow: "Hear the reason", title: "Which note changes the color?", body: "Our study keeps C and G, then changes C minor to C major. What moves?", choices: [{ label: "E-flat rises to E", correct: true }, { label: "C moves an octave lower" }, { label: "Every note changes" }], answerExplanation: "The third changes from E-flat to E. The shared C and G make the transition feel connected.", why: "You can now recognize and use this change without memorizing a new hand shape from scratch." },
      { id: "laura-create", kind: "compose", eyebrow: "Make your own scene", title: "Let one detail change the room", body: "Record a quiet C-minor shape, leave space, then change E-flat to E. Repeat with the major chord softer rather than louder. This is your own short scene, not the song melody.", allowedNotes: [48, 55, 60, 62, 63, 64, 67, 72], minNotes: 12, prompt: "Did the change feel like comfort, a memory, or something more uncertain?", why: "You are connecting a harmonic choice to an audible emotional result." },
    ],
  },
  {
    id: "twin-peaks-theme", number: "19", chapter: "Repertoire",
    title: "Twin Peaks: Main Theme / Falling",
    subtitle: "A steady floor beneath a floating harmony",
    duration: "4 sessions",
    outcome: "You can play Roadhouse dusk, an original eight-bar two-hand chord study, hear the color of added sevenths, and prepare for the full theme using a licensed piano score.",
    tags: ["Twin Peaks", "Original study", "Dreamlike harmony"],
    resources: [
      { label: "Listen to the theme", url: "https://www.youtube.com/watch?v=nCn3LYqCnrk", description: "Angelo Badalamenti's Twin Peaks Theme, provided by Rhino." },
      { label: "Full theme: piano score", url: "https://www.sheetmusicplus.com/en/product/theme-from-twin-peaks-19410132.html", description: "Hal Leonard Europe's purchasable piano score, with playback and tempo controls." },
    ],
    repertoire: {
      composer: "Cadence · inspired by Angelo Badalamenti's atmosphere",
      edition: "Roadhouse dusk · original preparation, not the theme transcription",
      scoreUrl: "/scores/twin-peaks-theme-study.musicxml", totalMeasures: 8, practiceBpm: 56, completeWork: false,
      sections: [
        { title: "Float", measures: [1, 4], focus: "Let the left hand anchor a softer right-hand color", harmony: "F major 7, D minor 7, B-flat major 7, C7" },
        { title: "Return", measures: [5, 8], focus: "Recognize the repeated beginning and changed ending", harmony: "F major 7, D minor 7, G minor 7, F major" },
      ],
    },
    steps: [
      { ...learn("twin-listen", "Separate the pulse from the haze", "Listen to the main theme, then imagine two jobs: a steady foundation and a floating upper layer. Roadhouse dusk is an original exercise in those jobs. Its notes and form are not the theme's transcription; use the linked piano score when learning the full song.", "An atmospheric sound still needs a clear underlying pulse. Softness does not mean losing your place."), terms: [
        { term: "Seventh", plain: "An extra chord tone that adds color beyond the basic three-note chord." },
        { term: "Common tone", plain: "A note shared by two neighboring chords, helping them connect." },
        { term: "Pulse", plain: "The steady beat you can quietly tap while other notes move around it." },
      ] },
      chord("twin-home", "Build a soft major-seventh color", "Left hand: F2 and C3. Right hand: A3, C4, E4. Start with one hand, then join them. E is the added seventh above F.", [41, 48, 57, 60, 64], "F major 7 · study opening", "F, A, and C form a plain major chord. Adding E creates a close pull toward F and a less settled color."),
      chord("twin-relative", "Keep familiar notes as the bass changes", "Left hand: D3 and A3. Right hand: C4, E4, F4. Keep C and E familiar from the previous chord. Bring F forward gently.", [50, 57, 60, 64, 65], "D minor 7 · study continuation", "The bass changes the meaning of shared upper notes. Common tones help the movement feel smooth."),
      { ...learn("twin-hands", "Let both hands arrive together", "Use the hand selectors beneath the study score. Learn the right-hand shapes first, then the bass fifths with your left. In Both hands mode, prepare each shape silently and play the two parts together. Count four beats per bar. Cadence waits for the requested keys; it does not enforce a four-beat hold.", "Preparing before the attack reduces scrambling. Keep the left hand softer so the upper color remains audible."), scoreSection: 0 },
      { ...chord("twin-ending", "Hear a clearer arrival", "Left hand: F2 and C3. Right hand: A3, C4, F4. Compare F on top here with E in the opening. One sounds more settled.", [41, 48, 57, 60, 65], "F major · study ending", "Replacing the seventh E with the root F gives the study a more conclusive finish."), scoreSection: 1 },
      { id: "twin-check", kind: "quiz", eyebrow: "Explain what you hear", title: "Why do the first two study chords connect?", body: "F major 7 moves to D minor 7. What helps the change feel smooth?", choices: [{ label: "They share several upper notes", correct: true }, { label: "The left hand plays louder" }, { label: "The pulse stops" }], answerExplanation: "F, A, C, and E belong to both chord collections; D changes the bass foundation. Shared notes connect the colors.", why: "Listening for common tones makes new chord progressions easier to understand and play." },
      { id: "twin-create", kind: "improv", eyebrow: "Compose a place", title: "Keep the floor, leave room above it", body: "Record four quiet F-major-seventh and D-minor-seventh shapes. Leave a breath between them, then add a sparse upper answer using A, C, E, or F. Keep the pulse steady.", allowedNotes: [41, 48, 50, 57, 60, 64, 65, 69, 72, 76, 77], minNotes: 16, why: "The contrast between reliable support and a sparse upper part makes atmosphere playable with two hands." },
    ],
  },
];
