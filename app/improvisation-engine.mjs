const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

function direction(interval) {
  return interval === 0 ? 0 : interval > 0 ? 1 : -1;
}

function repeatedIntervalScore(notes) {
  if (notes.length < 6) return 0;
  const intervals = notes.slice(1).map((note, index) => note - notes[index]);
  const cells = intervals.slice(0, -1).map((interval, index) => `${interval},${intervals[index + 1]}`);
  const counts = new Map();
  cells.forEach((cell) => counts.set(cell, (counts.get(cell) ?? 0) + 1));
  const repeated = [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  return clamp(((repeated * 2) / Math.max(1, cells.length)) * 100);
}

export function analyzeImprovisation(samples, scenario) {
  if (!samples.length) {
    return {
      notes: 0,
      duration: 0,
      range: 0,
      phraseCount: 0,
      breathCount: 0,
      motifScore: 0,
      harmonicFit: 0,
      chordChangeLandings: 0,
      contourChanges: 0,
      endingResolved: false,
      observation: "Play a short phrase so Cadence can compare identity, space, and harmony.",
      nextPass: "Begin with a three-note idea you can remember without looking at the keys.",
    };
  }

  const notes = samples.map((sample) => sample.midi);
  const gaps = samples.slice(1).map((sample, index) => sample.at - samples[index].at);
  const breathCount = gaps.filter((gap) => gap >= 850).length;
  const phraseCount = 1 + breathCount;
  const intervals = notes.slice(1).map((note, index) => note - notes[index]);
  const directions = intervals.map(direction).filter(Boolean);
  const contourChanges = directions.slice(1).filter((value, index) => value !== directions[index]).length;
  const chordMs = scenario.beatsPerChord * (60000 / scenario.bpm);
  let harmonicMatches = 0;
  let changeLandings = 0;
  let landingOpportunities = 0;
  samples.forEach((sample, index) => {
    const chordIndex = Math.floor(sample.at / chordMs) % scenario.chords.length;
    const chord = scenario.chords[chordIndex];
    if (chord.pitchClasses.includes(sample.midi % 12)) harmonicMatches += 1;
    const withinChord = sample.at % chordMs;
    const isFirstAfterChange = withinChord < 650 || (index > 0 && Math.floor(samples[index - 1].at / chordMs) !== Math.floor(sample.at / chordMs));
    if (isFirstAfterChange) {
      landingOpportunities += 1;
      if (chord.pitchClasses.includes(sample.midi % 12)) changeLandings += 1;
    }
  });
  const harmonicFit = clamp((harmonicMatches / samples.length) * 100);
  const chordChangeLandings = landingOpportunities ? clamp((changeLandings / landingOpportunities) * 100) : harmonicFit;
  const endingPitch = notes.at(-1) % 12;
  const endingResolved = scenario.homePitchClasses.includes(endingPitch);
  const motifScore = repeatedIntervalScore(notes);
  const range = Math.max(...notes) - Math.min(...notes);
  const duration = Math.round(samples.at(-1).at);

  let observation;
  let nextPass;
  if (samples.length < 8) {
    observation = "The phrase is still too short to reveal a dependable pattern, but its contour is already visible.";
    nextPass = "Repeat the opening cell once, then add an answer before stopping.";
  } else if (motifScore < 22) {
    observation = "The pitch material keeps changing, so the listener has little time to recognize an identity.";
    nextPass = "Choose the first three notes as your motif. Repeat their rhythm exactly and change only the final pitch.";
  } else if (breathCount === 0 && duration > 4500) {
    observation = "The motif is audible, but the phrase does not yet give it space to register.";
    nextPass = "After the first statement, leave one full beat of silence before answering.";
  } else if (chordChangeLandings < 60) {
    observation = "Your line has identity and breath. The harmony changes underneath it, but your landing notes do not yet acknowledge those changes reliably.";
    nextPass = "Keep the motif, then aim the first note after each chord change at one highlighted chord tone.";
  } else if (!endingResolved) {
    observation = "The phrase follows the harmony and preserves a recognizable idea. Its final pitch leaves the sentence intentionally open.";
    nextPass = "Repeat the phrase and change only the final note so it settles into the home harmony.";
  } else if (range > 14) {
    observation = "The motif, harmonic landings, and ending are coherent. The wide range is now the strongest dramatic feature.";
    nextPass = "Keep the notes, but save the highest point for the final third of the next pass.";
  } else {
    observation = "The phrase balances identity, harmonic awareness, space, and a clear ending.";
    nextPass = "Develop rather than replace it: keep the rhythm and reharmonize the second half, or keep the harmony and invert the contour.";
  }

  return {
    notes: samples.length,
    duration,
    range,
    phraseCount,
    breathCount,
    motifScore,
    harmonicFit,
    chordChangeLandings,
    contourChanges,
    endingResolved,
    observation,
    nextPass,
  };
}
