import { describe, expect, it } from "vitest";

import {
  parseMigrationFlowPayload,
  parseStatsValuesPayload,
} from "../schemas";

const statsPayload = {
  metricKey: "population",
  entityKind: "prefecture",
  rows: [
    {
      areaCode: "13000",
      areaName: "東京都",
      yearCode: "2020",
      yearName: "2020年",
      value: 14000000,
      unit: "人",
      rank: 1,
    },
  ],
  meta: {
    rowCount: 1,
    yearRange: ["2020", "2020"],
    areaCount: 1,
    generatedAt: "2026-06-21T00:00:00.000Z",
  },
};

const migrationPayload = {
  metricKey: "migration",
  entityKind: "migration-flow",
  year: 2020,
  rows: [
    {
      fromPrefCode: "13000",
      toPrefCode: "14000",
      inflow: 100,
      outflow: 80,
      net: 20,
    },
  ],
  meta: {
    rowCount: 1,
    generatedAt: "2026-06-21T00:00:00.000Z",
  },
};

describe("parseStatsValuesPayload", () => {
  it("valid stats payload を parse できる", () => {
    const result = parseStatsValuesPayload(statsPayload);

    expect(result.metricKey).toBe("population");
    expect(result.rows[0]?.areaCode).toBe("13000");
  });

  it("value は null を許可する", () => {
    const result = parseStatsValuesPayload({
      ...statsPayload,
      rows: [{ ...statsPayload.rows[0], value: null }],
    });

    expect(result.rows[0]?.value).toBeNull();
  });

  it("rows が配列でない場合は拒否する", () => {
    expect(() =>
      parseStatsValuesPayload({ ...statsPayload, rows: null }),
    ).toThrow("rows must be an array");
  });

  it("value が finite number でない場合は拒否する", () => {
    expect(() =>
      parseStatsValuesPayload({
        ...statsPayload,
        rows: [{ ...statsPayload.rows[0], value: Number.NaN }],
      }),
    ).toThrow("rows[0].value must be a finite number");
  });
});

describe("parseMigrationFlowPayload", () => {
  it("valid migration-flow payload を parse できる", () => {
    const result = parseMigrationFlowPayload(migrationPayload);

    expect(result.year).toBe(2020);
    expect(result.rows[0]?.net).toBe(20);
  });

  it("entityKind が migration-flow でない場合は拒否する", () => {
    expect(() =>
      parseMigrationFlowPayload({ ...migrationPayload, entityKind: "prefecture" }),
    ).toThrow("entityKind must be migration-flow");
  });

  it("inflow が数値でない場合は拒否する", () => {
    expect(() =>
      parseMigrationFlowPayload({
        ...migrationPayload,
        rows: [{ ...migrationPayload.rows[0], inflow: "100" }],
      }),
    ).toThrow("rows[0].inflow must be a finite number");
  });
});
