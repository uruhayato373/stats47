import {
    rankingData,
    rankingItems
} from "@stats47/mock/ranking";
import { getMaxDecimalPlaces } from "@stats47/utils";
import type {
    RankingEntry,
    RankingInput,
    RankingMeta,
} from "../types/ranking";
import { previewData } from "../../utils/preview-data";

export type MockDataKey = keyof typeof rankingItems;

/**
 * 共有モックデータのキー一覧を取得
 */
export function getMockDataKeys(): MockDataKey[] {
  return Object.keys(rankingItems) as MockDataKey[];
}

/**
 * 共有パッケージのデータを動画コンポーネント用の型に変換して取得
 */
export function getMockRankingData(key: MockDataKey): RankingInput {
  const item = rankingItems[key];
  const data = rankingData[key];

  const meta: RankingMeta = {
    title: item.title,
    subtitle: item.subtitle || undefined,
    unit: item.unit,
    yearName: item.latestYear?.yearName,
    demographicAttr: item.demographicAttr || undefined,
    normalizationBasis: item.standardizedUnit || undefined,
  };

  // RankingEntry 型に変換
  const entries: RankingEntry[] = data.map((d) => ({
    rank: d.rank,
    areaCode: d.areaCode,
    areaName: d.areaName,
    value: d.value,
  }));

  return { meta, entries };
}

/**
 * デフォルトのモックデータを取得
 */
export function getDefaultMockRankingData(): RankingInput {
  return getMockRankingData("annual-sales-amount-per-employee");
}

/** resolveRankingData の戻り値（precision 付き） */
export interface ResolvedRankingData extends RankingInput {
  /** 値の最大小数桁数（表示時の桁揃えに使用） */
  precision: number;
}

/**
 * meta + allEntries があればそのまま返し、なければ previewData にフォールバック。
 * precision（値の最大小数桁数）を自動算出して返す。
 */
export function resolveRankingData(opts: {
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
}): ResolvedRankingData {
  const input = (opts.meta && opts.allEntries)
    ? { meta: opts.meta, entries: opts.allEntries }
    : previewData;
  const precision = getMaxDecimalPlaces(input.entries.map((e) => e.value));
  return { ...input, precision };
}
