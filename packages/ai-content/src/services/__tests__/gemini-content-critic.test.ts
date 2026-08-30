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
});
