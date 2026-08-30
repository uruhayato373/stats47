import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GeminiTextError,
  extractQuotaDetails,
  generateContentText,
  isBillingExhausted,
  listGenerateContentModels,
} from "../gemini-text-client";

const okBody = {
  candidates: [{ content: { parts: [{ text: '{"ok":true}' }] }, finishReason: "STOP" }],
  usageMetadata: {
    promptTokenCount: 12,
    candidatesTokenCount: 4,
    totalTokenCount: 20,
    thoughtsTokenCount: 4,
  },
};

afterEach(() => vi.restoreAllMocks());

describe("generateContentText", () => {
  it("generateContent は responseSchema 形式と大文字 schema type を使う", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const url = String(_url);
      expect(url).toContain("gemini-2.5-flash-lite:generateContent");
      expect(url).not.toContain("secret-key");
      expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("secret-key");
      const body = JSON.parse(String(init?.body));
      expect(body.generationConfig.responseMimeType).toBe("application/json");
      expect(body.generationConfig.responseSchema).toEqual({
        type: "OBJECT",
        properties: {
          items: {
            type: "ARRAY",
            minItems: "1",
            items: { type: "STRING" },
          },
        },
      });
      expect(body.generationConfig.responseFormat).toBeUndefined();
      return new Response(JSON.stringify(okBody), { status: 200 });
    });

    const result = await generateContentText({
      prompt: "test",
      apiKey: "secret-key",
      responseJsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          items: { type: "array", minItems: 1, items: { type: "string" } },
        },
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).toEqual({
      text: '{"ok":true}',
      attempts: 1,
      usage: { inputTokens: 12, outputTokens: 4, totalTokens: 20, thinkingTokens: 4 },
    });
  });

  it("429 quota だけを有界再試行する", async () => {
    const quota = JSON.stringify({
      error: {
        details: [
          { violations: [{ quotaMetric: "generate_content_free_tier_requests", quotaValue: "20" }] },
          { retryDelay: "1s" },
        ],
      },
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(quota, { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(okBody), { status: 200 }));
    const sleepImpl = vi.fn(async () => undefined);

    const result = await generateContentText({
      prompt: "test",
      apiKey: "key",
      fetchImpl: fetchImpl as typeof fetch,
      sleepImpl,
      maxAttempts: 2,
    });

    expect(result.attempts).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledWith(1_000);
    expect(extractQuotaDetails(quota)).toEqual({
      metric: "generate_content_free_tier_requests",
      limit: "20",
      retryAfter: "1s",
    });
  });

  it("課金クレジット枯渇は再試行せず billing で停止する", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('{"error":{"message":"Credits are depleted"}}', { status: 429 }),
    );
    await expect(
      generateContentText({
        prompt: "test",
        apiKey: "key",
        fetchImpl: fetchImpl as typeof fetch,
        maxAttempts: 3,
      }),
    ).rejects.toMatchObject({ classification: "billing", status: 429 } satisfies Partial<GeminiTextError>);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(isBillingExhausted("Credit balance is too low")).toBe(true);
  });
});

describe("listGenerateContentModels", () => {
  it("generateContent 対応モデルだけを複数ページから返す", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [
              { name: "models/gemini-a", supportedGenerationMethods: ["generateContent"] },
              { name: "models/embed", supportedGenerationMethods: ["embedContent"] },
            ],
            nextPageToken: "next",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ name: "models/gemini-b", supportedGenerationMethods: ["generateContent"] }],
          }),
        ),
      );
    await expect(listGenerateContentModels({ apiKey: "key", fetchImpl: fetchImpl as typeof fetch })).resolves.toEqual([
      "gemini-a",
      "gemini-b",
    ]);
  });
});
