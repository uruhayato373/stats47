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
 * 正典: `.claude/rules/metric-config-standards.md` / 追跡: `.claude/todo/backlog.md`
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

export const MAX_KNOWN_BROKEN = 14;

/**
 * 値の分布検査 (`VALUE_CHECKS`) 側の上限 (縮小専用ラチェット・2026-08-04 新設)。
 *
 * 器の形を見る既存 4 検査とは**別枠**にする。同じ枠に混ぜると「既存分を是正して空いた枠に
 * 新しい壊れ方を入れる」ができてしまい、ラチェットが意味を失う。
 *
 * 2026-08-04 に登録した 3 件 (`constant-value` = 最新年の全 47 県が同値) は
 * **2026-08-05 に該当 metric を退役 (isActive:false + GONE) して解消したので 0 に下げた**。
 * 値分布の欠陥は allowlist で緑にするのではなく、metric を直すか退役させる方が筋が良い
 * (順位が成立しないページを公開し続ける理由が無い)。
 */
export const MAX_KNOWN_BROKEN_VALUE = 0;

export const EXPECTED_SHAPE_ANOMALY: readonly ExpectedShapeAnomalyEntry[] = [
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
];
