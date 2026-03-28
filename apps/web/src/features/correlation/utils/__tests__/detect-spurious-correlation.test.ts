import { describe, it, expect } from "vitest";

import { detectSpuriousCorrelation } from "../detect-spurious-correlation";

describe("detectSpuriousCorrelation", () => {
  it("強い相関 + 弱い偏相関で疑似相関と判定する", () => {
    expect(detectSpuriousCorrelation(0.9, [0.3, 0.4])).toBe(true);
  });

  it("強い相関 + 強い偏相関で疑似相関ではないと判定する", () => {
    expect(detectSpuriousCorrelation(0.9, [0.7, 0.8])).toBe(false);
  });

  it("弱い相関の場合は偏相関に関わらず false", () => {
    expect(detectSpuriousCorrelation(0.5, [0.1])).toBe(false);
  });

  it("偏相関が全て null の場合に false", () => {
    expect(detectSpuriousCorrelation(0.9, [null, null])).toBe(false);
  });

  it("空配列の場合に false", () => {
    expect(detectSpuriousCorrelation(0.9, [])).toBe(false);
  });

  it("負の強い相関でも疑似相関を検出する", () => {
    expect(detectSpuriousCorrelation(-0.85, [0.2])).toBe(true);
  });

  it("閾値ちょうど（pearsonR = 0.7, partial = 0.5）で false", () => {
    expect(detectSpuriousCorrelation(0.7, [0.5])).toBe(false);
  });

  it("null と有効値が混在する場合", () => {
    expect(detectSpuriousCorrelation(0.8, [null, 0.3, null])).toBe(true);
  });
});
