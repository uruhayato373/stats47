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
  // ── 2026-11-03 v8 確認レビュー: R2 で描き直された図の年・分母・題・出典の行 ──
  "commercial-land-price-trend/commercial-rate-ranking": [{ ...NENDO("2024", ">2024年 · 単位：%<"), reason: "[K-S1-09 v8 G01] 地価の変動率は年度" }],
  "commercial-land-price-trend/commercial-rate-map": [{ ...NENDO("2024", ">2024年 · 単位：%<"), reason: "[K-S1-09 v8 G01] 地価の変動率は年度" }],
  "industrial-water-manufacturing-nexus/water-usage-map": [{ ...NENDO("2015", ">2015年 · 単位：m³/日<"), reason: "[K-S1-09 v8 G02] 表は 2015年度" }],
  "nursing-care-shortage-2040/nursing-home-capacity-ranking": [
    { before: ">2023年 · 単位：人 · 範囲：24.4–60.4<", after: ">2023年 · 65歳以上人口千人当たり · 単位：人<", reason: "[K-S1-04 v8 M04] 分母が無く県全体の人数に読める" },
  ],
  "heating-cost-vs-disposable-income/heating-cost-combined-ranking": [
    { before: ">出典：計算値（家計調査 灯油消費支出額＋電気代消費支出額＋都市ガス消費支出額の合算）<", after: ">出典：家計調査（灯油・電気代・都市ガスの支出額の合計）<", reason: "[K-S1-01 v8 C03] 出典の行が右端で切れる" },
  ],
  "household-spending-prefecture-gap/clothing-footwear-expenditure-ratio-multi-person-households-prefecture-rankings": [
    { before: ">被服及び履物費割合 都道府県ランキング（2024年）ランキング<", after: ">被服及び履物費割合<", reason: "[K-S1-01 v8 C04] 題が「ランキング」と年を二重に含む (年・単位は副題にある)" },
  ],
  // ── K-S1-06 自治体財政 (F-003-16: 地方財政状況調査系はすべて年度。F-004-07: 「全国推移」は 47 県単純平均) ──
  // 2026-11-03: 経常収支比率・実質公債費比率・地方債・財政力の推移の図は描き直しで年度・単純平均になったので校訂を外した (KINDLE-S1-BLOG-REWRITE-RECONCILE-01)
  // ── 2026-11-03 v6 差分レビュー: ブログの図の一括の描き直しで出た年・題の不具合 ──
  "fiscal-health-50years-trend/fiscal-map": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 v6 B01] 財政力指数は年度" }],
  "per-capita-income-gap/income-map": [{ ...NENDO("2021", ">2021年 · 単位：万円<"), reason: "[K-S1-01 v6 B01] 県民所得は年度 (図の描き直しで副題の形が変わったので合わせた)" }],
  "per-capita-income-gap/income-ranking": [{ ...NENDO("2021", ">2021年 · 単位：万円 · 範囲：225.8–576.1<"), reason: "[K-S1-01 v6 B01] 県民所得は年度 (図の描き直しで副題の形が変わったので合わせた)" }],
  "manufacturing-aichi-dominance/manufacturing-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-09 v7 F01] 本文・表の「年度」にそろえる" }],
  "manufacturing-aichi-dominance/manufacturing-heatmap": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-09 v7 F01] 本文・表の「年度」にそろえる" }],
  "manufacturing-aichi-dominance/industrial-zone-ranking": [{ ...NENDO("2023", ">2023年・構成都府県の合計<"), reason: "[K-S1-09 v7 F01] 本文・表の「年度」にそろえる" }],
  "manufacturing-aichi-dominance/shipment-per-employee-ranking": [
    { ...NENDO("2023", ">　2023年<"), reason: "[K-S1-09 v7 F01] 本文・表の「年度」にそろえる" },
    { before: 'class="svg-title">製造品出荷額等<', after: 'class="svg-title">従業者1人当たり製造品出荷額等<', reason: "[K-S1-09 v6 A02] 総額の図と同じ題になっていた" },
  ],
  "household-spending-prefecture-gap/culture-recreation-expenditure-ratio-multi-person-households-prefecture-rankings": [
    { before: ">教養娯楽費割合 都道府県ランキング（2024年）ランキング<", after: ">教養娯楽費割合<", reason: "[K-S1-01 v6 M01] 題が「ランキング」を 2 回含み、右端で切れる (年・単位は副題にある)" },
  ],
  "fiscal-health-50years-trend/fiscal-ranking": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 F-003-16] 年度 (2026-11-03 描き直しで置換元の全角空白が消えたので合わせた)" }],
  "local-tax-revenue-gap/local-tax-ratio-ranking": [{ ...NENDO("2022", ">　2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "local-tax-revenue-gap/allocation-tax-map": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 F-003-16] 年度 (title と表示の 2 か所)" }],
  "local-tax-revenue-gap/national-treasury-disbursement-ratio-pref-finance-prefecture-rankings": [{ ...NENDO("2022", ">国庫支出金割合 都道府県ランキング（2022年）<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "future-burden-ratio-extreme-gap/future-burden-ratio-prefecture-rankings": [{ ...NENDO("2022", ">　2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  "future-burden-ratio-extreme-gap/future-burden-ratio-tile-grid": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-06 F-003-16] 年度" }],
  // ── K-S1-08 エネルギー (F-05-13: 9 指標すべて yearFormat=fiscal) ──
  "energy-consumption-structure-shift/energy-map": [{ ...NENDO("2022", ">2022年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  // solar-power-housing-map は外した (2026-09-27): 原典の住宅・土地統計調査は 10 月 1 日時点で公式表記も「令和5年住宅・土地統計調査」。
  // config を yearFormat: calendar に直したので、図の「2023年」が正しく、年度へ書き換えると誤りになる。
  "electricity-demand-gap/electricity-demand-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "energy-infrastructure-gas-electricity/gas-ratio-map": [{ ...NENDO("2016", ">2016年 · 単位：%<"), reason: "[K-S1-08 F-05-13] 年度 (2026-11-03 図の描き直しで題の形が変わったので合わせた)" }],
  // 2026-11-03 図の描き直しで副題が「2023年 · 単位：万KL」の形になったので合わせた
  "gasoline-car-society-map/gasoline-map": [{ ...NENDO("2023", ">2023年 · 単位：万KL<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "gasoline-car-society-map/gasoline-ranking": [{ ...NENDO("2023", ">2023年 · 単位：万KL · 範囲：25.0–424.5<"), reason: "[K-S1-08 F-05-13] 年度" }],
  "manufacturing-aichi-dominance/manufacturing-trend": [{ ...NENDO("2023", ">1990〜2023年・全国（47都道府県の合計）<"), reason: "[K-S1-09 v6 A01] 本文・表・第0章の「年度」にそろえる" }],
  "manufacturing-aichi-dominance/manufacturing-employees-trend": [{ ...NENDO("2023", ">1990〜2023年（2015年は欠測）・全国（47都道府県の合計）<"), reason: "[K-S1-09 v6 A01] 本文・表・第0章の「年度」にそろえる" }],
  // ── K-S1-10 安全と環境 (F-B-01: 社会・人口統計体系 13 指標は年度。N20: 保険散布図の題名と縦軸) ──
  "crime-rate-regional-gap/theft-ranking": [{ ...NENDO("2023", ">2023年 · 単位：件 · 範囲：1.68–6.65<"), reason: "[K-S1-10 F-B-01] 年度 (2026-11-03 図の描き直しで題の形が変わったので合わせた)" }],
  "crime-rate-regional-gap/theft-map": [{ ...NENDO("2023", ">2023年 · 単位：件<"), reason: "[K-S1-10 F-B-01] 年度 (2026-11-03 図の描き直しで題の形が変わったので合わせた)" }],
  "crime-rate-regional-gap/arrest-rate-ranking": [{ ...NENDO("2023", ">2023年 · 単位：% · 範囲：26.7–72.7<"), reason: "[K-S1-10 F-B-01] 年度 (2026-11-03 図の描き直しで題の形が変わったので合わせた)" }],
  "workplace-accident-regional-map/frequency-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/severity-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/freq-severity-scatter": [{ ...NENDO("2023", ">労災の頻度 × 重さ（47都道府県・2023年）<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/avg-payment-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "workplace-accident-regional-map/workers-compensation-insurance-benefits-rate-prefecture-rankings": [{ ...NENDO("2023", ">労働者災害補償保険給付率 都道府県ランキング（2023年）<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "pollution-complaints-regional-map/complaints-ranking": [{ ...NENDO("2023", ">　2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "pollution-complaints-regional-map/complaints-map": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  "waste-management-recycling-gap/recycling-tilemap": [{ ...NENDO("2023", ">2023年<"), reason: "[K-S1-10 F-B-01] 年度" }],
  // ── 2026-11-03 KINDLE-QUALITY-LOOP-01: 600px 幅の図の評価で、図だけでは指標・年・単位が分からなかった図 ──
  "mackerel-expenditure-ranking/mackerel-expenditure-ranking": [
    { before: 'class="svg-title">都道府県別ランキング<', after: 'class="svg-title">さば消費支出額（2024年・円）<', reason: "[K-S1-02 図の評価] 題が『都道府県別ランキング』だけで指標・年・単位が無い" },
  ],
  // taiwan-guest-map は図の描き直しで題に指標・年・単位が入ったので校訂を外した
  "inbound-by-nationality-regional-preference/usa-guests-ranking": [
    { before: 'class="svg-title">都道府県別ランキング<', after: 'class="svg-title">米国人延べ宿泊者数（2024年・人泊）<', reason: "[K-S1-07 図の評価] 描き直し後の題が『都道府県別ランキング』だけで指標・年・単位が無い" },
  ],
  "inbound-by-nationality-regional-preference/nationality-composition-top15": [
    { before: ">国籍別 外国人宿泊者構成（上位15県）<", after: ">国籍別 外国人延べ宿泊者数（2024年・人泊・上位15県）<", reason: "[K-S1-07 図の評価] 年と単位が図に無い" },
  ],
  "overseas-travel-gap/income-vs-travel-scatter": [
    { before: ">海外旅行の年間行動者率 と 課税対象所得 の関係<", after: ">海外旅行の年間行動者率（2001年）と 課税対象所得（2024年度）<", reason: "[K-S1-07 図の評価・v6 レビュー B02] 2 つの指標の年が離れていることが図に無い。課税対象所得は本文どおり 2024年度" },
  ],
  "earthquake-insurance-prefecture-gap/insurance-damage-scatter": [
    { before: ">地震保険料 × 災害被害額<", after: ">火災・地震保険料支出 × 災害被害額<", reason: "[K-S1-10 N20] 指標は火災・地震保険料の消費支出額" },
    { ...NENDO("2023", ">災害被害額（1人当たり・円・2023年）<"), reason: "[K-S1-10 N20] 災害被害額 (社会・人口統計体系) は年度。横軸の家計調査 2024年 は暦年のまま" },
  ],
  // ── 2026-11-03 v7 差分レビュー: 年度の値を「年」と書いた図・Web 記事の名残の題 ──
  "real-disposable-income-reversal/per-capita-prefectural-income-h27-prefecture-rankings": [{ ...NENDO("2021", ">2021年 · 単位：万円 · 範囲：225.8–576.1<"), reason: "[K-S1-01 v7 B01] 県民所得は年度 (本文・alt・全県表は 2021年度)" }],
  "expenditure-structure-comparison/welfare-ratio-ranking": [{ ...NENDO("2022", ">2022年 · 単位：% · 範囲：10.81–21.77<"), reason: "[K-S1-01 v7 B04] 民生費割合 (都道府県財政) は年度" }],
  "expenditure-structure-comparison/welfare-ratio-map": [{ ...NENDO("2022", ">2022年 · 単位：%<"), reason: "[K-S1-01 v7 B04] 民生費割合 (都道府県財政) は年度" }],
  "communication-cost-burden/comm-cost-summary-findings": [
    { before: ">この記事でわかったこと<", after: ">この章でわかったこと<", reason: "[K-S1-01 v7 M03] Web 記事の名残" },
    { before: ">携帯電話契約数が多い都市部ほど割合は低い（弱い負の相関）。真因はスマホ料金ではなく自動車<", after: ">携帯電話契約数が多い都市部ほど割合は低い（弱い負の相関）。通信費だけでは割合の差を説明できない<", reason: "[K-S1-01 v8 C01] 本文は自動車関連費を主因と断定していない" },
    { before: ">関連費<", after: ">（自動車関連費の実額は本章では未確認）<", reason: "[K-S1-01 v8 C01] 同上 (2 行目)" },
  ],
  "education-cost-per-child/elementary-cost-ranking": [{ ...NENDO("2022", ">2022年 · 単位：万円 · 範囲：64.4–109.5<"), reason: "[K-S1-05 v7 B01] 地方教育費調査は会計年度" }],
  "education-cost-per-child/elementary-cost-map": [{ ...NENDO("2022", ">2022年 · 単位：万円<"), reason: "[K-S1-05 v7 B01] 地方教育費調査は会計年度" }],
  "education-expenses-gap/education-per-student-ranking": [{ ...NENDO("2022", ">2022年 · 単位：万円 · 範囲：82.0–147.2<"), reason: "[K-S1-05 v7 B02] 本文・全県表は 2022年度" }],
  "education-expenses-gap/education-per-student-map": [{ ...NENDO("2022", ">2022年 · 単位：万円<"), reason: "[K-S1-05 v7 B02] 本文・全県表は 2022年度" }],
  "education-expenses-gap/education-summary-findings": [
    { before: ">この記事でわかったこと<", after: ">この章でわかったこと<", reason: "[K-S1-05 v7 M01] Web 記事の名残" },
    { before: ">人口が少ない県ほど1人当たり教育費が高い──小規模校の維持コストが影響<", after: ">人口が少ない県ほど1人当たり教育費が高い──小規模校の維持費が一因の可能性<", reason: "[K-S1-05 v7 M01] 因果の断定 (本章に学校規模のデータは無い)" },
  ],
  "university-advancement-capacity/capacity-index-map": [{ ...NENDO("2024", ">2024年<"), reason: "[K-S1-05 v7 B03] 学校基本調査の年度値 (title と表示の 2 か所)" }],
};

/** 横幅 1080 の型の図の題 (72px)。左右の余白 64px を除いた幅に収まらない題は字を小さくする */
const WIDE_TITLE = /<text([^>]*?)font-size="72"([^>]*)>([^<]+)<\/text>/g;

/**
 * どの図にも当てる書籍版の直し (2026-11-03 v6 差分レビュー: ブログの図の一括の描き直しの型の不具合)。
 * - 出典名の入っていない「出典：」だけの行を消す (各章の「データ出典」節に出典がある)
 * - 横幅 1080 の型で、題が右端で切れるものは字を小さくして収める (「…都道府県ランキ」で切れていた)
 */
export function fixFigureTemplate(svg: string): string {
  const widthMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /);
  const width = widthMatch ? Number(widthMatch[1]) : 0;
  return svg
    .replace(/<text\b[^>]*>出典[：:]\s*<\/text>/g, "")
    .replace(WIDE_TITLE, (all, pre: string, post: string, text: string) => {
      const fit = Math.floor((width - 128) / [...text].length);
      return width > 0 && fit < 72 ? `<text${pre}font-size="${fit}"${post}>${text}</text>` : all;
    });
}

/**
 * 文字列の置換では直せない図の書籍版の直し。
 * - manufacturing-ranking: 「58,021,789 百万円」が長く、先頭の桁が県名に重なる (愛知県8,021,789 と読める。K-S1-09 v7 F02)。兆円にして短くする
 */
const FIGURE_TRANSFORMS: Readonly<Record<string, (svg: string) => string>> = {
  "manufacturing-aichi-dominance/manufacturing-ranking": (svg) =>
    svg.replace(/>([\d,]+) 百万円</g, (_all, n: string) => `>${(Number(n.replace(/,/g, "")) / 1_000_000).toFixed(1)}兆円<`),
};

/** SVG 文字列に図の校訂を当てる。before が 1 回も無ければ R2 の図が変わったので止める。 */
export function correctBookFigure(slug: string, name: string, svg: string): string {
  for (const c of KINDLE_FIGURE_CORRECTIONS[`${slug}/${name}`] ?? []) {
    if (!svg.includes(c.before)) {
      throw new Error(`Figure correction source changed: ${slug}/${name} (${c.before}). Re-check the R2 figure before generating an edition.`);
    }
    svg = svg.split(c.before).join(c.after);
  }
  const transform = FIGURE_TRANSFORMS[`${slug}/${name}`];
  return fixFigureTemplate(transform ? transform(svg) : svg);
}
