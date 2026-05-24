import { geoMercator, geoPath, geoLength } from "d3-geo";
import { feature as topoFeature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

const R2_HIGHWAY_TOPOJSON =
  "https://storage.stats47.jp/app/highway-history/highway-sections.topojson";
const R2_PREFECTURE_TOPOJSON =
  "https://storage.stats47.jp/gis/mlit/20240101/prefecture.topojson";
const R2_STATS_JSON = "https://storage.stats47.jp/app/highway-history/stats.json";

export interface HighwayStats {
  yearStart: number;
  yearEnd: number;
  totalYears: number;
  totalSections: number;
  totalKm: number;
  cumByYear: Record<string, number>;
  cumKmByYear: Record<string, number>;
  topRoutes: Array<{ name: string; km: number; sections: number }>;
  milestones: Array<{ year: number; label: string }>;
  source: string;
  sourceUrl: string;
  generatedAt: string;
}

export async function loadHighwayStats(): Promise<HighwayStats> {
  const res = await fetch(R2_STATS_JSON, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to load highway stats");
  return (await res.json()) as HighwayStats;
}

interface MapProps {
  year: number;
  width?: number;
  height?: number;
}

/** Server Component: 指定年までに開通した高速道路区間を SVG で描画 */
export async function HighwayTimelineMap({
  year,
  width = 900,
  height = 1100,
}: MapProps) {
  const [prefRes, hwyRes] = await Promise.all([
    fetch(R2_PREFECTURE_TOPOJSON, { next: { revalidate: 2592000 } }),
    fetch(R2_HIGHWAY_TOPOJSON, { next: { revalidate: 2592000 } }),
  ]);
  const prefTopo = (await prefRes.json()) as Topology;
  const hwyTopo = (await hwyRes.json()) as Topology;

  const prefObjKey = Object.keys(prefTopo.objects)[0];
  const hwyObjKey = Object.keys(hwyTopo.objects)[0];
  const prefFc = topoFeature(
    prefTopo,
    prefTopo.objects[prefObjKey] as GeometryCollection,
  ) as unknown as GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    { N03_007?: string }
  >;
  const hwyFc = topoFeature(
    hwyTopo,
    hwyTopo.objects[hwyObjKey] as GeometryCollection,
  ) as unknown as GeoJSON.FeatureCollection;

  const mainPref: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: prefFc.features.filter((f) => f.properties?.N03_007 !== "47"),
  };

  const projection = geoMercator().fitExtent(
    [
      [30, 30],
      [width - 30, height - 30],
    ],
    mainPref,
  );
  const pathGen = geoPath(projection);
  const prefPath = pathGen(mainPref as never) || "";

  const visibleHwy: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: hwyFc.features.filter((f, idx) => {
      const props = (hwyTopo.objects[hwyObjKey] as GeometryCollection).geometries[idx]
        .properties as { N06_002?: number };
      const openYear = Number(props?.N06_002 ?? 9999);
      if (openYear > year) return false;
      const coords = (f.geometry as { coordinates: number[][] }).coordinates;
      if (coords?.[0]?.[1] !== undefined && coords[0][1] < 30) return false;
      return true;
    }),
  };
  const hwyPath = pathGen(visibleHwy as never) || "";

  const newCount = (hwyTopo.objects[hwyObjKey] as GeometryCollection).geometries.filter(
    (g) => Number((g.properties as { N06_002?: number })?.N06_002 ?? 9999) === year,
  ).length;

  let newKm = 0;
  for (let i = 0; i < hwyFc.features.length; i++) {
    const props = (hwyTopo.objects[hwyObjKey] as GeometryCollection).geometries[i]
      .properties as { N06_002?: number };
    if (Number(props?.N06_002 ?? 9999) === year) {
      newKm += geoLength(hwyFc.features[i]) * 6371;
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full h-auto"
        role="img"
        aria-label={`${year}年時点の日本の高速道路ネットワーク`}
      >
        <path d={prefPath} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.6} />
        <path
          d={hwyPath}
          fill="none"
          stroke="#d97706"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.92}
        />
      </svg>
      {newCount > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {year}年 新規開通:{" "}
          <span className="font-semibold text-amber-600">+{newCount} 区間</span>{" "}
          (約{Math.round(newKm).toLocaleString("ja-JP")} km)
        </p>
      )}
    </div>
  );
}
