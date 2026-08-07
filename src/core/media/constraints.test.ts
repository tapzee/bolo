import { describe, expect, it } from "vitest";
import {
  MAX_TRANSCRIBABLE_SECONDS,
  MAX_UPLOAD_AUDIO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  formatAllowance,
  formatDuration,
  formatMinutesSeconds,
  predictedAudioBytes,
  validateDuration,
} from "./constraints";
import { PLAN_MONTHLY_CREDITS, secondsForCredits } from "../billing/credits";

describe("formatMinutesSeconds", () => {
  it("keeps the seconds instead of rounding them away", () => {
    expect(formatMinutesSeconds(96)).toBe("1 min 36 sec");
    expect(formatMinutesSeconds(184)).toBe("3 min 4 sec");
  });

  it("says seconds when there is under a minute left", () => {
    // The old Math.round(sec / 60) rendered this as "0 min left" while the
    // balance could still pay for a transcription.
    expect(formatMinutesSeconds(24)).toBe("24 sec");
    expect(formatMinutesSeconds(59)).toBe("59 sec");
  });

  it("drops the seconds when they are zero", () => {
    expect(formatMinutesSeconds(180)).toBe("3 min");
    expect(formatMinutesSeconds(60)).toBe("1 min");
  });

  it("never rounds up past what the balance can buy", () => {
    // 1:36 must not present itself as 2 min.
    expect(formatMinutesSeconds(96).startsWith("1 min")).toBe(true);
    expect(formatMinutesSeconds(119)).toBe("1 min 59 sec");
  });

  it("clamps junk input rather than rendering NaN", () => {
    expect(formatMinutesSeconds(0)).toBe("0 sec");
    expect(formatMinutesSeconds(-30)).toBe("0 sec");
  });

  it("still differs from the player timecode", () => {
    expect(formatDuration(96)).toBe("1:36");
    expect(formatMinutesSeconds(96)).toBe("1 min 36 sec");
  });
});

describe("validateDuration", () => {
  it("accepts a clip inside both ceilings", () => {
    expect(validateDuration(60)).toBeNull();
    expect(validateDuration(MAX_TRANSCRIBABLE_SECONDS)).toBeNull();
  });

  it("refuses a clip whose audio would exceed the upload ceiling", () => {
    const rejection = validateDuration(MAX_TRANSCRIBABLE_SECONDS + 1);
    expect(rejection?.code).toBe("too_long_to_upload");
  });

  it("still refuses an absurdly long clip as too_long", () => {
    expect(validateDuration(MAX_VIDEO_DURATION_SECONDS + 1)?.code).toBe(
      "too_long",
    );
  });

  /**
   * The invariant the whole pre-flight rests on. If the encoder's bitrate is
   * raised without raising `AUDIO_BYTES_PER_SECOND`, the prediction goes
   * optimistic and doomed uploads start getting through to a platform 413 that
   * carries no message we can improve.
   */
  it("keeps every accepted duration under the upload ceiling", () => {
    expect(predictedAudioBytes(MAX_TRANSCRIBABLE_SECONDS)).toBeLessThanOrEqual(
      MAX_UPLOAD_AUDIO_BYTES,
    );
    expect(predictedAudioBytes(MAX_TRANSCRIBABLE_SECONDS + 1)).toBeGreaterThan(
      MAX_UPLOAD_AUDIO_BYTES,
    );
  });

  it("stays clear of the 4.5MB platform cap it is derived from", () => {
    // The margin covers multipart framing and headers, which ride along with
    // the audio and count against the same limit.
    expect(MAX_UPLOAD_AUDIO_BYTES).toBeLessThan(4.5 * 1000 * 1000);
  });
});

describe("formatAllowance", () => {
  it("speaks in hours once there is an hour to speak of", () => {
    expect(formatAllowance(3600)).toBe("1 hr");
    expect(formatAllowance(5400)).toBe("1 hr 30 min");
    expect(formatAllowance(14400)).toBe("4 hr");
    expect(formatAllowance(36000)).toBe("10 hr");
  });

  it("hands anything under an hour to formatMinutesSeconds", () => {
    expect(formatAllowance(3599)).toBe(formatMinutesSeconds(3599));
    expect(formatAllowance(96)).toBe("1 min 36 sec");
    expect(formatAllowance(24)).toBe("24 sec");
    expect(formatAllowance(0)).toBe("0 sec");
  });

  it("truncates, so it can never promise more than the balance buys", () => {
    // 1 hr 30 min 59 sec must not become "1 hr 31 min".
    expect(formatAllowance(5459)).toBe("1 hr 30 min");
    expect(formatAllowance(-90)).toBe("0 sec");
  });
});

describe("plan allowances read back honestly", () => {
  it("free is exactly its advertised length", () => {
    expect(formatMinutesSeconds(secondsForCredits(PLAN_MONTHLY_CREDITS.free))).toBe(
      "3 min",
    );
  });

  it("pins what the paid allowances actually buy", () => {
    // The pricing copy in `src/app/legal-content.tsx` is now computed from
    // these same constants, so it can no longer disagree with them. These
    // assertions pin the ladder itself.
    expect(formatAllowance(secondsForCredits(PLAN_MONTHLY_CREDITS.starter)))
      .toBe("1 hr 30 min");
    expect(formatAllowance(secondsForCredits(PLAN_MONTHLY_CREDITS.editor)))
      .toBe("4 hr");
    expect(formatAllowance(secondsForCredits(PLAN_MONTHLY_CREDITS.pro)))
      .toBe("10 hr");
  });
});
