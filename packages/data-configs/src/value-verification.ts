/**
 * 「疑わしい値分布」を洗い出し、検証済みプロファイルと突き合わせる純関数。
 *
 * ## shape-gate との役割分担
 *
 * `shape-gate.ts` は **確実に壊れていると言えるものだけ**を error にする
 * (誤検知を出すゲートは運用で無効化されるため)。その結果、判断が割れる帯
 * — ゼロ率 50-90% の 16 件など — を「検知しない」と捨てていた。
 *
 * ここは逆向きで **広く疑い、検証済みのものだけ通す**。捨てていた帯を全部拾い、
 * agent が中身を見て `VERIFIED_VALUE_PROFILES` に根拠つきの予測を書くまで
 * `unverified` として残す。
 *
 * ## なぜ機械だけで分離できないのか (2026-08-04 実測)
 *
 * 「経年でゼロ率が急増したものだけ拾えば agent 検証なしで壊れだけ取れる」を試して**失敗した**:
 *
 * | key | 最新ゼロ率 | 前年比 jump | 実態 |
 * |---|---|---|---|
 * | bowling-alley-public | 1.00 | +0.02 | 壊れ (ずっと壊れているので jump が出ない) |
 * | unemployment-measures-project-... | 1.00 | +0.00 | 壊れ (同上) |
 * | geothermal-power-plant-count | 0.85 | 比較不能 | 正当 (年が 1 つしかない) |
 * | fishery-species-catch-scallop | 0.33 | **+0.33** | jump は最大だが正当かもしれない |
 *
 * 壊れているものほど**ずっと壊れている**ので経年差が出ず、年が 1 つしかなく比較不能なものが
 * 8 件あり、その中に確定バグ (gini) が入っていた。**分離に必要な情報はデータの形の中に無く、
 * 指標が何を数えているかという意味の側にしかない** → agent 検証が要る、という結論。
 *
 * ## 取り込み層には配線しない
 *
 * これは監査層 (週次) 専用。取り込み (`page-data-batch`) で未検証を止めると、新しい metric を
 * 投入するたびに日次 data-refresh が止まる。取り込みは shape-gate の error 検査だけが止める。
 *
 * 正典: `.claude/rules/metric-config-standards.md` §検証済みプロファイル方式
 */
import type { ShapeSummary } from "./shape-gate";
import type { VerifiedValueProfile } from "./verified-value-profiles";

/** 疑いの種類 */
export type ValueSuspicion =
  /** 最新年のゼロ率が高い */
  | "zero-suspicion"
  /** 最新年の県数が少ない */
  | "thin-suspicion"
  /** 負値がある */
  | "negative-suspicion";

/**
 * ゼロ率がこれ以上なら疑う。
 *
 * shape-gate の `zero-heavy` (0.9・warn) より**大幅に緩い**のが意図。あちらは
 * 「確実に異常」だけを拾うが、ここは「正当と確認できていないものを全部拾う」。
 * 0.3 は実測で 33 件 (1.5%) に当たる水準で、検証キャンペーンで消化できる規模。
 */
export const ZERO_SUSPICION_THRESHOLD = 0.3;

/**
 * 最新年の県数がこれ未満なら疑う。
 *
 * shape-gate の `area-coverage` は「前より減った」ときだけ error にするので、
 * **最初から少ないもの**は素通りする。ここはその穴を埋める (実測 19 件)。
 */
export const THIN_SUSPICION_THRESHOLD = 40;

/** 1 metric の判定結果 */
export interface ValueVerificationResult {
  key: string;
  /** 検出された疑い。空なら疑いなし */
  suspicions: ValueSuspicion[];
  /**
   * - `clean`: 疑いなし
   * - `verified`: 疑いはあるが profile が全部 cover し、予測の範囲内
   * - `unverified`: profile が無い / 疑いを cover していない
   * - `profile-violated`: profile はあるが**予測を破った** = 再検証が要る
   */
  status: "clean" | "verified" | "unverified" | "profile-violated";
  /** 観測値 (レポート・キュー出力用) */
  observed: {
    latestYearCode: string | null;
    rowCount: number;
    zeroShare: number | null;
    negativeCount: number;
  };
  /** profile-violated / unverified の理由 (1 行) */
  reasons: string[];
}

