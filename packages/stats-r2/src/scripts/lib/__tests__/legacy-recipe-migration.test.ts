import { buildRecipe, getMetricConfig } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

import {
  hashLegacyRows,
  migrateLegacyRecipe,
} from "../legacy-recipe-migration";

function requireTestConfig() {
  const value = getMetricConfig("ambulance-hospital-arrival-time");
  if (!value) throw new Error("test metric config is missing");
  return value;
}

const config = requireTestConfig();

function fixture() {
  const rows = [
    {
      areaCode: "01000",
      areaName: "北海道",
      yearCode: "2024",
      yearName: "2024年",
      value: 44.6,
      unit: "分",
    },
  ];
  return {
    metricKey: config.key,
    entityKind: "prefecture",
    rows,
    meta: {
      rowCount: rows.length,
      yearRange: ["2024", "2024"],
      areaCount: 1,
      generatedAt: "2026-07-19T10:40:20.996Z",
    },
  };
}

describe("legacy recipe migration", () => {
  it("行と生成日時を変えずに current config の recipe だけを追加する", () => {
    const payload = fixture();
    const result = migrateLegacyRecipe(payload, config, hashLegacyRows(payload.rows));

    expect(result.status).toBe("migrated");
    expect(result.payload.rows).toEqual(payload.rows);
    expect(result.payload.meta.generatedAt).toBe(payload.meta.generatedAt);
    expect(result.payload.meta.recipe).toEqual(buildRecipe(config));
  });

  it("行 fingerprint が1値でも変われば停止する", () => {
    const payload = fixture();
    expect(() => migrateLegacyRecipe(payload, config, "0".repeat(64))).toThrow(
      /row fingerprint changed/,
    );
  });

  it("既存 recipe が current config と一致すれば再書き込みしない", () => {
    const payload = fixture();
    const withRecipe = {
      ...payload,
      rows: [{ ...payload.rows[0], value: 45.1 }],
      meta: { ...payload.meta, recipe: buildRecipe(config) },
    };
    const result = migrateLegacyRecipe(withRecipe, config, hashLegacyRows(payload.rows));

    expect(result.status).toBe("current");
    expect(result.payload.rows[0]?.value).toBe(45.1);
  });

  it("既存 recipe が drift していれば上書きせず停止する", () => {
    const payload = fixture();
    const withRecipe = {
      ...payload,
      meta: {
        ...payload.meta,
        recipe: { ...buildRecipe(config), configHash: "0".repeat(16) },
      },
    };

    expect(() =>
      migrateLegacyRecipe(withRecipe, config, hashLegacyRows(payload.rows)),
    ).toThrow(/existing recipe drift/);
  });
});
