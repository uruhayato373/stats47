import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { THEME_SELECTION_VIEWPOINTS } from "../../../../../config/paths.mjs";
import {
  countAdoptionCriteria,
  evaluateSelectionViewpoints,
  MACHINE_VIEWPOINT_IDS,
  metricYearCount,
} from "../selection-viewpoints";
import { ADOPTION_CRITERIA, type ThemeCatalog } from "../types";

// 指標を選ぶ視点の正本は config/ の JSON。採用基準の id は型 (ADOPTION_CRITERIA) と JSON Schema の enum にもあり、
// 機械で数える規則の id は selection-viewpoints.ts の関数にもある。どれかだけを変えると、管理画面に出ない規則や
// 書けない採用基準が生まれるので、ここで一致を止める。
const ROOT = path.resolve(__dirname, "../../../../..");
const viewpoints = JSON.parse(readFileSync(path.join(ROOT, THEME_SELECTION_VIEWPOINTS), "utf8")) as {
  adoptionCriteria: Array<{ id: string; label: string; question: string }>;
  rules: Array<{ id: string; title: string; statement: string; severity: string; check: { kind: string } }>;
};
const schema = JSON.parse(
  readFileSync(path.join(ROOT, "data/themes/schema/theme-catalog.schema.json"), "utf8"),
) as unknown;

