import prefectures from "../../../area/src/data/prefectures.json";
import type { SingleEntityRow } from "../../../stats-r2/src/types";
import { classifyShape, summarizeShape } from "../shape-gate";
import { AGRICULTURAL_OUTPUT_RELEASE } from "./official-theme-releases";

const prefectureByCode = new Map(prefectures.map((pref) => [pref.prefCode, pref.prefName]));
const rowKey = (row: SingleEntityRow) => `${row.yearCode}/${row.areaCode}`;

/** A changed source must never silently drop years, overwrite history or duplicate an axis. */
export function mergeOfficialRows(
  key: string,
  existing: readonly SingleEntityRow[],
  reconstructed: readonly SingleEntityRow[],
  years: readonly number[],
  unit: string,
): SingleEntityRow[] {
  const byKey = new Map<string, SingleEntityRow>();
  for (const row of reconstructed) {
    if (byKey.has(rowKey(row))) throw new Error(`${key}: duplicate area/year ${rowKey(row)}`);
    if (prefectureByCode.get(row.areaCode) !== row.areaName) throw new Error(`${key}: unknown prefecture ${row.areaCode}`);
    if (row.unit !== unit || typeof row.value !== "number" || !Number.isFinite(row.value) || row.value <= 0) {
      throw new Error(`${key}: invalid unit or value ${rowKey(row)}`);
    }
    if (!years.includes(Number(row.yearCode)) || !/^\d{4}$/.test(row.yearCode)) throw new Error(`${key}: unexpected year ${row.yearCode}`);
    byKey.set(rowKey(row), { ...row, yearName: `${row.yearCode}年` });
  }
  for (const year of years) {
    const count = reconstructed.filter((row) => row.yearCode === String(year)).length;
    if (count !== 47) throw new Error(`${key}: ${year} has ${count} prefectures, expected 47`);
  }
  const previousKeys = new Set<string>();
  for (const previous of existing) {
    if (previousKeys.has(rowKey(previous))) throw new Error(`${key}: existing duplicate ${rowKey(previous)}`);
    previousKeys.add(rowKey(previous));
    const current = byKey.get(rowKey(previous));
    if (!current) throw new Error(`${key}: refusing to remove existing year/area ${rowKey(previous)}`);
    if (previous.value !== current.value || previous.unit !== current.unit || previous.areaName !== current.areaName) {
      throw new Error(`${key}: official source disagrees with existing history ${rowKey(previous)}`);
    }
  }
  const rows = [...byKey.values()].sort((a, b) => a.yearCode.localeCompare(b.yearCode) || a.areaCode.localeCompare(b.areaCode));
  const violations = classifyShape({ key, entity: "prefecture", summary: summarizeShape(rows), unit,
    priorSummary: summarizeShape(existing), now: new Date() });
  if (violations.length) throw new Error(`${key}: shape gate ${violations.map((v) => v.message).join("; ")}`);
  return rows;
}

type EstatValue = Record<string, string>;
interface EstatHistory {
  GET_STATS_DATA: {
    RESULT: { STATUS: number };
    PARAMETER: { STATS_DATA_ID: string };
    STATISTICAL_DATA: {
      RESULT_INF: { TOTAL_NUMBER: number; TO_NUMBER: number };
      DATA_INF: { VALUE: EstatValue[] };
    };
  };
}

/** Only the pinned SSDS series and prefecture universe may supply the historical years. */
export function parseAgriculturalHistory(raw: unknown): SingleEntityRow[] {
  const response = (raw as EstatHistory)?.GET_STATS_DATA;
  const spec = AGRICULTURAL_OUTPUT_RELEASE.history;
  if (response?.RESULT?.STATUS !== 0 || response.PARAMETER?.STATS_DATA_ID !== spec.statsDataId) {
    throw new Error("Agricultural history: wrong e-Stat response/table");
  }
  const data = response.STATISTICAL_DATA;
  if (data.RESULT_INF.TOTAL_NUMBER !== data.RESULT_INF.TO_NUMBER || !Array.isArray(data.DATA_INF.VALUE)) {
    throw new Error("Agricultural history: truncated e-Stat response");
  }
  const rows: SingleEntityRow[] = [];
  for (const value of data.DATA_INF.VALUE) {
    if (value["@cat01"] !== spec.cdCat01 || value["@unit"] !== spec.unit) throw new Error("Agricultural history: wrong series/unit");
    const areaName = prefectureByCode.get(value["@area"]);
    if (!areaName) {
      if (value["@area"] === "00000") continue;
      throw new Error("Agricultural history: unexpected geographic scope");
    }
    if (!/^\d{4}100000$/.test(value["@time"])) throw new Error("Agricultural history: expected calendar-year observations");
    const yearCode = value["@time"].slice(0, 4);
    // Later SSDS revisions must be explicitly adopted instead of overwriting the reviewed source.
    if (Number(yearCode) > spec.to || Number(yearCode) < spec.from) continue;
    if (!/^\d+(?:\.\d+)?$/.test(value.$)) throw new Error("Agricultural history: missing/non-numeric value");
    rows.push({ areaCode: value["@area"], areaName, yearCode, yearName: `${yearCode}年`, value: Number(value.$), unit: spec.unit });
  }
  return rows;
}
