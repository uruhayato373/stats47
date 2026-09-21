/**
 * 図の中の文字 (SVG の <text>/<title>) に対する書籍版だけの校訂。
 *
 * ★なぜ要るか (2026-09-19 の S1 全冊レビュー)
 *   本文は critic の指摘で「2023年度」「火災・地震保険料支出」に直ったが、図は R2 の SVG を
 *   そのまま PNG 化するので図題・副題・軸ラベルが旧表記のまま残り、critic が「据え置き (図側工程)」
 *   として 3 冊 (K-S1-06 / 08 / 10) で持ち越した。図データ (data/*.json) を直すのはブログ側の工程で、
 *   ここでは PNG 化の直前に文字だけを置き換える。数値・座標・点は触らない。
 *
 * 契約は editorial-corrections と同じ: before は R2 SVG の逐語で、1 回以上現れなければ生成を止める
 * (ブログ側で図が直ったら、この校訂は不要になり before が消える → エントリを削除する)。
 * 同じ文字列が <title> と <text> の 2 か所に出る地図は両方置き換える (置換は全件)。
 *
 * 年の型 (年/年度) は指標定義シート (data-configs yearFormat) に合わせる。config 側の型が疑わしい指標
 * (警察庁の犯罪統計は暦年集計) は backlog METRIC-YEARFORMAT-KAKEI-01 で config を直してから戻す。
 */
import type { EditorialCorrection } from "./editorial-corrections";

const NENDO = (y: string, before: string) => ({ before, after: before.replace(`${y}年`, `${y}年度`) });

/** key は `<slug>/<figure name>` (article.md の `![..](data/<name>.svg)`)。 */
export const KINDLE_FIGURE_CORRECTIONS: Readonly<Record<string, readonly EditorialCorrection[]>> = {
  // ── K-S1-06 自治体財政 (F-003-16: 地方財政状況調査系はすべて年度。F-004-07: 「全国推移」は 47 県単純平均) ──
  "fiscal-self-reliance-gap/current-balance-ratio-prefecture-rankings": [{ ...NENDO("2022", ">経常収支比率 都道府県ランキング（2022年）<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "fiscal-self-reliance-gap/real-public-debt-service-ratio-prefecture-rankings": [{ ...NENDO("2022", ">実質公債費比率 都道府県ランキング（2022年）<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "fiscal-health-50years-trend/fiscal-ranking": [{ ...NENDO("2022", ">　2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "fiscal-health-50years-trend/fiscal-trend": [
    { before: ">財政力指数 全国推移<", after: ">財政力指数 47都道府県単純平均の推移<", reason: "[K-S1-06 F-004-07/F-009-02] 全国集計値ではなく 47 県の単純平均 (R2 values.json で 1991 0.508 / 2008 0.521 / 2022 0.494 を確認)" },
  ],
  "local-tax-revenue-gap/local-tax-ratio-ranking": [{ ...NENDO("2022", ">　2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "local-tax-revenue-gap/allocation-tax-map": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 F-003-16] 年度 (title と表示の 2 か所)" }],
  "local-tax-revenue-gap/national-treasury-disbursement-ratio-pref-finance-prefecture-rankings": [{ ...NENDO("2022", ">国庫支出金割合 都道府県ランキング（2022年）<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "local-government-debt-burden/local-debt-ratio-ranking": [{ ...NENDO("2022", ">　2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "local-government-debt-burden/local-debt-map": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "future-burden-ratio-extreme-gap/future-burden-ratio-prefecture-rankings": [{ ...NENDO("2022", ">　2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "future-burden-ratio-extreme-gap/future-burden-ratio-tile-grid": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  // ── K-S1-08 エネルギー (F-05-13: 9 指標すべて yearFormat=fiscal) ──
  "energy-consumption-structure-shift/energy-map": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "renewable-energy-regional-gap/solar-power-housing-map": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "electricity-demand-gap/electricity-demand-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "energy-infrastructure-gas-electricity/gas-ratio-map": [{ ...NENDO("2016", ">2016年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "gasoline-car-society-map/gasoline-map": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "gasoline-car-society-map/gasoline-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  // ── K-S1-10 安全と環境 (F-B-01: 社会・人口統計体系 13 指標は年度。N20: 保険散布図の題名と縦軸) ──
  "crime-rate-regional-gap/theft-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "crime-rate-regional-gap/theft-map": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "crime-rate-regional-gap/arrest-rate-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/frequency-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/severity-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/freq-severity-scatter": [{ ...NENDO("2023", ">労災の頻度 × 重さ（47都道府県・2023年）<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/avg-payment-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/workers-compensation-insurance-benefits-rate-prefecture-rankings": [{ ...NENDO("2023", ">労働者災害補償保険給付率 都道府県ランキング（2023年）<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "pollution-complaints-regional-map/complaints-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "pollution-complaints-regional-map/complaints-map": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "waste-management-recycling-gap/recycling-tilemap": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "earthquake-insurance-prefecture-gap/insurance-damage-scatter": [
    { before: ">地震保険料 × 災害被害額<", after: ">火災・地震保険料支出 × 災害被害額<", reason: "[K-S1-10 N20] 指標は火災・地震保険料の消費支出額" },
    { ...NENDO("2023", ">災害被害額（1人当たり・円・2023年）<"), reason: "[K-S1-10 N20] 災害被害額 (社会・人口統計体系) は年度。横軸の家計調査 2024年 は暦年のまま" },
  ],
};

/** SVG 文字列に図の校訂を当てる。before が 1 回も無ければ R2 の図が変わったので止める。 */
export function correctBookFigure(slug: string, name: string, svg: string): string {
  for (const c of KINDLE_FIGURE_CORRECTIONS[`${slug}/${name}`] ?? []) {
    if (!svg.includes(c.before)) {
      throw new Error(`Figure correction source changed: ${slug}/${name} (${c.before}). Re-check the R2 figure before generating an edition.`);
    }
    svg = svg.split(c.before).join(c.after);
  }
  return svg;
}
