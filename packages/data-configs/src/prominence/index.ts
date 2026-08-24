/**
 * ランキングの掲載価値まわりの純粋ロジック。
 *
 * **このディレクトリは METRICS_REGISTRY を import しない。**
 * 共通 Header など広く読まれる場所から参照されるため、registry を引き込むと
 * ほぼ全 route の bundle に metric module が入る (実測 18,364 参照)。
 * 入力は呼び出し側が渡す。
 *
 * 正典: `.claude/rules/` ではなく、当面この README 代わりのコメントと
 * `~/.claude/plans/ok-lucky-valley.md`。
 */
export {
  adjectiveFromTitle,
  adjectiveFromUnit,
  deriveRankingReaderLabel,
  deriveRankingHook,
  isCrossDimensionMismatch,
  resolveHookAdjective,
  type HookAdjective,
  type RankingHookInput,
} from "./derive-ranking-hook";

export {
  compareByProminence,
  computeClarity,
  computeDemand,
  computeDepth,
  computeFreshness,
  computeProminenceScores,
  selectHomeFeatured,
  selectRepresentatives,
  PROMINENCE_WEIGHTS,
  type ProminenceBreakdown,
  type ProminenceInput,
  type ProminenceResult,
} from "./compute-prominence";

export {
  RANKING_HOOK_OVERRIDES,
  RANKING_READER_LABEL_OVERRIDES,
} from "./ranking-hook-overrides";

export {
  auditDerivedHooks,
  resolveRankingReaderLabel,
  resolveRankingHook,
  HOOK_MAX_LENGTH,
  HOOK_MIN_LENGTH,
  type HookAuditFinding,
  type HookAuditReason,
  type RankingHookResolveInput,
} from "./resolve-ranking-hook";

export {
  normalizeTitleForDedup,
  normalizeTitleForHook,
  stripTrailingParenthetical,
} from "./normalize-title";
