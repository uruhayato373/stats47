/**
 * model-preflight / listGenerateContentModels / resolveTextModel のテスト。
 *
 * 2026-07-30 の障害 (日次 cron が全件 HTTP 404) の再発防止。ゲート自体が働くこと
 * — 実在するモデルは通し、提供終了したモデルは落とす — を両方向で固定する。
 *
 * 実行: npm run test:ai-content --workspace apps/web
 */

import { describe, expect, it, vi } from "vitest";

import {
  GeminiTextError,
  listGenerateContentModels,
  resolveTextModel,
  GEMINI_TEXT_MODEL,
} from "../gemini-text-client";
import { evaluateModelAvailability, runModelPreflight } from "../model-preflight";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

describe("resolveTextModel", () => {
  it("env が無ければ既定モデル", () => {
    expect(resolveTextModel({} as NodeJS.ProcessEnv)).toBe(GEMINI_TEXT_MODEL);
  });

  it("GEMINI_TEXT_MODEL で上書きできる (提供終了時の復旧口)", () => {
    expect(
      resolveTextModel({ GEMINI_TEXT_MODEL: "gemini-9-flash" } as NodeJS.ProcessEnv),
    ).toBe("gemini-9-flash");
  });

  it("空文字・空白は上書きとみなさない", () => {
    expect(resolveTextModel({ GEMINI_TEXT_MODEL: "  " } as NodeJS.ProcessEnv)).toBe(
      GEMINI_TEXT_MODEL,
    );
  });
});

describe("evaluateModelAvailability", () => {
  const available = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-image",
    "text-embedding-004",
  ];

  it("実在するモデルは通す (ゲートが素通りしないことの対照)", () => {
    const v = evaluateModelAvailability("gemini-2.5-flash", available);
    expect(v.ok).toBe(true);
    expect(v.suggestions).toEqual([]);
  });

  it("提供終了したモデルは落とし、候補を返す", () => {
    const v = evaluateModelAvailability("gemini-1.5-flash", available);
    expect(v.ok).toBe(false);
    expect(v.suggestions.length).toBeGreaterThan(0);
  });

  it("候補はテキスト生成向けのみ (embedding / image を混ぜない)", () => {
    const v = evaluateModelAvailability("retired-model", available);
    expect(v.suggestions).not.toContain("text-embedding-004");
    expect(v.suggestions).not.toContain("gemini-2.5-flash-image");
  });

  it("候補は安定版 flash を先頭に置く (preview より先)", () => {
    const v = evaluateModelAvailability("retired-model", available);
    expect(v.suggestions[0]).toBe("gemini-2.5-flash");
    expect(v.suggestions.indexOf("gemini-2.5-flash")).toBeLessThan(
      v.suggestions.indexOf("gemini-2.5-flash-preview-09-2025"),
    );
  });

  it("候補が 1 つも無ければ空配列 (捏造しない)", () => {
    const v = evaluateModelAvailability("gemini-2.5-flash", ["text-embedding-004"]);
    expect(v.ok).toBe(false);
    expect(v.suggestions).toEqual([]);
  });
});

describe("runModelPreflight — 合否は実生成だけで決める", () => {
  it("実生成が通れば ok (ListModels は呼ばない = API 呼び出し 1 回)", async () => {
    const listModels = vi.fn(async () => ["gemini-2.5-flash"]);
    const r = await runModelPreflight({
      configured: "gemini-2.5-flash",
      smoke: async () => ({ ok: true }),
      listModels,
    });
    expect(r.ok).toBe(true);
    expect(listModels).not.toHaveBeenCalled();
  });

  it("★一覧に載っていても実生成が 404 なら落とす (2026-07-31 に実測した罠)", async () => {
    const r = await runModelPreflight({
      configured: "gemini-2.5-flash",
      smoke: async () => ({ ok: false, classification: "bad-request", status: 404 }),
      listModels: async () => ["gemini-2.5-flash", "gemini-3.5-flash"],
    });
    expect(r.ok).toBe(false);
    expect(r.messages.join("\n")).toContain("ListModels には載っている");
    expect(r.suggestions).toContain("gemini-3.5-flash");
    // 設定中のモデル自身を「代替候補」として出さない
    expect(r.suggestions).not.toContain("gemini-2.5-flash");
  });

  it("一覧にも無ければ提供終了として報告する", async () => {
    const r = await runModelPreflight({
      configured: "gemini-1.5-flash",
      smoke: async () => ({ ok: false, classification: "bad-request", status: 404 }),
      listModels: async () => ["gemini-3.5-flash"],
    });
    expect(r.ok).toBe(false);
    expect(r.messages.join("\n")).toContain("提供終了");
  });

  it("ListModels も落ちたら候補なしで報告 (捏造しない)", async () => {
    const r = await runModelPreflight({
      configured: "gemini-2.5-flash",
      smoke: async () => ({ ok: false, classification: "auth", status: 403 }),
      listModels: async () => {
        throw new Error("boom");
      },
    });
    expect(r.ok).toBe(false);
    expect(r.suggestions).toEqual([]);
  });

  it("失敗報告に HTTP status を残す (切り分けの材料)", async () => {
    const r = await runModelPreflight({
      configured: "m",
      smoke: async () => ({ ok: false, classification: "bad-request", status: 404 }),
      listModels: async () => [],
    });
    expect(r.messages[0]).toContain("404");
  });
});

