import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CHANNELS, channelsOf } from "@/lib/channel-registry";
import { NAV_GROUPS, isBranch, isNavItemActive, navHrefs } from "@/lib/nav-registry";

const APP_DIR = path.resolve(__dirname, "../../app");
const params = (query = "") => new URLSearchParams(query);
const hrefs = navHrefs(NAV_GROUPS);

describe("nav-registry (左メニューの SSOT)", () => {
  it("メニューの全項目 (枝の中も含む) に対応するページ (app/<path>/page.tsx) が実在する", () => {
    for (const href of hrefs) {
      const route = href.split("?")[0];
      const page = path.join(APP_DIR, route === "/" ? "" : route, "page.tsx");
      expect(existsSync(page), `${href} → ${page}`).toBe(true);
    }
  });

  it("href が重複しない (同じ画面が二重に出ない)", () => {
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("全チャネルがメニューに載り、商品・SNS の各グループの「チャネル別」の枝に channel-registry の順で入る", () => {
    for (const [title, group] of [["商品", "product"], ["SNS", "sns"]] as const) {
      const branch = NAV_GROUPS.find((g) => g.title === title)?.items.find(isBranch);
      expect(branch?.children.map((c) => c.href), title).toEqual(channelsOf(group).map((c) => c.href));
    }
    // 新しいチャネルを registry に足したらメニューにも出る (直書きの取り残しを防ぐ)
    for (const channel of CHANNELS) expect(hrefs).toContain(channel.href);
  });

  it("チャネルのサブ画面 (/content/note/covers) でも、そのチャネルが現在地になる", () => {
    expect(isNavItemActive("/content/note/covers", params(), "/content/note", hrefs)).toBe(true);
    expect(isNavItemActive("/content/note/covers", params(), "/content", hrefs)).toBe(false);
  });

  it("販売状態とココナラは別の画面として現在地を持つ", () => {
    expect(isNavItemActive("/product/coconala", params(), "/product/coconala", hrefs)).toBe(true);
    expect(isNavItemActive("/product/coconala", params(), "/product/status", hrefs)).toBe(false);
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
