import "server-only";

import type { RankingItem } from "@stats47/ranking";
import { listRankingItems, listRankingValues } from "@stats47/ranking/server";
import { exportCorrelationSnapshot } from "../exporters/correlation-snapshot";
import { exportCorrelationPerKeySnapshots } from "../exporters/per-key-snapshot";
import { upsertCorrelation } from "../repositories/upsert-correlation";
import { isExcludedCorrelationKey, isExcludedCorrelationPair } from "../trivial-pairs";
import { buildScatterData, calculatePartialR, calculatePearsonR } from "../utils/calculate-pearson";

const MIN_DATA_POINTS = 30;
const AREA_TYPE = "prefecture";
/** 個別ペア失敗時のログは最大この件数まで。それ以降はサマリのみ。 */
const MAX_ERROR_LOGS = 5;
const LOG_INTERVAL_PERCENT = 10;

/** 偏相関計算に使う制御変数 */
const CONTROL_VARIABLES = [
  { key: "total-population", column: "partialRPopulation" },
  { key: "total-area-excluding-northern-territories-and-takeshima", column: "partialRArea" },
  { key: "ratio-65-plus", column: "partialRAging" },
  { key: "population-density-per-km2-total-area", column: "partialRDensity" },
] as const;

/**
 * 補数関係にあるランキングキーのグループ。
 * 同グループ内のペアは合計が一定値（100%等）になるため相関が自明であり除外する。
 */
const COMPLEMENTARY_GROUPS: string[][] = [
  // 産業別就業者比率（第1次 + 第2次 + 第3次 ≒ 100%）
  [
    "employed-people-ratio-primary",
    "employed-people-ratio-secondary",
    "employed-people-ratio-tertiary",
    "secondary-employed-people-ratio-tertiary",
  ],
  // 産業別事業所数構成比
  [
    "secondary-industry-establishment-ratio",
    "tertiary-industry-establishment-ratio",
    "secondary-industry-establishment-ratio-census",
    "tertiary-industry-establishment-ratio-census",
  ],
  // 住宅所有形態（持ち家 + 借家 ≒ 100%）
  [
    "owner-occupied-housing-ratio",
    "rented-housing-ratio",
    "private-rented-housing-ratio",
  ],
  // 住宅構造（一戸建 + 共同住宅 + 長屋建 ≒ 100%）
  [
    "detached-house-ratio",
    "apartment-ratio",
    "row-house-ratio",
  ],
  // 就業地・人口流出入（県内就業 + 流出 ≒ 100%）
  [
    "in-prefecture-employed-people-ratio",
    "outflow-population-ratio",
    "inflow-population-ratio",
  ],
  // 財政支出構成・性質別（義務的経費・投資的経費等）
  [
    "personnel-expenditure-ratio-pref-finance",
    "assistance-expenditure-ratio-pref-finance",
    "investment-expenditure-ratio-pref-finance",
    "ordinary-construction-expenditure-ratio-pref-finance",
  ],
  // 事業所規模別割合（事業所数）
  [
    "establishment-ratio-1-4-employees-private",
    "establishment-ratio-5-9-employees-private",
    "establishment-ratio-10-29-employees-private",
    "establishment-ratio-300plus-employees-private",
  ],
  // 年齢3区分構成比（15歳未満 + 15-64歳 + 65歳以上 = 100%）
  [
    "young-population-ratio",
    "production-age-population-ratio",
    "ratio-65-plus",
  ],
  // 事業所規模別割合（従業者数）
  [
    "employee-ratio-1-4-employee-establishments-private",
    "employee-ratio-5-9-employee-establishments-private",
    "employee-ratio-10-29-employee-establishments-private",
    "employee-ratio-100-299-employee-establishments-private",
    "employee-ratio-300plus-employee-establishments-private",
  ],
  // 大学学生数割合（国立 + 公立 + 私立 ≒ 100%）
  [
    "national-university-student-ratio",
    "public-university-student-ratio",
    "private-university-student-ratio",
  ],
  // 最終学歴構成比（小中卒 + 高校卒 + 短大高専卒 + 大学大学院卒 ≒ 100%）
  [
    "final-education-elementary-junior-high-ratio",
    "final-education-highschool-old-junior-high-ratio",
    "final-education-junior-college-technical-college-ratio",
    "final-education-university-graduate-school-ratio",
  ],
  // 評価総地積割合（田 + 畑 + 宅地 + 総地積 の構成）
  [
    "total-assessed-land-area-ratio",
    "total-assessed-land-area-ratio-residential",
    "total-assessed-land-area-ratio-paddy",
    "total-assessed-land-area-ratio-field",
  ],
  // 歳出目的別構成比（民生費 + 教育費 + 土木費 + ... ≒ 100%）
  [
    "welfare-expenditure-ratio-pref-finance",
    "education-expenditure-ratio-pref-finance",
    "public-works-expenditure-ratio-pref-finance",
    "police-expenditure-ratio-pref-finance",
    "sanitation-expenditure-ratio-pref-finance",
    "agriculture-forestry-fisheries-expenditure-ratio-pref-finance",
    "commerce-industry-expenditure-ratio-pref-finance",
    "labor-expenditure-ratio-pref-finance",
    "disaster-recovery-expenditure-ratio-pref-finance",
  ],
  // 消費支出構成比（食料費 + 住居費 + 光熱水道 + ... ≒ 100%）
  [
    "food-expenditure-ratio-multi-person-households",
    "housing-expenditure-ratio-multi-person-households",
    "utilities-expenditure-ratio-multi-person-households",
    "furniture-household-goods-expenditure-ratio-multi-person-households",
    "clothing-footwear-expenditure-ratio-multi-person-households",
    "healthcare-expenditure-ratio-multi-person-households",
    "transport-communication-expenditure-ratio-multi-person-households",
    "education-expenditure-ratio-multi-person-households",
    "culture-recreation-expenditure-ratio-multi-person-households",
    "other-consumption-expenditure-ratio-multi-person-households",
  ],
];

