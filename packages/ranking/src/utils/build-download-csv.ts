import type { RankingItem, RankingValue } from "../types";

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
export function buildSingleSeriesCsv(values: RankingValue[], citation?: CsvCitation): string {
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

  return BOM + [header, ...rows].map(toCsvLine).join("\n") + citationFooter(citation);
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
export function buildAllBasesCsv(seriesList: BasisSeries[], citation?: CsvCitation): string {
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

  return BOM + [header, ...rows].map(toCsvLine).join("\n") + citationFooter(citation);
}

/**
 * CSV の末尾に置く出典と加工の表記。e-Stat 利用規約の表記例 (https://www.e-stat.go.jp/terms-of-use) に沿い、
 * 出典・加工したこと・掲載ページ・作成日を残す (DOWNLOAD-CSV-CITATION-01: 卒論・レポートで引用する読者が最多)。
 * 先頭行は列見出しのまま保つため、表の後に空行を挟んで置く。
 */
export interface CsvCitation {
  readonly title?: string | null;
  readonly attribution?: RankingItem["attribution"];
  readonly source?: RankingItem["source"] | null;
  readonly dataSourceId?: string | null;
  readonly pageUrl: string;
  /** YYYY-MM-DD */
  readonly createdOn: string;
}

function sourceText(c: CsvCitation): string | null {
  const surveys = (c.attribution?.originalSurveys ?? []).map((s) => s.name).join("・");
  const compilation = c.attribution?.compilation;
  if (compilation) {
    const name = compilation.url ? `${compilation.name}（${compilation.url}）` : compilation.name;
    return surveys ? `${name}（原典: ${surveys}）` : name;
  }
  if (surveys) return surveys;
  if (c.source?.name) return c.source.url ? `${c.source.name}（${c.source.url}）` : c.source.name;
  return null;
}

export function buildCsvCitationRows(c: CsvCitation): string[][] {
  const rows: string[][] = [];
  if (c.title) rows.push(["指標", c.title]);
  rows.push(["出典", sourceText(c) ?? "掲載ページの出典欄を参照"]);
  if (c.dataSourceId === "estat") rows.push(["統計の取得元", "政府統計の総合窓口(e-Stat)（https://www.e-stat.go.jp/）"]);
  rows.push(["加工", "上記の統計を stats47（https://stats47.jp/）が加工して作成。人口・面積当たりの値は stats47 が算出"]);
  rows.push(["掲載ページ", c.pageUrl]);
  rows.push(["作成日", c.createdOn]);
  return rows;
}

function citationFooter(citation: CsvCitation | undefined): string {
  if (!citation) return "";
  return "\n\n" + buildCsvCitationRows(citation).map(toCsvLine).join("\n");
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
