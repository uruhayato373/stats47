import { describe, it, expect } from "vitest";
import { PREFECTURES, PREFECTURE_CODES5, toCode5, toCode2, REGIONS } from "../src/data/prefectures";
import { PALETTES, paletteById } from "../src/design/palettes";
import { LAYOUTS } from "../src/design/layouts";
import { serializeSourcesCsv, type SourceRow } from "../src/data/sources";
import { normalizeDataset } from "../src/data/dataset";
import { validateDataset } from "../src/validators/dataset-validator";
import { SAMPLE_DATASET } from "../src/fixtures/sample-dataset";
import { rankingBarSpec, classifyChoropleth } from "../src/charts/chart-spec";
import { renderLicenseText } from "../src/licenses/license-text";
import { loadPrefectureGeometry } from "../src/maps/prefecture-geometry";
import { LICENSE_IDS } from "../src/catalog/licenses";

describe("prefectures master", () => {
  it("has 47 prefectures with unique 5-digit codes", () => {
    expect(PREFECTURES.length).toBe(47);
    expect(new Set(PREFECTURE_CODES5).size).toBe(47);
    expect(REGIONS.flatMap((r) => r.prefCodes5).sort()).toEqual([...PREFECTURE_CODES5].sort());
  });
  it("normalizes any code notation to 5 digits", () => {
    expect(toCode5("1")).toBe("01000");
    expect(toCode5("01")).toBe("01000");
    expect(toCode5("13000")).toBe("13000");
    expect(toCode2("47000")).toBe("47");
    expect(() => toCode5("99")).toThrow();
  });
});

describe("design", () => {
  it("provides at least 3 CVD-safe palettes", () => {
    expect(PALETTES.filter((p) => p.cvdSafe).length).toBeGreaterThanOrEqual(3);
    expect(paletteById("okabe-ito").kind).toBe("categorical");
  });
  it("fixes layout dims incl. 620x620 coconala thumbnail", () => {
    expect(LAYOUTS["thumb-square"].wPx).toBe(620);
    expect(LAYOUTS["16x9"].wPx / LAYOUTS["16x9"].hPx).toBeCloseTo(16 / 9, 2);
  });
});

describe("sources csv", () => {
  it("prefixes UTF-8 BOM and uses CRLF (JP Excel safe)", () => {
    const rows: SourceRow[] = [
      { surveyName: "国勢調査", tableName: "T1", statsDataId: "0003448237", url: "https://e-stat.go.jp/", year: "2020", retrievedAt: "2026-07-18", unit: "人", transform: "集計", notes: "カンマ,含む" },
    ];
    const csv = serializeSourcesCsv(rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("\r\n");
    expect(csv).toContain('"カンマ,含む"'); // カンマはクオート
  });
});

describe("dataset + validator", () => {
  it("fills all 47 prefectures, missing as null (not 0)", () => {
    const ds = normalizeDataset({
      indicator: "x",
      unit: "件",
      year: "2023",
      source: { surveyName: "s", tableName: "-", statsDataId: "-", url: "https://x", year: "2023", retrievedAt: "2026-07-18", unit: "件", transform: "-", notes: "-" },
      values: [{ code: "13000", value: 5 }], // 東京のみ与える
    });
    expect(ds.values.length).toBe(47);
    const tokyo = ds.values.find((d) => d.code5 === "13000");
    const other = ds.values.find((d) => d.code5 === "01000");
    expect(tokyo?.value).toBe(5);
    expect(other?.value).toBeNull();
    expect(other?.missing).toBe("missing"); // 0 埋めしない
  });
  it("validates the sample fixture as OK", () => {
    const r = validateDataset(SAMPLE_DATASET);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("detects a corrupted dataset (negative control)", () => {
    const broken = { ...SAMPLE_DATASET, values: SAMPLE_DATASET.values.slice(1) };
    const r = validateDataset(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === "code-missing")).toBe(true);
  });
});

describe("chart specs", () => {
  it("ranks top/bottom excluding nulls", () => {
    const spec = rankingBarSpec(SAMPLE_DATASET, { topN: 5, bottomN: 5 });
    expect(spec.top.length).toBe(5);
    expect(spec.bottom.length).toBe(5);
    expect(spec.top[0].rank).toBe(1);
    expect(spec.top[0].value).toBeGreaterThanOrEqual(spec.top[1].value);
  });
  it("classifies choropleth into palette classes deterministically", () => {
    const c1 = classifyChoropleth(SAMPLE_DATASET, { classes: 5, paletteId: "blues-sequential" });
    const c2 = classifyChoropleth(SAMPLE_DATASET, { classes: 5, paletteId: "blues-sequential" });
    expect(c1.bins.length).toBe(47);
    expect(c1).toEqual(c2); // 決定的
    for (const b of c1.bins) expect(b.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("license text", () => {
  it("renders every registered license with resale prohibition", () => {
    for (const id of LICENSE_IDS) {
      const text = renderLicenseText(id);
      expect(text).toContain("再販売 / 再配布");
      expect(text).toContain("著作権の譲渡ではありません");
    }
    expect(() => renderLicenseText("nope")).toThrow();
  });
});

describe("prefecture geometry", () => {
  it("decodes 47 prefecture shapes with rings inside the projected box", () => {
    const geo = loadPrefectureGeometry(1000);
    expect(geo.shapes.length).toBe(47);
    expect(geo.width).toBe(1000);
    expect(geo.height).toBeGreaterThan(0);
    const codes = new Set(geo.shapes.map((s) => s.code5));
    expect(codes.size).toBe(47);
    for (const s of geo.shapes) {
      expect(s.rings.length).toBeGreaterThanOrEqual(1);
      for (const ring of s.rings) {
        expect(ring.length).toBeGreaterThanOrEqual(3);
        for (const p of ring) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1000 + 1e-6);
          expect(p.y).toBeGreaterThanOrEqual(-1e-6);
          expect(p.y).toBeLessThanOrEqual(geo.height + 1e-6);
        }
      }
    }
  });
});
