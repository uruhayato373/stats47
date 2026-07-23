/**
 * home-featured-v1 実験の識別子と採用結果 (実験は 2026-07-23 に終了)。
 *
 * ポータル型 home 再設計 (docs/02_実装計画/38_ポータル型ホーム・ヘッダー再設計仕様.md) に伴い、
 * 判定前だった 50/50 A/B (control = map / number vs editorial = question / comparison /
 * territory / top-three) を **オーナー判断で終了し editorial を採用**した (inconclusive。
 * 正典: doc 28 §9.4 / FeaturedRankings/README.md)。
 *
 * sticky assignment の機構 (localStorage key `stats47_exp_home_featured_v1` / 乱数 50/50 割当) は
 * 撤去し、以降は editorial variant を全ユーザーに固定描画する。impression / click 計測は継続し、
 * `experiment_variant` には採用値 "editorial" を送って GA4 の連続性を保つ。
 */

export const HOME_FEATURED_EXPERIMENT_ID = "home-featured-v1";

export const HOME_FEATURED_EXPERIMENT_VARIANTS = ["control", "editorial"] as const;
export type HomeFeaturedExperimentVariant =
  (typeof HOME_FEATURED_EXPERIMENT_VARIANTS)[number];

/** 実験終了時 (2026-07-23) に採用した variant。 */
export const HOME_FEATURED_ADOPTED_VARIANT: HomeFeaturedExperimentVariant = "editorial";
