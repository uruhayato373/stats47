/**
 * 形状違反を明示的に許可した metric の一覧。
 *
 * ★このファイルの `EXPECTED_SHAPE_ANOMALY` 配列は **生成物**。手で書かない。
 *   再生成: `npx tsx packages/data-configs/scripts/scan-stats-shape.ts --emit-allowlist`
 *   194 件を手書きすると必ず写し間違えるため、走査スクリプトの出力を貼る。
 *
 * ## なぜ allowlist が要るか
 *
 * 2026-07-30 に形状ゲート (`shape-gate.ts`) を導入した時点で、active 2,179 metric のうち
 * **194 件が既に壊れていた**。ゲートをそのまま有効にすると全 metric の配信更新が止まり、
 * 健全な 1,984 件まで巻き添えになる。既知分を期限つきで登録し、是正しながら減らす。
 *
 * ## allowlist を腐らせない 3 つの仕掛け
 *
 * 1. `until` (失効日) が必須。期限を過ぎたエントリは許可として扱われず違反に戻る。
 * 2. `observedSeverity` を持ち、**現在値がこれ以下のときだけ**降格する。悪化したら error に戻る。
 * 3. `MAX_KNOWN_BROKEN` のラチェット (下記)。是正のたびにこの定数を下げる。増やす変更は
 *    テストが落ちるので、新しい壊れ方を allowlist に足して誤魔化すことができない。
 *
 * 正典: `.claude/rules/metric-config-standards.md` / 追跡: `docs/todo/05_機能バックログ.md`
 * の `[RANKING-VALUES-PARTITION-INTEGRITY-01]`
 */
import type { ExpectedShapeAnomalyEntry } from "./shape-gate";

/**
 * エントリ数の上限 (縮小専用ラチェット)。
 *
 * 是正して allowlist からエントリを消したら**この定数も下げる**。
 * 上げる変更は原則しない (新しい壊れ方は allowlist ではなく config の是正で解決する)。
 *
 * ## 14 → 15 に上げた例外 (2026-07-31・オーナー判断)
 *
 * `commuter-ratio-from-other-municipalities` (city) を `disposition: "legitimate"` で
 * 登録するため。**新しい壊れ方ではない** — 実測して「値は正当で、閾値の側が比率系の
 * 市区町村データに合っていない」と確定した (詳細は当該エントリの reason)。
 * このラチェットが止めたいのは「壊れたものを allowlist で緑にする」ことなので、
 * legitimate と確認できたものは対象外と判断した。
 *
 * 壊れている (`known-broken`) エントリは 14 件のままで増えていない。
 */

export const MAX_KNOWN_BROKEN = 15;

/**
 * 値の分布検査 (`VALUE_CHECKS`) 側の上限 (縮小専用ラチェット・2026-08-04 新設)。
 *
 * 器の形を見る既存 4 検査とは**別枠**にする。同じ枠に混ぜると「既存分を是正して空いた枠に
 * 新しい壊れ方を入れる」ができてしまい、ラチェットが意味を失う。
 *
 * 現在の 3 件は 2026-08-04 に active 2,176 件を全走査して確定した既知分
 * (`constant-value` = 最新年の全 47 県が同値)。是正したらこの定数も下げる。
 */
export const MAX_KNOWN_BROKEN_VALUE = 3;

