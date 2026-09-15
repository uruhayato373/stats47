import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AREA_DATABOOK_TEMPLATE } from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

const COMPONENT_DIR = resolve(import.meta.dirname, "..");
const sectionSource = readFileSync(
  resolve(COMPONENT_DIR, "AreaDatabookSection.tsx"),
  "utf8",
);

describe("県データブックの情報密度契約", () => {
  it("主要統計を編集コンテンツより先に表示する", () => {
    const ordered = [...AREA_DATABOOK_TEMPLATE.sections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => section.sectionKey);

    expect(ordered.slice(0, 3)).toEqual([
      "civic-population",
      "civic-economy",
      "civic-living",
    ]);
    expect(ordered.slice(-2)).toEqual(["symbols", "specialties"]);
  });

  it("章をChartPanelで囲まず、複数の半幅チャートだけを2列にする", () => {
    expect(sectionSource).not.toContain("import { ChartPanel }");
    expect(sectionSource).toContain("hasMultipleHalfWidthCharts(section)");
    expect(sectionSource).toContain("col-span-12 @md:col-span-6");
  });
});
