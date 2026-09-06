/**
 * 指標 (metric config) → テーマパック (P-01〜P-14) の機械配分マップ (SSOT)。
 *
 * 各 metric config の e-Stat カテゴリ 17 分類 (`category`) を主キーに、1 指標 = 1 テーマ (primary)
 * で配分する。曖昧なカテゴリはキーワードで微調整する。P-11 (地図・チャート素材集) は横断代表を
 * 選抜し、P-12 (全部入り) は全配分指標の和集合。P-13 (無料お試し) は対象外。
 *
 * この写像は `build-pack-rankingkeys.ts` が METRICS_REGISTRY に適用して
 * `pack-rankingkeys.generated.ts` を再生成するための純ロジック。値やキー列は転記しない。
 */
import type { PackTheme } from "./types";

/**
 * 有償商品へ収録しない ranking key。
 * P12 は「非商用」データであり、商用利用可能な根拠が確認できないため除外する。
 * 2026-09-05 にサイトの旧ランキングも公開終了対象とした。設定の再活性化でも商品へ戻さない。
 */
export const PRODUCT_EXCLUDED_RANKING_KEYS: ReadonlySet<string> = new Set([
  "tourism-resource-count",
]);

/** e-Stat カテゴリ (17 分類) → 主テーマ。economy は既定 P-09、物価/地価/家賃は P-07 へ振り分ける。 */
export const CATEGORY_PACK: Readonly<Record<string, PackTheme>> = {
  population: "population-household", // P-01
  laborwage: "income-wage-hiring", // P-02
  tourism: "tourism-lodging", // P-03
  international: "tourism-lodging", // P-03 (在留外国人・インバウンド関連)
  administrativefinancial: "municipal-finance", // P-04
  socialsecurity: "healthcare-nursing", // P-05
  educationsports: "education-childcare", // P-06
  landweather: "migration-living", // P-07 (気候・土地=移住候補地の生活環境)
  commercial: "retail-trade-area", // P-08
  miningindustry: "industry-economy", // P-09
  agriculture: "industry-economy", // P-09
  economy: "industry-economy", // P-09 (既定。物価/地価/家賃は下記で P-07 へ)
  infrastructure: "disaster-infrastructure", // P-10
  construction: "disaster-infrastructure", // P-10
  energy: "disaster-infrastructure", // P-10
  safetyenvironment: "disaster-infrastructure", // P-10
  ict: "disaster-infrastructure", // P-10
};

/**
 * economy カテゴリのうち「移住・生活コスト」相当 (消費者物価地域差指数・地価/公示地価変動率・
 * 持ち家率・住居費/家賃) は P-07 (移住・生活) へ振り分ける。それ以外の economy は P-09。
 */
const P07_ECONOMY_KEY = new RegExp(
  [
    "consumer-price-difference-index",
    "cpi-change-rate",
    "standard-price-change",
    "land-price",
    "residential-land",
    "home-ownership-rate",
    "housing-cost",
    "housing-charges",
    "-rent-consumption",
    "land-rent-consumption",
    "rent-per",
    "disposable-income-after-rent",
  ].join("|"),
);

/** P-11 (地図・チャート素材集) の横断代表キー (テーマを跨いで映える 28 指標)。 */
export const MAP_CHART_ASSET_KEYS: readonly string[] = [
  "total-population",
  "japanese-population",
  "total-area-including-northern-territories-and-takeshima",
  "general-households",
  "aging-index",
  "total-fertility-rate",
  "crude-birth-rate",
  "per-capita-prefectural-income-h27",
  "active-job-opening-ratio",
  "avg-salary-all-prefecture",
  "total-overnight-guests",
  "total-overnight-guests-foreign",
  "number-of-hotel-facilities",
  "fiscal-strength-index-prefecture",
  "laspeyres-index-prefecture",
  "physicians-in-medical-facilities-per-100k",
  "general-hospital-bed-count-per-100k",
  "high-school-advancement-rate",
  "social-increase-rate",
  "consumer-price-difference-index-overall",
  "residential-land-price-change-rate",
  "annual-sales-amount",
  "convenience-store-count-per-100k",
  "manufacturing-shipment-amount",
  "road-length-per-km2",
  "annual-sunshine-duration",
  "annual-precipitation",
  "resident-foreigner-population",
];

/**
 * 1 指標を主テーマパックへ配分する。配分できないものは null (P-13 対象・未知カテゴリ)。
 * P-11 (素材集) と P-12 (全部入り) はここでは扱わない (別ロジックで束ねる)。
 *
 * 配分優先順位:
 *   1. economy かつ移住・生活コスト相当 (物価/地価/家賃) → P-07 を維持する。
 *      P-07 の既存構成 (物価/地価 + 住居費) を壊さないため、家計調査由来の住居費 (家賃消費支出等) も
 *      この範囲に含まれるものは P-07 のまま据え置く (kakei ルールより先に判定)。
 *   2. 家計調査の消費品目 (source.kind === "kakei-chousa") → P-14 (家計・消費)。
 *      これらは category=economy だが「○○消費支出額」等の家計消費であり、産業・経済 (P-09) に不適合。
 *      category 判定より優先して P-14 へ寄せる。
 *   3. e-Stat カテゴリ 17 分類の写像 (CATEGORY_PACK)。
 */
export function assignPackTheme(
  key: string,
  category: string,
  sourceKind?: string,
): PackTheme | null {
  if (category === "economy" && P07_ECONOMY_KEY.test(key)) return "migration-living";
  if (sourceKind === "kakei-chousa") return "household-consumption";
  return CATEGORY_PACK[category] ?? null;
}
