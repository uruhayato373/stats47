import { createSnapshotReader, type SnapshotReadResult } from "@stats47/r2-storage/server";
import { describe, expect, it } from "vitest";

import { mapCategoriesReadResult } from "../repositories/read-categories-snapshot";
import {
  buildCategoriesSnapshot,
  parseCategoriesSnapshot,
} from "../types/snapshot";

const categories = [
  {
    categoryKey: "population",
    categoryName: "人口・世帯",
    icon: "Users",
    displayOrder: 1,
  },
];

describe("categories producer / schema / reader contract", () => {
  it("producerが生成したJSONを同じruntime parser付きreaderでround-tripする", async () => {
    const produced = buildCategoriesSnapshot(categories, "2026-08-26T00:00:00.000Z");
    const load = createSnapshotReader({
      key: "categories/all.json",
      label: "categories",
      parse: parseCategoriesSnapshot,
      select: (snapshot) => snapshot.categories,
      fallback: [],
      fetchText: async () => JSON.stringify(produced),
      now: () => new Date("2026-08-26T00:00:00.000Z"),
    });

    await expect(load.readResult()).resolves.toMatchObject({
      status: "ok",
      data: categories,
    });
  });

  it("schemaVersion無しの旧snapshotをv2へ明示移行する", () => {
    const result = parseCategoriesSnapshot({
      generatedAt: "2026-08-01T00:00:00.000Z",
      count: 1,
      categories,
    });

    expect(result.schemaVersion).toBe(2);
  });

  it("未知schemaとcount不一致を拒否する", () => {
    expect(() =>
      parseCategoriesSnapshot({
        schemaVersion: 3,
        generatedAt: "2026-08-01T00:00:00.000Z",
        count: 1,
        categories,
      }),
    ).toThrow("schemaVersion");
    expect(() =>
      parseCategoriesSnapshot({
        schemaVersion: 2,
        generatedAt: "2026-08-01T00:00:00.000Z",
        count: 0,
        categories,
      }),
    ).toThrow("count");
  });
});

describe("categories page adapter state mapping", () => {
  const error = new Error("fixture failure");

  it.each<{
    state: SnapshotReadResult<typeof categories>;
    success: boolean;
    data?: typeof categories;
  }>([
    { state: { status: "ok", data: categories, attempts: 1 }, success: true, data: categories },
    { state: { status: "no-data", attempts: 1 }, success: true, data: [] },
    {
      state: {
        status: "stale",
        data: categories,
        generatedAt: "2026-01-01T00:00:00.000Z",
        ageDays: 200,
        attempts: 1,
      },
      success: true,
      data: categories,
    },
    {
      state: {
        status: "source-unavailable",
        reason: "transport-error",
        error,
        attempts: 2,
      },
      success: false,
    },
    {
      state: {
        status: "schema-invalid",
        reason: "schema-invalid",
        error,
        attempts: 1,
      },
      success: false,
    },
  ])("$state.statusを意図したResultへ写像する", ({ state, success, data }) => {
    const result = mapCategoriesReadResult(state);

    expect(result.success).toBe(success);
    if (result.success) expect(result.data).toEqual(data);
    else expect(result.error.message).toContain(state.status);
  });
});
