/**
 * gemini-text-client のテスト。
 *
 * 作法は apps/web/scripts/lib/__tests__/gemini-image-client.test.ts に合わせる
 * (fetch / sleep を差し替えて HTTP 分類・再試行・秘匿を検証する)。
 *
 * 実行: npm run test:ai-content --workspace apps/web
 */

import { describe, expect, it, vi } from "vitest";

import { GeminiTextError, generateContentText } from "../gemini-text-client";

const noSleep = () => Promise.resolve();

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

function textResponse(text: string, finishReason = "STOP"): Response {
  return jsonResponse(200, {
    candidates: [{ content: { parts: [{ text }] }, finishReason }],
  });
}

/** キュー順に Response を返す fetch mock */
function queuedFetch(responses: (Response | (() => Promise<Response>))[]) {
  const fn = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("fetch called more times than queued");
    return typeof next === "function" ? next() : next;
  });
  return fn as unknown as typeof fetch;
}

const base = { prompt: "p", apiKey: "SECRET-KEY-123", sleepImpl: noSleep };

describe("generateContentText — 成功", () => {
  it("parts の text を連結して返す", async () => {
    const fetchImpl = queuedFetch([
      jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: '{"a":' }, { text: "1}" }] }, finishReason: "STOP" }],
      }),
    ]);
    const res = await generateContentText({ ...base, fetchImpl });
    expect(res.text).toBe('{"a":1}');
    expect(res.attempts).toBe(1);
  });

  it("API キーはヘッダーで渡し URL に載せない", async () => {
    const fetchImpl = queuedFetch([textResponse("ok")]) as unknown as ReturnType<typeof vi.fn>;
    await generateContentText({ ...base, fetchImpl: fetchImpl as unknown as typeof fetch });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("SECRET-KEY-123");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("SECRET-KEY-123");
  });

  it("JSON 応答を要求し出力上限を明示する", async () => {
    const fetchImpl = queuedFetch([textResponse("ok")]) as unknown as ReturnType<typeof vi.fn>;
    await generateContentText({ ...base, fetchImpl: fetchImpl as unknown as typeof fetch });
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.maxOutputTokens).toBeGreaterThan(10_000);
  });
});

describe("generateContentText — 再試行", () => {
  it("429 は再試行して成功する", async () => {
    const fetchImpl = queuedFetch([
      jsonResponse(429, { error: "rate limited" }),
      textResponse("ok"),
    ]);
    const res = await generateContentText({ ...base, fetchImpl });
    expect(res.text).toBe("ok");
    expect(res.attempts).toBe(2);
  });

  it("5xx は再試行する", async () => {
    const fetchImpl = queuedFetch([jsonResponse(503, {}), textResponse("ok")]);
    await expect(generateContentText({ ...base, fetchImpl })).resolves.toMatchObject({
      attempts: 2,
    });
  });

  it("試行を尽くすと rate-limit で失敗する", async () => {
    const fetchImpl = queuedFetch([
      jsonResponse(429, {}),
      jsonResponse(429, {}),
      jsonResponse(429, {}),
    ]);
    await expect(generateContentText({ ...base, fetchImpl, maxAttempts: 3 })).rejects.toMatchObject({
      classification: "rate-limit",
      status: 429,
    });
  });
});

describe("generateContentText — 再試行しない失敗", () => {
  it("400 は即失敗する (入力エラーは繰り返しても同じ)", async () => {
    const fetchImpl = queuedFetch([jsonResponse(400, { error: "bad" })]);
    await expect(generateContentText({ ...base, fetchImpl })).rejects.toMatchObject({
      classification: "bad-request",
    });
  });

  it("401/403 は auth として即失敗する", async () => {
    const fetchImpl = queuedFetch([jsonResponse(403, {})]);
    await expect(generateContentText({ ...base, fetchImpl })).rejects.toMatchObject({
      classification: "auth",
    });
  });

  it("MAX_TOKENS は truncated として失敗する (途中で切れた JSON を採用しない)", async () => {
    const fetchImpl = queuedFetch([textResponse('{"insights":"…', "MAX_TOKENS")]);
    await expect(generateContentText({ ...base, fetchImpl })).rejects.toMatchObject({
      classification: "truncated",
    });
  });

  it("text が空なら no-text で失敗する", async () => {
    const fetchImpl = queuedFetch([jsonResponse(200, { candidates: [{ content: { parts: [] } }] })]);
    await expect(generateContentText({ ...base, fetchImpl })).rejects.toMatchObject({
      classification: "no-text",
    });
  });
});

describe("generateContentText — 秘匿", () => {
  it("エラーに API キーとレスポンス本文を含めない", async () => {
    const secretBody = { error: { message: "quota for project SECRET-KEY-123 exceeded" } };
    const fetchImpl = queuedFetch([jsonResponse(400, secretBody)]);
    const err = await generateContentText({ ...base, fetchImpl }).catch((e) => e);
    expect(err).toBeInstanceOf(GeminiTextError);
    const dump = `${err.message} ${err.stack ?? ""}`;
    expect(dump).not.toContain("SECRET-KEY-123");
    expect(dump).not.toContain("quota for project");
  });
});

describe("generateContentText — ネットワーク", () => {
  it("timeout (AbortError) は再試行する", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) {
        const e = new Error("aborted");
        e.name = "AbortError";
        throw e;
      }
      return textResponse("ok");
    }) as unknown as typeof fetch;
    const res = await generateContentText({ ...base, fetchImpl });
    expect(res.attempts).toBe(2);
  });
});
