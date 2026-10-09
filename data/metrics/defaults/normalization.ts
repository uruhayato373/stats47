/**
 * 正規化の分母に使う well-known metric の宣言。
 *
 * ★`valueScaleToBaseUnit` を必ず伴わせること。
 *
 * config の `NormalizationOption` は「基準単位あたり」で書かれている:
 *
 *   per_area        : `unit: "人/100km²"`, `scaleFactor: 100`    → 式は `分子 / 面積[km²] × 100`
 *   per_population  : `unit: "人/10万人"`, `scaleFactor: 100000` → 式は `分子 / 人口[人] × 100000`
 *
 * つまり scaleFactor は **分母が基準単位 (km² / 人) で来ること**を前提にしている。ところが
 * 分母 metric が R2 に保持している値の単位は e-Stat の公表単位そのままで、基準単位とは限らない。
 *
 * - `total-area-including-northern-territories-and-takeshima` の unit は **`１００Ｋm2` (= 100km²)**
 *   (実測: 北海道 834.21 = 83,421km² / 東京 22 = 2,200km²)
 * - よって素の値で割ると `分子 / (面積[km²] / 100) × 100` = `分子 / 面積[km²] × 10000` となり
 *   **意図した「100km² あたり」の 100 倍**になる
 *
 * `valueScaleToBaseUnit` は「R2 に入っている分母の値 → 基準単位」への変換係数で、この差を吸収する。
 * 新しい分母を追加するときは、その metric config の `unit` を確認して係数を必ず設定すること。
 */
export interface WellKnownDenominator {
  /** 分母として読む metric key */
  key: string;
  /** R2 の分母値に掛けると基準単位 (per_area→km² / per_population→人) になる係数 */
  valueScaleToBaseUnit: number;
}

export const WELL_KNOWN_DENOMINATORS: Record<
  string,
  Record<string, WellKnownDenominator | null>
> = {
  per_population: {
    // total-population の unit は「人」= 基準単位そのもの
    prefecture: { key: "total-population", valueScaleToBaseUnit: 1 },
    city: { key: "total-population", valueScaleToBaseUnit: 1 },
  },
  per_area: {
    // unit「１００Ｋm2」= 100km² 単位で格納されているため ×100 して km² に直す
    prefecture: {
      key: "total-area-including-northern-territories-and-takeshima",
      valueScaleToBaseUnit: 100,
    },
    // 市区町村の面積 metric は現状 registry に存在しない (この分岐は解決できず空を返す)。
    // 追加するときは必ずその config の unit を見て係数を設定すること。
    city: null,
  },
};
