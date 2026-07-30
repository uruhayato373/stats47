import { parseRecipe } from "@stats47/data-configs";

import type {
  MigrationFlowPayload,
  MigrationFlowRow,
  SingleEntityRow,
  StatsValuesPayload,
} from "./types";

const ENTITY_KINDS = new Set(["prefecture", "city", "port"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`${path} must be a string`);
  }
  return value;
}

function assertFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number`);
  }
  return value;
}

function assertNullableFiniteNumber(value: unknown, path: string): number | null {
  if (value === null) return null;
  return assertFiniteNumber(value, path);
}

function assertOptionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined;
  return assertString(value, path);
}

function assertOptionalNullableFiniteNumber(
  value: unknown,
  path: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  return assertNullableFiniteNumber(value, path);
}

function parseSingleEntityRow(value: unknown, index: number): SingleEntityRow {
  if (!isRecord(value)) {
    throw new Error(`rows[${index}] must be an object`);
  }

  return {
    areaCode: assertString(value.areaCode, `rows[${index}].areaCode`),
    areaName: assertString(value.areaName, `rows[${index}].areaName`),
    yearCode: assertString(value.yearCode, `rows[${index}].yearCode`),
    yearName: assertString(value.yearName, `rows[${index}].yearName`),
    value: assertNullableFiniteNumber(value.value, `rows[${index}].value`),
    unit: assertOptionalString(value.unit, `rows[${index}].unit`),
    rank: assertOptionalNullableFiniteNumber(value.rank, `rows[${index}].rank`),
    prefectureCode: assertOptionalString(value.prefectureCode, `rows[${index}].prefectureCode`),
    rankPref: assertOptionalNullableFiniteNumber(value.rankPref, `rows[${index}].rankPref`),
  };
}

function parseMigrationFlowRow(value: unknown, index: number): MigrationFlowRow {
  if (!isRecord(value)) {
    throw new Error(`rows[${index}] must be an object`);
  }

  return {
    fromPrefCode: assertString(value.fromPrefCode, `rows[${index}].fromPrefCode`),
    toPrefCode: assertString(value.toPrefCode, `rows[${index}].toPrefCode`),
    inflow: assertFiniteNumber(value.inflow, `rows[${index}].inflow`),
    outflow: assertFiniteNumber(value.outflow, `rows[${index}].outflow`),
    net: assertFiniteNumber(value.net, `rows[${index}].net`),
  };
}

function parseStatsMeta(value: unknown): StatsValuesPayload["meta"] {
  if (!isRecord(value)) {
    throw new Error("meta must be an object");
  }

  const yearRangeValue = value.yearRange;
  let yearRange: [string, string] | null;
  if (yearRangeValue === null) {
    yearRange = null;
  } else if (
    Array.isArray(yearRangeValue) &&
    yearRangeValue.length === 2 &&
    typeof yearRangeValue[0] === "string" &&
    typeof yearRangeValue[1] === "string"
  ) {
    yearRange = [yearRangeValue[0], yearRangeValue[1]];
  } else {
    throw new Error("meta.yearRange must be null or [string, string]");
  }

  // ★parseStatsMeta はホワイトリスト再構築なので、meta を拡張したら必ずここにも足す。
  //   足し忘れると読み側で黙って消える (recipe が消えると監査が全件 unbaked になる)。
  //   recipe の解釈は `@stats47/data-configs` の parseRecipe が単一定義 —
  //   ここで独自にフィールドを列挙しない (二重定義はドリフトの温床)。
  const recipe = value.recipe === undefined ? null : parseRecipe(value.recipe);

  return {
    rowCount: assertFiniteNumber(value.rowCount, "meta.rowCount"),
    yearRange,
    areaCount: assertFiniteNumber(value.areaCount, "meta.areaCount"),
    generatedAt: assertString(value.generatedAt, "meta.generatedAt"),
    ...(recipe ? { recipe } : {}),
  };
}

function parseMigrationFlowMeta(value: unknown): MigrationFlowPayload["meta"] {
  if (!isRecord(value)) {
    throw new Error("meta must be an object");
  }

  return {
    rowCount: assertFiniteNumber(value.rowCount, "meta.rowCount"),
    generatedAt: assertString(value.generatedAt, "meta.generatedAt"),
  };
}

export function parseStatsValuesPayload(value: unknown): StatsValuesPayload {
  if (!isRecord(value)) {
    throw new Error("stats values payload must be an object");
  }

  const entityKind = assertString(value.entityKind, "entityKind");
  if (!ENTITY_KINDS.has(entityKind)) {
    throw new Error("entityKind must be one of prefecture, city, port");
  }
  if (!Array.isArray(value.rows)) {
    throw new Error("rows must be an array");
  }

  return {
    metricKey: assertString(value.metricKey, "metricKey"),
    entityKind: entityKind as StatsValuesPayload["entityKind"],
    rows: value.rows.map(parseSingleEntityRow),
    meta: parseStatsMeta(value.meta),
  };
}

export function parseMigrationFlowPayload(value: unknown): MigrationFlowPayload {
  if (!isRecord(value)) {
    throw new Error("migration-flow payload must be an object");
  }
  if (!Array.isArray(value.rows)) {
    throw new Error("rows must be an array");
  }

  const entityKind = assertString(value.entityKind, "entityKind");
  if (entityKind !== "migration-flow") {
    throw new Error("entityKind must be migration-flow");
  }

  return {
    metricKey: assertString(value.metricKey, "metricKey"),
    entityKind,
    year: assertFiniteNumber(value.year, "year"),
    rows: value.rows.map(parseMigrationFlowRow),
    meta: parseMigrationFlowMeta(value.meta),
  };
}
