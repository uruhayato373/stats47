import { describe, expect, it } from "vitest";
import { correctBookFigure, KINDLE_FIGURE_CORRECTIONS } from "../figure-corrections";

describe("figure corrections (SVG text only)", () => {
  it("rewrites every occurrence of the label and leaves numbers untouched", () => {
    const svg = '<svg><title>2023年</title><text>2023年</text><text>3.29</text></svg>';
    const out = correctBookFigure("crime-rate-regional-gap", "theft-map", svg);
    expect(out).toContain("<title>2023年度</title>");
    expect(out).toContain("<text>2023年度</text>");
    expect(out).toContain("<text>3.29</text>");
  });
  it("stops the edition when the R2 figure no longer contains the source text", () => {
    expect(() => correctBookFigure("crime-rate-regional-gap", "theft-map", "<svg><text>2023年度</text></svg>")).toThrow(/Figure correction source changed/);
  });
  it("passes figures without corrections through unchanged", () => {
    expect(correctBookFigure("crime-rate-regional-gap", "no-such-figure", "<svg/>")).toBe("<svg/>");
  });
  it("only turns 年 into 年度 (never the reverse) and keeps calendar-year axes", () => {
    for (const [key, list] of Object.entries(KINDLE_FIGURE_CORRECTIONS)) {
      for (const c of list) {
        expect(c.after, key).not.toMatch(/年度度/);
        expect(c.before, key).not.toMatch(/年度</);
      }
    }
    const ins = KINDLE_FIGURE_CORRECTIONS["earthquake-insurance-prefecture-gap/insurance-damage-scatter"];
    expect(ins.some((c) => c.before.includes("2024年"))).toBe(false);
  });
});