function findAdoptionEnum(node: unknown): string[] | null {
  if (!node || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  const items = record.adoptionCriteria as { items?: { enum?: string[] } } | undefined;
  if (items?.items?.enum) return items.items.enum;
  for (const value of Object.values(record)) {
    const found = findAdoptionEnum(value);
    if (found) return found;
  }
  return null;
}

describe(`${THEME_SELECTION_VIEWPOINTS}`, () => {
  it("採用基準の id は型と JSON Schema の enum と同じ並びで一致する", () => {
    const ids = viewpoints.adoptionCriteria.map((c) => c.id);
    expect(ids).toEqual([...ADOPTION_CRITERIA]);
    expect(findAdoptionEnum(schema)).toEqual(ids);
    for (const c of viewpoints.adoptionCriteria) {
      expect(c.label.trim(), c.id).not.toBe("");
      expect(c.question.trim(), c.id).not.toBe("");
    }
  });

  it("機械で数える規則は判定関数と 1 対 1 で、残りは人が確かめる規則として書かれている", () => {
    const ids = viewpoints.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const machine = viewpoints.rules.filter((r) => r.check.kind === "machine").map((r) => r.id);
    expect(machine.sort()).toEqual([...MACHINE_VIEWPOINT_IDS].sort());
    for (const rule of viewpoints.rules) {
      expect(["machine", "review"], rule.id).toContain(rule.check.kind);
      expect(["fix", "review"], rule.id).toContain(rule.severity);
      expect(rule.title.trim(), rule.id).not.toBe("");
      expect(rule.statement.trim(), rule.id).not.toBe("");
    }
  });
});

const lineChart = (componentKey: string, refs: Array<{ metricKey: string; area?: "national" }>) => ({
  componentKey,
  componentType: "line-chart" as const,
  title: `${componentKey} の推移`,
  sortOrder: 10,
  componentProps: { seriesRefs: refs },
  relatedRankingKeys: refs.map((r) => r.metricKey),
});

function theme(overrides: Partial<ThemeCatalog>): ThemeCatalog {
  return {
    key: "t",
    title: "テーマ",
    description: "",
    category: "economy",
    usage: "theme",
    metrics: [],
    charts: [],
    ...overrides,
  } as ThemeCatalog;
}

// 図の参照 (seriesRefs) は実在の metric だけが読まれるので、実在の key に年の形だけを差し替えて使う
const MULTI = "total-production-in-the-prefecture";
const OTHER = "per-capita-prefectural-income-h27";
const SINGLE = "employment-location-quotient-manufacturing";
const SINGLE2 = "enterprise-net-value-added-all-industries";
const registry = {
  [MULTI]: { years: { from: 2011, to: 2021 } },
  [OTHER]: { years: { from: 2012, to: 2021 } },
  [SINGLE]: { years: { from: 2021, to: 2021 } },
  [SINGLE2]: { years: { years: [2020] } },
  unknown: { years: "all" },
};

describe("evaluateSelectionViewpoints", () => {
  it("推移の図の指標がすべて 1 枚のカードにあれば重複とし、全国だけの系列・カードに無い指標を含む図・推移以外の図は数えない", () => {
    const hits = evaluateSelectionViewpoints(
      [
        theme({
          metrics: [
            { rankingKey: MULTI, shortLabel: "A", role: "primary" },
            { rankingKey: OTHER, shortLabel: "B", role: "secondary" },
          ],
          metricGroups: [{ key: "g", title: "カード", rankingKeys: [MULTI], defaultCheckedKeys: [MULTI] }],
          charts: [
            lineChart("dup", [{ metricKey: MULTI }]),
            lineChart("national", [{ metricKey: MULTI, area: "national" }]),
            lineChart("wider", [{ metricKey: MULTI }, { metricKey: OTHER }]),
            { ...lineChart("shape", [{ metricKey: MULTI }]), componentType: "composition-chart" as const },
          ],
        } as Partial<ThemeCatalog>),
      ],
      registry,
    );
    expect(hits["card-chart-duplicate"].map((h) => h.target)).toEqual(["dup"]);
  });

  it("1 年分の指標だけのカードは comparisonYear が無いときだけ数え、年が分からない指標は数えない", () => {
    const hits = evaluateSelectionViewpoints(
      [
        theme({
          metricGroups: [
            { key: "trend", title: "単年", rankingKeys: [SINGLE, SINGLE2], defaultCheckedKeys: [SINGLE] },
            { key: "fixed", title: "比較", rankingKeys: [SINGLE], defaultCheckedKeys: [SINGLE], comparisonYear: "2021" },
            { key: "mixed", title: "混在", rankingKeys: [SINGLE, MULTI], defaultCheckedKeys: [SINGLE] },
            { key: "all", title: "不明", rankingKeys: ["unknown"], defaultCheckedKeys: ["unknown"] },
          ],
          charts: [lineChart("one-point", [{ metricKey: SINGLE }]), lineChart("ok", [{ metricKey: MULTI }])],
        } as Partial<ThemeCatalog>),
      ],
      registry,
    );
    expect(hits["single-year-as-trend"].map((h) => h.target).sort()).toEqual(["one-point", "trend"]);
  });

  it("ほかのテーマの主指標を secondary・context に置いた箇所と、選定根拠の欠けた主要指標を挙げる", () => {
    const owner = theme({ key: "owner", metrics: [{ rankingKey: MULTI, shortLabel: "A", role: "primary" }] });
    const borrower = theme({
      key: "borrower",
      metrics: [
        { rankingKey: MULTI, shortLabel: "A", role: "context" },
        {
          rankingKey: OTHER,
          shortLabel: "B",
          role: "secondary",
          selection: { proposedBy: "x", surveyedAt: "2026-10-07", rationale: "y" },
        },
      ],
    });
    const hits = evaluateSelectionViewpoints([owner, borrower], registry);
    expect(hits["owned-elsewhere"]).toEqual([
      { themeKey: "borrower", target: MULTI, detail: "owner の主指標 (このテーマでは context)" },
    ]);
    expect(hits["selection-evidence"].map((h) => `${h.themeKey}/${h.target}`)).toEqual([
      `owner/${MULTI}`,
      `borrower/${OTHER}`,
    ]);
  });
});

describe("補助関数", () => {
  it("years の形から年数を数え、'all' は不明として null を返す", () => {
    expect(metricYearCount({ from: 2011, to: 2021 })).toBe(11);
    expect(metricYearCount({ years: [2015, 2020] })).toBe(2);
    expect(metricYearCount("all")).toBeNull();
    expect(metricYearCount(undefined)).toBeNull();
  });

  it("採用基準は primary・secondary の選定根拠だけを数える", () => {
    const counts = countAdoptionCriteria([
      theme({
        metrics: [
          {
            rankingKey: "a",
            shortLabel: "a",
            role: "primary",
            selection: { proposedBy: "x", surveyedAt: "2026-10-07", rationale: "y", adoptionCriteria: ["representativeness", "readerValue"] },
          },
          {
            rankingKey: "b",
            shortLabel: "b",
            role: "context",
            selection: { proposedBy: "x", surveyedAt: "2026-10-07", rationale: "y", adoptionCriteria: ["representativeness"] },
          },
        ],
      }),
    ]);
    expect(counts).toEqual({ representativeness: 1, readerValue: 1 });
  });
});
