/**
 * gemini-text-client のテスト。
 *
 * 作法は apps/web/scripts/lib/__tests__/gemini-image-client.test.ts に合わせる
 * (fetch / sleep を差し替えて HTTP 分類・再試行・秘匿を検証する)。
 *
 * 実行: npm run test:ai-content --workspace apps/web
 */

import { describe, expect, it, vi } from "vitest";

import { GeminiTextError, generateContentText,
  extractQuotaDetails,
  isBillingExhausted,
  redactApiKey,
} from "../gemini-text-client";

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

// ============================================================================
// 429 のクォータ内訳 (2026-07-31)
//
// 本文を丸ごと読み捨てていたため「分あたりで詰まったのか日あたりを使い切ったのか」が
// 分からず、日次件数 (ai-content 40 / blog 2) を実測で決められなかった。
// 抜くのは quotaMetric / quotaValue / retryDelay の 3 項目だけ (機密ではない)。
// ============================================================================
describe("extractQuotaDetails", () => {
  it("★QuotaFailure と RetryInfo から 3 項目だけ取り出す", () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        message: "Resource has been exhausted",
        details: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [
              {
                quotaMetric: "generativelanguage.googleapis.com/generate_content_free_tier_requests",
                quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                quotaValue: "25",
              },
            ],
          },
          { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "38s" },
        ],
      },
    });
    expect(extractQuotaDetails(body)).toEqual({
      metric: "generativelanguage.googleapis.com/generate_content_free_tier_requests",
      limit: "25",
      retryAfter: "38s",
    });
  });

  it("JSON でない本文でも落ちない", () => {
    expect(extractQuotaDetails("<html>502</html>")).toBeUndefined();
  });

  it("空文字・クォータ項目なしは undefined", () => {
    expect(extractQuotaDetails("")).toBeUndefined();
    expect(extractQuotaDetails(JSON.stringify({ error: { details: [] } }))).toBeUndefined();
  });
});

describe("redactApiKey", () => {
  it("本文にキーが現れたら伏せる", () => {
    expect(redactApiKey("err key=AIzaSECRET end", "AIzaSECRET")).toBe("err key=*** end");
  });
  it("キーが無ければそのまま", () => {
    expect(redactApiKey("quota exceeded", "AIzaSECRET")).toBe("quota exceeded");
  });
  it("空のキーでも落ちない", () => {
    expect(redactApiKey("body", "")).toBe("body");
  });
});

// ============================================================================
// 429 の 2 種を見分ける (2026-07-31 実測)
//
// 同じ HTTP 429 / RESOURCE_EXHAUSTED に、対処が正反対の 2 つが同居している。
// レート制限は待てば戻るが、クレジット枯渇は人が補充するまで戻らない。
// ここを混ぜると (a) 無意味な再試行で毎 run 45s を捨て (b) preflight が
// 「時間をおけ」「lite に逃げろ」という**効かない**回避策を出す。
//
// 判定は狭く取る。広げるとレート制限の本文にある billing の案内文で誤爆する。
// ============================================================================
describe("isBillingExhausted", () => {
  // CI run 30607349739 で実際に返ってきた本文
  const REAL_BILLING_BODY = JSON.stringify({
    error: {
      code: 429,
      message:
        "Your prepayment credits are depleted. Please go to AI Studio at " +
        "https://ai.studio/projects to manage your project and billing. " +
        "Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay. ",
      status: "RESOURCE_EXHAUSTED",
    },
  });

  it("★実測したクレジット枯渇の本文を検出する", () => {
    expect(isBillingExhausted(REAL_BILLING_BODY)).toBe(true);
  });

  it("★レート制限の本文では発火しない (billing の語を含んでいても)", () => {
    const rateLimitBody = JSON.stringify({
      error: {
        code: 429,
        message:
          "You exceeded your current quota. Enable billing to raise your limits. " +
          "Learn more at https://ai.google.dev/gemini-api/docs/rate-limits.",
        status: "RESOURCE_EXHAUSTED",
        details: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [{ quotaMetric: "generate_content_free_tier_requests", quotaValue: "25" }],
          },
        ],
      },
    });
    expect(isBillingExhausted(rateLimitBody)).toBe(false);
  });

  it("空文字・無関係な本文では発火しない", () => {
    expect(isBillingExhausted("")).toBe(false);
    expect(isBillingExhausted("<html>502 Bad Gateway</html>")).toBe(false);
  });

  it("実測本文に構造化 quota は無い (パーサの不具合ではない)", () => {
    expect(extractQuotaDetails(REAL_BILLING_BODY)).toBeUndefined();
  });
});

describe("クレジット枯渇は再試行しない", () => {
  const billingBody = {
    error: { code: 429, message: "Your prepayment credits are depleted.", status: "RESOURCE_EXHAUSTED" },
  };

  it("★billing に分類し、待たずに 1 回で諦める", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429, billingBody));
    const sleep = vi.fn(() => Promise.resolve());

    await expect(
      generateContentText({
        prompt: "p",
        apiKey: "k",
        maxAttempts: 3,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleepImpl: sleep,
      }),
    ).rejects.toMatchObject({ classification: "billing", status: 429 });

    expect(fetchImpl).toHaveBeenCalledTimes(1); // 再試行しない
    expect(sleep).not.toHaveBeenCalled(); // 待たない
  });

  it("★レート制限のほうは従来どおり再試行する (振る舞いを変えていない)", async () => {
    const rateBody = { error: { code: 429, message: "You exceeded your current quota." } };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429, rateBody));

    await expect(
      generateContentText({
        prompt: "p",
        apiKey: "k",
        maxAttempts: 3,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleepImpl: noSleep,
      }),
    ).rejects.toMatchObject({ classification: "rate-limit" });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
