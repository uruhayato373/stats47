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

/**
 * 既定モデル。テキストは flash 系で足りる (品質フロアは決定的ゲートが握る)。
 *
 * ★2026-07-31 に `gemini-2.5-flash` から変更。旧モデルは **ListModels に載ったまま
 * generateContent が 404** になっており (提供終了)、日次 cron が全件失敗していた。
 *
 * 選定の考え方:
 *   - **pinned なモデル名にする** (`gemini-flash-latest` のような浮動 alias にしない)。
 *     浮動 alias は 404 を避けられる代わりに、品質もコストも黙って変わる。提供終了は
 *     preflight が実生成で必ず検出するので、pinned でも気づけないまま止まることはない
 *   - lite ではなく flash (47 県の解説を書かせるため)。preview / experimental は使わない
 */
export const GEMINI_TEXT_MODEL = "gemini-3.5-flash";

/**
 * 実際に使うモデル名。`GEMINI_TEXT_MODEL` env で上書きできる。
 *
 * ★なぜ上書き口が要るか (2026-07-30): モデルは提供終了する。既定値をコードに焼き切ると、
 * 提供終了のたびにコード変更 → デプロイまで日次 cron が全件 404 で止まる。env で差し替えられれば
 * workflow の 1 行変更で復旧できる。正しいモデル名は preflight-gemini.ts が ListModels で実測する。
 */
export function resolveTextModel(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.GEMINI_TEXT_MODEL?.trim();
  return override ? override : GEMINI_TEXT_MODEL;
}

/** 47 県解説を含む JSON を出し切れる長さ (実測 ~13K 文字 ≒ 8K トークン) */
const DEFAULT_MAX_OUTPUT_TOKENS = 32_768;

/** 出力が大きいので画像用 (30s) より長く取る */
const DEFAULT_TIMEOUT_MS = 180_000;

export type GeminiTextErrorClass =
  | "rate-limit"
  | "billing"
  | "server"
  | "bad-request"
  | "auth"
  | "http-error"
  | "no-text"
  | "truncated"
  | "timeout"
  | "network"
  | "unknown";

/**
 * 429 の本文から取り出す**構造化されたクォータ情報だけ**。
 *
 * Google は 429 で `QuotaFailure` (violations[].quotaMetric / quotaValue) と
 * `RetryInfo` (retryDelay) を返す。どれも機密ではなく、これが無いと
 * 「分あたりで詰まったのか、日あたりを使い切ったのか」が判別できない。
 */
/**
 * 429 本文の先頭スニペット (診断用・2026-07-31 追加)。
 *
 * `extractQuotaDetails` が undefined を返した実測があり (run 30606687068)、**なぜ抽出できな
 * かったか**が分からなかった。Google のエラー本文は `error.message` / `error.status` /
 * `error.details` で、**API キーは含まれない** (キーはヘッダで送るだけで echo されない)。
 * それでも保険として、万一キー文字列が現れたら伏せる。
 *
 * 出すのは 429 のときだけ・先頭 500 文字だけ。成功時や他のエラーでは本文に触れない。
 */
const DEBUG_SNIPPET_MAX = 500;

/** 本文にキーが現れた場合だけ伏せる (通常は現れない) */
export function redactApiKey(text: string, apiKey: string): string {
  if (!apiKey) return text;
  return text.split(apiKey).join("***");
}

/**
 * 429 のうち**課金枯渇**を見分ける (2026-07-31 実測)。
 *
 * 同じ HTTP 429 / RESOURCE_EXHAUSTED に、意味も対処も正反対の 2 つが入っている:
 *
 *   - レート制限 (RPM/RPD)  … 時間をおけば戻る。再試行に意味がある
 *   - **前払いクレジット枯渇** … 待っても戻らない。人がクレジットを補充するまで全モデルで失敗する
 *
 * 実測した本文には `error.details` が無く (だから `extractQuotaDetails` は undefined を返した。
 * これはパーサの不具合ではない)、判別材料は `error.message` の自由文しかない:
 *
 *   "Your prepayment credits are depleted. Please go to AI Studio ... to manage your project and billing."
 *
 * 判定は**狭く**取る。`billing` の語だけで見ると、レート制限の本文にも
 * 「billing を有効にすると上限が上がる」という案内が入るため誤爆する。
 * 迷ったら rate-limit のまま扱う (再試行して次の cron で拾い直せる方に倒す)。
 */
const BILLING_EXHAUSTED_MARKERS = [
  "credits are depleted",
  "credit balance is too low",
  "insufficient credits",
];

export function isBillingExhausted(raw: string): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase();
  return BILLING_EXHAUSTED_MARKERS.some((m) => lower.includes(m));
}

export interface GeminiQuotaDetails {
  /** 例: generativelanguage.googleapis.com/generate_content_free_tier_requests */
  metric?: string;
  /** その metric の上限 */
  limit?: string;
  /** 例: "38s"。日次枯渇だと長い値か未設定になる */
  retryAfter?: string;
}

