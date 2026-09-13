export function toneReleaseSeconds(pedalAssist, requestedDuration) {
  return requestedDuration ?? (pedalAssist ? 2.6 : 0.42);
}
