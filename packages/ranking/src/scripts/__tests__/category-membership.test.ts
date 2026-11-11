import { describe, expect, it } from "vitest";

import { expectedCategoryMembers, findMissingCategoryMembers } from "../lib/category-membership";

/**
 * カテゴリ一覧の所属漏れ検査の契約。
 * 守りたいのは「1,013 件のうち 9 件が欠けても件数の検査は通る」状況を、キー単位で必ず検出すること。
 */

const items = [
  { rankingKey: "a", isActive: true, categoryKey: "economy" },
  { rankingKey: "b", isActive: true, categoryKey: "economy", additionalCategories: ["population"] },
  { rankingKey: "c", isActive: false, categoryKey: "economy" },
  { rankingKey: "d", isActive: true, categoryKey: null },
];

describe("expectedCategoryMembers", () => {
  it("無効な指標とカテゴリの無い指標は入れず、追加カテゴリにも入れる", () => {
    const m = expectedCategoryMembers(items);
    expect([...(m.get("economy") ?? [])].sort()).toEqual(["a", "b"]);
    expect([...(m.get("population") ?? [])]).toEqual(["b"]);
    expect(m.size).toBe(2);
  });
});

describe("findMissingCategoryMembers", () => {
  it("全部入っていれば空", () => {
    const actual = new Map([
      ["economy", new Set(["a", "b"])],
      ["population", new Set(["b"])],
    ]);
    expect(findMissingCategoryMembers(items, actual)).toEqual([]);
  });

  it("件数が足りていても 1 件でも欠ければそのキーを返す (economy の 9 件欠けの再現)", () => {
    const actual = new Map([
      ["economy", new Set(["a", "zzz"])], // 件数は 2 で期待と同じだが b が無い
      ["population", new Set(["b"])],
    ]);
    expect(findMissingCategoryMembers(items, actual)).toEqual([{ categoryKey: "economy", rankingKey: "b" }]);
  });

  it("追加カテゴリ側の一覧からの欠けも見つける", () => {
    const actual = new Map([
      ["economy", new Set(["a", "b"])],
      ["population", new Set<string>()],
    ]);
    expect(findMissingCategoryMembers(items, actual)).toEqual([{ categoryKey: "population", rankingKey: "b" }]);
  });

  it("取得できなかったカテゴリは数えない (取得失敗は別の検査の担当)", () => {
    const actual = new Map([["economy", new Set(["a", "b"])]]);
    expect(findMissingCategoryMembers(items, actual)).toEqual([]);
  });

  it("余分なキーは違反にしない", () => {
    const actual = new Map([
      ["economy", new Set(["a", "b", "extra"])],
      ["population", new Set(["b"])],
    ]);
    expect(findMissingCategoryMembers(items, actual)).toEqual([]);
  });
});
