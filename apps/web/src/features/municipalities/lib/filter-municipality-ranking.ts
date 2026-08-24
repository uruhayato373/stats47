import type { MunicipalityRankingValue } from '@stats47/ranking/types';

export interface MunicipalityRankingQuery {
  query?: string;
  prefectureCode?: string;
  page?: number;
  pageSize?: number;
}

export function filterMunicipalityRanking(
  values: readonly MunicipalityRankingValue[],
  options: MunicipalityRankingQuery
): {
  rows: MunicipalityRankingValue[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
} {
  const query = options.query?.trim().toLocaleLowerCase('ja-JP') ?? '';
  const prefectureCode = /^\d{2}000$/.test(options.prefectureCode ?? '')
    ? options.prefectureCode
    : undefined;
  const pageSize = Math.min(100, Math.max(10, options.pageSize ?? 50));
  const filtered = values.filter((value) => {
    if (prefectureCode && value.prefectureCode !== prefectureCode) return false;
    if (query && !value.areaName.toLocaleLowerCase('ja-JP').includes(query)) {
      return false;
    }
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number.isFinite(options.page)
    ? Math.floor(options.page ?? 1)
    : 1;
  const page = Math.min(pageCount, Math.max(1, requestedPage));
  const start = (page - 1) * pageSize;
  return {
    rows: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageCount,
    pageSize,
  };
}

export function municipalityLeafName(areaName: string): string {
  return areaName.trim().split(/\s+/).at(-1) ?? areaName;
}
