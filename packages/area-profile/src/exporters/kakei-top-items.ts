/**
 * 県ページの「県庁所在市の家計調査で全国 3 位以内の品目」を選ぶ純粋関数群。
 *
 * 母集団は metric config の source.kind === "kakei-chousa" の指標のうち、最下層の品目
 * (cdCat01 が 9 桁で末尾の 0 が 2 つ以下) だけ。食料費・消費支出総額・魚介類のような集計区分は
 * 末尾に 0 が 3 つ以上並ぶのでここで外れる。実測 (2026-11-02): 該当 682 指標はすべて台帳の品目か、
 * 米・牛乳・清酒・ビールのように読者が品目と呼ぶ区分だった。
 * 値と順位は exporter が R2 values.json の最新年から渡す。ここは R2 を読まない。
 */
import { detectRankDirection, parseHighlightYear, MIN_HIGHLIGHT_YEAR } from "../highlights/select-area-highlights";
import type { RankedValue } from "../highlights/select-area-highlights";

/** 全国で何位以内を載せるか。 */
export const KAKEI_TOP_RANK_LIMIT = 3;
/** 県ページに出す最大件数。 */
export const KAKEI_TOP_ITEM_LIMIT = 5;
/** 支出額の単位。同じ品目の支出額と購入数量が同順位のとき、こちらを選ぶ。 */
const EXPENDITURE_UNIT = "円";
/** 品目コードの末尾に許す 0 の数。これを超えると集計区分。 */
const MAX_TRAILING_ZEROS_OF_ITEM = 2;
const ITEM_CODE_RE = /^\d{9}$/;
/** 食料 (大分類 01) の品目コードの先頭。欄を置く「食の消費」の節に合う食品を、同順位の中で先に出す。 */
const FOOD_ITEM_CODE_PREFIX = "01";

/** metric config のうち、品目の判定に使う最小限の形。 */
export interface KakeiMetricLike {
  key: string;
  source: { kind: string; filter?: Record<string, unknown> };
}

/** 家計調査の最下層の品目なら cdCat01 を返す。集計区分・家計調査以外・コード無しは null。 */
export function kakeiDetailItemCode(metric: KakeiMetricLike): string | null {
  if (metric.source.kind !== "kakei-chousa") return null;
  const code = metric.source.filter?.cdCat01;
  if (typeof code !== "string" || !ITEM_CODE_RE.test(code)) return null;
  const trailingZeros = /0*$/.exec(code)?.[0].length ?? 0;
  return trailingZeros > MAX_TRAILING_ZEROS_OF_ITEM ? null : code;
}

/** 品目コード → その品目の指標キー (支出額・購入数量など)。順序は入力順。 */
export function groupKakeiItemKeys(metrics: readonly KakeiMetricLike[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const metric of metrics) {
    const code = kakeiDetailItemCode(metric);
    if (!code) continue;
    groups.set(code, [...(groups.get(code) ?? []), metric.key]);
  }
  return groups;
}

/** snapshot に焼き込む 1 品目。 */
export interface KakeiTopItem {
  rankingKey: string;
  /** 表示名 (readerLabel ?? title) */
  label: string;
  value: number;
  unit: string;
  /** データ年度 (yearName) */
  year: string;
  /** 全国順位 (1 〜 KAKEI_TOP_RANK_LIMIT) */
  rank: number;
}

/** 1 指標の、ある県の最新年の値。pickKakeiTopItems の入力。 */
export interface KakeiTopCandidate extends KakeiTopItem {
  /** 品目コード (cdCat01)。支出額と購入数量を 1 件にまとめるキー */
  itemCode: string;
  /** 47 県の順位つき値 (順位の向きと決定力の計算用) */
  ranked: RankedValue[];
}

function isEligible(c: KakeiTopCandidate): boolean {
  if (c.rank < 1 || c.rank > KAKEI_TOP_RANK_LIMIT) return false;
  // 小さい値が 1 位の指標は「多く買う品目」ではないので載せない
  if (detectRankDirection(c.ranked) !== "desc") return false;
  const year = parseHighlightYear(c.year);
  return year !== null && year >= MIN_HIGHLIGHT_YEAR;
}

/**
 * 同じ品目の候補から 1 件を選ぶ規則: 順位が上 → 支出額 (円) → 指標キー順。
 * 順位が同じなら支出額を残すのは、購入数量より単位が一定で読者に読みやすいため。
 */
function betterOfSameItem(a: KakeiTopCandidate, b: KakeiTopCandidate): KakeiTopCandidate {
  if (a.rank !== b.rank) return a.rank < b.rank ? a : b;
  const aMoney = a.unit === EXPENDITURE_UNIT;
  const bMoney = b.unit === EXPENDITURE_UNIT;
  if (aMoney !== bMoney) return aMoney ? a : b;
  return a.rankingKey <= b.rankingKey ? a : b;
}

/**
 * 1 県ぶんの候補から、全国 3 位以内の品目を最大 KAKEI_TOP_ITEM_LIMIT 件選ぶ。
 * 並び順は 順位 → 食料の品目 → 47 都道府県の平均の何倍か (大きいほどその都市で際立つ) → 指標キー。
 * 隣の順位との値の比で並べると、宇都宮のぎょうざ (平均の 1.86 倍・2 位と僅差) が外れ、購入の少ない品目が残った (2026-11-02)。
 * 食料を先にするのは、決定力だけで並べると畳替え・通学用かばん・祭具・墓石のように購入が少なく値が
 * 揺れる品目が上に来て、「食の消費」の節の欄として読者に伝わらないため (2026-11-02 の 3 県実測)。
 */
export function pickKakeiTopItems(candidates: readonly KakeiTopCandidate[]): KakeiTopItem[] {
  const byItem = new Map<string, KakeiTopCandidate>();
  for (const candidate of candidates) {
    if (!isEligible(candidate)) continue;
    const current = byItem.get(candidate.itemCode);
    byItem.set(candidate.itemCode, current ? betterOfSameItem(current, candidate) : candidate);
  }
  return [...byItem.values()]
    .map((c) => ({ c, ratio: ratioToMean(c.ranked, c.value), isFood: c.itemCode.startsWith(FOOD_ITEM_CODE_PREFIX) }))
    .sort(
      (a, b) =>
        a.c.rank - b.c.rank ||
        Number(b.isFood) - Number(a.isFood) ||
        b.ratio - a.ratio ||
        a.c.rankingKey.localeCompare(b.c.rankingKey),
    )
    .slice(0, KAKEI_TOP_ITEM_LIMIT)
    .map(({ c }) => ({
      rankingKey: c.rankingKey,
      label: c.label,
      value: c.value,
      unit: c.unit,
      year: c.year,
      rank: c.rank,
    }));
}

/** 値が 47 都道府県の平均の何倍か。平均が 0 以下なら 0 (並びの最後) */
function ratioToMean(ranked: readonly RankedValue[], value: number): number {
  if (ranked.length === 0) return 0;
  const mean = ranked.reduce((sum, r) => sum + r.value, 0) / ranked.length;
  return mean > 0 ? value / mean : 0;
}
