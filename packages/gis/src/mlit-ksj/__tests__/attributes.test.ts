import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { INFRA_NETWORKS } from "../../infra-history/networks";
import {
  KSJ_ATTRIBUTE_LEDGERS,
  KSJ_UNIQUE_ROLES,
  findKsjFeatureType,
  findKsjFeatureTypeForEntry,
  ksjAttributeByRole,
  ksjPropertyName,
} from "../attributes";
import { KSJ_CLASSIFICATIONS } from "../classifications";
import { getPropertyMap } from "../property-map";

const ROOT = resolve(__dirname, "../../../../..");
const LEDGER_DIR = resolve(ROOT, "data/geo/attributes");

/**
 * 属性の原典台帳 (data/geo/attributes/<dataId>.json) は、属性名を読む側の正本。読む側は属性名を書かず役割から引く。
 * 台帳の中の矛盾 (役割の重複) と、台帳から外れた写し (区分の台帳・取り込みの付け替え・交通網) を止める。
 */
describe("属性の原典台帳", () => {
  it("data/geo/attributes の全ファイルを読み込み、ファイル名と dataId が一致する", () => {
    const files = readdirSync(LEDGER_DIR).filter((file) => file.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const dataId = file.replace(/\.json$/, "");
      const raw = JSON.parse(readFileSync(resolve(LEDGER_DIR, file), "utf8")) as { dataId: string };
      expect(raw.dataId, file).toBe(dataId);
      expect(KSJ_ATTRIBUTE_LEDGERS.has(dataId), `${file} が読み込み口に無い`).toBe(true);
    }
    expect(KSJ_ATTRIBUTE_LEDGERS.size).toBe(files.length);
  });

  it("1 つの地物の種類の中で、名前・開始年・終了年・県・主たる関係 ID の役割は 1 つまで、属性名は重複しない", () => {
    for (const ledger of KSJ_ATTRIBUTE_LEDGERS.values()) {
      for (const featureType of ledger.featureTypes) {
        const where = `${ledger.dataId}/${featureType.key}`;
        const names = featureType.attributes.map((attribute) => attribute.name);
        expect(new Set(names).size, where).toBe(names.length);
        for (const role of KSJ_UNIQUE_ROLES) {
          const count = featureType.attributes.filter((attribute) => attribute.role === role).length;
          expect(count, `${where} の ${role}`).toBeLessThanOrEqual(1);
        }
        for (const relationKind of ["main", "additional"] as const) {
          const count = featureType.attributes.filter((attribute) => attribute.relationKind === relationKind).length;
          expect(count, `${where} の relation ${relationKind}`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("区分の台帳が引く属性は、属性の台帳でそのコード表を持つ属性と同じ", () => {
    for (const ledger of KSJ_ATTRIBUTE_LEDGERS.values()) {
      const classification = KSJ_CLASSIFICATIONS.get(ledger.dataId);
      const withTable = ledger.featureTypes.flatMap((featureType) =>
        featureType.attributes.filter((attribute) => attribute.codeTable),
      );
      if (!classification) {
        expect(withTable, `${ledger.dataId} は区分を持たないのにコード表を指している`).toEqual([]);
        continue;
      }
      expect(withTable.length, ledger.dataId).toBeGreaterThan(0);
      for (const attribute of withTable) {
        expect(ksjPropertyName(attribute), ledger.dataId).toBe(classification.field);
      }
    }
  });

  it("取り込みが付け替える属性名 (property-map.ts) は台帳の distributedName と同じ", () => {
    for (const ledger of KSJ_ATTRIBUTE_LEDGERS.values()) {
      const renamed = new Map(
        ledger.featureTypes.flatMap((featureType) =>
          featureType.attributes.flatMap((attribute) =>
            attribute.distributedName ? [[attribute.name, attribute.distributedName] as const] : [],
          ),
        ),
      );
      expect(Object.fromEntries(renamed), ledger.dataId).toEqual(getPropertyMap(ledger.dataId));
    }
  });

  it("役割で引く (重複する役割を 1 つで引こうとすると止める)", () => {
    const section = findKsjFeatureType("N06", "HighwaySection");
    expect(section).not.toBeNull();
    expect(ksjAttributeByRole(section!, "startYear")?.name).toBe("N06_002");
    expect(ksjAttributeByRole(section!, "relation", { relationKind: "additional" })?.name).toBe("N06_011");
    expect(ksjAttributeByRole(section!, "prefecture")).toBeNull();
    const station = findKsjFeatureType("N02", "Station");
    expect(() => ksjAttributeByRole(station!, "category")).toThrow();
    expect(findKsjFeatureTypeForEntry("N08", "UTF-8/N08-21_AirportPoint.geojson")?.key).toBe("AirportPoint");
    expect(findKsjFeatureTypeForEntry("N08", "UTF-8/N08-21_Airport.geojson")?.key).toBe("Airport");
    expect(findKsjFeatureTypeForEntry("N08", "UTF-8/N08-21_Unknown.geojson")).toBeNull();
  });
});

describe("交通網の変遷は属性名を属性の台帳の役割から引く", () => {
  it("交通網の台帳 (networks.json) は属性名を持たない", () => {
    const raw = JSON.parse(readFileSync(resolve(ROOT, "data/geo/infra-history/networks.json"), "utf8")) as {
      networks: Record<string, unknown>[];
    };
    for (const network of raw.networks) {
      expect(network, String(network.key)).not.toHaveProperty("attributes");
    }
  });

  it("原典の版で確かめた属性名に解決する", () => {
    const byKey = Object.fromEntries(INFRA_NETWORKS.map((network) => [network.key, network.attributes]));
    expect(byKey.expressway).toEqual({
      start: "N06_002",
      end: "N06_003",
      name: "N06_007",
      category: "N06_008",
      relation: "N06_004",
      relationNote: "N06_011",
    });
    expect(byKey.railway).toEqual({
      start: "N05_005b",
      end: "N05_005e",
      name: "N05_002",
      category: "N05_001",
      relation: "N05_006",
      relationNote: "N05_010",
    });
    expect(byKey.airport).toEqual({
      start: "N08_014",
      end: "N08_015",
      name: "N08_003",
      category: "N08_002",
      relation: "N08_016",
      prefectureSource: { kind: "muniCode", field: "N08_001" },
    });
  });
});
