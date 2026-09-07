/**
 * ランキングの「問いかけコピー」(hook) を title と unit から導出する純関数。
 *
 * なぜ導出規則を SSOT にするか: hook を 2,000 件超の metric config に手書きすると、
 * `isFeatured` (2,295 件中 8 件しか設定されなかった) と同じく誰も維持しなくなる。
 * 規則をここ 1 本に閉じ、読みが不自然なものだけ `ranking-hook-overrides.ts` で上書きする。
 * `deriveProductTermsFromTitles` と同じ「導出規則が SSOT・生成時に焼く」形。
 *
 * このモジュールは何も import しない (METRICS_REGISTRY を route bundle に持ち込まない)。
 */
import {
  normalizeTitleForHook,
  stripTrailingParenthetical,
} from "./normalize-title";

/** 問いかけの述語。指標の量的性質で決まる。 */
export type HookAdjective = "長い" | "多い" | "高い" | "広い";

export interface RankingHookInput {
  readonly title: string;
  readonly unit: string;
}

interface ParticipationReaderCopy {
  readonly readerLabel: string;
  readonly hook: string;
}

/**
 * 社会生活基本調査の専門語「行動者率」を、意味を広げず日常語へ置き換える。
 * 「好き」「盛ん」のような嗜好・因果は調査していないため使わない。
 */
function deriveParticipationReaderCopy(title: string): ParticipationReaderCopy | null {
  const normalized = normalizeTitleForHook(title);
  const participationTitle = stripTrailingParenthetical(normalized);

  if (
    participationTitle ===
    "スマートフォン・パソコン使用者の趣味・娯楽行動者率"
  ) {
    return {
      readerLabel: "スマホ等利用者のうち趣味・娯楽をした人の割合",
      hook: "スマホ等利用者で趣味をした人が多い県は？",
    };
  }

  // 79 件中この語順だけが「〜の行動者率」形ではない。
  if (participationTitle === "マンガを読む行動者率") {
    return {
      readerLabel: "マンガを読んだ人の割合",
      hook: "マンガを読んだ人が多い県は？",
    };
  }

  const matched = participationTitle.match(/^(.+)の(?:年間)?行動者率$/);
  if (!matched) return null;

  const activity = matched[1];
  return {
    readerLabel: `${activity}をした人の割合`,
    hook: `${activity}をした人が多い県は？`,
  };
}

/**
 * 家計調査の「〜消費支出額」を「〜への支出」へ置き換える。
 *
 * 家計調査が観測しているのは**支出した金額**であって、買った回数でも好みでもない。
 * 「よく買う」「好きな」のような行動・嗜好への言い換えは観測範囲を超えるので使わない。
 *
 * 品目名を持たない「消費支出」「消費支出総額」は末尾一致しないので、この規則には乗らない
 * (実測 2026-09-07: 末尾一致 502 件はすべて `<品目>消費支出額` の形)。
 */
const EXPENDITURE_SUFFIX = "消費支出額";

function deriveExpenditureReaderLabel(normalizedTitle: string): string | null {
  if (!normalizedTitle.endsWith(EXPENDITURE_SUFFIX)) return null;
  const item = normalizedTitle.slice(0, -EXPENDITURE_SUFFIX.length);
  // 「消費支出額」だけの title を「への支出」にしない (現状 0 件だが規則としては塞ぐ)
  if (item.length === 0) return null;
  return `${item}への支出`;
}

/**
 * 正準な統計名から、カード・記事・チャートで使える平易な名詞句を導出する。
 * 専用規則がない指標は正準名を維持し、意味を推測して言い換えない。
 *
 * 家族規則を足す場所はここ 1 箇所。hook (`deriveRankingHook`) はこの結果を主語に使うので、
 * 平易化を 1 回書けば表示名と問いかけの両方に効く。
 */
export function deriveRankingReaderLabel(title: string): string {
  const participation = deriveParticipationReaderCopy(title);
  if (participation) return participation.readerLabel;

  const normalized = normalizeTitleForHook(title);
  return deriveExpenditureReaderLabel(normalized) ?? normalized;
}

/**
 * title の末尾語 → 述語。**unit より優先する**。
 *
 * unit だけで決めると `年齢別死亡率` (unit=人口千対) や `人工妊娠中絶実施率` (unit=‰) が
 * 「最も多い」になってしまう。率・指数の類は title の末尾語でしか判別できない。
 *
 * 配列順に `endsWith` で走査するので、長い接尾辞を先に置く
 * (`倍率`/`比率` を `率` より前、`日数`/`件数` を `数` より前、`支出額` を `額` より前)。
 */
