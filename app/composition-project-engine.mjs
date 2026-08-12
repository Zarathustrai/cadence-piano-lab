const STARTER = [60, 62, 64, 67, 64, 62];

export const PROJECT_TRANSFORMS = [
  { id: "original", label: "State the idea", explanation: "Preserve pitch, rhythm, and touch so the listener can learn the identity." },
  { id: "answer", label: "Answer the contour", explanation: "Turn each interval around the first note. The rhythm stays familiar while direction changes." },
  { id: "transpose", label: "Lift it a step", explanation: "Move the whole idea up two semitones. Identity survives because every interval stays intact." },
  { id: "rhythm", label: "Change the pacing", explanation: "Alternate longer and shorter spaces without changing the pitch order." },
  { id: "open", label: "Open the register", explanation: "Lift alternating notes by an octave to create width and a more produced texture." },
  { id: "distill", label: "Distill the motif", explanation: "Keep the first half only. Repetition makes the smallest recognizable cell audible." },
  { id: "return", label: "Return, then resolve", explanation: "Recall the original shape and guide its last note back to the opening pitch class." },
];

export const PROJECT_BRIEFS = [
  {
    id: "classical-miniature",
    direction: "Classical foundations",
    title: "Classical miniature",
    goal: "Write a 60 to 90 second A–A′–B–A return whose development can be heard, not merely seen.",
    question: "How little can change while the listener still hears growth?",
    defaults: { harmonies: ["I: establish home", "vi or IV: recolor home", "V: make return necessary", "V–I: release"], textures: ["Solo statement", "Inner voice added", "Bass-led contrast", "Opening texture, quieter"] },
  },
  {
    id: "cinematic-cue",
    direction: "Film & game music",
    title: "Cinematic memory cue",
    goal: "Shape one motif into calm, uncertainty, distance, and a changed return over 60 to 90 seconds.",
    question: "What has changed when the opening idea returns?",
    defaults: { harmonies: ["Tonic: intimate", "Tonic substitute: widen", "Dominant or modal dominant", "Tonic with one color tone"], textures: ["Intimate piano", "Piano with warm pad", "Low bass and distant lead", "Fuller return, then thin out"] },
  },
  {
    id: "ambient-study",
    direction: "Ambient",
    title: "Evolving atmosphere",
    goal: "Create a patient four-part form where register, density, and decay develop a small harmonic seed.",
    question: "Can space and timbre create form without a hard cadence?",
    defaults: { harmonies: ["Open tonic field", "Shared-tone shift", "Remote color", "Tonic field, unresolved color"] , textures: ["Felt piano and silence", "Long pad enters", "Low bloom, sparse motif", "Pad remains after piano"] },
  },
  {
    id: "production-sketch",
    direction: "Music production",
    title: "Piano seed to track sketch",
    goal: "Turn one played idea into a 16-bar arrangement with a clear focal voice, bass role, contrast, and return.",
    question: "Which layer owns attention in each section?",
    defaults: { harmonies: ["Core loop, restrained", "Same loop, inversion change", "Contrast chord or bass pedal", "Core loop with strongest cadence"], textures: ["Piano and pulse", "Bass and harmony enter", "Lead thins, space widens", "All roles, then one-bar release"] },
  },
  {
    id: "song-form",
    direction: "Songwriting",
    title: "Verse, lift, hook, return",
    goal: "Build a compact song form whose melodic register and harmonic tension make the hook feel earned.",
    question: "What makes the central idea feel like a destination?",
    defaults: { harmonies: ["Tonic-led verse", "Predominant lift", "Dominant-to-tonic hook", "Verse harmony with hook echo"], textures: ["Low conversational range", "Rhythm becomes active", "Highest focal register", "Return with one hook fragment"] },
  },
];

export function performanceFromSource(sketch) {
  if (sketch?.performance?.length) return sketch.performance.map((note) => ({ ...note }));
  const notes = sketch?.notes?.length ? sketch.notes : STARTER;
  return notes.map((midi, index) => ({ midi, start: index * 460, duration: 330, velocity: 78 + (index % 3) * 4 }));
}

function normalizedPerformance(performance) {
  if (!performance.length) return [];
  const first = Math.min(...performance.map((note) => note.start));
  return performance.map((note) => ({ ...note, start: note.start - first })).sort((a, b) => a.start - b.start);
}

