import { describe, expect, it } from "vitest";

import { buildMapGeoJson, buildMapKml, MAP_BOUNDARY_ATTRIBUTION } from "../build-map-download";

import type { RankingValue } from "@stats47/ranking";
import type { Feature } from "geojson";


const square = (x: number): Feature => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [[[x, 35], [x + 1, 35], [x + 1, 36], [x, 35]]] },
  properties: {},
});

const features: Feature[] = [
  { ...square(139), properties: { N03_001: "東京都", N03_007: "13" } },
  { ...square(135), properties: { N03_001: "大阪府", N03_007: "27" } },
  { ...square(141), properties: { N03_001: "北海道", N03_007: "01" } },
];

const value = (areaCode: string, areaName: string, yearCode: string, v: number | null, rank: number): RankingValue =>
  ({ areaCode, areaName, yearCode, yearName: `${yearCode.slice(0, 4)}年`, value: v, unit: "人", rank, categoryCode: "", categoryName: "", areaType: "prefecture" }) as unknown as RankingValue;

const values: RankingValue[] = [
  value("13000", "東京都", "2023100000", 14000000, 1),
  value("27000", "大阪府", "2023100000", 8800000, 2),
  value("13000", "東京都", "2020100000", 1, 47), // 古い年は使わない
];

const meta = { rankingKey: "total-population", pageUrl: "https://stats47.jp/ranking/total-population" };

describe("build-map-download", () => {
  it("最新年の値だけを県コードで境界に結合し、値の無い県は null にする", () => {
    const geo = buildMapGeoJson({ features, values, meta });
    const byName = Object.fromEntries(geo.features.map((f) => [f.properties?.prefName, f.properties]));
    expect(byName["東京都"]).toMatchObject({ value: 14000000, rank: 1, year: "2023年", prefCode: "13" });
    expect(byName["大阪府"]?.value).toBe(8800000);
    expect(byName["北海道"]).toMatchObject({ value: null, fill: "#d9d9d9" });
    expect(geo.features[0].properties?.boundarySource).toBe(MAP_BOUNDARY_ATTRIBUTION);
  });

  it("KML は各県を Placemark にし、値・出典・境界の出典を説明に入れる", () => {
    const kml = buildMapKml({ features, values, meta });
    expect(kml.startsWith('<?xml version="1.0" encoding="UTF-8"?><kml')).toBe(true);
    expect(kml.match(/<Placemark>/g)).toHaveLength(3);
    expect(kml).toContain("<name>東京都</name>");
    expect(kml).toContain("14,000,000 人");
    expect(kml).toContain(meta.pageUrl);
    expect(kml).toContain("国土数値情報");
    expect(kml).not.toContain("47位"); // 古い年の順位を使っていない
  });
});
