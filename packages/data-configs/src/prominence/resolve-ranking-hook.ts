/**
 * 導出 + override の適用と、導出品質の機械監査。
 *
 * 監査がなぜ要るか: 生成物と SSOT のズレは `--check` が守るが、
 * 「導出された hook が日本語として読めるか」は誰も見ていない。metric を足したときに
 * 不自然な文が生成されても `--check` は通ってしまう。誰も見ていない仕組みは
 * `isFeatured` と同じく腐るので、怪しい候補を機械的に列挙できるようにしておく。
 */
import {
  adjectiveFromTitle,
  adjectiveFromUnit,
  deriveRankingHook,
  deriveRankingReaderLabel,
  isCrossDimensionMismatch,
  type HookAdjective,
  type RankingHookInput,
} from "./derive-ranking-hook";
import { stripParentheticals } from "./normalize-title";
import {
  RANKING_HOOK_OVERRIDES,
  RANKING_READER_LABEL_OVERRIDES,
} from "./ranking-hook-overrides";

/** hook の長さ制約。旧 `validateHomeFeaturedRankings` の 8〜28 文字を引き継ぐ。 */
export const HOOK_MIN_LENGTH = 8;
export const HOOK_MAX_LENGTH = 28;

/** hook に混ざると読みにくくなる記号。中黒 `・` は複合語で普通に使うので含めない。 */
const UNREADABLE_SYMBOLS = /[／/【】[\]＜＞<>|｜＝=]/;
/** 読者向けコピーに残してはいけない統計固有の専門語。 */
const UNFRIENDLY_TERMS = /行動者率/;

/**
 * 記号判定は「括弧の外にある記号」に限る。
 *
 * `男女間賃金格差（女性/男性）` のスラッシュは注釈内の意味のある記号で、読みを損なわない。
 * 括弧を落とす実装は normalize-title.ts に一本化してある (同じ正規表現を 3 箇所に
 * 散らしていて、ReDoS 修正のときに直し漏れる形になっていた)。
 */

export interface RankingHookResolveInput extends RankingHookInput {
  readonly rankingKey: string;
}

/** 個別の編集例外を優先し、無ければ共通規則から平易な表示名を導出する。 */
export function resolveRankingReaderLabel(
  input: Pick<RankingHookResolveInput, "rankingKey" | "title">,
): string {
  return (
    RANKING_READER_LABEL_OVERRIDES[input.rankingKey] ??
    deriveRankingReaderLabel(input.title)
  );
}

/** override を優先して hook を確定する。 */
export function resolveRankingHook(input: RankingHookResolveInput): string {
  return RANKING_HOOK_OVERRIDES[input.rankingKey] ?? deriveRankingHook(input);
}

export type HookAuditReason =
  /** 8〜28 文字の範囲外。長すぎる title がそのまま入っている */
  | "length"
  /** 括弧の外に読みにくい記号が残っている */
  | "symbol"
  /** 正規化したのに空白が残っている（想定外の空白文字） */
  | "whitespace"
  /** 平易化対象の統計用語が問いかけに残っている */
  | "jargon"
  /**
   * title 由来と unit 由来で述語が**次元をまたいで**食い違う。
   * 「長い/広い」と「多い/高い」の食い違いは、どちらかの規則が壊れている強い兆候。
   */
  | "adjective-conflict";

export interface HookAuditFinding {
  readonly rankingKey: string;
  readonly title: string;
  readonly unit: string;
  readonly hook: string;
  readonly reasons: readonly HookAuditReason[];
  /** adjective-conflict のときだけ入る */
  readonly titleAdjective?: HookAdjective;
  readonly unitAdjective?: HookAdjective;
}

/**
 * 導出が怪しい hook を列挙する。override 済みのものは人が書いた確定コピーなので対象外。
 *
 * 返り値が空 = 全件が規則で素直に導出できている。
 */
export function auditDerivedHooks(
  inputs: readonly RankingHookResolveInput[],
): HookAuditFinding[] {
  const findings: HookAuditFinding[] = [];

  for (const input of inputs) {
    if (RANKING_HOOK_OVERRIDES[input.rankingKey] !== undefined) continue;

    const hook = deriveRankingHook(input);
    const reasons: HookAuditReason[] = [];

    const length = [...hook].length;
    if (length < HOOK_MIN_LENGTH || length > HOOK_MAX_LENGTH) reasons.push("length");
    if (UNREADABLE_SYMBOLS.test(stripParentheticals(hook))) reasons.push("symbol");
    if (/[\s　]/.test(hook)) reasons.push("whitespace");
    if (UNFRIENDLY_TERMS.test(hook)) reasons.push("jargon");

    const titleAdjective = adjectiveFromTitle(input.title);
    const unitAdjective = adjectiveFromUnit(input.unit);
    const conflict =
      titleAdjective !== null &&
      unitAdjective !== null &&
      isCrossDimensionMismatch(titleAdjective, unitAdjective);
    if (conflict) reasons.push("adjective-conflict");

    if (reasons.length > 0) {
      findings.push({
        rankingKey: input.rankingKey,
        title: input.title,
        unit: input.unit,
        hook,
        reasons,
        ...(conflict
          ? { titleAdjective: titleAdjective!, unitAdjective: unitAdjective! }
          : {}),
      });
    }
  }

  return findings;
}
