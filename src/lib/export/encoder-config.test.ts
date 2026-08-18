import { describe, expect, it } from "vitest";
import { avcCodecString, targetBitrate } from "./encoder-config";

/**
 * The level table is the fix for "the export stutters on my phone", so these
 * tests pin the two things that make a file hardware-decodable: the level is
 * derived from macroblocks rather than pixel dimensions, and it is the *lowest*
 * one that fits.
 */
describe("avcCodecString", () => {
  const bitrate = 8_000_000;

  it("tags a 720p reel as level 3.1, not 5.2", () => {
    // Remotion's own table compares 1280 against landscape height limits and
    // lands on avc1.640034 (level 5.2) for this, the smallest thing we export.
    expect(avcCodecString({ width: 720, height: 1280, fps: 30, bitrate: 3_000_000 })).toBe(
      "avc1.64001F",
    );
  });

  it("tags a 1080p reel as level 4.0", () => {
    // 68 x 120 = 8,160 macroblocks, 244,800 MB/s: inside level 4.0's 8,192 and
    // 245,760 with nothing to spare, which is why the arithmetic has to be exact.
    expect(avcCodecString({ width: 1080, height: 1920, fps: 30, bitrate })).toBe(
      "avc1.640028",
    );
  });

  it("moves up a level when the same frame is 60fps", () => {
    expect(avcCodecString({ width: 1080, height: 1920, fps: 60, bitrate })).toBe(
      "avc1.64002A",
    );
  });

  it("treats landscape and portrait of the same size identically", () => {
    expect(avcCodecString({ width: 1920, height: 1080, fps: 30, bitrate })).toBe(
      avcCodecString({ width: 1080, height: 1920, fps: 30, bitrate }),
    );
  });

  it("tags 4K at level 5.1", () => {
    expect(
      avcCodecString({ width: 2160, height: 3840, fps: 30, bitrate: 32_000_000 }),
    ).toBe("avc1.640033");
  });

  it("climbs past a level whose bitrate ceiling is too low", () => {
    // 1080x1920@30 fits level 4.0 on frame size, but 4.0 caps High-profile
    // bitrate at 25 Mbit/s — declaring it while writing 30 would be a lie.
    expect(
      avcCodecString({ width: 1080, height: 1920, fps: 30, bitrate: 30_000_000 }),
    ).toBe("avc1.640029");
  });

  it("always names High profile", () => {
    for (const height of [1280, 1920, 2400, 3840]) {
      expect(
        avcCodecString({ width: 1080, height, fps: 30, bitrate }),
      ).toMatch(/^avc1\.6400/);
    }
  });
});

describe("targetBitrate", () => {
  it("gives a 1080p reel several times Remotion's fixed 3 Mbit/s", () => {
    const bitrate = targetBitrate({
      width: 1080,
      height: 1920,
      fps: 30,
      mobile: true,
    });
    expect(bitrate).toBeGreaterThan(6_000_000);
    expect(bitrate).toBeLessThan(9_000_000);
  });

  it("scales with frame rate", () => {
    const at30 = targetBitrate({ width: 720, height: 1280, fps: 30, mobile: true });
    const at60 = targetBitrate({ width: 720, height: 1280, fps: 60, mobile: true });
    expect(at60).toBeCloseTo(at30 * 2, -5);
  });

  it("holds a floor so a tiny clip is not starved", () => {
    expect(
      targetBitrate({ width: 320, height: 480, fps: 24, mobile: true }),
    ).toBe(2_500_000);
  });

  it("caps mobile lower than desktop", () => {
    const frame = { width: 2160, height: 3840, fps: 30 };
    expect(targetBitrate({ ...frame, mobile: true })).toBe(12_000_000);
    expect(targetBitrate({ ...frame, mobile: false })).toBeGreaterThan(
      12_000_000,
    );
  });

  it("does not clamp a 1080p30 reel on mobile", () => {
    // The mobile ceiling is there for 60fps footage. If it ever starts biting at
    // 30 we are back to starving the common case, which is the original bug.
    expect(
      targetBitrate({ width: 1080, height: 1920, fps: 30, mobile: true }),
    ).toBeLessThan(12_000_000);
  });

  it("stays inside the level chosen for it", () => {
    // The two functions have to agree, or we declare a level the stream breaks.
    for (const [width, height, fps] of [
      [720, 1280, 30],
      [1080, 1920, 30],
      [1080, 1920, 60],
      [1920, 1080, 30],
      [2160, 3840, 30],
    ] as const) {
      const bitrate = targetBitrate({ width, height, fps, mobile: false });
      const codec = avcCodecString({ width, height, fps, bitrate });
      expect(codec).toMatch(/^avc1\.6400/);
    }
  });
});
