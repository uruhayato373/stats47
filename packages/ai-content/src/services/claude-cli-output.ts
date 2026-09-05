/**
 * headless `claude -p --output-format json` の出力を読む純関数と、CLI で使う model alias の正典。
 *
 * ★2026-09-05 新設。ranking ai-content の量産を Agent tool 経路 (1 件 $16-18。subagent が
 *   CLAUDE.md+rules ≈150K トークンを毎ターン読み 46-144 ターン回る) から headless CLI 経路へ
 *   移すために、CLI の wrapper JSON を型付きで読めるようにした。
 *
 * CLI は結果を次の wrapper で返す (同じ形を読む既存実装: .claude/scripts/lib/summarize-claude-execution.mjs):
 *   { type: "result", subtype: "success" | "error_*", is_error, result, structured_output?,
 *     total_cost_usd, usage: { input_tokens, output_tokens, cache_creation_input_tokens,
 *     cache_read_input_tokens }, modelUsage: { <modelId>: {...} } }
 *
 * generate-parallel.ts から使う。I/O を持たないので vitest で直接テストする。
 */
import type { GeminiTokenUsage } from "./gemini-text-client";

/**
 * `--model` / `--critic` で受け付ける alias → 実 model ID。
 * ここに無い alias は拒否する (旧実装は `startsWith("claude")` で未知 alias を黙って haiku に倒していた)。
 */
export const CLAUDE_CLI_MODELS = {
  "claude-haiku": "claude-haiku-4-5-20251001",
  "claude-sonnet": "claude-sonnet-5",
  "claude-opus": "claude-opus-5",
} as const;

export type ClaudeCliAlias = keyof typeof CLAUDE_CLI_MODELS;

export function isClaudeCliAlias(value: string): value is ClaudeCliAlias {
  return Object.prototype.hasOwnProperty.call(CLAUDE_CLI_MODELS, value);
}

export interface ClaudeCliUsageBreakdown {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export interface ClaudeCliParsed {
  /** モデルの本文。structured_output があればそれを JSON 文字列化したもの、無ければ result のテキスト */
  text: string;
  /** Gemini 経路と同じ形に揃えた usage。inputTokens は cache を含む処理済み prompt トークン総量 (下記) */
  usage: GeminiTokenUsage;
  breakdown: ClaudeCliUsageBreakdown;
  /** CLI が返す API 換算費用。Pro/Max OAuth では実請求ではない */
  costUsd: number;
  /** modelUsage のうち最も多くトークンを使った model ID (CLI は補助 call に別モデルを混ぜることがある)。alias ではなくこれを記録する */
  modelId: string | null;
  /** modelUsage に現れた全 model ID (使用量の多い順) */
  modelIds: string[];
  /** CLI 内部の API ターン数。1 request なのに 2 以上なら構造化出力の tool 往復などで input が倍加している */
  numTurns: number;
}

/** CLI が `is_error` / 非 success subtype を返したとき。429・billing を JSON parse error と混同しないための型 */
export class ClaudeCliError extends Error {
  constructor(
    message: string,
    public readonly subtype: string,
  ) {
    super(message);
    this.name = "ClaudeCliError";
  }
}

const int = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;

export function parseClaudeCliOutput(stdout: string): ClaudeCliParsed {
  let wrapper: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(stdout);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    wrapper = parsed as Record<string, unknown>;
  } catch {
    throw new ClaudeCliError(
      `claude CLI の出力が result JSON ではありません: ${stdout.slice(0, 200)}`,
      "invalid-output",
    );
  }

  const rawSubtype = typeof wrapper.subtype === "string" ? wrapper.subtype : "unknown";
  if (wrapper.is_error === true || (wrapper.subtype !== undefined && rawSubtype !== "success")) {
    // 実測 (2026-09-05): 未ログインは `is_error: true` なのに `subtype: "success"` で返る。
    // is_error を独立に見て弾き、subtype が success のままなら "error" に読み替える (誤解を招く記録を残さない)。
    const subtype = wrapper.is_error === true && rawSubtype === "success" ? "error" : rawSubtype;
    const detail = typeof wrapper.result === "string" ? wrapper.result.slice(0, 300) : "";
    throw new ClaudeCliError(`claude CLI ${subtype}: ${detail}`, subtype);
  }

  const text =
    wrapper.structured_output !== undefined && wrapper.structured_output !== null
      ? JSON.stringify(wrapper.structured_output)
      : typeof wrapper.result === "string"
        ? wrapper.result
        : "";

  const rawUsage =
    wrapper.usage && typeof wrapper.usage === "object"
      ? (wrapper.usage as Record<string, unknown>)
      : {};
  const breakdown: ClaudeCliUsageBreakdown = {
    input: int(rawUsage.input_tokens),
    output: int(rawUsage.output_tokens),
    cacheWrite: int(rawUsage.cache_creation_input_tokens),
    cacheRead: int(rawUsage.cache_read_input_tokens),
  };
  // ★inputTokens は cache を含めて合算する。費用ではなく「prompt に何が乗ったか」を見る量で、
  //   rules が漏れ込むと (cache read として) ここが 7-8K → 150K 超になるので検知できる。
  //   費用換算は total_cost_usd をそのまま使い、cacheRead の割引を自前で掛けない。
  const inputTokens = breakdown.input + breakdown.cacheWrite + breakdown.cacheRead;
  const usage: GeminiTokenUsage = {
    inputTokens,
    outputTokens: breakdown.output,
    totalTokens: inputTokens + breakdown.output,
    thinkingTokens: 0,
  };

  const costUsd =
    typeof wrapper.total_cost_usd === "number" && Number.isFinite(wrapper.total_cost_usd)
      ? wrapper.total_cost_usd
      : 0;
  const modelUsage =
    wrapper.modelUsage && typeof wrapper.modelUsage === "object" && !Array.isArray(wrapper.modelUsage)
      ? (wrapper.modelUsage as Record<string, unknown>)
      : {};
  // 重み = そのモデルの数値フィールド合計 (input/output/cache/cost を区別せず「使った量」の代理)。
  // CLI が補助 call に別モデルを混ぜても、主 call のモデルが先頭に来る。
  const weight = (value: unknown): number =>
    value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>).reduce<number>(
          (acc, x) => acc + (typeof x === "number" && Number.isFinite(x) ? x : 0),
          0,
        )
      : 0;
  const modelIds = Object.keys(modelUsage).sort((a, b) => weight(modelUsage[b]) - weight(modelUsage[a]));
  const numTurns = int(wrapper.num_turns);

  return { text, usage, breakdown, costUsd, modelId: modelIds[0] ?? null, modelIds, numTurns };
}