export function transformPerformance(performance, transformId) {
  const source = normalizedPerformance(performance);
  if (!source.length) return [];
  const firstPitch = source[0].midi;
  let transformed = source.map((note, index) => {
    if (transformId === "answer") return { ...note, midi: firstPitch - (note.midi - firstPitch) };
    if (transformId === "transpose") return { ...note, midi: note.midi + 2 };
    if (transformId === "rhythm") return { ...note, start: note.start * (index % 2 ? 1.14 : .9), duration: note.duration * (index % 2 ? .82 : 1.18) };
    if (transformId === "open") return { ...note, midi: note.midi + (index % 2 ? 12 : 0), velocity: Math.max(1, note.velocity - (index % 2 ? 8 : 0)) };
    return { ...note };
  });
  if (transformId === "distill") transformed = transformed.slice(0, Math.max(1, Math.ceil(transformed.length / 2)));
  if (transformId === "return") {
    const firstPitchClass = transformed[0].midi % 12;
    const last = transformed.at(-1);
    const candidates = [firstPitchClass + 48, firstPitchClass + 60, firstPitchClass + 72];
    const resolved = candidates.sort((a, b) => Math.abs(a - last.midi) - Math.abs(b - last.midi))[0];
    transformed = transformed.map((note, index) => index === transformed.length - 1 ? { ...note, midi: resolved, duration: note.duration * 1.55, velocity: Math.max(45, note.velocity - 8) } : note);
  }
  return normalizedPerformance(transformed).map((note) => ({ ...note, midi: Math.max(24, Math.min(108, note.midi)), duration: Math.max(60, note.duration) }));
}

function repeatIntoSection(performance, sectionMs) {
  if (!performance.length) return [];
  const phraseMs = Math.max(300, ...performance.map((note) => note.start + note.duration));
  const gap = Math.min(500, phraseMs * .12);
  const cycle = phraseMs + gap;
  const result = [];
  for (let offset = 0; offset < sectionMs; offset += cycle) {
    performance.forEach((note) => {
      if (offset + note.start < sectionMs - 30) result.push({ ...note, start: offset + note.start, duration: Math.min(note.duration, sectionMs - offset - note.start) });
    });
  }
  return result;
}

export function assembleProject(project, sketches) {
  const beatMs = 60000 / (project.tempo || 76);
  let cursor = 0;
  return project.sections.flatMap((section) => {
    const source = sketches.find((sketch) => sketch.id === section.sourceSketchId);
    const transformed = transformPerformance(performanceFromSource(source), section.transformation);
    const sectionMs = Math.max(4, section.bars || 4) * 4 * beatMs;
    const events = repeatIntoSection(transformed, sectionMs).map((note) => ({
      ...note,
      start: note.start + cursor,
      velocity: Math.max(1, Math.min(127, note.velocity + (section.dynamic === "Build" ? 8 : section.dynamic === "Release" ? -10 : 0))),
    }));
    cursor += sectionMs;
    return events;
  });
}

export function analyzeProject(project) {
  const [a, development, contrast, returning] = project.sections;
  const sourceChosen = Boolean(a?.sourceSketchId);
  const developed = Boolean(development && development.transformation !== "original");
  const contrasted = Boolean(contrast && (contrast.sourceSketchId !== a?.sourceSketchId || contrast.harmony !== a?.harmony || contrast.texture !== a?.texture));
  const returned = Boolean(returning && returning.sourceSketchId === a?.sourceSketchId && ["original", "return"].includes(returning.transformation));
  const arranged = project.sections.filter((section) => section.texture && section.dynamic && section.harmony).length === project.sections.length;
  const reflected = project.sections.filter((section) => section.reflection?.trim().length >= 12).length;
  const milestones = [sourceChosen, developed, contrasted, returned, arranged, reflected >= 2];
  const completed = milestones.filter(Boolean).length;
  let observation = "Choose the musical seed for A. A listener needs one identity before development has meaning.";
  let nextMove = "Select a saved improvisation, harmony study, or the built-in starter motif.";
  if (sourceChosen && !developed) {
    observation = "The identity is present, but A′ still repeats it literally. Development needs one audible change.";
    nextMove = "Keep the source and change contour, register, pacing, or transposition in A′.";
  } else if (developed && !contrasted) {
    observation = "A and A′ belong together. B does not yet create a different dramatic condition.";
    nextMove = "Give B a different source, harmonic function, texture, or dynamic destination.";
  } else if (contrasted && !returned) {
    observation = "The form departs convincingly, but the listener has not been given a recognizable return.";
    nextMove = "Reconnect the final section to A, then use Return and resolve to acknowledge what changed.";
  } else if (returned && !arranged) {
    observation = "The form reads as identity, development, contrast, and return. Clarify who owns attention in every section.";
    nextMove = "Complete the harmony, texture, and dynamic role for each section before exporting a rehearsal sketch.";
  } else if (arranged && reflected < 2) {
    observation = "The piece has a complete structural draft. The next revision should be based on listening evidence, not more options.";
    nextMove = "Preview the form and write what changed emotionally in at least two sections.";
  } else if (completed === milestones.length) {
    observation = "This is a complete first composition draft: identity survives development, contrast creates need, and return carries memory.";
    nextMove = "Create a rehearsal sketch, play it away from the screen, then record one specific revision.";
  }
  return { completed, total: milestones.length, sourceChosen, developed, contrasted, returned, arranged, reflected, observation, nextMove };
}

export function recommendedBrief(preferences = []) {
  return PROJECT_BRIEFS.find((brief) => preferences.includes(brief.direction)) ?? PROJECT_BRIEFS[0];
}
