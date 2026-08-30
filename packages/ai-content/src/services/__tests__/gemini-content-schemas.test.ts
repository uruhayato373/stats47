import { describe, expect, it } from "vitest";

import { buildAiContentResponseSchema, GEMINI_CRITIC_RESPONSE_SCHEMA } from "../gemini-content-schemas";

describe("Gemini structured output schema", () => {
  it("FAQ 5件と対象地域全件を固定する", () => {
    const schema = buildAiContentResponseSchema(47) as any;
    expect(schema.properties.faq.properties.items).toMatchObject({ minItems: 5, maxItems: 5 });
    expect(schema.properties.prefectureCommentary.properties.items).toMatchObject({
      minItems: 47,
      maxItems: 47,
    });
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