export const EXPECTED_SHAPE_ANOMALY: readonly ExpectedShapeAnomalyEntry[] = [
  // --- 値の分布検査 (2026-08-04 追加・VALUE_CHECKS ファミリー) ---------------
  // いずれも「最新年の全 47 県が同じ値 0」で順位が成立しない。ゲート追加前から
  // 配信されており、是正 (config 修正 or isActive 見直し) はオーナー判断のため
  // 期限つきで許可する。放置防止は docs/todo/01_未整理タスク.md の記録と until。
  {
    key: "gini-coefficient-disposable-income",
    check: "constant-value",
    disposition: "known-broken",
    observedSeverity: 1,
    reason:
      "2026-08-04 実測: 等価可処分所得ジニ係数 (2019) の全 47 県が 0。ジニ係数は定義上 0 に " +
      "なりえないので cdCat / tab の選択誤りで別系列を取っている。config 是正 + 再取り込みが要る",
    issue: "docs/todo/01_未整理タスク.md (2026-08-04)",
    until: "2026-12-31",
  },
  {
    key: "bowling-alley-public",
    check: "constant-value",
    disposition: "known-broken",
    observedSeverity: 1,
    reason:
      "2026-08-04 実測: 公共ボウリング場数 (2021) の全 47 県が 0。最良の年 (2015) でも値 1 の県が " +
      "2 つだけで順位が成立しない。データは正しく実態が 0 なので config 是正ではなく isActive の見直し対象",
    issue: "docs/todo/01_未整理タスク.md (2026-08-04)",
    until: "2026-12-31",
  },
  {
    key: "unemployment-measures-project-expenses-prefecture",
    check: "constant-value",
    disposition: "known-broken",
    observedSeverity: 1,
    reason:
      "2026-08-04 実測: 失業対策事業費 (2022) の全 47 県が 0。2007-2013 と 2022 が全件 0 で、" +
      "失業対策事業は 1996 年に廃止済み。実態が 0 なので isActive の見直し対象",
    issue: "docs/todo/01_未整理タスク.md (2026-08-04)",
    until: "2026-12-31",
  },
  // --- 器の形の検査 (2026-07-30 導入時の既知分) -----------------------------
  {
    key: "employment-insurance-daily-receipt-rate",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 1545.5,
    reason: "2026-07-30 実測: unit が % なのに最大値 1545.5。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "future-burden-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 330.8,
    reason: "2026-07-30 実測: unit が % なのに最大値 330.8。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "local-debt-current-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 256.5,
    reason: "2026-07-30 実測: unit が % なのに最大値 256.5。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "food-self-sufficiency-rate-calorie",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 223,
    reason: "2026-07-30 実測: unit が % なのに最大値 223。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "day-time-population-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 122,
    reason: "2026-07-30 実測: unit が % なのに最大値 122。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "current-balance-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 117.4,
    reason: "2026-07-30 実測: unit が % なのに最大値 117.4。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "daytime-population-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 116.14287,
    reason: "2026-07-30 実測: unit が % なのに最大値 116.14287。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "psychiatric-hospital-bed-occupancy-rate",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 115.2,
    reason: "2026-07-30 実測: unit が % なのに最大値 115.2。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "nursery-utilization-rate",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 113.2,
    reason: "2026-07-30 実測: unit が % なのに最大値 113.2。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "city-gas-supply-area-household-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 106.7,
    reason: "2026-07-30 実測: unit が % なのに最大値 106.7。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "water-supply-population-ratio-2012on",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 101.6,
    reason: "2026-07-30 実測: unit が % なのに最大値 101.6。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "flush-toilet-population-ratio",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 101.2,
    reason: "2026-07-30 実測: unit が % なのに最大値 101.2。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "water-supply-population-ratio-pre2011",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 100.9,
    reason: "2026-07-30 実測: unit が % なのに最大値 100.9。率ではなく実数が入っている。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  {
    key: "convenience-store-count-commercial",
    check: "duplicate-area-year",
    disposition: "known-broken",
    observedSeverity: 2,
    reason: "2026-07-30 実測: 同一 (県, 年) に最大 2 行。分類軸の絞り忘れ。是正待ち",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2026-12-31",
  },
  // ★このエントリだけ scan-stats-shape の生成物ではなく手書き。
  //   走査スクリプトは値しか見ないので「壊れている」としか出力できず、
  //   legitimate かどうかは指標の意味を知らないと判定できない (2026-07-31)。
  {
    key: "commuter-ratio-from-other-municipalities",
    check: "percent-out-of-range",
    entities: ["city"],
    disposition: "legitimate",
    observedSeverity: 9640,
    reason:
      "2026-07-31 実測: 市区町村の最大 9,640%。これは壊れたデータではなく正当な値。" +
      "この指標は「他市区町村からの通勤流入 ÷ 居住就業者」なので、居住者に対して流入が" +
      "桁違いに多い自治体では 100% を大きく超える。実測の上位は 07548 大熊町 9,640%" +
      "(2015・避難で居住就業者がほぼゼロ、廃炉作業員が流入) と 13101 千代田区 3,907%" +
      "(1995)。e-Stat のメタも都道府県表 0000010206 / 市区町村表 0000020306 の両方で" +
      "#F02702 が同名・単位 ％ で一致しており、コードの取り違えでもない。" +
      "都道府県粒度は最大 93.6% で閾値内なので city のみを対象にする。",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    // legitimate なので「是正期限」ではなく**再確認の期限**。閾値側 (percent-out-of-range の
    // error 1000) を比率系の市区町村データに合わせて見直せば、この登録は不要になる。
    until: "2027-07-31",
  },
];
