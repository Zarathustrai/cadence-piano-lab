export function toneReleaseSeconds(pedalMode, requestedDuration, scoreFollowing = false) {
  if (requestedDuration !== undefined) return requestedDuration;
  if (pedalMode === "off") return 0.42;
  if (pedalMode === "auto" && scoreFollowing) return 12;
  return 2.6;
}

export function autoPedalGroup(expectedNotes, measure) {
  if (!expectedNotes.length) return null;
  if (expectedNotes.length === 1) return `measure:${measure}`;
  return `harmony:${[...expectedNotes].sort((a, b) => a - b).join(",")}`;
}
