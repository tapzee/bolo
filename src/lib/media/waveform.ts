"use client";

/**
 * Peak envelope for the audio waveform strip.
 *
 * Computed from the already-extracted audio blob rather than the video, so it
 * costs one decode of a few hundred KB instead of re-reading the source file.
 *
 * The waveform is not decoration — it is how a creator finds where a word
 * actually starts. Retiming by dragging a word edge against silence is guessing;
 * dragging it against a visible speech burst is not.
 */
export const computeWaveformPeaks = async (
  audio: Blob,
  buckets = 1600,
): Promise<number[]> => {
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (AudioCtx === undefined) return [];

  const context = new AudioCtx();
  try {
    const buffer = await context.decodeAudioData(await audio.arrayBuffer());
    const channel = buffer.getChannelData(0);
    const perBucket = Math.max(1, Math.floor(channel.length / buckets));
    const peaks: number[] = new Array(buckets).fill(0);

    let max = 0;
    for (let i = 0; i < buckets; i += 1) {
      const start = i * perBucket;
      const end = Math.min(channel.length, start + perBucket);

      let peak = 0;
      // Stride rather than sampling every frame: at 16kHz a bucket can hold
      // hundreds of samples, and the envelope is identical either way.
      const stride = Math.max(1, Math.floor((end - start) / 64));
      for (let j = start; j < end; j += stride) {
        const value = Math.abs(channel[j] ?? 0);
        if (value > peak) peak = value;
      }

      peaks[i] = peak;
      if (peak > max) max = peak;
    }

    // Normalised so quietly recorded audio still shows a readable envelope.
    return max > 0 ? peaks.map((p) => p / max) : peaks;
  } catch {
    // A codec the AudioContext cannot decode is not worth failing the edit for.
    return [];
  } finally {
    void context.close();
  }
};
