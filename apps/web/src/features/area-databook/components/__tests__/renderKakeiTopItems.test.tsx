import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AREA_DATABOOK_TEMPLATE } from "@stats47/data-configs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KAKEI_TOP_ITEMS_HEADING, KAKEI_TOP_ITEMS_SECTION_KEY, renderKakeiTopItems } from "../renderKakeiTopItems";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";

const base: AreaDatabookSnapshot = {
  areaCode: "09000",
  areaName: "栃木県",
  metrics: {},
  agriTop10: [],
  generatedAt: "2026-11-02T00:00:00.000Z",
};

const html = (databook: AreaDatabookSnapshot | null) => {
  const node = renderKakeiTopItems(databook);
  return node ? renderToStaticMarkup(node) : "";
};

describe("renderKakeiTopItems", () => {
  it("品目を値・順位・年つきで出し、県庁所在市の値だと見出しで示す", () => {
    const out = html({
      ...base,
      kakeiTopItems: [
        { rankingKey: "gyoza-frozen-consumption-expenditure", label: "ぎょうざ消費支出額", value: 3500, unit: "円", year: "2025年", rank: 1 },
        { rankingKey: "beef-consumption-quantity", label: "牛肉消費量", value: 9000, unit: "g", year: "2025年", rank: 3 },
      ],
    });
    expect(out).toContain(KAKEI_TOP_ITEMS_HEADING);
    expect(out).toContain("県庁所在市");
    expect(out).toContain("ぎょうざ消費支出額");
    expect(out).toContain("3,500");
    expect(out).toContain("1位");
    expect(out).toContain("3位");
    expect(out).toContain("2025年");
    expect(out).toContain('href="/ranking/gyoza-frozen-consumption-expenditure"');
  });

  it("該当品目が無い県・欄を焼き込む前の databook・databook 無しでは何も出さない", () => {
    expect(html({ ...base, kakeiTopItems: [] })).toBe("");
    expect(html(base)).toBe("");
    expect(html(null)).toBe("");
  });

  it("置き先の節がテンプレに実在し、共通 6 品目の欄 (ranked-kpi-grid) も残っている", () => {
    const section = AREA_DATABOOK_TEMPLATE.sections.find((s) => s.sectionKey === KAKEI_TOP_ITEMS_SECTION_KEY);
    const grid = section?.blocks.find((b) => b.blockType === "ranked-kpi-grid");
    expect(grid && "metrics" in grid ? grid.metrics.length : 0).toBe(6);
  });

  it("県データブックの節が、この欄を置き先の節の末尾に描く", () => {
    const source = readFileSync(resolve(import.meta.dirname, "..", "AreaDatabookSection.tsx"), "utf8");
    expect(source).toContain("KAKEI_TOP_ITEMS_SECTION_KEY");
    expect(source).toContain("renderKakeiTopItems(data.databook)");
  });
});
