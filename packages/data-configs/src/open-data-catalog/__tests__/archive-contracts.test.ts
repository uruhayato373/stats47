import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import recipes from "../../../../../data/open-data/fetch/recipes.json";
import schema from "../../../../../config/schema/open-data.fetch-recipes.schema.json";
import type { OpenDataFetchRecipe, OpenDataNormalizedTable, OpenDataExpansion } from "..";
import { normalizeOpenDataArea } from "../normalized-table";

describe("open data archive contracts", () => {
  it("accepts the recipe ledger including the three pilots and refuses incomplete discriminated fetches", () => {
    const validate = new Ajv().compile(schema);
    expect(validate(recipes)).toBe(true);
    expect(validate({ recipes: [{ datasetId: "sample", version: "v1", fetch: { type: "http-file" } }] })).toBe(false);
    // 取得定義は 136 件へ広がった (1bc770f78)。件数ではなく、最初の 3 件の pilot が残っていることを固定する
    expect(recipes.recipes.map((recipe) => recipe.datasetId)).toEqual(
      expect.arrayContaining(["mhlw-medical-hospitals", "mhlw-medical-clinics", "reinfolib-transaction-prices"]),
    );
  });
  it("keeps the public types usable without storage dependencies", () => {
    const recipe: OpenDataFetchRecipe = { datasetId: "sample", version: "v1", fetch: { type: "skip", reason: "other", note: "fixture" } };
    const table: OpenDataNormalizedTable = {
      datasetId: recipe.datasetId, version: recipe.version, table: "count", columns: ["areaCode", "value"],
      rows: [{ ...normalizeOpenDataArea("prefecture", "01"), time: "2026", dims: {}, value: 1, unit: "施設" }],
      provenance: { manifestKey: "key", manifestSha256: "sha", recipeSha256: "sha" },
    };
    const expansion: OpenDataExpansion = { entries: [] };
    expect(table.rows[0].value).toBe(1);
    expect(expansion.entries).toEqual([]);
  });
});
