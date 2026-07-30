/**
 * Gemini テキスト生成クライアント (ai-content 量産用)。
 *
 * ## なぜ CLI ではなく API 直叩きか
 *
 * `generate-parallel.ts` の `--model gemini` は `gemini` CLI を子プロセス起動する。ローカルでは
 * 手軽だが CI では脆い (グローバル install・CLI の認証方式・バージョン変動に依存する)。
 * 日次 cron で無人運転する経路は **API キー 1 本で完結する HTTP** にしておく。
 *
 * 作法は `apps/web/scripts/lib/gemini-image-client.ts` に合わせる:
 *   - `x-goog-api-key` ヘッダーでキーを渡す (URL クエリに入れない)
 *   - タイムアウトあり。429 / 5xx / timeout / network のみ指数バックオフで限定再試行
 *   - 4xx 入力エラー (400/401/403) は再試行しない
 *   - **エラーは分類 + HTTP status だけを持つ。API キー・レスポンス本文は絶対に出さない**
 *
 * ai-content は 47 県分の解説を含むため出力が大きい (実測 ~13K 文字)。画像用より
 * タイムアウトを長く取り、`maxOutputTokens` を明示する。
 *
 * 正典: .claude/rules/ranking-content-standards.md §生成パイプライン
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** 既定モデル。テキストは flash 系で足りる (品質フロアは決定的ゲートが握る) */
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

/** 47 県解説を含む JSON を出し切れる長さ (実測 ~13K 文字 ≒ 8K トークン) */
const DEFAULT_MAX_OUTPUT_TOKENS = 32_768;

/** 出力が大きいので画像用 (30s) より長く取る */
const DEFAULT_TIMEOUT_MS = 180_000;

export type GeminiTextErrorClass =
  | "rate-limit"
  | "server"
  | "bad-request"
  | "auth"
  | "http-error"
  | "no-text"
  | "truncated"
  | "timeout"
  | "network"
  | "unknown";

/** 機密・レスポンス本文を含まないエラー (message は分類のみ)。 */
export class GeminiTextError extends Error {
  constructor(
    readonly classification: GeminiTextErrorClass,
    readonly status?: number,
  ) {
    super(status ? `${classification} (HTTP ${status})` : classification);
    this.name = "GeminiTextError";
  }
}

export interface GenerateTextOptions {
  prompt: string;
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  /** API 試行上限。既定 3、最大 5 (無料 tier の 429 を吸収するため画像より多め) */
  maxAttempts?: number;
  /** テスト用 fetch 差し替え */
  fetchImpl?: typeof fetch;
  /** テスト用 sleep 差し替え */
  sleepImpl?: (ms: number) => Promise<void>;
  /** 試行ごとの通知 (status/attempt/classification まで。本文は渡さない) */
  onAttempt?: (info: {
    attempt: number;
    status?: number;
    classification: GeminiTextErrorClass | "ok";
  }) => void;
}

export interface GenerateTextResult {
  text: string;
  attempts: number;
}

function classify(status: number): GeminiTextErrorClass {
  if (status === 429) return "rate-limit";
  if (status >= 500) return "server";
  if (status === 401 || status === 403) return "auth";
  if (status >= 400) return "bad-request";
  return "http-error";
}

function isRetriable(cls: GeminiTextErrorClass): boolean {
  // truncated は maxOutputTokens 到達なので再試行しても同じ → 対象外
  return cls === "rate-limit" || cls === "server" || cls === "timeout" || cls === "network";
}

function realSleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isAbort(e: unknown): boolean {
  return e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError");
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

/**
 * プロンプトを 1 回投げてテキストを返す。失敗時は GeminiTextError (分類のみ)。
 *
 * 呼び出し側 (generate-parallel) は失敗を「その key をスキップ」に落とし、次の key へ進む。
 * 出力の妥当性 (JSON か・ルールを守っているか) は決定的ゲートが別に判定する。
 */
export async function generateContentText(
  opts: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const model = opts.model ?? GEMINI_TEXT_MODEL;
  const maxAttempts = Math.min(Math.max(opts.maxAttempts ?? 3, 1), 5);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputTokens = opts.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleepImpl ?? realSleep;
  const url = `${API_BASE}/${model}:generateContent`;

  let lastError: GeminiTextError | undefined;

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
          generationConfig: {
            // プロンプトは JSON を出すよう指示済み。MIME を固定してコードフェンス混入も防ぐ
            responseMimeType: "application/json",
            maxOutputTokens,
            temperature: 0.7,
          },
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        // 本文はログ・エラーに残さない (安全に読み捨て)
        await res.text().catch(() => "");
        const cls = classify(res.status);
        opts.onAttempt?.({ attempt, status: res.status, classification: cls });
        const err = new GeminiTextError(cls, res.status);
        if (isRetriable(cls) && attempt < maxAttempts) {
          lastError = err;
          // 429 は無料 tier のレート制限なので長めに待つ
          const base = cls === "rate-limit" ? 15_000 : 2_000;
          await sleep(base * 2 ** (attempt - 1));
          continue;
        }
        throw err;
      }

      const json = (await res.json()) as GeminiResponse;
      const candidate = json.candidates?.[0];
      const text = candidate?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim();

      if (candidate?.finishReason === "MAX_TOKENS") {
        opts.onAttempt?.({ attempt, status: 200, classification: "truncated" });
        throw new GeminiTextError("truncated", 200);
      }
      if (!text) {
        opts.onAttempt?.({ attempt, status: 200, classification: "no-text" });
        throw new GeminiTextError("no-text", 200);
      }

      opts.onAttempt?.({ attempt, status: 200, classification: "ok" });
      return { text, attempts: attempt };
    } catch (e) {
      if (e instanceof GeminiTextError) throw e;
      const cls: GeminiTextErrorClass = isAbort(e) ? "timeout" : "network";
      opts.onAttempt?.({ attempt, classification: cls });
      const err = new GeminiTextError(cls);
      if (attempt < maxAttempts) {
        lastError = err;
        await sleep(2_000 * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new GeminiTextError("unknown");
}
