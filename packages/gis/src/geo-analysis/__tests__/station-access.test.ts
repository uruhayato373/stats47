import { describe, expect, test } from "vitest";

import {
  assertStationAccessConservation,
  calculateStationAccessibility,
  stationsWithinRadiusOfMeshes,
} from "../station-access";

import type { PopulationMeshPoint } from "../geo-analysis-core";
import type {
  GeoAnalysisSnapshotRow,
  GeoStationAccessPrefDetail,
} from "../snapshot";

const METERS_PER_LATITUDE_DEGREE = (6_371_008.8 * Math.PI) / 180;

function meshAtMeters(meters: number): PopulationMeshPoint {
  return {
    meshId: String(meters),
    areaCode: "13000",
    longitude: 139.7,
    latitude: 35.6 + meters / METERS_PER_LATITUDE_DEGREE,
    population2020: 100,
    population2050: 80,
    bounds: [139.695, 35.595, 139.705, 35.605],
  };
}

describe("station access evidence", () => {
  test("799mと800mを圏内、801mを圏外として元入力を変更しない", () => {
    const meshes = [meshAtMeters(799), meshAtMeters(800), meshAtMeters(801)];
    const result = calculateStationAccessibility(meshes, [
      { id: "station", name: "駅", longitude: 139.7, latitude: 35.6 },
    ]);

    expect(result.map((mesh) => mesh.isStationAccessible)).toEqual([
      true,
      true,
      false,
    ]);
    expect(meshes.every((mesh) => mesh.isStationAccessible === undefined)).toBe(
      true,
    );
  });

  test("中間メッシュと県別aggregateの人口・比率を保存則で照合する", () => {
    const detail: GeoStationAccessPrefDetail = {
      schemaVersion: 1,
      slug: "population-station-access",
      generatedAt: "2026-08-30T00:00:00.000Z",
      areaCode: "13000",
      areaName: "東京都",
      accessRadiusMeters: 800,
      meshMethod: "center-point",
      meshes: [
        ["a", 0, 0, 1, 1, 100, 80, 1],
        ["b", 1, 0, 2, 1, 100, 60, 0],
      ],
      stations: [["s", "駅", 1, 1]],
      summary: {
        meshCount: 2,
        accessibleMeshCount: 1,
        displayedStationCount: 1,
        population2020: 200,
        population2050: 140,
        accessiblePopulation2020: 100,
        accessiblePopulation2050: 80,
        stationAccessShare2020: 50,
        stationAccessShare2050: 57.1,
      },
    };
    const aggregate: GeoAnalysisSnapshotRow = {
      areaCode: "13000",
      areaName: "東京都",
      rank: 1,
      values: {
        accessibleMeshCount: 1,
        accessiblePopulation2050: 80,
        stationAccessShare2020: 50,
        stationAccessShare2050: 57.1,
      },
    };

    expect(() => assertStationAccessConservation(detail, aggregate)).not.toThrow();
    expect(() =>
      assertStationAccessConservation(
        { ...detail, summary: { ...detail.summary, accessibleMeshCount: 2 } },
        aggregate,
      ),
    ).toThrow(/conservation/);
  });

  test("県別表示には距離判定へ寄与する駅だけを含める", () => {
    const meshes = [meshAtMeters(0)];
    const stations = stationsWithinRadiusOfMeshes(meshes, [
      { id: "near", name: "近い駅", longitude: 139.7, latitude: 35.6 },
      { id: "far", name: "遠い駅", longitude: 140.7, latitude: 35.6 },
    ]);
    expect(stations.map((station) => station.id)).toEqual(["near"]);
  });
});
