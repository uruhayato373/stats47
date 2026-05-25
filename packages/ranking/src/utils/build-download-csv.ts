import type { RankingValue } from "../types";

/**
 * 都道府県 × 年度の値を CSV 文字列に整形する。
 *
 * 単一系列フォーマット:
 * ```
 * 都道府県コード,都道府県名,2024年,2023年,...
 * 01000,北海道,5183687,5224614,...
 * ```
 *
 * UTF-8 + BOM 付与で Excel の文字化けを防ぐ。
 */
export function buildSingleSeriesCsv(values: RankingValue[]): string {
  const BOM = "﻿";

  const yearsMap = new Map<string, string>();
  for (const v of values) yearsMap.set(v.yearCode, v.yearName);
  const yearCodes = [...yearsMap.keys()].sort((a, b) => b.localeCompare(a));

  const areaMap = new Map<
    string,
    { areaCode: string; areaName: string; values: Map<string, number> }
  >();
  for (const v of values) {
    if (v.value === null || v.value === undefined) continue;
    let entry = areaMap.get(v.areaCode);
    if (!entry) {
      entry = { areaCode: v.areaCode, areaName: v.areaName, values: new Map() };
      areaMap.set(v.areaCode, entry);
    }
    entry.values.set(v.yearCode, v.value);
  }

  const header = [
    "都道府県コード",
    "都道府県名",
    ...yearCodes.map((yc) => yearsMap.get(yc) ?? yc),
  ];

  const sortedAreas = [...areaMap.values()].sort((a, b) =>
    a.areaCode.localeCompare(b.areaCode),
  );

  const rows = sortedAreas.map((area) => {
    const yearValues = yearCodes.map((yc) => area.values.get(yc) ?? "");
    return [area.areaCode, area.areaName, ...yearValues];
  });

  return BOM + [header, ...rows].map(toCsvLine).join("\n");
}

interface BasisSeries {
  basisKey: string;
  basisLabel: string;
  values: RankingValue[];
}

/**
 * 複数の基準 (総数 / 人口10万人あたり / 面積100km²あたり / 1世帯あたり) を
 * 横並びにした「全基準まとめて」フォーマットの CSV を生成する。
 *
 * 列構成:
 * ```
 * 都道府県コード,都道府県名,
 *   総数_2024年,総数_2023年,...,
 *   人口10万人あたり_2024年,...,
 *   面積100km²あたり_2024年,...
 * ```
 */
export function buildAllBasesCsv(seriesList: BasisSeries[]): string {
  const BOM = "﻿";

  // 全系列を通じた year コード → year ラベル
  const yearsMap = new Map<string, string>();
  for (const series of seriesList) {
    for (const v of series.values) yearsMap.set(v.yearCode, v.yearName);
  }
  const yearCodes = [...yearsMap.keys()].sort((a, b) => b.localeCompare(a));

  // areaCode → { areaName, values: Map<seriesIdx + yearCode, number> }
  const areaMap = new Map<
    string,
    { areaCode: string; areaName: string; values: Map<string, number> }
  >();

  seriesList.forEach((series, sIdx) => {
    for (const v of series.values) {
      if (v.value === null || v.value === undefined) continue;
      let entry = areaMap.get(v.areaCode);
      if (!entry) {
        entry = { areaCode: v.areaCode, areaName: v.areaName, values: new Map() };
        areaMap.set(v.areaCode, entry);
      }
      entry.values.set(`${sIdx}:${v.yearCode}`, v.value);
    }
  });

  // ヘッダー: 都道府県コード, 都道府県名, 基準A_2024, 基準A_2023, ..., 基準B_2024, ...
  const header: string[] = ["都道府県コード", "都道府県名"];
  seriesList.forEach((series) => {
    for (const yc of yearCodes) {
      const yearLabel = yearsMap.get(yc) ?? yc;
      header.push(`${series.basisLabel}_${yearLabel}`);
    }
  });

  const sortedAreas = [...areaMap.values()].sort((a, b) =>
    a.areaCode.localeCompare(b.areaCode),
  );

  const rows = sortedAreas.map((area) => {
    const row: (string | number)[] = [area.areaCode, area.areaName];
    seriesList.forEach((_, sIdx) => {
      for (const yc of yearCodes) {
        row.push(area.values.get(`${sIdx}:${yc}`) ?? "");
      }
    });
    return row;
  });

  return BOM + [header, ...rows].map(toCsvLine).join("\n");
}

function escapeCsvCell(val: string | number): string {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvLine(cells: (string | number)[]): string {
  return cells.map(escapeCsvCell).join(",");
}
