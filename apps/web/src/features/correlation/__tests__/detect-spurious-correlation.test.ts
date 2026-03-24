import { describe, expect, it } from "vitest";

import { detectSpuriousCorrelation } from "../utils/detect-spurious-correlation";

describe("detectSpuriousCorrelation", () => {
  it("ピアソン相関が弱い場合は疑似相関ではない", () => {
    expect(detectSpuriousCorrelation(0.5, [0.3, 0.2])).toBe(false);
  });

  it("ピアソン相関が強く偏相関も強い場合は疑似相関ではない", () => {
    expect(detectSpuriousCorrelation(0.8, [0.7, 0.6])).toBe(false);
  });

  it("ピアソン相関が強く偏相関の最小値が弱い場合は疑似相関", () => {
    expect(detectSpuriousCorrelation(0.8, [0.7, 0.3])).toBe(true);
  });

  it("負の強い相関でも偏相関が弱ければ疑似相関", () => {
    expect(detectSpuriousCorrelation(-0.85, [-0.4, -0.6])).toBe(true);
  });

  it("偏相関が全て null の場合は疑似相関ではない", () => {
    expect(detectSpuriousCorrelation(0.9, [null, null, null])).toBe(false);
  });

  it("一部 null を含む偏相関で判定できる", () => {
    expect(detectSpuriousCorrelation(0.8, [null, 0.3, null, 0.6])).toBe(true);
  });

  it("ちょうど閾値（|r|=0.7, effectiveR=0.5）では疑似相関ではない", () => {
    expect(detectSpuriousCorrelation(0.7, [0.5])).toBe(false);
  });
});
