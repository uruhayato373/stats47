// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildMapShapes } from "../map-shapes";

import type { Topology } from "topojson-specification";

const PUBLIC_DIR = resolve(import.meta.dirname, "../../../../../../public");
const read = (name: string) => JSON.parse(readFileSync(resolve(PUBLIC_DIR, name), "utf8")) as Topology;

describe("buildMapShapes", () => {
  it("都道府県の地図は 47 都道府県を 5 桁のコードで描く", () => {
    const { shapes, insetLine } = buildMapShapes(read("prefecture-simple.topojson"), { level: "prefecture", national: true });
    expect(shapes).toHaveLength(47);
    expect(new Set(shapes.map((s) => s.code)).size).toBe(47);
    expect(shapes.find((s) => s.code === "13000")?.name).toBe("東京都");
    expect(shapes.every((s) => s.d.length > 0)).toBe(true);
    expect(insetLine).toBeDefined();
  });

  it("全国の市区町村は描かない島を外し、値の結合に使う 5 桁のコードを持つ", () => {
    const { shapes } = buildMapShapes(read("municipalities.topojson"), { level: "city", national: true, excludeCodes: ["13421"] });
    expect(shapes.length).toBeGreaterThan(1600);
    expect(shapes.some((s) => s.code === "13421")).toBe(false);
    expect(shapes.find((s) => s.code === "01100")?.name).toBe("札幌市");
    expect(shapes.some((s) => s.code.startsWith("47"))).toBe(true);
  });

  it("全国でない地図は沖縄を動かさず、区切りの線も描かない", () => {
    const { insetLine } = buildMapShapes(read("prefecture-simple.topojson"), { level: "prefecture", national: false });
    expect(insetLine).toBeUndefined();
  });
});
