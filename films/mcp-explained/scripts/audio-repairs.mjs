// Local, sample-preserving repairs for the included voice takes. No TTS or retiming.
// Durations are measured from the END of each decoded MP3. The final bursts
// occur after the last aligned spoken character and after a quiet interval.
export const TAIL_MUTE_SECONDS = Object.freeze({
  i1: 0.060, l1: 0.060, i3: 0.060, s02: 0.100, s06: 0.060,
  s09: 0.040, s12: 0.040, s13: 0.040, s15: 0.040,
});
export const HEAD_FADE_SECONDS = Object.freeze({i3: 0.003});
export const TAIL_FADE_SECONDS = 0.010;
const raisedCosine = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);

export const repairVoiceSegment = (pcm, id, sr) => {
  const head = Math.round((HEAD_FADE_SECONDS[id] || 0) * sr);
  const mute = Math.round((TAIL_MUTE_SECONDS[id] || 0) * sr);
  if (!head && !mute) return pcm;
  const repaired = new Float32Array(pcm);
  for (let i = 0; i < head; i++) repaired[i] *= raisedCosine(i / (head - 1));
  if (mute) {
    const fade = Math.round(TAIL_FADE_SECONDS * sr), end = pcm.length - mute, start = end - fade;
    if (start < head) throw new Error(`Audio repair exceeds available samples: ${id}`);
    for (let i = start; i < end; i++) repaired[i] *= 1 - raisedCosine((i - start) / (fade - 1));
    repaired.fill(0, end);
  }
  return repaired;
};

// Keep the original silent interval and impact cue. Only the two edit edges
// receive short ramps; stem normalization and the ducking detector stay intact.
export const musicSpliceGain = (i, cutStart, cutEnd, sr) => {
  const fadeOut = Math.round(0.005 * sr), fadeIn = Math.round(0.003 * sr);
  if (i >= cutStart - fadeOut && i < cutStart) return 1 - raisedCosine((i - cutStart + fadeOut) / (fadeOut - 1));
  if (i >= cutStart && i < cutEnd) return 0;
  if (i >= cutEnd && i < cutEnd + fadeIn) return raisedCosine((i - cutEnd) / (fadeIn - 1));
  return 1;
};
