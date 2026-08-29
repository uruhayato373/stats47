import { describe, expect, it } from "vitest";

import {
  buildReferenceContentPortfolio,
  type ReferenceContentInput,
} from "@/lib/content-operations/reference";

function fixture(overrides: Partial<ReferenceContentInput> = {}): ReferenceContentInput {
  return {
    expectedSourceKeys: ["book-a", "book-b"],
    inventories: [
      {
        sourceKey: "book-a",
        edition: "2026",
        sourcePath: ".claude/state/source-inventory/book-a/2026/inventory.json",
        items: [
          {
            id: "metric-evidence",
            resolution: "reuse-existing-metric",
            primarySource: { url: "https://example.go.jp/stat" },
            mapping: {
              metricKeys: ["sample-metric"],
              contentRoles: ["ranking", "blog", "note"],
            },
          },
          {
            id: "blocked-evidence",
            resolution: "rights-hold",
            mapping: { metricKeys: ["must-not-appear"] },
          },
          { id: "context-evidence", resolution: "context-only" },
        ],
      },
      {
        sourceKey: "book-b",
        edition: "2025",
        sourcePath: ".claude/state/source-inventory/book-b/2025/inventory.json",
        items: [
          {
            id: "area-evidence",
            resolution: "combined-analysis",
            primarySource: { url: "https://pref.example.jp/symbol" },
            mapping: { areaCodes: ["01000"], contentRoles: ["area"] },
          },
        ],
      },
    ],
    metrics: [
      {
        key: "sample-metric",
        title: "サンプル指標",
        active: true,
        sourcePath: "packages/data-configs/src/metrics/sample-metric.ts",
      },
    ],
    blogs: [
      {
        slug: "sample-analysis",
        title: "分析記事",
        published: true,
        rankingKeys: ["sample-metric"],
      },
    ],
    notes: [],
    kindleBooks: [
      { id: "K-S1-01", status: "generated", rankingKeys: [], blogSlugs: ["sample-analysis"] },
    ],
    areas: [
      {
        code: "01000",
        name: "北海道",
        editorialPath: "packages/data-configs/src/area-databook/editorial/01000.ts",
      },
    ],
    ...overrides,
  };
}

describe("reference content portfolio", () => {
  it("根拠候補を指標・地域の制作単位へ重複排除して既存成果物と突合する", () => {
    const result = buildReferenceContentPortfolio(fixture());

    expect(result.audit.status).toBe("pass");
    expect(result.summary).toMatchObject({
      sourceItems: 4,
      productionEvidence: 2,
      contextEvidence: 1,
      blockedEvidence: 1,
      productionUnits: 2,
    });
    expect(result.units.map((unit) => unit.id)).toEqual([
      "metric:sample-metric",
      "area:01000",
    ]);
    const metric = result.units.find((unit) => unit.id === "metric:sample-metric")!;
    expect(metric.channels.map((channel) => [channel.channel, channel.stage])).toEqual([
      ["site", "integrated"],
      ["blog", "integrated"],
      ["note", "ready"],
      ["kindle", "integrated"],
    ]);
  });

  it("rights-holdを制作単位へ昇格せず、欠落inventoryと接続先を機械検出する", () => {
    const input = fixture({
      expectedSourceKeys: ["book-a", "book-b", "missing-book"],
      metrics: [],
      areas: [{ code: "01000", name: "北海道", editorialPath: null }],
    });
    const result = buildReferenceContentPortfolio(input);

    expect(result.units.some((unit) => unit.id.includes("must-not-appear"))).toBe(false);
    expect(result.audit.status).toBe("fail");
    expect(result.audit.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "REFERENCE_INVENTORY_MISSING",
        "REFERENCE_METRIC_MISSING",
        "REFERENCE_AREA_EDITORIAL_MISSING",
      ]),
    );
  });

  it("非公開metricから下流制作をreadyにしない", () => {
    const input = fixture({
      metrics: [
        {
          key: "sample-metric",
          title: "サンプル指標",
          active: false,
          sourcePath: "packages/data-configs/src/metrics/sample-metric.ts",
        },
      ],
      blogs: [],
      kindleBooks: [],
    });
    const result = buildReferenceContentPortfolio(input);
    const metric = result.units.find((unit) => unit.id === "metric:sample-metric")!;

    expect(metric.channels.filter((channel) => channel.stage === "blocked").map((x) => x.channel))
      .toEqual(["site", "blog", "note"]);
    expect(result.summary.readySlots).toBe(0);
  });
});
