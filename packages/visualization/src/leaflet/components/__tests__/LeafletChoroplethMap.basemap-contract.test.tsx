import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MapVisualizationConfig, MapDataPoint } from "../../../d3/types/map-chart";
import type { TopoJSONTopology } from "@stats47/types";

/**
 * ベースマップとコロプレスの独立性の契約。
 *
 * 経緯 (2026-09-07): ランキングページのモバイル LCP 要素は Leaflet のタイル <img> だが、
 * このコンポーネントが `!prefGeojson` で早期 return していたため、タイルは
 * 1,015,004 bytes の /prefecture.topojson を取得・parse し終えるまで DOM に存在しなかった。
 * タイルの実体は <link rel="preload" fetchpriority="high"> で document 解析時に取得済み
 * (PSI 実測 resourceLoadDuration 49ms) なのに要素が生まれず paint できないため、
 * LCP は 12,650ms と payload 縮小前の baseline 9,347ms より悪化していた。
 *
 * このテストは「topology を待たずにタイルを描く」ことを固定する。早期 return を
 * 復活させる変更も、コロプレスを topology 未取得のまま描こうとする変更もここで落ちる。
 */

vi.mock("leaflet/dist/leaflet.css", () => ({}));

const mapApi = vi.hoisted(() => ({
  addControl: vi.fn(), removeControl: vi.fn(),
  fitBounds: vi.fn(), on: vi.fn(), off: vi.fn(),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
  GeoJSON: () => <div data-testid="geojson-layer" />,
  useMap: () => mapApi,
}));

vi.mock("../MapColorLegend", () => ({
  MapColorLegend: () => <div data-testid="map-legend" />,
}));

// 色スケールの解決 (d3 の動的 import) はこの契約の対象外。gating だけを見たいので
// 同期に確定する style を返す
vi.mock("../../hooks/useChoroplethStyle", () => ({
  useChoroplethStyle: () => () => ({ fillColor: "#000" }),
}));

const { LeafletChoroplethMap } = await import("../LeafletChoroplethMap");

const TILE_URL = "/tiles/light_all/{z}/{x}/{y}{r}.png";

const COLOR_CONFIG: MapVisualizationConfig = {
  colorSchemeType: "sequential",
  colorScheme: "Blues",
};

const DATA: MapDataPoint[] = [
  { areaCode: "01000", areaName: "北海道", value: 10 },
  { areaCode: "13000", areaName: "東京都", value: 100 },
];

/** 都道府県 2 件だけの最小 TopoJSON (topojson-client が feature 化できる形) */
const TOPOLOGY = {
  type: "Topology",
  arcs: [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ],
  ],
  objects: {
    prefectures: {
      type: "GeometryCollection",
      geometries: [
        { type: "Polygon", arcs: [[0]], properties: { N03_007: "01", N03_001: "北海道" } },
        { type: "Polygon", arcs: [[0]], properties: { N03_007: "13", N03_001: "東京都" } },
      ],
    },
  },
} as unknown as TopoJSONTopology;

function renderMap(topology: TopoJSONTopology | null, fitToPrefectures = false) {
  return render(
    <LeafletChoroplethMap
      topology={topology}
      data={DATA}
      colorConfig={COLOR_CONFIG}
      tileUrl={TILE_URL}
      attribution="test"
      fitToPrefectures={fitToPrefectures}
    />,
  );
}

describe("leaflet choropleth base map contract", () => {
  it("fits the full prefecture extent when the overview opts in", async () => {
    mapApi.fitBounds.mockClear();
    renderMap(TOPOLOGY, true);
    await waitFor(() => expect(mapApi.fitBounds).toHaveBeenCalled());
    expect(mapApi.on).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  it("renders the base tile layer while the topology is still loading", () => {
    renderMap(null);

    // LCP 要素はこのタイル。topology を待たせると LCP が 1MB の fetch に直列で乗る
    expect(screen.getByTestId("map-container")).toBeTruthy();
    expect(screen.getByTestId("tile-layer").getAttribute("data-url")).toBe(TILE_URL);
  });

  it("does not draw the choropleth before the topology arrives", () => {
    renderMap(null);

    expect(screen.queryByTestId("geojson-layer")).toBeNull();
  });

  it("overlays the choropleth once the topology arrives, keeping the tiles", async () => {
    renderMap(TOPOLOGY);

    // 色スケールは非同期に解決するので待つ
    await waitFor(() => {
      expect(screen.getByTestId("geojson-layer")).toBeTruthy();
    });
    expect(screen.getByTestId("tile-layer").getAttribute("data-url")).toBe(TILE_URL);
  });
});
