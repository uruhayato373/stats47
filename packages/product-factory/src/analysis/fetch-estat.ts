import { buildMunicipalityEntityPolicy, listPublishableMunicipalities, PREFECTURE_AREA_CODES } from "@stats47/area";
import type { ClassItem, ClassObject, EstatStatsDataResponse, EstatValue } from "@stats47/estat-api/api";

import { conversionFactor } from '@stats47/data-configs/unit';
import { assertCapitalCityMetadata, listCapitalCityAreas } from './capital-city';

export interface AnalysisSource {
  id: string;
  statsDataId: string;
  grain: "prefecture" | "municipality" | "capital-city";
  filters?: Record<string, string>;
  years: number[];
  metrics: { id: string; code: string; label: string; unit: string }[];
}

export interface AnalysisObservation {
  sourceId: string;
  metricId: string;
  areaCode: string;
  areaName: string;
  year: number;
  value: number | null;
  unit: string;
  missingReason?: string;
}

const PAGE_SIZE = 100_000;
const asArray = <T>(value: T | T[]): T[] => Array.isArray(value) ? value : [value];

function withoutCredentials<T extends { PARAMETER?: object }>(envelope: T): T {
  if (!envelope.PARAMETER) return envelope;
  return { ...envelope, PARAMETER: Object.fromEntries(Object.entries(envelope.PARAMETER)
    .filter(([key]) => !/^(app[_-]?id|.*token|.*secret|api[_-]?key|password)$/i.test(key))) };
}

function classMap(axis: ClassObject | undefined, label: string): Map<string, ClassItem> {
  if (!axis) throw new Error(`Missing metadata axis: ${label}`);
  const entries = asArray(axis.CLASS);
  const map = new Map(entries.map((item) => [item["@code"], item]));
  if (map.size !== entries.length) throw new Error(`Duplicate metadata codes: ${label}`);
  return map;
}

function assertSource(source: AnalysisSource): void {
  if (!source.id || !source.statsDataId || !source.metrics.length || !source.years.length) {
    throw new Error("Analysis source requires id, table, metrics and years");
  }
  if (new Set(source.years).size !== source.years.length) throw new Error("Duplicate source years");
  if (!["prefecture", "municipality", "capital-city"].includes(source.grain)) throw new Error(`Invalid source grain: ${source.grain}`);
  for (const [axis, code] of Object.entries(source.filters ?? {})) {
    if (!/^cd(?:Cat0[2-5]|Tab)$/.test(axis) || !code || code.includes(','))
      throw Error(`Unsupported fixed source dimension: ${axis}`);
  }
  for (const year of source.years) {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error(`Invalid source year: ${year}`);
  }
  for (const field of ["id", "code"] as const) {
    if (new Set(source.metrics.map((metric) => metric[field])).size !== source.metrics.length) {
      throw new Error(`Duplicate metric ${field}`);
    }
  }
  if (source.metrics.some((metric) => !metric.id || !metric.code || !metric.label || !metric.unit)) {
    throw new Error("Analysis metric requires id, code, label and unit");
  }
}

