import { describe, expect, it } from "vitest";

import { buildAiContentResponseSchema, GEMINI_CRITIC_RESPONSE_SCHEMA } from "../gemini-content-schemas";

describe("Gemini structured output schema", () => {
  it("FAQ は 5 件に固定し、県別解説の件数と順位の範囲は schema に持たせない", () => {
    const schema = buildAiContentResponseSchema() as any;
    expect(schema.properties.faq.properties.items).toMatchObject({ minItems: 5, maxItems: 5 });
    // 47 件の制約付き配列は HTTP 400 になった (2026-11-22)。件数は audit-ai-content.mjs の blocker が検査する。
    const commentary = schema.properties.prefectureCommentary.properties.items;
    expect(commentary).not.toHaveProperty("minItems");
    expect(commentary).not.toHaveProperty("maxItems");
    expect(commentary.items.properties.rank).toEqual({ type: "integer" });
    expect(schema.required).toEqual([
      "faq",
      "regionalAnalysis",
      "insights",
      "prefectureCommentary",
    ]);
  });

  it("独立批評は PASS / REVISE のみ許容する", () => {
    const schema = GEMINI_CRITIC_RESPONSE_SCHEMA as any;
    expect(schema.properties.verdict.enum).toEqual(["PASS", "REVISE"]);
    expect(schema.required).toEqual(["verdict", "issues"]);
  });
});
