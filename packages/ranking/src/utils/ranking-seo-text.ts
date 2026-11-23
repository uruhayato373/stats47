import { PREFECTURE_CAPITAL_CITY_NAMES } from "@stats47/area";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { resolveValuePrecision } from "@stats47/utils";

import { formatRankingValue, resolveRankingValueDisplay } from "./ranking-value-display";

import type { RankingItem } from "../types/ranking-item";

/** 題と説明文を作るのに使う 1 行 (最新年の 1 県) */
export interface SeoValueRow {
  areaCode: string;
  areaName: string;
  value: number | null;
  rank: number | null;
}

export interface RankingSeoText {
  seoTitle: string;
  seoDescription: string;
}

/** 倍率を書く下限の比 (これ未満は「格差」と呼ぶほどの開きではない) */
const MIN_RATIO_TO_WRITE = 1.05;

/**
 * ランキングのページの題 (`<title>`) と説明文 (`<meta name="description">`) を、最新年の観測値から作る
 * (SEO-META-FROM-VALUES-01・2026-11-23 オーナー決定)。
 *
 * これまでは指標の定義 (data/metrics/<key>.ts) に「一般病院数ランキング都道府県【2023年】｜1位東京都（588施設）」のように
 * 年と値を手で書いていたので、新しい年を取り込んでも題が古い年のまま残った。言い回しは手で書いていた題と同じ形にそろえ、
 * 値の単位と桁はランキングのページの表と同じ決め方 (`resolveRankingValueDisplay`) にする。
 *
 * - 1 位と最下位は順位 (rank) で決める。値の大小では決めない (少ないほど上位の指標がある)
 * - 倍率は両方が正の値で、開きが 1.05 倍以上のときだけ書く (負の値・0 を含む指標で倍率を書かない)
 * - 県庁所在市の値の指標 (家計調査など) は県名を市の名前にし、「都道府県」と書かない
 * - 順位の付いた行が 2 つ未満なら作らない (null)。呼び出し側は指標の名前だけの題に戻す
 * - note (指標の定義の seoNote) があれば説明文の後ろに付ける (対象の範囲の断りなど)
 */
export function buildRankingSeoText(
  item: Pick<RankingItem, "title" | "unit" | "valueDisplay">,
  yearName: string,
  rows: readonly SeoValueRow[],
  options: { capitalCities?: boolean; note?: string } = {},
): RankingSeoText | null {
  const ranked = rows
    .filter((row): row is SeoValueRow & { value: number; rank: number } =>
      typeof row.value === "number" && Number.isFinite(row.value) && row.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  if (ranked.length < 2) return null;

  const all = ranked.map((row) => row.value);
  const display = resolveRankingValueDisplay(item, all);
  const precision = display?.precision ?? resolveValuePrecision(all);
  const factor = display?.factor ?? 1;
  const unit = display?.unit ?? formatUnitForDisplay(item.unit);
  const name = (row: SeoValueRow) =>
    (options.capitalCities ? PREFECTURE_CAPITAL_CITY_NAMES[row.areaCode] : undefined) ?? row.areaName;
  const valueText = (row: { value: number }) => `${formatRankingValue(row.value, precision, factor)}${unit}`;

  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const scope = options.capitalCities ? "県庁所在市" : "都道府県";
  const count = options.capitalCities ? `${ranked.length}市` : `${ranked.length}都道府県`;

  const high = Math.max(top.value, bottom.value);
  const low = Math.min(top.value, bottom.value);
  const ratio = low > 0 ? high / low : null;
  const ratioText = ratio !== null && ratio >= MIN_RATIO_TO_WRITE ? `で${formatRatio(ratio)}倍の格差` : "";

  return {
    seoTitle: `${item.title}ランキング${scope}【${yearName}】｜1位${name(top)}（${valueText(top)}）`,
    seoDescription:
      `${yearName}の${item.title}の${scope}別ランキング。` +
      `1位${name(top)}（${valueText(top)}）、最下位${name(bottom)}（${valueText(bottom)}）${ratioText}。` +
      `地図やグラフで${count}を比較。` +
      (options.note ? options.note : ""),
  };
}

/** 倍率は小数 1 桁で書く (手で書いていた説明文と同じ。10 倍以上の 407 件中 406 件が小数 1 桁)。1,000 倍以上は桁区切りを付ける */
function formatRatio(ratio: number): string {
  return ratio.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
