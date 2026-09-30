import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { NAV_GROUPS, isNavItemActive } from "@/lib/nav-registry";

const APP_DIR = path.resolve(__dirname, "../../app");
const params = (query = "") => new URLSearchParams(query);
const hrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));

describe("nav-registry (左メニューの SSOT)", () => {
  it("メニューの全項目に対応するページ (app/<path>/page.tsx) が実在する", () => {
    for (const href of hrefs) {
      const route = href.split("?")[0];
      const page = path.join(APP_DIR, route === "/" ? "" : route, "page.tsx");
      expect(existsSync(page), `${href} → ${page}`).toBe(true);
    }
  });

  it("href が重複しない (同じ画面が二重に出ない)", () => {
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("より具体的な項目が一致するとき、親 (/strategy) は現在地にならない", () => {
    expect(isNavItemActive("/strategy/lanes", params(), "/strategy", hrefs)).toBe(false);
    expect(isNavItemActive("/strategy/lanes", params(), "/strategy/lanes", hrefs)).toBe(true);
    expect(isNavItemActive("/strategy", params(), "/strategy", hrefs)).toBe(true);
  });

  it("/content は完全一致だけ (子の /content/note が親を点灯させない)", () => {
    expect(isNavItemActive("/content/note", params(), "/content", hrefs)).toBe(false);
    expect(isNavItemActive("/content", params(), "/content", hrefs)).toBe(true);
  });

  it("TODO は ?f=層 まで比較し、未知の f はバックログへフォールバックする", () => {
    expect(isNavItemActive("/todo", params(), "/todo", hrefs)).toBe(true);
    expect(isNavItemActive("/todo", params("f=unknown"), "/todo", hrefs)).toBe(true);
    expect(isNavItemActive("/todo", params("f=weekly"), "/todo", hrefs)).toBe(false);
    expect(isNavItemActive("/todo", params("f=weekly"), "/todo?f=weekly", hrefs)).toBe(true);
    expect(isNavItemActive("/todo", params(), "/todo?f=weekly", hrefs)).toBe(false);
  });

  it("ホームは / だけ", () => {
    expect(isNavItemActive("/", params(), "/", hrefs)).toBe(true);
    expect(isNavItemActive("/ops", params(), "/", hrefs)).toBe(false);
  });
});
