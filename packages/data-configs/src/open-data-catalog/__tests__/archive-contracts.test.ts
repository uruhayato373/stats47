import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import recipes from "../../../../../data/open-data/fetch/recipes.json";
import schema from "../../../../../config/schema/open-data.fetch-recipes.schema.json";
import type { OpenDataFetchRecipe, OpenDataNormalizedTable, OpenDataExpansion } from "..";
import { normalizeOpenDataArea } from "../normalized-table";

describe("open data archive contracts", () => {
  it("accepts the three pilot recipes and refuses incomplete discriminated fetches", () => {
    const validate = new Ajv().compile(schema);
    expect(validate(recipes)).toBe(true);
    expect(validate({ recipes: [{ datasetId: "sample", version: "v1", fetch: { type: "http-file" } }] })).toBe(false);
    expect(recipes.recipes).toHaveLength(3);
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
