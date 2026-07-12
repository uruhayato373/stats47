import { describe, expect, it, vi } from "vitest";

import {
  GeminiImageError,
  generateBackgroundImage,
} from "../gemini-image-client";

const noSleep = () => Promise.resolve();
const IMG_B64 = "aGVsbG8="; // base64 of "hello" (client は base64 decode するだけ)

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

function imageResponse(b64 = IMG_B64): Response {
  return jsonResponse(200, {
    candidates: [{ content: { parts: [{ inlineData: { data: b64, mimeType: "image/png" } }] } }],
  });
}

/** キュー順に Response を返す fetch mock。 */
function queuedFetch(responses: (Response | (() => Promise<Response>))[]) {
  const fn = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("fetch called more times than queued");
    return typeof next === "function" ? next() : next;
  });
  return fn as unknown as typeof fetch;
}

const base = { prompt: "p", apiKey: "SECRET-KEY-123", sleepImpl: noSleep };

describe("generateBackgroundImage — 成功", () => {
  it("inlineData から画像バッファを取り出す", async () => {
    const fetchImpl = queuedFetch([imageResponse()]);
    const r = await generateBackgroundImage({ ...base, fetchImpl });
    expect(r.buffer.toString("utf-8")).toBe("hello");
    expect(r.mimeType).toBe("image/png");
    expect(r.attempts).toBe(1);
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });

  it("x-goog-api-key ヘッダーで渡し URL にキーを含めない", async () => {
    const fetchImpl = queuedFetch([imageResponse()]);
    await generateBackgroundImage({ ...base, fetchImpl });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).not.toContain("SECRET-KEY-123");
    expect((init as RequestInit).headers).toMatchObject({ "x-goog-api-key": "SECRET-KEY-123" });
  });
});

describe("generateBackgroundImage — 再試行ポリシー", () => {
  it("429 は再試行し、次で成功する", async () => {
    const fetchImpl = queuedFetch([jsonResponse(429, { error: "rate" }), imageResponse()]);
    const r = await generateBackgroundImage({ ...base, fetchImpl, maxAttempts: 2 });
    expect(r.attempts).toBe(2);
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });

  it("5xx は再試行する", async () => {
    const fetchImpl = queuedFetch([jsonResponse(503, {}), imageResponse()]);
    const r = await generateBackgroundImage({ ...base, fetchImpl, maxAttempts: 2 });
    expect(r.attempts).toBe(2);
  });

  it("400 は再試行しない (1 回で throw)", async () => {
    const fetchImpl = queuedFetch([jsonResponse(400, { error: "bad" })]);
    await expect(
      generateBackgroundImage({ ...base, fetchImpl, maxAttempts: 3 }),
    ).rejects.toMatchObject({ classification: "bad-request", status: 400 });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });

  it("401 は再試行しない", async () => {
    const fetchImpl = queuedFetch([jsonResponse(401, {})]);
    await expect(
      generateBackgroundImage({ ...base, fetchImpl, maxAttempts: 3 }),
    ).rejects.toMatchObject({ classification: "auth" });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });

  it("maxAttempts を超えて再試行しない (429 が続けば最終的に throw)", async () => {
    const fetchImpl = queuedFetch([jsonResponse(429, {}), jsonResponse(429, {})]);
    await expect(
      generateBackgroundImage({ ...base, fetchImpl, maxAttempts: 2 }),
    ).rejects.toBeInstanceOf(GeminiImageError);
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });

  it("200 でも画像が無ければ no-image で再試行しない", async () => {
    const fetchImpl = queuedFetch([jsonResponse(200, { candidates: [] })]);
    await expect(
      generateBackgroundImage({ ...base, fetchImpl, maxAttempts: 3 }),
    ).rejects.toMatchObject({ classification: "no-image" });
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });
});

describe("generateBackgroundImage — 機密の非露出", () => {
  it("エラー message に API キーやレスポンス本文を含めない", async () => {
    const fetchImpl = queuedFetch([jsonResponse(400, { secretLeak: "SECRET-KEY-123 leaked body" })]);
    const err = await generateBackgroundImage({ ...base, fetchImpl }).catch((e) => e);
    expect(err).toBeInstanceOf(GeminiImageError);
    expect(String(err.message)).not.toContain("SECRET-KEY-123");
    expect(String(err.message)).not.toContain("leaked body");
    expect(String(err.message)).toContain("bad-request");
  });
});
