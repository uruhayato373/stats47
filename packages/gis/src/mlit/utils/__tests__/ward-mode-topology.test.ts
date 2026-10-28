import { feature } from "topojson-client";
import { describe, expect, it } from "vitest";

import { deriveWardModeTopology } from "../ward-mode-topology";

import type { TopoJSONTopology } from "@stats47/types";

/**
 * 横に並んだ 3 つの正方形: 鶴見区 (14101)・神奈川区 (14102) は横浜市 (14100) の行政区、右端は川崎市 (14130)。
 * arc 0 = 鶴見区と神奈川区の境目、arc 1 = 神奈川区と川崎市の境目 (共有の境目で mergeArcs が内側の線を消すことを確かめる)。
 */
const SPLIT: TopoJSONTopology = {
  type: "Topology",
  arcs: [
    [[1, 0], [1, 1]],
    [[2, 0], [2, 1]],
    [[1, 1], [0, 1], [0, 0], [1, 0]],
    [[1, 0], [2, 0]],
    [[2, 1], [1, 1]],
    [[2, 0], [3, 0], [3, 1], [2, 1]],
  ],
  objects: {
    city: {
      type: "GeometryCollection",
      geometries: [
        { type: "Polygon", arcs: [[0, 2]], properties: { N03_007: "14101", N03_003: "横浜市", N03_004: "鶴見区" } },
        { type: "Polygon", arcs: [[-1, 3, 1, 4]], properties: { N03_007: "14102", N03_003: "横浜市", N03_004: "神奈川区" } },
        { type: "Polygon", arcs: [[-2, 5]], properties: { N03_007: "14130", N03_004: "川崎市" } },
      ],
    },
  },
};

const MERGE = new Map([["14100", ["14101", "14102"]]]);

describe("deriveWardModeTopology", () => {
  it("行政区を親の市 1 つにまとめ、ほかの市町村はそのまま残す", () => {
    const merged = deriveWardModeTopology(SPLIT, MERGE);
    const codes = merged.objects.city!.geometries.map((g) => g.properties?.N03_007);
    expect(codes.sort()).toEqual(["14100", "14130"]);
    const yokohama = merged.objects.city!.geometries.find((g) => g.properties?.N03_007 === "14100")!;
    expect(yokohama.properties?.N03_004).toBe("横浜市");
  });

  it("まとめた形の外周は分割版と同じ境目を使い、内側の境目 (arc 0) を含まない", () => {
    const merged = deriveWardModeTopology(SPLIT, MERGE);
    const yokohama = merged.objects.city!.geometries.find((g) => g.properties?.N03_007 === "14100")!;
    const used = JSON.stringify(yokohama.arcs);
    expect(used).toContain("1"); // 川崎市との境目は残る
    const shape = feature(
      merged as unknown as Parameters<typeof feature>[0],
      merged.objects.city as unknown as Parameters<typeof feature>[1]
    ) as unknown as { features: Array<{ properties: Record<string, unknown>; geometry: { coordinates: number[][][][] } }> };
    const ring = shape.features.find((f) => f.properties.N03_007 === "14100")!.geometry.coordinates[0]![0]!;
    // 内側の境目 x=1 の縦線 (0,… ではなく 1,0 → 1,1 の連続) が外周に無い
    const verticalAtX1 = ring.some((p, i) => i > 0 && p[0] === 1 && ring[i - 1]![0] === 1);
    expect(verticalAtX1).toBe(false);
  });

  it("まとめる組が空なら (split) 入力をそのまま返す", () => {
    expect(deriveWardModeTopology(SPLIT, new Map())).toBe(SPLIT);
  });

  it("東京の特別区のように組に入っていない区はまとめない", () => {
    const merged = deriveWardModeTopology(SPLIT, new Map([["99999", ["00000"]]]));
    expect(merged.objects.city!.geometries).toHaveLength(3);
  });
});