/** 補数関係グループの高速ルックアップ: rankingKey → グループID */
const complementaryGroupMap = new Map<string, number>();
COMPLEMENTARY_GROUPS.forEach((group, idx) => {
  for (const key of group) {
    complementaryGroupMap.set(key, idx);
  }
});

/**
 * 自明な相関ペアを除外する。
 * - 同タイトルのペア（同指標のバリエーション違い）
 * - 補数関係にあるペア（合計が100%等になる構成比同士）
 * - 明示的な除外リスト（物理法則・部分⊂全体・施設規模連動など）
 */
function isTrivialPair(a: RankingItem, b: RankingItem): boolean {
  // 同タイトル除外
  if (a.title === b.title) return true;
  // 補数関係除外
  const groupA = complementaryGroupMap.get(a.rankingKey);
  const groupB = complementaryGroupMap.get(b.rankingKey);
  if (groupA !== undefined && groupA === groupB) return true;
  // 明示的な除外リスト
  if (isExcludedCorrelationPair(a.rankingKey, b.rankingKey)) return true;
  return false;
}

/**
 * yearCode を正規化する。
 * yearName が混入しているケースに対応:
 *   "2021年度" → "2021", "2024年" → "2024", "2021" → "2021"
 */
function normalizeYearCode(yearCode: string): string {
  return yearCode.replace(/年度?$/, "");
}

/**
 * バッチ進捗のコールバックインターフェース。
 * admin 側の in-memory store などが実装する。
 */
export interface BatchCorrelationObserver {
  onStart(total: number): void;
  onProgress(completed: number, skipped: number, failed: number): void;
  onLog(level: "info" | "warn" | "error", message: string): void;
  isAborted(): boolean;
  onComplete(result: { success: boolean; message?: string; error?: string }): void;
}

/**
 * 相関分析バッチを実行する
 * ranking_items の isActive + prefecture で同一 yearCode のペアを生成し、
 * 各ペアでピアソン相関係数を計算して correlation_analysis に upsert する。
 */