describe("listGenerateContentModels", () => {
  it("generateContent を持つモデルだけ返し models/ 接頭辞を落とす", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        models: [
          { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
          { name: "models/text-embedding-004", supportedGenerationMethods: ["embedContent"] },
        ],
      }),
    ) as unknown as typeof fetch;

    const models = await listGenerateContentModels({ apiKey: "SECRET-KEY-123", fetchImpl });
    expect(models).toEqual(["gemini-2.5-flash"]);
  });

  it("API キーはヘッダーで渡し URL に載せない", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { models: [] }));
    await listGenerateContentModels({
      apiKey: "SECRET-KEY-123",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("SECRET-KEY-123");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("SECRET-KEY-123");
  });

  it("nextPageToken を辿って全ページ集める", async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call++;
      return call === 1
        ? jsonResponse(200, {
            models: [{ name: "models/a", supportedGenerationMethods: ["generateContent"] }],
            nextPageToken: "tok",
          })
        : jsonResponse(200, {
            models: [{ name: "models/b", supportedGenerationMethods: ["generateContent"] }],
          });
    }) as unknown as typeof fetch;

    const models = await listGenerateContentModels({ apiKey: "k", fetchImpl });
    expect(models).toEqual(["a", "b"]);
  });

  it("HTTP エラーは分類のみを持つ GeminiTextError (本文・キーを漏らさない)", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(403, { error: { message: "key SECRET-KEY-123 is invalid" } }),
    ) as unknown as typeof fetch;

    const err = await listGenerateContentModels({ apiKey: "SECRET-KEY-123", fetchImpl }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(GeminiTextError);
    expect((err as GeminiTextError).classification).toBe("auth");
    expect((err as GeminiTextError).message).not.toContain("SECRET-KEY-123");
    expect((err as GeminiTextError).message).not.toContain("invalid");
  });
});

// ============================================================================
// 429 は「提供終了」と混同しない (2026-07-31 実測)
//
// blog-generate の初回実走が 429 で止まったとき、preflight が 404 用の文言
// (「一覧に載っていても使えないことがある」+ 代替候補) を出していた。
// 同じキー・同じモデルで数時間前は成功しており、提供終了ではなかった。
// メッセージを混ぜると「モデルを変えろ」と読めてしまい、品質もコストも変わる変更を促す。
// ============================================================================
describe("runModelPreflight: rate-limit の扱い", () => {
  it("★429 は提供終了と切り分け、モデル候補を出さない", async () => {
    const report = await runModelPreflight({
      configured: "gemini-3.5-flash",
      smoke: async () => ({ ok: false, classification: "rate-limit", status: 429 }),
      listModels: async () => ["gemini-3.5-flash", "gemini-2.5-flash-lite"],
    });
    expect(report.ok).toBe(false);
    expect(report.messages.join("\n")).toMatch(/クォータ\/レート制限であって提供終了ではない/);
    expect(report.messages.join("\n")).toMatch(/時間をおいて再実行/);
    // 候補を出すと「モデルを変えろ」と読める。429 では出さない。
    expect(report.suggestions).toEqual([]);
  });

  it("429 以外 (提供終了) では従来どおり候補を出す", async () => {
    const report = await runModelPreflight({
      configured: "gemini-3.5-flash",
      smoke: async () => ({ ok: false, classification: "http-error", status: 404 }),
      listModels: async () => ["gemini-2.5-flash-lite", "gemini-flash-latest"],
    });
    expect(report.ok).toBe(false);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });
});
