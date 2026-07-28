export type MusicExplanation = {
  title: string;
  symbol: string;
  role: string;
  explanation: string;
  listenFor: string;
  experiment: string;
};

const EXPLANATIONS: Record<string, MusicExplanation> = {
  "C major": {
    title: "C major",
    symbol: "C · E · G",
    role: "Tonic, the musical home",
    explanation:
      "C is the root, E makes the chord major, and G stabilizes it. In Bach’s Prelude, this harmony gives the ear a clear point of rest before the bass begins to travel.",
    listenFor:
      "Notice how the E adds brightness while the outer C and G feel settled.",
    experiment:
      "Replace E with E♭. The same outer notes become C minor and the emotional color changes immediately.",
  },
  "G7": {
    title: "G dominant seventh",
    symbol: "G · B · D · F",
    role: "Dominant, tension that asks for C",
    explanation:
      "B leans upward toward C while F leans downward toward E. Those two half-step resolutions make G7 feel unfinished until it reaches C major.",
    listenFor:
      "Hold B and F, then resolve them outward to C and E.",
    experiment:
      "Play G major without F, then add F. The added note makes the pull toward C much stronger.",
  },
  "A minor": {
    title: "A minor",
    symbol: "A · C · E",
    role: "Relative minor, a nearby shadow",
    explanation:
      "A minor uses the same white-key collection as C major, but A becomes the center. That change of gravity creates contrast without sounding like a new world.",
    listenFor:
      "Compare C–E–G with A–C–E. Two notes remain, but the emotional center moves.",
    experiment:
      "Keep C and E held while moving only the bass from C down to A.",
  },
  "E minor": {
    title: "E minor",
    symbol: "E · G · B",
    role: "Minor tonic, restrained and unresolved",
    explanation:
      "In Chopin’s E-minor Prelude, the melody is spare while the inner voices descend by small steps. The harmony changes color even when the top line barely moves.",
    listenFor:
      "Listen below the melody. The expressive motion lives inside the chord.",
    experiment:
      "Hold B in the top voice and move the lower notes down by one step at a time.",
  },
};

export function getMusicExplanation(chord: string): MusicExplanation {
  return EXPLANATIONS[chord] ?? EXPLANATIONS["C major"];
}

export type DrillInput = {
  wrongNote?: string;
  timingScore: number;
  lessonTitle: string;
};

export type PracticeDrill = {
  eyebrow: string;
  title: string;
  instruction: string;
  repetitions: string;
  reason: string;
};

/**
 * Drop-in AI boundary. The MVP uses deterministic coaching so it works without
 * an API key. Replace this function with a server-side LLM call later.
 */
export async function generatePracticeDrill(
  input: DrillInput,
): Promise<PracticeDrill> {
  await Promise.resolve();

  if (input.wrongNote) {
    return {
      eyebrow: "Generated from your last attempts",
      title: `${input.wrongNote} landing drill`,
      instruction: `Play the note before ${input.wrongNote}, pause, then land on ${input.wrongNote} with the smallest possible hand movement. Add the following note only when the landing feels easy.`,
      repetitions: "5 slow repetitions · then 3 in tempo",
      reason: `You hesitated around ${input.wrongNote} in ${input.lessonTitle}. This isolates the transition without practicing the mistake again.`,
    };
  }

  if (input.timingScore < 80) {
    return {
      eyebrow: "Generated from your timing",
      title: "Quiet pulse drill",
      instruction:
        "Tap four beats, then play one note on every second tap. Keep the hand loose and make each landing exactly as calm as the last.",
      repetitions: "2 rounds at 72 BPM · then 2 at lesson tempo",
      reason:
        "Your notes are accurate. A steadier internal pulse will make the phrase sound intentional rather than careful.",
    };
  }

  return {
    eyebrow: "Ready when you are",
    title: "Shape the phrase",
    instruction:
      "Play the passage once quietly, once with a gentle rise toward its highest note, then once from memory. Keep the rhythm unchanged.",
    repetitions: "3 contrasting repetitions",
    reason:
      "The notes and pulse are stable. The next useful challenge is expression and musical memory.",
  };
}
