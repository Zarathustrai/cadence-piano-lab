function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function deviation(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function analyzeTechnique(samples) {
  const velocities = samples.map((sample) => sample.velocity);
  const gaps = samples
    .slice(1)
    .map((sample, index) => sample.at - samples[index].at)
    .filter((gap) => gap > 80 && gap < 3000);
  const averageGap = mean(gaps);
  const timingVariation = averageGap ? deviation(gaps) / averageGap : 1;
  const velocityVariation = mean(velocities) ? deviation(velocities) / mean(velocities) : 1;
  const range = samples.length
    ? Math.max(...samples.map((sample) => sample.midi)) - Math.min(...samples.map((sample) => sample.midi))
    : 0;
  const dynamicRange = velocities.length ? Math.max(...velocities) - Math.min(...velocities) : 0;
  const timing = clamp(100 - timingVariation * 155);
  const evenness = clamp(100 - velocityVariation * 190);
  const control = clamp((timing + evenness) / 2);
  return {
    timing,
    evenness,
    control,
    range,
    dynamicRange,
    averageVelocity: Math.round(mean(velocities)),
    averageGap: Math.round(averageGap),
  };
}

function variableLength(value) {
  const bytes = [value & 0x7f];
  while ((value >>= 7)) bytes.unshift((value & 0x7f) | 0x80);
  return bytes;
}

function normalizedPerformance(input) {
  if (!input.length) return [];
  if (typeof input[0] === "number") {
    return input.map((midi, index) => ({ midi, start: index * 500, duration: 250, velocity: 88 }));
  }
  return input.map((event) => ({
    midi: event.midi ?? event.note,
    start: Math.max(0, event.start ?? event.at ?? 0),
    duration: Math.max(40, event.duration ?? 250),
    velocity: Math.max(1, Math.min(127, event.velocity ?? 88)),
  }));
}

export function createMidiFile(input, bpm = 92) {
  const division = 480;
  const tempo = Math.round(60000000 / bpm);
  const track = [
    0x00, 0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff,
    0x00, 0xc0, 0x00,
  ];

  const performance = normalizedPerformance(input);
  const events = performance.flatMap((note) => {
    const safeNote = Math.max(0, Math.min(127, note.midi));
    const startTick = Math.round((note.start * bpm * division) / 60000);
    const endTick = Math.max(startTick + 1, Math.round(((note.start + note.duration) * bpm * division) / 60000));
    return [
      { tick: startTick, priority: 1, bytes: [0x90, safeNote, note.velocity] },
      { tick: endTick, priority: 0, bytes: [0x80, safeNote, 0] },
    ];
  }).sort((a, b) => a.tick - b.tick || a.priority - b.priority);

  let previousTick = 0;
  for (const event of events) {
    track.push(...variableLength(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  }
  track.push(0x00, 0xff, 0x2f, 0x00);
  const header = [
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (division >> 8) & 0xff, division & 0xff,
    0x4d, 0x54, 0x72, 0x6b,
    (track.length >>> 24) & 0xff,
    (track.length >>> 16) & 0xff,
    (track.length >>> 8) & 0xff,
    track.length & 0xff,
  ];
  return new Uint8Array([...header, ...track]);
}

export function analyzePerformance(input) {
  const performance = normalizedPerformance(input).sort((a, b) => a.start - b.start);
  if (!performance.length) {
    return { duration: 0, dynamicRange: 0, averageVelocity: 0, articulation: 0, gapVariation: 0, overlapCount: 0 };
  }
  const starts = performance.map((event) => event.start);
  const gaps = starts.slice(1).map((start, index) => start - starts[index]).filter((gap) => gap >= 0);
  const velocities = performance.map((event) => event.velocity);
  const durations = performance.map((event) => event.duration);
  const totalDuration = Math.max(...performance.map((event) => event.start + event.duration));
  const overlapCount = performance.slice(1).filter((event, index) => {
    const previous = performance[index];
    return event.start < previous.start + previous.duration;
  }).length;
  return {
    duration: Math.round(totalDuration),
    dynamicRange: Math.max(...velocities) - Math.min(...velocities),
    averageVelocity: Math.round(mean(velocities)),
    articulation: Math.round(mean(durations)),
    gapVariation: gaps.length > 1 && mean(gaps) ? Math.round((deviation(gaps) / mean(gaps)) * 100) : 0,
    overlapCount,
  };
}

export function evaluateScoreSession({ correct = 0, mistakes = 0, timingRatios = [], pauses = 0, tempo = 72 } = {}) {
  const attempts = correct + mistakes;
  const accuracy = attempts ? clamp((correct / attempts) * 100) : 0;
  const timingErrors = timingRatios.map((ratio) => Math.min(1.5, Math.abs(ratio - 1)));
  const rhythm = timingErrors.length ? clamp(100 - mean(timingErrors) * 135) : 0;
  const continuity = correct > 1 ? clamp(100 - (pauses / (correct - 1)) * 120) : 0;
  return {
    accuracy,
    rhythm,
    continuity,
    tempo,
    positions: correct,
    mistakes,
    timingSamples: timingRatios.length,
  };
}

export function buildPracticePlan({ nextCourse, earProgress, latestScore, latestTechnique, hasSketch, preferences = [], dueReviews = [] }) {
  const earAccuracy = earProgress?.attempted ? Math.round((earProgress.correct / earProgress.attempted) * 100) : null;
  let warmup;
  if (dueReviews.length) {
    warmup = { minutes: 6, title: `Recall: ${dueReviews[0].title}`, destination: "review", reason: `${dueReviews.length} learning ${dueReviews.length === 1 ? "experience is" : "experiences are"} due. Retrieve the idea before rereading it.` };
  } else if (latestScore?.timingSamples > 0 && latestScore.rhythm < 74) {
    warmup = { minutes: 6, title: "Repair the pulse in context", destination: "score", reason: `${latestScore.section} rhythm is ${latestScore.rhythm}%. Loop two measures below performance tempo.` };
  } else if (latestTechnique?.control > 0 && latestTechnique.control < 74) {
    warmup = { minutes: 6, title: "Touch and pulse laboratory", destination: "lab", reason: `Recent control measured ${latestTechnique.control}%. Begin slowly enough to keep the hand easy.` };
  } else if (earAccuracy !== null && earAccuracy < 72) {
    warmup = { minutes: 6, title: "Focused ear comparison", destination: "lab", reason: `Ear accuracy is ${earAccuracy}%. Compare a smaller vocabulary before expanding it.` };
  } else {
    warmup = { minutes: 5, title: "Calibrate ear and touch", destination: "lab", reason: "One short sample keeps listening and movement connected to the rest of the session." };
  }

  const creativeTitle = !hasSketch
    ? preferences.includes("Film & game music")
      ? "Capture a first emotional motif"
      : preferences.includes("Music production")
        ? "Capture a first production seed"
        : "Record a first recognizable phrase"
    : preferences.includes("Film & game music")
      ? "Score one emotional change"
      : preferences.includes("Ambient")
        ? "Shape foreground and atmosphere"
        : preferences.includes("Songwriting")
          ? "Develop one memorable hook"
          : preferences.includes("Music production")
            ? "Arrange the latest idea into roles"
            : "Create one recognizable variation";
  return {
    totalMinutes: 25,
    reason: latestScore || latestTechnique || earAccuracy !== null || hasSketch
      ? "Built from your recent playing evidence, not a generic calendar."
      : "This first plan gathers enough evidence to become specific after the session.",
    items: [
      warmup,
      { minutes: 12, title: nextCourse?.title ?? "Continue the learning path", destination: "course", reason: nextCourse?.outcome ?? "Build the next prerequisite in sequence." },
      { minutes: warmup.minutes === 6 ? 7 : 8, title: creativeTitle, destination: hasSketch ? "sketchbook" : "create", reason: hasSketch ? "Revise existing material before generating something unrelated." : "Capture a first phrase so rhythm and touch can shape future feedback." },
    ],
  };
}

export function derivePlacementProfile(scores) {
  const normalized = {
    geography: clamp(scores.geography ?? 0),
    ear: clamp(scores.ear ?? 0),
    chords: clamp(scores.chords ?? 0),
    theory: clamp(scores.theory ?? 0),
  };
  const overall = Math.round(mean(Object.values(normalized)));
  const recommendedCourseId = normalized.geography < 65
    ? "keyboard"
    : normalized.ear < 65
      ? "intervals"
      : normalized.chords < 65 || normalized.theory < 65
        ? "triads"
        : "progressions";
  const reason = recommendedCourseId === "keyboard"
    ? "Keyboard landmarks should become immediate before reading and harmony compete for attention."
    : recommendedCourseId === "intervals"
      ? "Your keyboard orientation is ready; the next leverage point is connecting distance, sound, and notation."
      : recommendedCourseId === "triads"
        ? "You can orient and hear direction. Building chords from root, third, and fifth is the next useful bridge."
        : "Your foundations are secure enough to begin functional harmony while the earlier courses remain available for review.";
  return { ...normalized, overall, recommendedCourseId, reason };
}

export function scheduleReview(current, quality, completedAt = new Date().toISOString()) {
  const safeQuality = clamp(quality);
  const repetitions = (current?.repetitions ?? 0) + 1;
  let intervalDays;
  if (safeQuality < 65) intervalDays = 1;
  else if (!current) intervalDays = 1;
  else intervalDays = Math.min(45, Math.max(2, Math.round(current.intervalDays * (safeQuality >= 90 ? 2.4 : 1.7))));
  const dueAt = new Date(new Date(completedAt).getTime() + intervalDays * 86400000).toISOString();
  return { repetitions, intervalDays, quality: safeQuality, lastReviewedAt: completedAt, dueAt };
}

export function dueReviewEntries(schedule, now = new Date().toISOString()) {
  const nowTime = new Date(now).getTime();
  return Object.entries(schedule)
    .filter(([, item]) => new Date(item.dueAt).getTime() <= nowTime)
    .sort(([, a], [, b]) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .map(([key, item]) => ({ key, ...item }));
}

const PREFERENCE_COURSES = {
  "Classical foundations": ["ode", "bach", "minuet", "satie", "chopin"],
  Improvisation: ["improv", "intervals", "scales"],
  Composition: ["composition", "progressions", "inversions"],
  "Music production": ["production", "composition", "satie"],
  "Film & game music": ["production", "satie", "chopin", "composition"],
  Ambient: ["satie", "production", "improv"],
  "Jazz harmony": ["inversions", "progressions", "improv"],
  Songwriting: ["progressions", "composition", "production"],
};

export function chooseRecommendedCourse(courses, completedSteps, preferences, placementCourseId) {
  const incomplete = (course) => (completedSteps[course.id]?.length ?? 0) < course.steps.length;
  if (placementCourseId) {
    const placementIndex = courses.findIndex((course) => course.id === placementCourseId);
    const placedCourse = courses.slice(Math.max(0, placementIndex)).find(incomplete);
    if (placedCourse) return placedCourse;
  }
  const foundation = courses.slice(0, 5).find(incomplete);
  if (foundation) return foundation;

  const preferredIds = preferences.flatMap((preference) => PREFERENCE_COURSES[preference] ?? []);
  for (const id of [...new Set(preferredIds)]) {
    const course = courses.find((item) => item.id === id && incomplete(item));
    if (course) return course;
  }
  return courses.find(incomplete) ?? courses[courses.length - 1];
}
