import { describe, expect, it } from "vitest";

import { QUIZ_REEL_FPS, QUIZ_REEL_SCENE_DURATION, getQuizReelTimeline } from "../reel/timeline";

const SCENES = ["hook", "choices", "hint", "answer", "bars", "outro"] as const;

describe("getQuizReelTimeline", () => {
  it("シーンが重複・隙間なく連続し、合計尺が15〜18秒に収まる", () => {
    const timeline = getQuizReelTimeline();
    let cursor = 0;
    for (const name of SCENES) {
      expect(timeline[name].start).toBe(cursor);
      cursor += timeline[name].duration;
    }
    expect(timeline.totalDuration).toBe(cursor);

    const seconds = timeline.totalDuration / QUIZ_REEL_FPS;
    expect(seconds).toBeGreaterThanOrEqual(15);
    expect(seconds).toBeLessThanOrEqual(18);
  });

  it("各シーンの尺は SSOT (QUIZ_REEL_SCENE_DURATION) と一致する", () => {
    const timeline = getQuizReelTimeline();
    for (const name of SCENES) {
      expect(timeline[name].duration).toBe(QUIZ_REEL_SCENE_DURATION[name]);
    }
  });
});
