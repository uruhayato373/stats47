import { describe, expect, it } from "vitest";
import { correctBookFigure, KINDLE_FIGURE_CORRECTIONS } from "../figure-corrections";

describe("figure corrections (SVG text only)", () => {
  it("rewrites every occurrence of the label and leaves numbers untouched", () => {
    // 2026-11-03 の図の描き直しで題が「2023年 · 単位：件」の形になった
    const svg = '<svg><title>2023年 · 単位：件</title><text>2023年 · 単位：件</text><text>3.29</text></svg>';
    const out = correctBookFigure("crime-rate-regional-gap", "theft-map", svg);
    expect(out).toContain("<title>2023年度 · 単位：件</title>");
    expect(out).toContain("<text>2023年度 · 単位：件</text>");
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

describe("fixFigureTemplate", () => {
  it("空の出典行を消し、横幅 1080 の型で収まらない題の字を小さくする", async () => {
    const { fixFigureTemplate } = await import("../figure-corrections");
    const svg = '<svg viewBox="0 0 1080 1350"><text x="64" y="120" font-size="72" font-weight="700">外国人延べ宿泊者数 都道府県ランキング</text><text x="64" y="1310.0" font-size="26.0">出典：</text></svg>';
    const out = fixFigureTemplate(svg);
    expect(out).not.toContain("出典：");
    expect(out).toContain('font-size="50"');
    const short = '<svg viewBox="0 0 1080 1350"><text x="64" y="120" font-size="72">財政力指数</text><text>出典：総務省</text></svg>';
    expect(fixFigureTemplate(short)).toBe(short);
  });
});
