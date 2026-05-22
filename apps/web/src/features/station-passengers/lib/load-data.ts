import type { StationPassengerData } from "@stats47/station-passengers";
import type { FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";

/** 駅バブルマップ描画に必要なデータ一式 */
export interface StationPassengersBundle {
  topology: Topology;
  data: StationPassengerData;
  railLines: FeatureCollection | null;
}

/** 47 県サマリ index.json の 1 県 */
export interface PrefSummary {
  prefCode: string;
  prefName: string;
  stationCount: number;
  latestTotal: number;
}

export interface StationPassengersIndex {
  generatedAt: string;
  dataset: string;
  years: number[];
  latestYear: number;
  prefectures: PrefSummary[];
}

/** 県境 topojson は全県共通なのでクライアント内でキャッシュ */
let prefectureTopologyCache: Topology | null = null;

/**
 * 焦点県の駅データ一式を読み込む。
 * - 県境 topojson は /api/mf-topo/prefecture（移動フローと共用、R2 CORS 回避プロキシ）
 * - 駅・路線データは /api/station-passengers/{code}/*（R2 プロキシ）
 */
export async function loadStationPassengersBundle(
  code: string,
): Promise<StationPassengersBundle> {
  const prefectureTopologyPromise: Promise<Topology> = prefectureTopologyCache
    ? Promise.resolve(prefectureTopologyCache)
    : fetch(`/api/mf-topo/prefecture`).then((r) => r.json() as Promise<Topology>);

  const [topology, data, railLines] = await Promise.all([
    prefectureTopologyPromise,
    fetch(`/api/station-passengers/${code}/stations`).then(
      (r) => r.json() as Promise<StationPassengerData>,
    ),
    fetch(`/api/station-passengers/${code}/lines`)
      .then((r) => (r.ok ? (r.json() as Promise<FeatureCollection>) : null))
      .catch(() => null),
  ]);

  prefectureTopologyCache = topology;
  return { topology, data, railLines };
}
