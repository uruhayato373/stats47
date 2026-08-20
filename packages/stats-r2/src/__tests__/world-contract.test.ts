import { describe, expect, it } from "vitest";

import { WORLD_R2_PREFIX, worldR2Key } from "../types";

describe("worldR2Key (GEO-SCOPE-SEPARATION-01 WP7 — 契約のみ)", () => {
  it("doc 43 §5 で確定した key 命名 (app/world/<metric>/values.json) を生成する", () => {
    expect(worldR2Key("gdp-per-capita")).toBe("app/world/gdp-per-capita/values.json");
    expect(WORLD_R2_PREFIX).toBe("app/world");
  });

  it("Japan の series.json とは異なるファイル名を使う (namespace 混在防止)", () => {
    expect(worldR2Key("x")).not.toContain("series.json");
    expect(worldR2Key("x")).toContain("values.json");
  });
});
