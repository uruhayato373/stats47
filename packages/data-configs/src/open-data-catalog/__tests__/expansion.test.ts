import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import ledger from "../../../../../data/open-data/expansion.json";
import schema from "../../../../../config/schema/open-data.expansion.schema.json";
import recipeLedger from "../../../../../data/open-data/fetch/recipes.json";
import areaTemplate from "../../../../../data/areas/databook/template.json";
import { METRICS_REGISTRY } from "../../registry";
import { PREFECTURE_AREA_CODES } from "../../../../area/src/constants/prefecture-codes";
import { normalizeOpenDataArea } from "../normalized-table";
import type { OpenDataNormalizedTable } from "../normalized-table";
import type { OpenDataFetchRecipe } from "../fetch-recipe";
import { evaluateExpansionCandidate, findExpansionDuplicates, selectExpansionDenominator, validateOpenDataExpansion } from "../expansion";
import type { OpenDataExpansion, OpenDataExpansionCandidate } from "../expansion";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const validateSchema = new Ajv({ allErrors: true }).compile(schema);
const rawLedger: unknown = ledger;
if (!validateSchema(rawLedger)) throw Error(JSON.stringify(validateSchema.errors));
const expansion = rawLedger as OpenDataExpansion;
const recipes = recipeLedger.recipes as OpenDataFetchRecipe[];
const metrics = Object.values(METRICS_REGISTRY);
const context = {
  recipes, metrics,
  existingMetricKeys: new Set(Object.keys(METRICS_REGISTRY)),
  themeIds: new Set(fs.readdirSync(path.join(root, "data/themes/catalogs")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))),
  areaIds: new Set(areaTemplate.sections.map((s) => s.sectionKey)),
};
const planned = expansion.candidates.find((c) => c.metricKey === "national-assessment-elementary-japanese-correct-rate")!;
const validate = (candidate: OpenDataExpansionCandidate) => validateOpenDataExpansion({ schemaVersion: 1, candidates: [candidate] }, context);
const fixture: OpenDataNormalizedTable = {
  datasetId: planned.datasetId, table: planned.table, version: planned.slice.version,
  columns: ["areaCode", "areaLevel", "time", "dims", "value", "unit"],
  rows: PREFECTURE_AREA_CODES.map((code, i) => ({
    ...normalizeOpenDataArea("prefecture", code), time: "2025",
    dims: Object.fromEntries(Object.entries(planned.slice.dims).map(([k, v]) => [k, v[0]])), value: i + 1, unit: planned.unit,
  })),
  provenance: { manifestKey: "fixture", manifestSha256: "a".repeat(64), recipeSha256: "b".repeat(64) },
};