const TITLE_SUFFIX_ADJECTIVES: ReadonlyArray<readonly [string, HookAdjective]> = [
  // ── 長い ──
  ["所要時間", "長い"],
  // 「時間数」は末尾が「数」なので、先に拾わないと「最も多い」に落ちる
  // (実測: 月間平均実労働時間数。adjective-conflict 監査が検出した)
  ["時間数", "長い"],
  ["時間", "長い"],
  ["延長", "長い"],
  ["距離", "長い"],
  // ── 広い ──
  ["面積", "広い"],
  // ── 高い ── (率・指数・水準の類)
  ["倍率", "高い"],
  ["比率", "高い"],
  ["割合", "高い"],
  ["指数", "高い"],
  ["密度", "高い"],
  ["年齢", "高い"],
  ["気温", "高い"],
  ["水準", "高い"],
  ["価格", "高い"],
  ["単価", "高い"],
  ["賃金", "高い"],
  ["年収", "高い"],
  ["所得", "高い"],
  ["給与", "高い"],
  ["率", "高い"],
  // ── 多い ── (量・金額・件数の類)
  ["支出額", "多い"],
  ["収入", "多い"],
  ["支出", "多い"],
  ["額", "多い"],
  ["人口", "多い"],
  ["世帯数", "多い"],
  ["件数", "多い"],
  ["日数", "多い"],
  ["数", "多い"],
  ["量", "多い"],
];

/**
 * unit → 述語。title の末尾語で決まらなかったときだけ使うフォールバック。
 *
 * 判定順に意味がある (`m2` が「長い」の `m` に食われないよう、広い を先に置く)。
 */
const UNIT_ADJECTIVE_PATTERNS: ReadonlyArray<readonly [RegExp, HookAdjective]> = [
  [/(ha|ｈａ|km2|km²|㎢|m2|m²|㎡|平方)/, "広い"],
  [/^(時間|分|秒|km|ｋｍ|メートル|m$)/, "長い"],
  [/(%|％|‰|ポイント|指数|倍|歳|度|℃|人口\d*[千万]?対|対人口|対千人)/, "高い"],
  [/(円|ドル)/, "多い"],
];

/** 述語が決まらなかったときの既定。件数・量が最も多いため。 */
const DEFAULT_ADJECTIVE: HookAdjective = "多い";

/**
 * 述語の「次元」。監査で title 由来と unit 由来の食い違いを評価するときに使う。
 *
 * `高い` と `多い` の揺れは日常的で誤りではない (「平均年収が最も高い/多い」はどちらも通る)。
 * 一方 `長い`/`広い` と `多い` の食い違いは次元そのものが違うので、どちらかの規則が壊れている。
 * 同じ次元の中での揺れを矛盾として報告すると、年収系 60 件が丸ごと誤検知になる (実測)。
 */
const ADJECTIVE_DIMENSIONS: Readonly<Record<HookAdjective, "extent" | "magnitude">> = {
  長い: "extent",
  広い: "extent",
  多い: "magnitude",
  高い: "magnitude",
};

/** 2 つの述語が「次元をまたぐ食い違い」か。同次元の揺れは false。 */
export function isCrossDimensionMismatch(a: HookAdjective, b: HookAdjective): boolean {
  return ADJECTIVE_DIMENSIONS[a] !== ADJECTIVE_DIMENSIONS[b];
}

/** title の末尾語から述語を決める。決まらなければ null。 */
export function adjectiveFromTitle(title: string): HookAdjective | null {
  const target = stripTrailingParenthetical(normalizeTitleForHook(title));
  for (const [suffix, adjective] of TITLE_SUFFIX_ADJECTIVES) {
    if (target.endsWith(suffix)) return adjective;
  }
  return null;
}

/** unit から述語を決める。決まらなければ null。 */
export function adjectiveFromUnit(unit: string): HookAdjective | null {
  const target = unit.trim();
  if (!target) return null;
  for (const [pattern, adjective] of UNIT_ADJECTIVE_PATTERNS) {
    if (pattern.test(target)) return adjective;
  }
  return null;
}

/** title 優先・unit フォールバック・既定 `多い` の順で述語を決める。 */
export function resolveHookAdjective({ title, unit }: RankingHookInput): HookAdjective {
  return adjectiveFromTitle(title) ?? adjectiveFromUnit(unit) ?? DEFAULT_ADJECTIVE;
}

/**
 * 問いかけコピーを導出する。override は適用しない (それは `resolveRankingHook` の役目)。
 *
 * 主語は正準名ではなく `deriveRankingReaderLabel` の結果を使う。表示名と問いかけで
 * 別々に平易化規則を持つと必ずドリフトするので、平易化は readerLabel 側に一本化する。
 * 述語は正準名と unit から決める (`TITLE_SUFFIX_ADJECTIVES` の 23 パターンは正準名の
 * 末尾語に合わせて調整済みで、平易化後の語形で引き直すと判定が変わってしまう)。
 *
 * 語尾は既存の手書き hook に合わせて「県は？」とする (「都道府県は？」ではない)。
 * 8〜28 文字という既存の hook 長制約に収めるためでもある。
 */
export function deriveRankingHook(input: RankingHookInput): string {
  const participationCopy = deriveParticipationReaderCopy(input.title);
  if (participationCopy) return participationCopy.hook;

  const subject = deriveRankingReaderLabel(input.title);
  const adjective = resolveHookAdjective(input);
  return `${subject}が最も${adjective}県は？`;
}
