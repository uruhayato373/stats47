import type { CalculationConfig } from "../types/ranking-item";

/**
 * 計算型 metric の「オペランドに掛ける係数」を config から決定的に導出する。
 *
 * ## なぜ要るか
 *
 * 金額の単位が同じ「円」でも、**月額と年額は足し引きできない**。
 * `disposable-income-after-rent` は月額の可処分所得 (家計調査 SSDS L3130・全国 522,569 円)
 * から**年額**の民営家賃 (家計調査 年次表・全国の消費支出が 3,602,915 円で年額と確定) を
 * 引いており、控除額が 12 倍過大だった。1 位が山形から東京に入れ替わり 46/47 県の順位が
 * 動く規模の誤りで、公開済みのブログ記事もこの値の上に主題を組んでいた (2026-08-05)。
 *
 * e-Stat のメタは期間を明示しない (`@unit` はどちらも「円」、`TABLE_INF` にも記載なし)。
 * 機械では判別できないので **config の宣言 (`periodAlign`) が唯一の情報源**になる。
 *
 * ## 換算の向き
 *
 * `result` を基準にする。月額の結果に年額の項が来たら ÷12、年額の結果に月額の項が来たら
 * ×12。同じなら 1。**比 (ratio) では分子分母で約分されるため、宣言があっても実質無害**
 * (それでも同じ関数を通して式を一本化する)。
 */
export function periodScales(align: CalculationConfig["periodAlign"]): {
  numeratorScale: number;
  denominatorScale: number;
} {
  if (!align) return { numeratorScale: 1, denominatorScale: 1 };
  return {
    numeratorScale: scaleTo(align.numerator, align.result),
    denominatorScale: scaleTo(align.denominator, align.result),
  };
}

function scaleTo(from: "monthly" | "annual", to: "monthly" | "annual"): number {
  if (from === to) return 1;
  return from === "annual" ? 1 / 12 : 12;
}

/**
 * 表示桁での丸め。既存規約 (`packages/data-configs/src/estat-transform.ts` の `round1`) と
 * 同じ half-up 方式に揃える。
 *
 * `-0` を `0` に正規化するのは、JSON 直列化で `-0` が `0` になる一方で
 * `Object.is(-0, 0) === false` のため、突合や snapshot 比較が偽の差分を出すのを防ぐため。
 */
export function roundToPlaces(value: number, decimalPlaces: number | undefined): number {
  if (decimalPlaces === undefined) return value;
  const factor = 10 ** decimalPlaces;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}
