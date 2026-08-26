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
 * `legitimate` は統計定義上の例外であり、壊れたデータの返済残数には含めない。
 * テストも `disposition === "known-broken"` だけを数える。2026-08-26 に旧13件を
 * 一次資料とR2の焼き込み済みrecipeで再検証し、すべて正当値と確定したため0へ縮小した。
 */

export const MAX_KNOWN_BROKEN = 0;

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
    key: "day-time-population-ratio",
    check: "percent-out-of-range",
    entities: ["city"],
    disposition: "legitimate",
    observedSeverity: 7917.1,
    reason:
      "2026-08-26 e-Stat 市区町村表 0000020201 / A6108 を直接実測。最大は飯舘村2015年の7917.1％で、同表の昼間人口3246人÷夜間人口41人×100=7917.1％と一致。公式定義上100％超に上限はなく、避難で夜間人口が極端に小さい年の正当値",
    issue: "DATA-REFRESH-ZEROGATE-ALLORNOTHING-01",
    until: "2027-08-31",
  },
  {
    key: "commuter-ratio-from-other-municipalities",
    check: "percent-out-of-range",
    entities: ["city"],
    disposition: "legitimate",
    observedSeverity: 9640,
    reason:
      "2026-08-26 e-Stat 市区町村表 0000020306 / #F02702 を直接実測。単位は％のまま最大9640（葛尾村2015年）で、千代田区など流入通勤者が常住就業者を上回る地域も継続して100％超。百分率上限の一般則を適用できない正当値",
    issue: "DATA-REFRESH-ZEROGATE-ALLORNOTHING-01",
    until: "2027-08-31",
  },
  {
    key: "employment-insurance-daily-receipt-rate",
    check: "percent-out-of-range",
    disposition: "legitimate",
    observedSeverity: 1545.5,
    reason:
      "2026-08-26 e-Stat 0000010206 / #F07201 と計算式を直接確認。福島県1994年度は受給者実人員170人÷日雇労働被保険者11人×100=1545.5％で公式値と一致。期間内受給者を時点被保険者で割るため100％上限を適用できない正当値",
    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",
    until: "2027-08-31",
  },
];
