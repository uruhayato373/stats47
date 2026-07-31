/**
 * reingest-need — 「config は直っているのに配信データが古いまま」を機械的に判定する。
 *
 * ## なぜ要るか (2026-07-31)
 *
 * 分類軸の絞り忘れで壊れた metric は `EXPECTED_SHAPE_ANOMALY` に `known-broken` として
 * 登録され、`until` まで CI を赤くしない扱いになる。ところが**この allowlist は「いま R2 に
 * あるデータが壊れている」ことしか言わない**。config を是正しても再取り込みが走らなければ
 * 配信は古いままで、その状態を指す仕組みが無かった。
 *
 * 実例: `convenience-store-count-commercial` は 2026-07-30 の commit aa5f7c37 で config を
 * 是正し、e-Stat を実際に叩いて 47県×1行になることまで確認済み。にもかかわらず R2 は
 * 94 行 (重複 47 県・値域 -1.7〜7233) のまま。**再取り込みすれば直る**のに、それが
 * 誰にも見えていなかった。
 *
 * ## 検査(k) (レシピ整合) との違い
 *
 * `audit-ranking-data-integrity.ts` の検査(k) は `meta.recipe.configHash` を突き合わせて
 * 同じ乖離を捉える設計で、狙いはこのケースそのもの。ただしレシピ導入 (2026-07-30) 以前に
 * 書かれた payload には recipe が無く `unbaked` (違反ではなく残数) に落ちるため、
 * **全面再生成が終わるまで発火しない**。本モジュールは recipe を必要とせず、
 * 「config の最終更新日」と「データの生成日」だけで判定するので、その空白を埋める。
 *
 * ## 判定
 *
 * config の方が新しい → 再取り込みで直る (`stale-delivery`)。
 * データの方が新しい → 是正後に取り込んでもまだ壊れている = config の直しが足りない
 * (`config-insufficient`)。これは別の対処が要るので混同しない。
 */

export type ReingestVerdict =
  /** config を直した後にデータが再生成されていない。再取り込みで直る */
  | "stale-delivery"
  /** 是正後に取り込んでも壊れている。config の直しが足りない (再取り込みでは直らない) */
  | "config-insufficient"
  /** config の更新日かデータの生成日が取れず判定できない */
  | "unknown";

export interface ReingestInput {
  key: string;
  /** metric config ファイルの最終更新 (git の author date)。取れなければ null */
  configModifiedAt: string | null;
  /** 配信データの生成日時 (R2 payload の meta.generatedAt)。取れなければ null */
  dataGeneratedAt: string | null;
}

export interface ReingestAssessment extends ReingestInput {
  verdict: ReingestVerdict;
  /** 人が次の一手を決められる 1 行 */
  note: string;
  /**
   * 形状 allowlist に `known-broken` で載っているか。
   * **優先度の材料であって判定条件ではない** — allowlist は是正済みほど外れるので、
   * 載っていないことは「健全」を意味しない。
   */
  knownBroken?: boolean;
}

function parse(ts: string | null): number | null {
  if (!ts) return null;
  const t = Date.parse(ts);
  return Number.isFinite(t) ? t : null;
}

/**
 * 1 件を判定する。
 *
 * 同時刻 (config とデータの差が閾値未満) は `config-insufficient` に倒す。取り込みの直後に
 * config を触った、という順序は稀で、**「直したのに古い」と誤って報告するより「まだ壊れている」
 * と報告する方が安全**だから。前者は再取り込みという無駄な作業を促し、後者は調査を促す。
 */
export function assessReingestNeed(input: ReingestInput): ReingestAssessment {
  const cfg = parse(input.configModifiedAt);
  const data = parse(input.dataGeneratedAt);

  if (cfg === null || data === null) {
    const missing = [cfg === null && "config 更新日", data === null && "データ生成日"]
      .filter(Boolean)
      .join(" と ");
    return { ...input, verdict: "unknown", note: `${missing} が取得できず判定不能` };
  }

  if (cfg > data) {
    const days = Math.floor((cfg - data) / 86_400_000);
    return {
      ...input,
      verdict: "stale-delivery",
      note: `config はデータより ${days} 日新しい — 再取り込みで直る見込み`,
    };
  }

  return {
    ...input,
    verdict: "config-insufficient",
    note: "是正後に取り込んでもこの形 — config の直しが足りない (再取り込みでは直らない)",
  };
}

export interface ReingestSummary {
  total: number;
  staleDelivery: string[];
  configInsufficient: string[];
  unknown: string[];
}

export function summarizeReingest(assessments: readonly ReingestAssessment[]): ReingestSummary {
  return {
    total: assessments.length,
    staleDelivery: assessments.filter((a) => a.verdict === "stale-delivery").map((a) => a.key),
    configInsufficient: assessments
      .filter((a) => a.verdict === "config-insufficient")
      .map((a) => a.key),
    unknown: assessments.filter((a) => a.verdict === "unknown").map((a) => a.key),
  };
}