describe("open-data expansion decisions", () => {
  it("accepts the ledger and records a decision for every normalized recipe table", () => {
    expect(validateSchema(ledger), JSON.stringify(validateSchema.errors)).toBe(true);
    expect(validateOpenDataExpansion(expansion, context)).toEqual([]);
    for (const recipe of recipes) for (const table of recipe.normalize?.tables ?? []) {
      expect(expansion.candidates.some((c) => c.datasetId === recipe.datasetId && c.table === table.table)).toBe(true);
    }
  });

  it.each(["rejected", "blocked"] as const)("requires a nonblank reason for %s", (status) => {
    for (const reason of [undefined, "", "  "]) {
      expect(validateSchema({ schemaVersion: 1, candidates: [{ ...planned, status, reason }] })).toBe(false);
    }
    expect(validate({ ...planned, status, reason: " " }).join()).toContain("reason");
  });

  it("requires a planned key and rejects unknown fields and path traversal", () => {
    const { metricKey: _key, ...missing } = planned;
    expect(validateSchema({ schemaVersion: 1, candidates: [missing] })).toBe(false);
    expect(validateSchema({ schemaVersion: 1, candidates: [{ ...planned, metricKeys: [] }] })).toBe(false);
    expect(validateSchema({ schemaVersion: 1, candidates: [{ ...planned, slice: { ...planned.slice, version: "../../escape" } }] })).toBe(false);
  });

  it("rejects undeclared tables, key collisions and unknown references", () => {
    expect(validate({ ...planned, table: "not-declared" }).join()).toContain("recipe.normalize");
    expect(validate({ ...planned, metricKey: "total-population" }).join()).toContain("衝突");
    expect(validate({ ...planned, status: "blocked", denominator: "missing-denominator" }).join()).toContain("未知の denominator");
    expect(validate({ ...planned, status: "blocked", duplicateOf: "missing-metric" }).join()).toContain("未知の duplicateOf");
    expect(validate({ ...planned, channel: "theme", target: "missing-theme" }).join()).toContain("theme target");
    expect(validate({ ...planned, channel: "area", target: "missing-area" }).join()).toContain("area target");
  });

  it("requires evidence and a registered denominator with a fixed time for planned ratios", () => {
    expect(validate({ ...planned, verification: undefined }).join()).toContain("47県");
    const ratio = { ...planned, aggregation: { type: "per-100k" as const }, unit: "人/10万人" };
    expect(validate(ratio).join()).toContain("分母とその時点");
    expect(validateSchema({ schemaVersion: 1, candidates: [ratio] })).toBe(false);
    expect(validate({ ...planned, unit: "件" }).join()).toContain("件数そのもの");
  });

  it("mechanically identifies equivalent concepts even under a different metric key", () => {
    const candidate = expansion.candidates.find((c) => c.duplicateOf === "general-clinic-count" && c.channel === "prefecture-ranking")!;
    const existing = METRICS_REGISTRY["general-clinic-count"];
    expect(findExpansionDuplicates(candidate, [{ ...existing, key: "renamed-existing-key" }]).map((m) => m.key)).toEqual(["renamed-existing-key"]);
    expect(findExpansionDuplicates(candidate, [{ ...existing, unit: "人" }])).toEqual([]);
    expect(findExpansionDuplicates(candidate, [{ ...existing, entities: ["city"] }])).toEqual([]);
    expect(findExpansionDuplicates(candidate, [{ ...existing, source: { kind: "estat", statsDataId: "fixture", displayName: "関係のない調査" } }])).toEqual([]);
    expect(findExpansionDuplicates(candidate, [METRICS_REGISTRY["general-clinic-count-per-100k"]])).toEqual([]);
    expect(validate({ ...candidate, duplicateOf: undefined }).join()).toContain("重複を未記録");
    expect(validate({ ...candidate, status: "planned", metricKey: "another-clinic-count" }).join()).toContain("既存概念");
  });

  it("keeps total hospitals distinct from general hospitals and subjects distinct from the four-subject average", () => {
    const hospital = expansion.candidates.find((c) => c.table === "hospital-count" && c.channel === "prefecture-ranking" && c.aggregation.type === "identity")!;
    expect(findExpansionDuplicates(hospital, metrics)).toEqual([]);
    expect(findExpansionDuplicates(planned, [METRICS_REGISTRY["academic-achievement-test-average-rate"]])).toEqual([]);
    const pharmacy = expansion.candidates.find((c) => c.duplicateOf === "pharmacy-count")!;
    expect(findExpansionDuplicates(pharmacy, metrics).map((m) => m.key)).toEqual(expect.arrayContaining(["pharmacy-count", "pharmacy-count-by-prefecture"]));
  });

  it("allows the same proposed metric in different channels but refuses different formulas for one key", () => {
    const second = { ...planned, channel: "theme" as const, target: "education-culture" };
    expect(validateOpenDataExpansion({ schemaVersion: 1, candidates: [planned, second] }, context)).toEqual([]);
    expect(validateOpenDataExpansion({ schemaVersion: 1, candidates: [planned, { ...second, slice: { ...second.slice, time: { kind: "point", value: "2024" } } }] }, context).join()).toContain("異なる計算定義");
    expect(validateOpenDataExpansion({ schemaVersion: 1, candidates: [planned, planned] }, context).join()).toContain("展開判断が重複");
  });
});