/** 最新年の観測値を取り出す */
function observeLatest(summary: ShapeSummary): ValueVerificationResult["observed"] {
  const year = summary.latestYearCode;
  const s = year ? summary.perYearValueStats[year] : undefined;
  return {
    latestYearCode: year,
    rowCount: year ? (summary.perYearAreaCount[year] ?? 0) : 0,
    zeroShare: s && s.finite > 0 ? s.zeroCount / s.finite : null,
    negativeCount: s?.negativeCount ?? 0,
  };
}

/**
 * 疑わしい値分布を検出し、検証済みプロファイルと突き合わせる。
 *
 * @param key rankingKey
 * @param summary `summarizeShape` の出力 (取得済み payload から作る = 追加 fetch 不要)
 * @param profiles `VERIFIED_VALUE_PROFILES`
 */
export function classifyValueSuspicion(
  key: string,
  summary: ShapeSummary,
  profiles: readonly VerifiedValueProfile[],
): ValueVerificationResult {
  const observed = observeLatest(summary);
  const suspicions: ValueSuspicion[] = [];

  // 行が 1 件も無い metric はここの管轄外 (expected-empty.ts / shape-gate が扱う)
  if (summary.rowCount === 0) {
    return { key, suspicions, status: "clean", observed, reasons: [] };
  }

  if (observed.zeroShare !== null && observed.zeroShare >= ZERO_SUSPICION_THRESHOLD) {
    suspicions.push("zero-suspicion");
  }
  if (observed.rowCount > 0 && observed.rowCount < THIN_SUSPICION_THRESHOLD) {
    suspicions.push("thin-suspicion");
  }
  if (observed.negativeCount > 0) {
    suspicions.push("negative-suspicion");
  }

  if (suspicions.length === 0) {
    return { key, suspicions, status: "clean", observed, reasons: [] };
  }

  const profile = profiles.find((p) => p.key === key);
  if (!profile) {
    return {
      key,
      suspicions,
      status: "unverified",
      observed,
      reasons: [`検証プロファイル未登録 (疑い: ${suspicions.join(", ")})`],
    };
  }

  // profile がその疑いを cover しているか + 予測を守っているかを疑いごとに見る
  const violated: string[] = [];
  const uncovered: string[] = [];

  for (const s of suspicions) {
    if (s === "zero-suspicion") {
      if (profile.zeroShareMax === undefined) {
        uncovered.push("zeroShareMax 未記載なのにゼロ率が高い");
      } else if (observed.zeroShare !== null && observed.zeroShare > profile.zeroShareMax) {
        violated.push(
          `ゼロ率 ${observed.zeroShare.toFixed(3)} が検証時の予測 ${profile.zeroShareMax} を超えた`,
        );
      }
    } else if (s === "thin-suspicion") {
      if (profile.rowCountMin === undefined) {
        uncovered.push("rowCountMin 未記載なのに県数が少ない");
      } else if (observed.rowCount < profile.rowCountMin) {
        violated.push(
          `県数 ${observed.rowCount} が検証時の下限 ${profile.rowCountMin} を下回った`,
        );
      }
    } else {
      if (profile.negativesAllowed !== true) {
        uncovered.push("negativesAllowed 未許可なのに負値がある");
      }
    }
  }

  // 予測を破った方を優先して報告する (未 cover より深刻 = 検証が古くなった証拠)
  if (violated.length > 0) {
    return { key, suspicions, status: "profile-violated", observed, reasons: violated };
  }
  if (uncovered.length > 0) {
    return { key, suspicions, status: "unverified", observed, reasons: uncovered };
  }
  return { key, suspicions, status: "verified", observed, reasons: [] };
}
