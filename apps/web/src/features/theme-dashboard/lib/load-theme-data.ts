import "server-only";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { THEME_CATALOGS, type CatalogMetricGroup } from "@stats47/data-configs/theme-catalog";
import {
  readAllYearsRankingValuesFromR2,
  readRankingItemFromR2,
  readRankingValuesFromR2,
} from "@stats47/ranking/server";
import { readJapanSeries } from "@stats47/stats-r2/readers";
import { isOk, type AreaType, type Result } from "@stats47/types";

import { logger } from "@/lib/logger";

import { themeYearLabel } from "./theme-year-label";

import type { ThemeConfig, ThemeIndicatorData } from "../types";
import type { RankingItem, RankingValue } from "@stats47/ranking";

export interface ThemePageData {
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** カタログの指標カード編成。カタログに編成が無いテーマは undefined。 */
  metricGroups?: CatalogMetricGroup[];
}

/**
 * 都道府県指標の全年 R2 values から「全国」トレンド (年次の県平均) を構築する。
 *
 * R2 ranking values (app/ranking/<key>/values.json) には全国行 (00000) が無いため、
 * 各年の都道府県平均を「全国」系列 (MiniLineChart 用) として用いる。
 * ThemeMetricsDashboard も都道府県未選択時は県平均を KPI 値に使うため整合する。
 */