describe("reproducible 47-prefecture calculations", () => {
  it("selects the nearest published population year and refuses wrong identity, units and duplicate rows", () => {
    const candidate = { ...planned, denominator: "total-population", aggregation: { type: "per-100k" as const, denominatorTime: "2025" } };
    const row = { areaCode: "01000", yearCode: "2025", value: 1000, unit: "人" };
    const snapshot = { metricKey: "total-population", entityKind: "prefecture", rows: [{ ...row, yearCode: "2024", value: 900 }, row] };
    expect(selectExpansionDenominator(candidate, snapshot).get("01000")).toBe(1000);
    expect(() => selectExpansionDenominator({ ...candidate, aggregation: { ...candidate.aggregation, denominatorTime: "2024" } }, snapshot)).toThrow("最も近い");
    expect(() => selectExpansionDenominator(candidate, { ...snapshot, entityKind: "city" })).toThrow("地域粒度");
    expect(() => selectExpansionDenominator(candidate, { ...snapshot, metricKey: "other" })).toThrow("指標");
    expect(() => selectExpansionDenominator(candidate, { ...snapshot, rows: [row, row] })).toThrow("重複");
    expect(() => selectExpansionDenominator(candidate, { ...snapshot, rows: [{ ...row, unit: "千人" }] })).toThrow("単位");
    for (const value of [null, 0, -1, NaN]) expect(selectExpansionDenominator(candidate, { ...snapshot, rows: [{ ...row, value }] }).size).toBe(0);
    expect(validate({ ...candidate, verification: planned.verification }).join()).toContain("分母時点とsha256");
  });

  it("only fills explicitly confirmed empty count groups, never a missing region or an observed value", () => {
    const candidate = { ...planned, unit: "件", slice: { ...planned.slice, dims: { weather: ["5"] }, zeroAreaCodes: ["47000"] } };
    const rows = fixture.rows.map((r) => ({ ...r, dims: { weather: r.areaCode === "47000" ? "1" : "5" }, unit: "件" }));
    expect(evaluateExpansionCandidate(candidate, { ...fixture, rows })).toEqual({ rowCount: 46, areaCount: 47, min: 0, max: 46 });
    expect(() => evaluateExpansionCandidate({ ...candidate, slice: { ...candidate.slice, zeroAreaCodes: undefined } }, { ...fixture, rows })).toThrow("47県");
    expect(() => evaluateExpansionCandidate(candidate, { ...fixture, rows: rows.slice(0, -1) })).toThrow("明示ゼロ");
    expect(() => evaluateExpansionCandidate({ ...candidate, slice: { ...candidate.slice, zeroAreaCodes: ["01000"] } }, { ...fixture, rows })).toThrow("明示ゼロ");
    expect(validate(candidate).join()).toContain("件数集計表");
    expect(validateSchema({ schemaVersion: 1, candidates: [{ ...candidate, slice: { ...candidate.slice, zeroAreaCodes: ["47000", "47000"] } }] })).toBe(false);
  });

  it("computes count and range, rejects missing/wrong areas and duplicate observations", () => {
    expect(evaluateExpansionCandidate(planned, fixture)).toEqual({ rowCount: 47, areaCount: 47, min: 1, max: 47 });
    expect(() => evaluateExpansionCandidate(planned, { ...fixture, rows: fixture.rows.slice(1) })).toThrow("47県");
    expect(() => evaluateExpansionCandidate(planned, { ...fixture, rows: [...fixture.rows, fixture.rows[0]] })).toThrow("重複行");
    expect(() => evaluateExpansionCandidate(planned, { ...fixture, version: "another" })).toThrow("帰属/版");
    expect(() => evaluateExpansionCandidate(planned, { ...fixture, rows: fixture.rows.map((r) => ({ ...r, value: NaN })) })).toThrow("非有限値");
    expect(() => evaluateExpansionCandidate(planned, { ...fixture, rows: fixture.rows.map((r) => ({ ...r, unit: "件" })) })).toThrow("単位");
  });

  it("does not silently sum unselected dimensions or missing response categories", () => {
    expect(() => evaluateExpansionCandidate({ ...planned, slice: { ...planned.slice, dims: {} } }, fixture)).toThrow("全 dims");
    const responses = { ...planned, slice: { ...planned.slice, dims: { answer: ["1", "2"] }, dimensionAggregation: "sum" as const } };
    const rows = fixture.rows.flatMap((r) => ["1", "2"].map((answer) => ({ ...r, dims: { answer }, value: 20 })));
    expect(evaluateExpansionCandidate(responses, { ...fixture, rows })).toEqual({ rowCount: 94, areaCount: 47, min: 40, max: 40 });
    expect(() => evaluateExpansionCandidate(responses, { ...fixture, rows: rows.slice(1) })).toThrow("分類軸に欠測");
    expect(() => evaluateExpansionCandidate({ ...responses, slice: { ...responses.slice, dimensionAggregation: "none" } }, { ...fixture, rows })).toThrow("1系列");
  });

  it("aggregates a fixed daily window, preserves zero and rejects incomplete dates", () => {
    const daily = { ...planned, unit: "人", slice: { ...planned.slice, dims: {}, time: { kind: "range" as const, start: "2025-01-01", end: "2025-01-02" }, timeAggregation: "sum" as const } };
    const rows = fixture.rows.flatMap((r) => ["2025/1/1", "2025/1/2"].map((time, i) => ({ ...r, time, dims: {}, value: i, unit: "人" })));
    expect(evaluateExpansionCandidate(daily, { ...fixture, rows })).toEqual({ rowCount: 94, areaCount: 47, min: 1, max: 1 });
    expect(() => evaluateExpansionCandidate(daily, { ...fixture, rows: rows.slice(1) })).toThrow("期間に欠測");
    expect(() => evaluateExpansionCandidate({ ...daily, slice: { ...daily.slice, timeAggregation: "none" } }, { ...fixture, rows })).toThrow("時点が1系列");
    const ratio = { ...daily, unit: "人/10万人", aggregation: { type: "per-100k" as const, denominatorTime: "2025" }, denominator: "total-population" };
    expect(() => evaluateExpansionCandidate(ratio, { ...fixture, rows })).toThrow("分母");
    expect(evaluateExpansionCandidate(ratio, { ...fixture, rows }, new Map(PREFECTURE_AREA_CODES.map((code) => [code, 1000]))).min).toBe(100);
    expect(() => evaluateExpansionCandidate(ratio, { ...fixture, rows }, new Map(PREFECTURE_AREA_CODES.map((code) => [code, 0])))).toThrow("分母");
  });
  // 手元の正規化表から planned の値域を再計算する照合は validate-open-data-catalog.ts が行う (表が無いときは warn)。
});
