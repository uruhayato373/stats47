import { buildRecipe } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import {
  parseJapanSeriesArtifact,
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

describe("meta.recipe の round-trip (★ホワイトリスト落ちの再発防止)", () => {
  // parseStatsMeta は meta をホワイトリストで再構築する。types.ts だけ拡張して
  // schemas.ts を直し忘れると、書いたレシピが読み側で黙って消え、監査が
  // 全件「未焼き込み」と誤判定する。それを構造的に検知するためのテスト。
  const recipe = buildRecipe({
    key: "population",
    title: "人口",
    unit: "人",
    category: "population",
    source: { kind: "estat", statsDataId: "0003448237", cdCat01: "A1101", cdCat03: "02" },
    entities: ["prefecture"],
    years: "all",
  });

  it("書いたレシピがそのまま読める", () => {
    const result = parseStatsValuesPayload({
      ...statsPayload,
      meta: { ...statsPayload.meta, recipe: JSON.parse(JSON.stringify(recipe)) },
    });

    expect(result.meta.recipe).toEqual(recipe);
    expect(result.meta.recipe?.configHash).toBe(recipe.configHash);
    // 軸 pin が消えていないこと (ここが落ちると多系列混入を検知できなくなる)
    expect(result.meta.recipe?.estatParams?.cdCat03).toBe("02");
  });

  it("recipe が無い旧 payload も従来どおり読める (読み取りを壊さない)", () => {
    const result = parseStatsValuesPayload(statsPayload);
    expect(result.meta.recipe).toBeUndefined();
    expect(result.meta.rowCount).toBe(1);
  });

  it("壊れた recipe は throw せず落とす (1 フィールドで payload 全体を捨てない)", () => {
    const result = parseStatsValuesPayload({
      ...statsPayload,
      meta: { ...statsPayload.meta, recipe: { kind: "estat" } },
    });
    expect(result.meta.recipe).toBeUndefined();
    expect(result.meta.rowCount).toBe(1);
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

describe("parseJapanSeriesArtifact (GEO-SCOPE-SEPARATION-01 WP3)", () => {
  const japanArtifact = {
    schemaVersion: 1,
    metricKey: "library-count-per-million",
    geographyScope: "japan",
    sourceMode: "official",
    rows: [
      { yearCode: "2020", yearName: "2020年", value: 15.31, unit: "校" },
      { yearCode: "2021", yearName: "2021年", value: 15.2, unit: "校" },
    ],
    meta: {
      generatedAt: "2026-08-20T00:00:00.000Z",
      configHash: "abc123",
      recipeHash: "def456",
      sourceId: "0000010205",
    },
  };

  it("valid japan series artifact を parse できる", () => {
    const result = parseJapanSeriesArtifact(japanArtifact);
    expect(result.metricKey).toBe("library-count-per-million");
    expect(result.sourceMode).toBe("official");
    expect(result.rows).toHaveLength(2);
  });

  it("rank・areaCode を持たない (47都道府県のフィールドを混入させない)", () => {
    const result = parseJapanSeriesArtifact(japanArtifact);
    expect(result.rows[0]).not.toHaveProperty("rank");
    expect(result.rows[0]).not.toHaveProperty("areaCode");
  });

  it("schemaVersion が 1 でない場合は拒否する", () => {
    expect(() =>
      parseJapanSeriesArtifact({ ...japanArtifact, schemaVersion: 2 }),
    ).toThrow("schemaVersion must be 1");
  });

  it("geographyScope が 'japan' でない場合は拒否する", () => {
    expect(() =>
      parseJapanSeriesArtifact({ ...japanArtifact, geographyScope: "prefecture" }),
    ).toThrow("geographyScope must be 'japan'");
  });

  it("sourceMode が未知の値なら拒否する ('average' や '47-pref-mean' 等を通さない)", () => {
    expect(() =>
      parseJapanSeriesArtifact({ ...japanArtifact, sourceMode: "average" }),
    ).toThrow("sourceMode must be one of");
  });

  it("row の value が非有限数なら拒否する (0 埋め・プレースホルダを通さない)", () => {
    expect(() =>
      parseJapanSeriesArtifact({
        ...japanArtifact,
        rows: [{ ...japanArtifact.rows[0], value: Number.NaN }],
      }),
    ).toThrow("rows[0].value must be a finite number");
  });

  it("meta の必須フィールドが欠けていれば拒否する (provenance を失わない)", () => {
    expect(() =>
      parseJapanSeriesArtifact({
        ...japanArtifact,
        meta: { generatedAt: "2026-08-20T00:00:00.000Z" },
      }),
    ).toThrow("meta.configHash must be a string");
  });
});