export async function runBatchCorrelation(
  observer: BatchCorrelationObserver
): Promise<void> {
  try {
    const itemsResult = await listRankingItems({
      isActive: true,
      areaType: "prefecture",
    });
    if (!itemsResult.success) {
      observer.onLog(
        "error",
        `ランキング項目の取得に失敗: ${itemsResult.error?.message ?? "不明"}`
      );
      observer.onComplete({
        success: false,
        error: itemsResult.error?.message ?? "データ取得エラー",
      });
      return;
    }

    const allItems = itemsResult.data.filter((item) => item.latestYear?.yearCode);
    // 絶対値（総人口・出生数等）は相関ランキングで常にフィルタされるためバッチ対象外
    const items = allItems.filter((item) => !isExcludedCorrelationKey(item.rankingKey));
    observer.onLog(
      "info",
      `${items.length} 件のランキング項目を相関分析の対象とします（${allItems.length - items.length} 件は除外キー）`
    );
    if (items.length === 0) {
      observer.onLog(
        "warn",
        "対象のランキング項目（最新年度あり）がありません"
      );
      observer.onComplete({ success: true, message: "対象データなし" });
      return;
    }

    // 全キー横断でペアを生成（各キーは自身の latestYear を使用）
    const pairs: {
      keyX: string;
      keyY: string;
      yearX: string;
      yearY: string;
    }[] = [];
    let trivialSkipped = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (isTrivialPair(a, b)) {
          trivialSkipped++;
          continue;
        }
        pairs.push({
          keyX: a.rankingKey,
          keyY: b.rankingKey,
          yearX: normalizeYearCode(a.latestYear!.yearCode),
          yearY: normalizeYearCode(b.latestYear!.yearCode),
        });
      }
    }
    if (trivialSkipped > 0) {
      observer.onLog(
        "info",
        `自明な相関ペア ${trivialSkipped} 件を除外しました（同タイトル・補数関係）`
      );
    }

    const total = pairs.length;
    observer.onStart(total);
    observer.onLog("info", `相関分析を開始します。組み合わせ数: ${total}`);

    // ランキングデータキャッシュ
    interface CachedRankingData {
      valueMap: Map<string, number>;
      rows: { areaCode: string; areaName: string; value: number }[];
    }
    const rankingDataCache = new Map<string, CachedRankingData>();

    async function getCachedRankingData(
      rankingKey: string,
      yearCode: string
    ): Promise<CachedRankingData | null> {
      const cacheKey = `${rankingKey}:${yearCode}`;
      const cached = rankingDataCache.get(cacheKey);
      if (cached !== undefined) return cached;

      const result = await listRankingValues(rankingKey, AREA_TYPE, yearCode);
      if (!result.success || result.data.length === 0) {
        return null;
      }
      const valueMap = new Map<string, number>();
      const rows: CachedRankingData["rows"] = [];
      for (const v of result.data) {
        valueMap.set(v.areaCode, v.value);
        rows.push({ areaCode: v.areaCode, areaName: v.areaName, value: v.value });
      }
      const entry: CachedRankingData = { valueMap, rows };
      rankingDataCache.set(cacheKey, entry);
      return entry;
    }

    // 制御変数のデータ取得（全年コードで試行し、最もデータ数が多い年を代表として使う）
    // cvBestData: cvKey → Map<areaCode, value>（年をまたいで1つだけ保持）
    const cvBestData = new Map<string, Map<string, number>>();
    const yearCodes = [...new Set(items.map((item) => normalizeYearCode(item.latestYear!.yearCode)))];
    for (const cv of CONTROL_VARIABLES) {
      let bestData: Map<string, number> | null = null;
      let bestSize = 0;
      for (const yc of yearCodes) {
        const data = await getCachedRankingData(cv.key, yc);
        if (data && data.valueMap.size >= MIN_DATA_POINTS && data.valueMap.size > bestSize) {
          bestData = data.valueMap;
          bestSize = data.valueMap.size;
        }
      }
      if (bestData) {
        cvBestData.set(cv.key, bestData);
      }
    }
    observer.onLog("info", `制御変数データ: ${cvBestData.size} / ${CONTROL_VARIABLES.length} 変数取得`);

    // 各ランキング × 制御変数のピアソン r キャッシュ
    // key: `${rankingKey}:${yearCode}:${cvKey}` → r
    const cvCorrelationCache = new Map<string, number>();

    function computeCorrelationWithCV(
      rankingData: Map<string, number>,
      cvData: Map<string, number>
    ): number {
      const xVals: number[] = [];
      const yVals: number[] = [];
      for (const [areaCode, xVal] of rankingData) {
        const yVal = cvData.get(areaCode);
        if (yVal !== undefined) {
          xVals.push(xVal);
          yVals.push(yVal);
        }
      }
      if (xVals.length < MIN_DATA_POINTS) return 0;
      return calculatePearsonR(xVals, yVals).r;
    }

    function getCvCorrelation(
      rankingKey: string,
      yearCode: string,
      cvKey: string,
      rankingData: Map<string, number>
    ): number | null {
      const cacheKey = `${rankingKey}:${yearCode}:${cvKey}`;
      const cached = cvCorrelationCache.get(cacheKey);
      if (cached !== undefined) return cached;

      const cvData = cvBestData.get(cvKey);
      if (!cvData) return null;

      const r = computeCorrelationWithCV(rankingData, cvData);
      cvCorrelationCache.set(cacheKey, r);
      return r;
    }

    let completed = 0;
    let skipped = 0;
    let failed = 0;
    let nextLogThreshold = Math.floor(total * 0.1);

    for (let idx = 0; idx < pairs.length; idx++) {
      // 定期的にイベントループを解放してポーリング応答を処理可能にする
      if (idx % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (observer.isAborted()) {
        observer.onLog("warn", "中断が要求されました。処理を停止します。");
        break;
      }
      const { keyX, keyY, yearX, yearY } = pairs[idx];

      try {
        const [xCached, yCached] = await Promise.all([
          getCachedRankingData(keyX, yearX),
          getCachedRankingData(keyY, yearY),
        ]);

        if (!xCached || !yCached) {
          skipped++;
          observer.onProgress(completed, skipped, failed);
          continue;
        }

        const scatter = buildScatterData(xCached.rows, yCached.rows);

        if (scatter.length < MIN_DATA_POINTS) {
          skipped++;
          observer.onProgress(completed, skipped, failed);
          continue;
        }

        const xVals = scatter.map((p) => p.x);
        const yVals = scatter.map((p) => p.y);
        const { r } = calculatePearsonR(xVals, yVals);

        // 偏相関計算
        let partialRPopulation: number | null = null;
        let partialRArea: number | null = null;
        let partialRAging: number | null = null;
        let partialRDensity: number | null = null;

        for (const cv of CONTROL_VARIABLES) {
          const rAZ = getCvCorrelation(keyX, yearX, cv.key, xCached.valueMap);
          const rBZ = getCvCorrelation(keyY, yearY, cv.key, yCached.valueMap);
          if (rAZ === null || rBZ === null) continue;
          const pr = calculatePartialR(r, rAZ, rBZ);
          switch (cv.column) {
            case "partialRPopulation": partialRPopulation = pr; break;
            case "partialRArea": partialRArea = pr; break;
            case "partialRAging": partialRAging = pr; break;
            case "partialRDensity": partialRDensity = pr; break;
          }
        }

        await upsertCorrelation({
          rankingKeyX: keyX,
          rankingKeyY: keyY,
          yearX,
          yearY,
          pearsonR: r,
          partialRPopulation,
          partialRArea,
          partialRAging,
          partialRDensity,
          scatterData: scatter,
        });
        completed++;
      } catch (e) {
        failed++;
        if (failed <= MAX_ERROR_LOGS) {
          observer.onLog(
            "error",
            `[${keyX}-${keyY}] 計算失敗: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }
      observer.onProgress(completed, skipped, failed);

      // 進捗ログ（10%ごと）
      const processed = completed + skipped + failed;
      if (processed >= nextLogThreshold && processed < total) {
        const percent = Math.round((processed / total) * 100);
        observer.onLog(
          "info",
          `${percent}% 完了（${processed.toLocaleString()} / ${total.toLocaleString()} 件 — 計算 ${completed.toLocaleString()}, スキップ ${skipped.toLocaleString()}, 失敗 ${failed.toLocaleString()}）`
        );
        nextLogThreshold = Math.floor(
          (total * (percent + LOG_INTERVAL_PERCENT)) / 100
        );
      }
    }

    const wasAborted = observer.isAborted();

    let snapshotStatus: "ok" | "failed" = "ok";
    let snapshotErrorMessage: string | null = null;

    // Phase 0: 既存 top-pairs / stats snapshot（/correlation page 用、Phase 1 で /correlation 削除時に exporter ごと撤去予定）
    // Phase 1: per-ranking-key snapshot（CorrelationSection 用、本番 D1 read を完全消滅させる）
    try {
      const [snapshotResult, perKeyResult] = await Promise.all([
        exportCorrelationSnapshot(),
        exportCorrelationPerKeySnapshots(),
      ]);
      observer.onLog(
        "info",
        `R2 snapshot を更新しました（top-pairs=${snapshotResult.topPairs.pairCount}, per-key=${perKeyResult.succeeded}/${perKeyResult.totalKeys}, ${snapshotResult.durationMs}+${perKeyResult.durationMs}ms）`,
      );
      if (perKeyResult.failed > 0) {
        observer.onLog(
          "warn",
          `per-key snapshot のうち ${perKeyResult.failed} 件で書込失敗。再実行を推奨`,
        );
      }
    } catch (snapshotErr) {
      snapshotStatus = "failed";
      snapshotErrorMessage = snapshotErr instanceof Error ? snapshotErr.message : String(snapshotErr);
      // DB は更新済みだが Web で見えるデータは古い snapshot のまま、というズレが起きるため error 扱い。
      observer.onLog(
        "error",
        `R2 snapshot 更新失敗: DB upsert は成功したが Web 反映が古い。要再実行 (npm run export-snapshot --workspace=packages/correlation)。原因: ${snapshotErrorMessage}`,
      );
    }

    const baseMessage = wasAborted
      ? `中断しました: 完了 ${completed}件, スキップ ${skipped}件, 失敗 ${failed}件`
      : `完了 ${completed}件, スキップ ${skipped}件, 失敗 ${failed}件`;
    const fullMessage =
      snapshotStatus === "ok"
        ? `${baseMessage} / R2 snapshot 更新済`
        : `${baseMessage} / ⚠️ R2 snapshot 更新失敗 (Web は旧 snapshot を表示中)`;

    observer.onComplete({
      success: true,
      message: fullMessage,
    });
  } catch (e) {
    observer.onLog(
      "error",
      `バッチ処理エラー: ${e instanceof Error ? e.message : String(e)}`
    );
    observer.onComplete({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