/** 本文から上記 3 項目だけを拾う。自由文・キー・その他のフィールドは一切触らない。 */
export function extractQuotaDetails(raw: string): GeminiQuotaDetails | undefined {
  if (!raw) return undefined;
  try {
    const json = JSON.parse(raw) as { error?: { details?: Array<Record<string, unknown>> } };
    const out: GeminiQuotaDetails = {};
    for (const d of json.error?.details ?? []) {
      const violations = d.violations as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(violations) && violations.length > 0) {
        const v = violations[0];
        if (typeof v.quotaMetric === "string") out.metric = v.quotaMetric;
        if (typeof v.quotaValue === "string") out.limit = v.quotaValue;
      }
      if (typeof d.retryDelay === "string") out.retryAfter = d.retryDelay;
    }
    return out.metric || out.limit || out.retryAfter ? out : undefined;
  } catch {
    return undefined; // 本文が JSON でなくても落とさない
  }
}

/** 機密・レスポンス本文を含まないエラー (message は分類のみ)。 */
export class GeminiTextError extends Error {
  constructor(
    readonly classification: GeminiTextErrorClass,
    readonly status?: number,
    /** 429 のときだけ入る構造化クォータ情報 (機密ではない) */
    readonly quota?: GeminiQuotaDetails,
    /** 429 のときだけ入る本文スニペット (先頭 500 文字・キーは伏せ済) */
    readonly debugSnippet?: string,
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
    /** 429 のときだけ入る */
    quota?: GeminiQuotaDetails;
    /** 429 のときだけ入る本文スニペット (先頭 500 文字・キーは伏せ済) */
    debugSnippet?: string;
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
  // billing (クレジット枯渇) も同じ。人が補充するまで何度投げても同じ 429 が返るので、
  // 15s → 30s → 60s と待つのは純粋な浪費 (実測でこの待ちが毎 run 発生していた)
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
  const model = opts.model ?? resolveTextModel();
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
        // 本文はログ・エラーに残さない。ただし 429 のときだけ**構造化されたクォータ項目**を
        // 抜き出す (2026-07-31 追加)。本文を丸ごと捨てていたため「RPM なのか RPD なのか」
        // 「上限がいくつなのか」が分からず、日次の件数 (ai-content 40 / blog 2) を実測に
        // 基づいて決められなかった。抜くのは quotaMetric / quotaValue / retryDelay だけで、
        // 自由文やキーは触らない。
        const raw = await res.text().catch(() => "");
        const is429 = res.status === 429;
        // 429 は「待てば戻る」と「人が課金を直すまで戻らない」の 2 種が同居する。混ぜない
        const cls = is429 && isBillingExhausted(raw) ? "billing" : classify(res.status);
        const quota = is429 ? extractQuotaDetails(raw) : undefined;
        // 抽出できなかった理由を 1 回で突き止めるため、429 のときだけ本文の先頭を診断に載せる
        const debugSnippet = is429
          ? redactApiKey(raw.slice(0, DEBUG_SNIPPET_MAX), opts.apiKey)
          : undefined;
        opts.onAttempt?.({ attempt, status: res.status, classification: cls, quota, debugSnippet });
        const err = new GeminiTextError(cls, res.status, quota, debugSnippet);
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

// ============================================================
// ListModels (preflight 用)
// ============================================================

interface ListModelsResponse {
  models?: {
    name?: string;
    supportedGenerationMethods?: string[];
  }[];
  nextPageToken?: string;
}

export interface ListModelsOptions {
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** 取得ページ数の上限 (暴走防止)。既定 5 */
  maxPages?: number;
}

/**
 * `generateContent` を提供するモデル名を実測して返す (`models/` 接頭辞は落とす)。
 *
 * 用途は preflight だけ。生成本体は叩かない (課金ゼロ)。失敗は GeminiTextError (分類のみ) で、
 * ここでも **API キー・レスポンス本文は絶対に出さない**。
 */
export async function listGenerateContentModels(
  opts: ListModelsOptions,
): Promise<string[]> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const maxPages = Math.min(Math.max(opts.maxPages ?? 5, 1), 20);

  const names: string[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = pageToken
      ? `${API_BASE}?pageSize=200&pageToken=${encodeURIComponent(pageToken)}`
      : `${API_BASE}?pageSize=200`;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: "GET",
        headers: { "x-goog-api-key": opts.apiKey },
        signal: ac.signal,
      });
      if (!res.ok) {
        await res.text().catch(() => "");
        throw new GeminiTextError(classify(res.status), res.status);
      }
      const json = (await res.json()) as ListModelsResponse;
      for (const m of json.models ?? []) {
        if (!m.name) continue;
        if (!(m.supportedGenerationMethods ?? []).includes("generateContent")) continue;
        names.push(m.name.replace(/^models\//, ""));
      }
      pageToken = json.nextPageToken;
      if (!pageToken) break;
    } catch (e) {
      if (e instanceof GeminiTextError) throw e;
      throw new GeminiTextError(isAbort(e) ? "timeout" : "network");
    } finally {
      clearTimeout(timer);
    }
  }

  return names;
}