/** All years/areas are fetched; the caller owns persistence and refresh policy. */
export async function fetchAnalysisSource(source: AnalysisSource): Promise<{
  rows: AnalysisObservation[];
  raw: unknown;
  retrievedAt: string;
  tableTitle: string;
}> {
  assertSource(source);
  // CLI callers load environment before calling; the API package captures appId on import.
  const { fetchMetaInfoFromApi, fetchStatsDataFromApi, extractYearCode, parseEstatValue } = await import("@stats47/estat-api/api");
  function yearOf(code: string): number {
    // 月・四半期を年へ潰さない。対象は年次とSSDSの年度コードのみ。
    if (!/^\d{4}(?:[01]00000)?$/.test(code)) throw new Error(`Unsupported annual time code: ${code}`);
    const year = Number(extractYearCode(code));
    if (year < 1900 || year > 2100) throw new Error(`Invalid year: ${code}`);
    return year;
  }
  const metadata = await fetchMetaInfoFromApi(source.statsDataId);
  const meta = metadata.GET_META_INFO;
  if (meta.RESULT.STATUS !== 0 || meta.METADATA_INF.TABLE_INF["@id"] !== source.statsDataId) {
    throw new Error(`Invalid metadata response: ${source.id}`);
  }
  const axes = asArray(meta.METADATA_INF.CLASS_INF.CLASS_OBJ);
  const metricAxes = axes.filter((axis) => /^cat\d{2}$/.test(axis["@id"]) &&
    source.metrics.every((metric) => asArray(axis.CLASS).some((item) => item["@code"] === metric.code)));
  if (metricAxes.length !== 1) throw new Error(`Metrics do not resolve to one metadata axis: ${source.id}`);
  const metricAxis = metricAxes[0]!;
  const metricClasses = classMap(metricAxis, "metrics");
  for (const metric of source.metrics) {
    const unit = metricClasses.get(metric.code)!["@unit"];
    if (unit && unit !== metric.unit && conversionFactor(unit, metric.unit) !== 1) throw new Error(`Unit mismatch for ${metric.id}: ${unit} != ${metric.unit}`);
  }
  for (const axis of axes) {
    if ([metricAxis["@id"], "time", "area"].includes(axis["@id"])) continue;
    const parameter = `cd${axis["@id"][0]!.toUpperCase()}${axis["@id"].slice(1)}`;
    const selected = source.filters?.[parameter];
    if (selected ? !asArray(axis.CLASS).some(item => item["@code"] === selected) : asArray(axis.CLASS).length !== 1)
      throw new Error(`Unselected metadata dimension: ${axis["@id"]}`);
  }
  for (const parameter of Object.keys(source.filters ?? {})) {
    if (!axes.some(axis => `cd${axis["@id"][0]!.toUpperCase()}${axis["@id"].slice(1)}` === parameter))
      throw Error(`Fixed source dimension is missing: ${parameter}`);
  }
  const times = classMap(axes.find((axis) => axis["@id"] === "time"), "time");
  const yearsByTime = new Map([...times.keys()].map((code) => [code, yearOf(code)]));
  for (const year of source.years) {
    if ([...yearsByTime.values()].filter((candidate) => candidate === year).length !== 1) {
      throw new Error(`Year is missing or ambiguous in metadata: ${year}`);
    }
  }
  const areas = classMap(axes.find((axis) => axis["@id"] === "area"), "area");
  const capitalAreas = new Map(listCapitalCityAreas().map(area => [area.code, area]));
  if (source.grain === 'capital-city') assertCapitalCityMetadata([...areas.values()]);
  const allowedAreas = new Set<string>(source.grain === 'capital-city' ? [...capitalAreas.keys()] : source.grain === "prefecture" ? PREFECTURE_AREA_CODES :
    listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map((area) => area.code));
  const metricsByCode = new Map(source.metrics.map((metric) => [metric.code, metric]));
  const requestedYears = new Set(source.years);
  const pages: EstatStatsDataResponse[] = [];
  const rows: AnalysisObservation[] = [];
  const coordinates = new Set<string>();
  let startPosition = 1;
  let total: number | undefined;
  let received = 0;

  while (true) {
    const response = await fetchStatsDataFromApi({
      statsDataId: source.statsDataId,
      ...source.filters,
      [`cd${metricAxis["@id"][0]!.toUpperCase()}${metricAxis["@id"].slice(1)}`]: source.metrics.map((metric) => metric.code).join(","),
      startPosition,
      limit: PAGE_SIZE,
      metaGetFlg: "N",
      annotationGetFlg: "Y",
      replaceSpChars: "0",
    });
    const result = response.GET_STATS_DATA;
    if (result.RESULT.STATUS !== 0 || result.STATISTICAL_DATA.TABLE_INF["@id"] !== source.statsDataId) {
      throw new Error(`Invalid data response: ${source.id} (status ${result.RESULT.STATUS})`);
    }
    const data = result.STATISTICAL_DATA;
    const pageInfo = (data as typeof data & { RESULT_INF?: {
      TOTAL_NUMBER: number | string; FROM_NUMBER: number | string; TO_NUMBER: number | string; NEXT_KEY?: number | string;
    } }).RESULT_INF;
    const values = data.DATA_INF.VALUE ? asArray(data.DATA_INF.VALUE) : [];
    const pageTotal = Number(pageInfo?.TOTAL_NUMBER);
    if (!Number.isInteger(pageTotal) || pageTotal < 1 || (total !== undefined && total !== pageTotal) ||
      Number(pageInfo?.FROM_NUMBER) !== startPosition || Number(pageInfo?.TO_NUMBER) !== startPosition + values.length - 1 || !values.length) {
      throw new Error(`Invalid pagination or changed total: ${source.id} at ${startPosition}`);
    }
    total = pageTotal;
    received += values.length;
    pages.push(response);
    for (const value of values) {
      const metric = metricsByCode.get(value[`@${metricAxis["@id"]}` as keyof EstatValue] ?? "");
      if (!metric) throw new Error(`Unexpected metric in response: ${source.id}`);
      for (const [parameter, selected] of Object.entries(source.filters ?? {})) {
        const axis = `@${parameter[2]!.toLowerCase()}${parameter.slice(3)}` as keyof EstatValue;
        if (value[axis] !== selected) throw Error(`Unexpected fixed source coordinate: ${parameter}`);
      }
      const year = yearsByTime.get(value["@time"] ?? "");
      if (year === undefined) throw new Error(`Unknown time code in response: ${value["@time"]}`);
      const areaCode = value["@area"] ?? "";
      if (!/^\d{5}$/.test(areaCode) || !areas.has(areaCode)) throw new Error(`Unknown area in response: ${areaCode}`);
      if (!requestedYears.has(year) || !allowedAreas.has(areaCode)) continue;
      const key = `${metric.id}:${areaCode}:${year}`;
      if (coordinates.has(key)) throw new Error(`Duplicate observation: ${key}`);
      coordinates.add(key);
      const metadataUnit = metricClasses.get(metric.code)!["@unit"];
      const unit = value["@unit"] ?? metadataUnit;
      if (unit !== metric.unit && conversionFactor(unit, metric.unit) !== 1) throw new Error(`Unit mismatch for ${key}: ${unit} != ${metric.unit}`);
      const parsed = parseEstatValue(value.$);
      if (parsed !== null && !Number.isFinite(parsed)) throw new Error(`Non-finite value: ${key}`);
      rows.push({
        sourceId: source.id, metricId: metric.id, areaCode, areaName: source.grain === 'capital-city' ? capitalAreas.get(areaCode)!.name : areas.get(areaCode)!["@name"],
        year, value: parsed, unit: metric.unit,
        ...(parsed === null ? { missingReason: value.$.trim() || "blank" } : {}),
      });
    }
    const next = pageInfo?.NEXT_KEY === undefined ? undefined : Number(pageInfo.NEXT_KEY);
    if (next === undefined) {
      if (received !== total) throw new Error(`Truncated response: ${source.id}: ${received}/${total}`);
      break;
    }
    if (next !== received + 1 || next > total) throw new Error(`Invalid NEXT_KEY: ${source.id}`);
    startPosition = next;
  }
  if (!rows.length) throw new Error(`No observations match source: ${source.id}`);
  rows.sort((a, b) => a.metricId.localeCompare(b.metricId) || a.areaCode.localeCompare(b.areaCode) || a.year - b.year);
  return {
    rows,
    raw: {
      metadata: { ...metadata, GET_META_INFO: withoutCredentials(metadata.GET_META_INFO) },
      pages: pages.map((page) => ({ ...page, GET_STATS_DATA: withoutCredentials(page.GET_STATS_DATA) })),
    },
    retrievedAt: new Date().toISOString(),
    tableTitle: meta.METADATA_INF.TABLE_INF.TITLE?.$ ?? "",
  };
}
