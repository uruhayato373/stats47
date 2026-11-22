import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  PREFECTURE_BOUNDARY_META_PATH,
  checkBoundaryShape,
  prefectureBoundaryExists,
  prefectureBoundarySourceRow,
  type PrefectureBoundary,
} from "../src/maps/prefecture-boundary";
import { PREFECTURES } from "../src/data/prefectures";
import {
  JAPAN_CLIP,
  loadPrefectureGeometry,
  missingBoundaryMessage,
  simplifyGeometry,
  simplifyRing,
  type PrefectureGeometry,
} from "../src/maps/prefecture-geometry";
import { syntheticBoundary } from "./helpers/synthetic-geometry";

const CODES2 = PREFECTURES.map((p) => p.code2);

describe("境界の形の検査 (checkBoundaryShape)", () => {
  it("47 件・県コード 01〜47 がそろった境界は問題なし", () => {
    const r = checkBoundaryShape(syntheticBoundary(), CODES2);
    expect(r.problems).toEqual([]);
    expect(r.features).toBe(47);
  });

  it("県の欠け・重複・想定外コードを別々に報告する", () => {
    const b = syntheticBoundary();
    const dropped: PrefectureBoundary = { ...b, features: b.features.slice(1) };
    expect(checkBoundaryShape(dropped, CODES2).problems.join("\n")).toContain("欠けた県コード: 01");
    const dup: PrefectureBoundary = { ...b, features: [...b.features, b.features[0]] };
    expect(checkBoundaryShape(dup, CODES2).problems.join("\n")).toContain("01: 2 件の重複");
    const extra: PrefectureBoundary = { ...b, features: [...b.features, { ...b.features[0], properties: { code: "48", name: "x" } }] };
    expect(checkBoundaryShape(extra, CODES2).problems.join("\n")).toContain("想定外の県コード: 48");
  });

  it("閉じていない輪・点が足りない輪・日本の外の座標を止める", () => {
    const b = syntheticBoundary();
    const open: PrefectureBoundary = {
      ...b,
      features: b.features.map((f, i) =>
        i === 0 ? { ...f, geometry: { type: "Polygon", coordinates: [[[124, 26], [125, 26], [125, 27], [124, 27]]] } } : f,
      ),
    };
    expect(checkBoundaryShape(open, CODES2).problems.join("\n")).toContain("閉じていない輪");
    const outside: PrefectureBoundary = {
      ...b,
      features: b.features.map((f, i) =>
        i === 0 ? { ...f, geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } } : f,
      ),
    };
    expect(checkBoundaryShape(outside, CODES2).problems.join("\n")).toContain("日本の範囲外の座標");
  });
});

describe("頂点の間引き (simplifyRing / simplifyGeometry)", () => {
  // 100 画素の正方形の上辺に 0.1 画素のゆらぎを持つ点を並べた輪
  const wobbly = [
    { x: 0, y: 0 },
    ...Array.from({ length: 49 }, (_, i) => ({ x: (i + 1) * 2, y: i % 2 === 0 ? 0.1 : -0.1 })),
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
    { x: 0, y: 0 },
  ];

  it("許容幅より小さいゆらぎの点は落とし、角は残し、輪は閉じたまま", () => {
    const out = simplifyRing(wobbly, 1);
    expect(out).not.toBeNull();
    const ring = out ?? [];
    expect(ring.length).toBeLessThan(wobbly.length / 4);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const corner of [{ x: 100, y: 100 }, { x: 0, y: 100 }]) expect(ring).toContainEqual(corner);
  });

  it("許容幅を 0 にすると何も落とさない", () => {
    const geo: PrefectureGeometry = { width: 100, height: 100, shapes: [{ code5: "01000", name: "x", rings: [wobbly] }] };
    expect(simplifyGeometry(geo, 0)).toBe(geo);
  });

  it("点にしか見えない離島の輪は落とすが、県の形は 1 つ残す", () => {
    const speck = [{ x: 500, y: 500 }, { x: 500.5, y: 500 }, { x: 500.5, y: 500.5 }, { x: 500, y: 500.5 }, { x: 500, y: 500 }];
    const geo: PrefectureGeometry = {
      width: 1000,
      height: 1000,
      shapes: [
        { code5: "01000", name: "本土と離島", rings: [wobbly, speck] },
        { code5: "02000", name: "離島だけ", rings: [speck] },
      ],
    };
    const out = simplifyGeometry(geo, 1);
    expect(out.shapes[0].rings.length).toBe(1);
    expect(out.shapes[1].rings.length).toBe(1);
  });
});

describe("境界の読み込み", () => {
  it("県コード (2 桁) を 5 桁にそろえ、clip 外の遠隔の島は落とす", () => {
    const b = syntheticBoundary();
    const far: PrefectureBoundary = {
      ...b,
      features: b.features.map((f, i) =>
        i === 12
          ? {
              ...f,
              geometry: {
                type: "MultiPolygon",
                coordinates: [
                  (f.geometry as { coordinates: number[][][] }).coordinates,
                  [[[154, 24], [154.1, 24], [154.1, 24.1], [154, 24.1], [154, 24]]],
                ],
              },
            }
          : f,
      ),
    };
    const geo = loadPrefectureGeometry(1000, JAPAN_CLIP, { boundary: far, tolerance: 0 });
    expect(geo.shapes.map((s) => s.code5)).toEqual(PREFECTURES.map((p) => p.code5));
    expect(geo.shapes[12].rings.length).toBe(1);
    const unclipped = loadPrefectureGeometry(1000, undefined, { boundary: far, tolerance: 0 });
    expect(unclipped.shapes[12].rings.length).toBe(2);
  });

  it("境界ファイルが無いときは、生成スクリプトを案内して止まる (別の境界へ切り替えない)", () => {
    const message = missingBoundaryMessage("/x/y.geojson");
    expect(message).toContain("build-prefecture-boundary.mts");
    expect(message).toContain("/x/y.geojson");
  });
});

// 本物の境界 (e-Stat 由来・git 管理外) があるときだけ実行する。CI には無いので skip になる。
describe.skipIf(!prefectureBoundaryExists())("e-Stat 境界の生成物", () => {
  it("検査記録: 47 県・全県の人口が R2 の国勢調査 2020 総人口と一致・重なりなし", () => {
    expect(existsSync(PREFECTURE_BOUNDARY_META_PATH)).toBe(true);
    const meta = JSON.parse(readFileSync(PREFECTURE_BOUNDARY_META_PATH, "utf8")) as {
      checks: { features: number; overlapRatio: number; populationTotal: number };
      perPrefecture: { code: string; areaRatio: number; landPopulation: number; waterAreaPopulation: number; r2Population: number }[];
    };
    expect(meta.checks.features).toBe(47);
    expect(meta.perPrefecture.length).toBe(47);
    for (const r of meta.perPrefecture) {
      expect(r.landPopulation + r.waterAreaPopulation, r.code).toBe(r.r2Population);
      expect(Math.abs(r.areaRatio - 1), r.code).toBeLessThan(0.01);
    }
    expect(meta.checks.overlapRatio).toBeLessThan(0.001);
    expect(meta.checks.populationTotal).toBe(126146099); // 令和 2 年国勢調査の総人口
  });

  it("SOURCES.csv の境界の行は e-Stat の出どころ・基準日・加工を持つ", () => {
    const row = prefectureBoundarySourceRow();
    expect(row.surveyName).toContain("国勢調査");
    expect(row.year).toBe("2020");
    expect(row.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(row.notes).toContain("公認・推奨");
  });
});