function buildNationalSeries(
  allYears: RankingValue[],
): { year: number; value: number }[] {
  const byYear = new Map<number, number[]>();
  for (const v of allYears) {
    if (typeof v.value !== "number" || !Number.isFinite(v.value)) continue;
    const y = Number(String(v.yearCode).slice(0, 4));
    if (!Number.isFinite(y)) continue;
    const arr = byYear.get(y);
    if (arr) arr.push(v.value);
    else byYear.set(y, [v.value]);
  }
  return [...byYear.entries()]
    .map(([year, vals]) => ({
      year,
      value: vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
    .sort((a, b) => a.year - b.year);
}

/**
 * 1 回の loadThemeData が R2 へ同時に投げる取得の上限 (定義・値・全国の系列を通した合計)。
 *
 * 指標ごとの取得を上限なしで一斉に投げると、指標の多いテーマ (家計の食料支出は 189 指標 = 567 取得) で
 * 開発サーバーの取得が数件 `fetch failed` (ECONNRESET) で落ち、その指標がページから黙って消えた (2026-11-03)。
 * 24 は開発サーバーで /areas/28000/household-food-spending を開く時間を測って選んだ (2026-11-14。
 * 上限なし 9.9〜10.8 秒 / 6 本 13.2〜13.3 秒 / 12 本 9.1〜9.3 秒 / 24 本 7.6〜7.9 秒)。
 */
const R2_FETCH_CONCURRENCY = 24;

/** 同時に走らせる数を max までに絞る実行器。空きが出たら、待っている順に次を始める。 */
function createLimiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async function run<T>(task: () => Promise<T>): Promise<T> {
    // 満杯のときは枠を譲り受けるまで待つ (譲る側は active を減らさないので、上限を超える瞬間が無い)
    if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
    else active += 1;
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active -= 1;
    }
  };
}

/**
 * 失敗した取得 (失敗の結果、または例外) を 1 回だけ取り直す。
 * R2 に無い指標は成功 (null や空の配列) で返るので取り直さない。2 回目の結果はそのまま返す。
 */
async function readWithOneRetry<T>(read: () => Promise<Result<T, Error>>): Promise<Result<T, Error>> {
  try {
    const first = await read();
    if (isOk(first)) return first;
  } catch {
    // 下で取り直す
  }
  return read();
}

/**
 * テーマダッシュボード用のデータを一括取得
 *
 * 全指標の RankingItem 定義 + R2 ranking values + TopoJSON を並列取得し、
 * indicatorDataMap として返す。tabIndicators がある場合はそのキーもマージして取得する。
 * R2 への取得は同時に R2_FETCH_CONCURRENCY 本までに絞り、失敗した定義と値は 1 回だけ取り直す。
 *
 * ★データ source は R2 の `app/ranking/<key>/values.json` のみ (e-Stat ライブ取得はしない)。
 *   e-Stat ライブ取得は Cloudflare Workers ランタイムで失敗し本番で error fallback を招いたため、
 *   /ranking/* と同一の R2 source に統一した (完全DBレス: docs/01_技術設計/02_データアーキテクチャ.md)。
 *   build 時は readRankingValuesFromR2 が ok([]) を返すため、ページは force-dynamic で runtime 描画する。
 *
 * - prefecture: readAllYearsRankingValuesFromR2 で全年を 1 read → current 年 values + 全国(県平均)トレンド
 * - city: readRankingValuesFromR2 で current 年のみ (全市区町村×全年は巨大なため)
 */
export async function loadThemeData(
  theme: ThemeConfig,
  options?: { areaType?: AreaType },
): Promise<ThemePageData | null> {
  const areaType: AreaType = options?.areaType ?? "prefecture";
  const catalogGroups = THEME_CATALOGS[theme.themeKey]?.metricGroups;

  // tabIndicators のキーと rankingKeys をマージ（重複排除）
  const tabKeys = theme.tabIndicators?.map((t) => t.rankingKey) ?? [];
  const allKeys = [...new Set([...theme.rankingKeys, ...tabKeys])];

  const limit = createLimiter(R2_FETCH_CONCURRENCY);

  // 1. 全指標の RankingItem 定義を並列取得
  const rankingItemResults = await Promise.all(
    allKeys.map((key) =>
      limit(() => readWithOneRetry(() => readRankingItemFromR2(key, areaType))).catch((error) => {
        logger.error({ error, key, areaType }, "テーマダッシュボード: RankingItem取得失敗");
        return null;
      })
    )
  );

  const validItems: { key: string; item: RankingItem }[] = [];
  for (let i = 0; i < allKeys.length; i++) {
    const result = rankingItemResults[i];
    if (result && isOk(result) && result.data) {
      validItems.push({ key: allKeys[i], item: result.data });
    }
  }

  if (validItems.length === 0) return null;

  const metricGroups = catalogGroups;

  // 2. 全指標のデータを並列取得 (地図の地形はテーマでは読まない。都道府県の地図と表はランキングと同じ部品が自分で読む)
  const valuesPromises = validItems.map(({ key, item }) => {
    const yearCode = item.latestYear?.yearCode;
    if (!yearCode)
      return Promise.resolve({
        key,
        values: [] as RankingValue[],
        nationalValue: undefined as number | undefined,
        nationalSeries: undefined as { year: number; value: number }[] | undefined,
      });

    // city: R2 から直接読む (e-Stat 経由しない。全国行は無いため平均にフォールバック)
    if (areaType === "city") {
      return limit(() => readWithOneRetry(() => readRankingValuesFromR2(key, "city", yearCode)))
        .then((result) => {
          const values = isOk(result) ? result.data : [];
          return { key, values, nationalValue: undefined as number | undefined, nationalSeries: undefined as { year: number; value: number }[] | undefined };
        })
        .catch((error) => {
          logger.error({ error, key, yearCode }, "テーマダッシュボード: city values 取得失敗");
          return { key, values: [] as RankingValue[], nationalValue: undefined as number | undefined, nationalSeries: undefined as { year: number; value: number }[] | undefined };
        });
    }

    // prefecture: R2 から全年度を 1 read (e-Stat ライブ取得しない。/ranking/* と同一 source)。
    // current 年の values + 全国(県平均)トレンドを構築。全国行は無いため nationalValue は undefined
    // (ThemeMetricsDashboard が未選択時に県平均へフォールバックする)。
    return limit(() => readWithOneRetry(() => readAllYearsRankingValuesFromR2(key, "prefecture")))
      .then((result) => {
        const all = isOk(result) ? result.data : [];
        const ny = yearCode.slice(0, 4);
        const values = all.filter((v) => String(v.yearCode).slice(0, 4) === ny);
        const nationalSeries = buildNationalSeries(all);
        return {
          key,
          values,
          nationalValue: undefined as number | undefined,
          nationalSeries:
            nationalSeries.length > 0 ? nationalSeries : undefined,
        };
      })
      .catch((error) => {
        logger.error({ error, key }, "テーマダッシュボード: ranking values 取得失敗 (R2)");
        return { key, values: [] as RankingValue[], nationalValue: undefined as number | undefined, nationalSeries: undefined as { year: number; value: number }[] | undefined };
      });
  });

  // 公式の全国の系列 (app/japan/<key>/series.json)。全国のページの値と推移に使う。47 県の平均は全国と呼ばない
  // (2026-10-31。無い指標は null で、全国のページは値を出さない)。取り直しは読み取りの側が 3 回まで行う
  const japanPromise = Promise.all(
    validItems.map(({ key }) =>
      limit(() => readJapanSeries(key))
        .then((artifact) => [key, artifact] as const)
        .catch(() => [key, null] as const)
    )
  );
  const [valuesResults, japanEntries] = await Promise.all([Promise.all(valuesPromises), japanPromise]);
  const japanByKey = new Map(japanEntries);

  // 3. indicatorDataMap を構築（availableYears を含む）
  const indicatorDataMap: Record<string, ThemeIndicatorData> = {};
  for (const { key, item } of validItems) {
    const valResult = valuesResults.find((v) => v.key === key);
    const yearFormat = METRICS_REGISTRY[key]?.yearFormat;
    const normalizeYear = <T extends { yearCode: string; yearName?: string | null }>(year: T) => ({
      ...year,
      yearName: themeYearLabel(year.yearCode, year.yearName, yearFormat),
    });
    const values = (valResult?.values ?? []).map(normalizeYear);
    if (values.length > 0) {
      indicatorDataMap[key] = {
        rankingItem: {
          ...item,
          ...(item.latestYear ? { latestYear: normalizeYear(item.latestYear) } : {}),
          ...(item.availableYears ? { availableYears: item.availableYears.map(normalizeYear) } : {}),
        },
        rankingValues: values,
        availableYears: (item.availableYears ?? []).map(normalizeYear),
        nationalValue: officialNationalValue(japanByKey.get(key) ?? null) ?? valResult?.nationalValue,
        nationalSeries: valResult?.nationalSeries,
        officialNationalSeries: officialNationalSeries(japanByKey.get(key) ?? null),
      };
    }
  }

  if (Object.keys(indicatorDataMap).length === 0) return null;

  return { indicatorDataMap, ...(metricGroups ? { metricGroups } : {}) };
}

type JapanSeries = Awaited<ReturnType<typeof readJapanSeries>>;

/** 公式の全国の系列の最新の値 (年の新しい行) */
function officialNationalValue(artifact: JapanSeries): number | undefined {
  const rows = artifact?.rows.filter((row) => Number.isFinite(row.value)) ?? [];
  if (rows.length === 0) return undefined;
  return [...rows].sort((a, b) => a.yearCode.localeCompare(b.yearCode)).at(-1)!.value;
}

/** 公式の全国の系列を年の順に (無ければ undefined) */
function officialNationalSeries(artifact: JapanSeries): { year: number; value: number }[] | undefined {
  const points = (artifact?.rows ?? [])
    .filter((row) => Number.isFinite(row.value))
    .map((row) => ({ year: Number(row.yearCode.slice(0, 4)), value: row.value }))
    .filter((p) => Number.isFinite(p.year))
    .sort((a, b) => a.year - b.year);
  return points.length > 0 ? points : undefined;
}
