import { describe, expect, it } from "vitest";

import { buildGeminiCriticPrompt, parseGeminiCriticVerdict } from "../gemini-content-critic";

describe("Gemini content critic", () => {
  it("PASS と MAJOR が矛盾したら決定的に REVISE へ倒す", () => {
    const result = parseGeminiCriticVerdict(
      JSON.stringify({
        verdict: "PASS",
        issues: [{ section: "insights", severity: "MAJOR", message: "地域分析と重複" }],
      }),
    );
    expect(result.verdict).toBe("REVISE");
  });

  it("MINOR だけの PASS は保持する", () => {
    expect(
      parseGeminiCriticVerdict(
        JSON.stringify({
          verdict: "PASS",
          issues: [{ section: "faq", severity: "MINOR", message: "軽微" }],
        }),
      ).verdict,
    ).toBe("PASS");
  });

  it("批評 prompt は独立レビューと修正文非生成を明示する", () => {
    const prompt = buildGeminiCriticPrompt("sample-key", { insights: "sample" });
    expect(prompt).toContain("独立レビュアー");
    expect(prompt).toContain("修正文は作らず");
    expect(prompt).toContain("sample-key");
  });

  it("候補JSONの算術照合とサイト固有の地方区分を外部事実と混同しない", () => {
    const prompt = buildGeminiCriticPrompt("sample-key", {
      prefectureCommentary: {
        items: [
          { areaName: "北海道", rank: 1, value: 20, commentary: "北海道の説明です。" },
          { areaName: "青森県", rank: 2, value: 10, commentary: "青森県の説明です。" },
        ],
      },
    });
    expect(prompt).toContain("北海道・東北: 北海道、青森県");
    expect(prompt).toContain("候補JSON内の値から算出した全国平均=15");
    expect(prompt).toContain("外部ソースに対する正確性を保証しない");
  });
});
