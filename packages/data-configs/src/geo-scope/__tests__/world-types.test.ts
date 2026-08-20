import { describe, expect, it } from "vitest";

import {
  WORLD_CATALOGS,
  WORLD_DATA_PROVIDER_CANDIDATES,
  WORLD_DATA_PROVIDER_EVALUATIONS,
  getWorldCatalogTheme,
  listWorldCatalogThemes,
} from "../world-types";

describe("WORLD_CATALOGS (GEO-SCOPE-SEPARATION-01 WP7 — 契約のみ・データ無し)", () => {
  it("Phase 1 では意図的に空 (国際データ取得は別 backlog)", () => {
    expect(listWorldCatalogThemes()).toEqual([]);
    expect(Object.keys(WORLD_CATALOGS)).toHaveLength(0);
  });

  it("getWorldCatalogTheme は常に undefined を返す (フォールバックしない)", () => {
    expect(getWorldCatalogTheme("education-culture")).toBeUndefined();
    expect(getWorldCatalogTheme("any-slug")).toBeUndefined();
  });
});

describe("WORLD_DATA_PROVIDER_EVALUATIONS (read-only 机上評価)", () => {
  it("候補 provider 全てに評価がある (机上評価の抜け漏れを防ぐ)", () => {
    const evaluated = new Set(WORLD_DATA_PROVIDER_EVALUATIONS.map((e) => e.provider));
    for (const candidate of WORLD_DATA_PROVIDER_CANDIDATES) {
      expect(evaluated.has(candidate), `${candidate} の評価が無い`).toBe(true);
    }
  });

  it("各評価は根拠 URL とアクセス日を持つ (推測で書かない)", () => {
    for (const e of WORLD_DATA_PROVIDER_EVALUATIONS) {
      expect(e.sourceUrl).toMatch(/^https?:\/\//);
      expect(e.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.license.length).toBeGreaterThan(0);
    }
  });
});
