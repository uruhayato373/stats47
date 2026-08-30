/**
 * Gemini API の structured output に渡す JSON Schema。
 *
 * JSON の構文だけでなく、FAQ と県別解説の件数も API 応答時点で固定する。
 * 意味・数値の正しさは audit-ai-content.mjs が別に判定する。
 */

export type GeminiJsonSchema = Record<string, unknown>;

export function buildAiContentResponseSchema(totalCount: number): GeminiJsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      faq: {
        type: "object",
        additionalProperties: false,
        properties: {
          items: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
                type: {
                  type: "string",
                  enum: ["top_ranking", "bottom_ranking", "average", "regional", "custom"],
                },
              },
              required: ["question", "answer", "type"],
            },
          },
        },
        required: ["items"],
      },
      regionalAnalysis: { type: "string" },
      insights: { type: "string" },
      prefectureCommentary: {
        type: "object",
        additionalProperties: false,
        properties: {
          items: {
            type: "array",
            minItems: totalCount,
            maxItems: totalCount,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                areaCode: { type: "string" },
                areaName: { type: "string" },
                rank: { type: "integer", minimum: 1, maximum: Math.max(1, totalCount) },
                value: { type: "number" },
                commentary: { type: "string" },
              },
              required: ["areaCode", "areaName", "rank", "value", "commentary"],
            },
          },
        },
        required: ["items"],
      },
    },
    required: ["faq", "regionalAnalysis", "insights", "prefectureCommentary"],
  };
}

export const GEMINI_CRITIC_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["PASS", "REVISE"] },
    issues: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          section: {
            type: "string",
            enum: ["faq", "regionalAnalysis", "insights", "prefectureCommentary", "overall"],
          },
          severity: { type: "string", enum: ["BLOCK", "MAJOR", "MINOR"] },
          message: { type: "string" },
        },
        required: ["section", "severity", "message"],
      },
    },
  },
  required: ["verdict", "issues"],
};
