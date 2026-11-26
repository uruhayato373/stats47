/**
 * 自明な相関の除外。物理法則・同一指標・部分⊂全体・施設規模連動など、相関が高いことに発見がない組を外す。
 *
 * 除外の一覧 (判断して増える記録) は台帳 `data/correlation/exclusions.json` が正本で、ここは読んで判定するだけ
 * (2026-11-26。それまではこのファイルに 560 行の一覧を手で書いていて、実在しない指標を 30 件指していた。
 * 台帳は check-datasets が JSON Schema と指標の実在を検査する)。
 *
 * 1. pairs: 特定の 2 指標の組 (順序不問)
 * 2. groups: まとまりの中のどの 2 指標の組も除外
 * 3. keys: どの指標と組んでも自明になる指標 (人口に比例する絶対数など) を相関の一覧から外す
 * 4. 規則: 家計調査の同じ品目の支出額と購入数量 (下の isSameItemSpendAndQuantity)
 */
import exclusions from "../../../data/correlation/exclusions.json";

/** 2 指標の組を、順序によらない 1 つのキーにする */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

/** まとまりの中の全ての組 */
function groupToPairs(group: readonly string[]): string[] {
  return group.flatMap((a, i) => group.slice(i + 1).map((b) => pairKey(a, b)));
}

const excludedPairSet = new Set([
  ...exclusions.pairs.map(({ keys: [a, b] }) => pairKey(a, b)),
  ...exclusions.groups.flatMap(({ keys }) => groupToPairs(keys)),
]);

/** 相関の一覧から外す個別の指標 */
export const EXCLUDED_CORRELATION_KEYS: string[] = exclusions.keys.map(({ key }) => key);

const excludedKeySet = new Set(EXCLUDED_CORRELATION_KEYS);

/**
 * 指定した ranking_key ペアが自明な相関として除外対象かを判定する。
 * 順序不問（X/Y を入れ替えても同じ結果）。
 */
export function isExcludedCorrelationPair(
  rankingKeyX: string,
  rankingKeyY: string
): boolean {
  return (
    excludedPairSet.has(pairKey(rankingKeyX, rankingKeyY)) ||
    isSameItemSpendAndQuantity(rankingKeyX, rankingKeyY)
  );
}

const KAKEI_ITEM_KEY = /^(.+)-consumption-(?:expenditure|quantity)$/;

/**
 * 家計調査の同じ品目の支出額と購入数量 (`<品目>-consumption-expenditure` と `-quantity`)。
 * 支出額は数量 × 単価なので相関が高いのは当たり前で、テーマの「関連の深い指標」に
 * 灯油の支出額と数量 (+1.00) のような組が並んでいた (2026-11-02)。191 品目が対になる。
 */
function isSameItemSpendAndQuantity(keyA: string, keyB: string): boolean {
  if (keyA === keyB) return false;
  const a = KAKEI_ITEM_KEY.exec(keyA);
  const b = KAKEI_ITEM_KEY.exec(keyB);
  return a !== null && b !== null && a[1] === b[1];
}

/**
 * 指定した ranking_key が相関ランキングから除外対象かを判定する。
 * 人口比例の絶対数など、どの指標と組み合わせても自明な結果になる指標。
 */
export function isExcludedCorrelationKey(rankingKey: string): boolean {
  return excludedKeySet.has(rankingKey);
}
