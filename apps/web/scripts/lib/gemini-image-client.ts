/**
 * Gemini 画像生成のサーバー専用クライアント。
 *
 * - x-goog-api-key ヘッダーでキーを渡す (URL クエリに入れない)。
 * - 30 秒タイムアウト。429 / 5xx / timeout / network のみ指数バックオフで限定再試行。
 *   4xx 入力エラー (400/401/403 等) は再試行しない。
 * - エラーは「短い分類 + HTTP status」だけを持つ。API キー・レスポンス本文全文は絶対に出さない。
 *
 * 正典: docs/02_実装計画/23_ブログOGP生成AIパイプライン仕様.md §8
 * 参考: apps/web/scripts/generate-category-images.ts (呼び出し作法。エラー安全性を本クライアントで改善)
 */

import { OGP_MODEL } from "../data/blog-ogp-visual-catalog";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 30_000;

export type GeminiErrorClass =
  | "rate-limit"
  | "server"
  | "bad-request"
  | "auth"
  | "http-error"
  | "no-image"
  | "timeout"
  | "network"
  | "unknown";

/** 機密・レスポンス本文を含まないエラー (message は分類のみ)。 */
export class GeminiImageError extends Error {
  constructor(
    readonly classification: GeminiErrorClass,
    readonly status?: number,
  ) {
    super(status ? `${classification} (HTTP ${status})` : classification);
    this.name = "GeminiImageError";
  }
}

export interface GenerateImageOptions {
  prompt: string;
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  /** 1 記事の API 試行上限。既定 2、最大 3。 */
  maxAttempts?: number;
  /** テスト用 fetch 差し替え。 */
  fetchImpl?: typeof fetch;
  /** テスト用 sleep 差し替え (既定は実 sleep)。 */
  sleepImpl?: (ms: number) => Promise<void>;
  /** 試行ごとの通知 (ログは status/attempt/classification まで。本文は渡さない)。 */
  onAttempt?: (info: { attempt: number; status?: number; classification: GeminiErrorClass | "ok" }) => void;
}

export interface GenerateImageResult {
  buffer: Buffer;
  mimeType: string;
  attempts: number;
}

function classify(status: number): GeminiErrorClass {
  if (status === 429) return "rate-limit";
  if (status >= 500) return "server";
  if (status === 401 || status === 403) return "auth";
  if (status >= 400) return "bad-request";
  return "http-error";
}

function isRetriable(cls: GeminiErrorClass): boolean {
  return cls === "rate-limit" || cls === "server" || cls === "timeout" || cls === "network";
}

function realSleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isAbort(e: unknown): boolean {
  return e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError");
}

/**
 * 文字なし背景を 1 枚生成し画像バイト列を返す。失敗時は GeminiImageError (分類のみ)。
 * 呼び出し側は失敗をフォールバック (ブランド背景) に落とす。
 */
export async function generateBackgroundImage(
  opts: GenerateImageOptions,
): Promise<GenerateImageResult> {
  const model = opts.model ?? OGP_MODEL;
  const maxAttempts = Math.min(Math.max(opts.maxAttempts ?? 2, 1), 3);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleepImpl ?? realSleep;
  const url = `${API_BASE}/${model}:generateContent`;

  let lastError: GeminiImageError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": opts.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: opts.prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        // 本文はログ・エラーに残さない (安全に読み捨て)。
        await res.text().catch(() => "");
        const cls = classify(res.status);
        opts.onAttempt?.({ attempt, status: res.status, classification: cls });
        const err = new GeminiImageError(cls, res.status);
        if (isRetriable(cls) && attempt < maxAttempts) {
          lastError = err;
          await sleep(1000 * 2 ** (attempt - 1));
          continue;
        }
        throw err;
      }

      const json = (await res.json()) as {
        candidates?: {
          content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
        }[];
      };
      const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      const b64 = part?.inlineData?.data;
      if (!b64) {
        opts.onAttempt?.({ attempt, status: 200, classification: "no-image" });
        throw new GeminiImageError("no-image", 200); // content 失敗は再試行しない
      }

      opts.onAttempt?.({ attempt, status: 200, classification: "ok" });
      return {
        buffer: Buffer.from(b64, "base64"),
        mimeType: part?.inlineData?.mimeType ?? "image/png",
        attempts: attempt,
      };
    } catch (e) {
      if (e instanceof GeminiImageError) throw e;
      const cls: GeminiErrorClass = isAbort(e) ? "timeout" : "network";
      opts.onAttempt?.({ attempt, classification: cls });
      const err = new GeminiImageError(cls);
      if (attempt < maxAttempts) {
        lastError = err;
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new GeminiImageError("unknown");
}
