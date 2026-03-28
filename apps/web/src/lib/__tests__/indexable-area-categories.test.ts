import { describe, it, expect } from "vitest";

import {
  INDEXABLE_AREA_CATEGORIES,
  INDEXABLE_AREA_CATEGORIES_SET,
} from "../indexable-area-categories";

describe("INDEXABLE_AREA_CATEGORIES", () => {
  it("配列が定義されている", () => {
    expect(INDEXABLE_AREA_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("population を含む", () => {
    expect(INDEXABLE_AREA_CATEGORIES).toContain("population");
  });

  it("economy を含む", () => {
    expect(INDEXABLE_AREA_CATEGORIES).toContain("economy");
  });
});

describe("INDEXABLE_AREA_CATEGORIES_SET", () => {
  it("Set が配列と同じ要素数を持つ", () => {
    expect(INDEXABLE_AREA_CATEGORIES_SET.size).toBe(INDEXABLE_AREA_CATEGORIES.length);
  });

  it("has() で正しく検索できる", () => {
    expect(INDEXABLE_AREA_CATEGORIES_SET.has("population")).toBe(true);
    expect(INDEXABLE_AREA_CATEGORIES_SET.has("unknown")).toBe(false);
  });
});
