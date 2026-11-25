import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  UNNAMED_FEATURE_TYPE,
  collectAttributeNames,
  featureTypeOfEntry,
  mergeObservations,
  observeGeoJsonFile,
  readAttributeInventory,
  recordObservedAttributes,
  EMPTY_ATTRIBUTE_INVENTORY,
} from "../attribute-inventory";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "ksj-attr-inventory-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const feature = (properties: Record<string, unknown> | null) => ({ type: "Feature", geometry: null, properties });
const writeGeoJson = (name: string, features: unknown[]): string => {
  const file = path.join(dir, name);
  writeFileSync(file, JSON.stringify({ type: "FeatureCollection", features }), "utf8");
  return file;
};

describe("地物の種類の語幹", () => {
  it("<dataId>-<版>_<key>.geojson の key を取り、取れなければ (unnamed)", () => {
    expect(featureTypeOfEntry("N06-23_HighwaySection.geojson")).toBe("HighwaySection");
    expect(featureTypeOfEntry("UTF-8/N08-21_Airport.geojson")).toBe("Airport");
    expect(featureTypeOfEntry("P04-22_13.geojson")).toBe(UNNAMED_FEATURE_TYPE);
  });
});

describe("属性名の観測", () => {
  it("地物ごとに属性が欠けていても和集合を取り、properties が null の地物は無視する", () => {
    expect(collectAttributeNames([feature({ B: 1, A: 2 }), feature(null), feature({ C: 3 })])).toEqual(["A", "B", "C"]);
  });

  it("GeoJSON ファイルから属性名と地物の種類を読む (小さいファイルは全体、閾値以上は流して読む)", async () => {
    const file = writeGeoJson("N06-23_HighwaySection.geojson", [feature({ N06_001: "a", N06_002: "b" }), feature({ N06_003: "c" })]);
    const whole = await observeGeoJsonFile(file, { dataId: "N06", version: "23" });
    expect(whole).toEqual({ dataId: "N06", featureType: "HighwaySection", version: "23", attributes: ["N06_001", "N06_002", "N06_003"] });
    const streamed = await observeGeoJsonFile(file, { dataId: "N06", version: "23", streamThresholdBytes: 1 });
    expect(streamed).toEqual(whole);
  });
});

describe("観測の足し算", () => {
  const base = { dataId: "N06", featureType: "HighwaySection", version: "23" };

  it("同じ地物の種類は属性・版の和集合に、新しく足したときだけ observedAt を動かす", () => {
    const first = mergeObservations(EMPTY_ATTRIBUTE_INVENTORY, [{ ...base, attributes: ["N06_002", "N06_001"] }], "2026-11-25");
    expect(first.datasets.N06.featureTypes.HighwaySection).toEqual({ versions: ["23"], attributes: ["N06_001", "N06_002"], observedAt: "2026-11-25" });

    const same = mergeObservations(first, [{ ...base, attributes: ["N06_001"] }], "2026-12-01");
    expect(same).toEqual(first);

    const wider = mergeObservations(first, [{ ...base, version: "24", attributes: ["N06_003"] }], "2026-12-01");
    expect(wider.datasets.N06.featureTypes.HighwaySection).toEqual({ versions: ["23", "24"], attributes: ["N06_001", "N06_002", "N06_003"], observedAt: "2026-12-01" });
  });

  it("属性が 1 つも読めなかった観測は足さず、入力の記録は書き換えない", () => {
    const before = structuredClone(EMPTY_ATTRIBUTE_INVENTORY);
    const after = mergeObservations(before, [{ ...base, attributes: [] }], "2026-11-25");
    expect(after.datasets).toEqual({});
    expect(before).toEqual(EMPTY_ATTRIBUTE_INVENTORY);
  });

  it("データと地物の種類の並びは昇順で、足す順に左右されない", () => {
    const a = { dataId: "N08", featureType: "Airport", version: "21", attributes: ["N08_001"] };
    const b = { dataId: "N02", featureType: "Station", version: "23", attributes: ["N02_001"] };
    const ab = mergeObservations(EMPTY_ATTRIBUTE_INVENTORY, [a, b], "2026-11-25");
    const ba = mergeObservations(EMPTY_ATTRIBUTE_INVENTORY, [b, a], "2026-11-25");
    expect(JSON.stringify(ab)).toBe(JSON.stringify(ba));
    expect(Object.keys(ab.datasets)).toEqual(["N02", "N08"]);
  });
});

describe("記録ファイルへの書き込み", () => {
  it("観測が無ければファイルを作らず、足したら書き、同じ観測の再実行では書かない", () => {
    const inventoryPath = path.join(dir, "geo", "attribute-inventory.json");
    expect(recordObservedAttributes(inventoryPath, [], "2026-11-25")).toBe(false);
    expect(existsSync(inventoryPath)).toBe(false);

    const observation = { dataId: "N02", featureType: "Station", version: "23", attributes: ["N02_003", "N02_005"] };
    expect(recordObservedAttributes(inventoryPath, [observation], "2026-11-25")).toBe(true);
    expect(readAttributeInventory(inventoryPath).datasets.N02.featureTypes.Station.attributes).toEqual(["N02_003", "N02_005"]);
    expect(readFileSync(inventoryPath, "utf8").endsWith("\n")).toBe(true);

    expect(recordObservedAttributes(inventoryPath, [observation], "2026-12-01")).toBe(false);
    expect(readAttributeInventory(inventoryPath).datasets.N02.featureTypes.Station.observedAt).toBe("2026-11-25");
  });

  it("schemaVersion が違う記録は読まずに止める", () => {
    const inventoryPath = path.join(dir, "inventory.json");
    writeFileSync(inventoryPath, JSON.stringify({ schemaVersion: 2, datasets: {} }), "utf8");
    expect(() => readAttributeInventory(inventoryPath)).toThrow(/schemaVersion/);
  });
});
