/**
 * Gemini API の structured output に渡す JSON Schema。
 *
 * JSON の構文と FAQ の件数を API 応答時点で固定する。県別解説の件数・順位・値と、意味・数値の正しさは
 * audit-ai-content.mjs が別に判定する (件数の不一致は blocker)。
 *
 * 県別解説の配列に件数 (minItems/maxItems) と順位の範囲 (minimum/maximum) を付けると、47 件の key だけが
 * HTTP 400 で落ちた (gemini-3.5-flash-lite・2026-11-10〜11-22 の日次。26・38・39 件の key は生成できた)。
 * [仮説] 制約付きの配列が長いと structured output の schema が受け付けられない。400 の本文は
 * 2026-11-22 から GeminiTextError の detail に残るので、次の run のログで確かめる。
 */

export type GeminiJsonSchema = Record<string, unknown>;

export function buildAiContentResponseSchema(): GeminiJsonSchema {
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
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                areaCode: { type: "string" },
                areaName: { type: "string" },
                rank: { type: "integer" },
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
