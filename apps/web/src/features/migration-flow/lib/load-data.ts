import type {
  MigrationFlowData,
  MunicipalityData,
} from "@stats47/migration-flow";
import type { Topology } from "topojson-specification";

/** 移動フロー描画に必要な 4 データ */
export interface MigrationFlowBundle {
  topology: Topology;
  cityTopology: Topology;
  data: MigrationFlowData;
  municipalities: MunicipalityData;
}

/** 県境 topojson は全県共通なのでクライアント内でキャッシュ */
let prefectureTopologyCache: Topology | null = null;

/**
 * 焦点県の移動フローデータ一式を読み込む。
 * - 県境・市区町村境界 topojson は /api/mf-topo（R2 を CORS 回避でプロキシ）
 * - 県間フロー・市区町村純移動 JSON は web public から
 */
export async function loadMigrationFlowBundle(
  code: string,
): Promise<MigrationFlowBundle> {
  const prefectureTopologyPromise: Promise<Topology> = prefectureTopologyCache
    ? Promise.resolve(prefectureTopologyCache)
    : fetch(`/api/mf-topo/prefecture`).then(
        (r) => r.json() as Promise<Topology>,
      );

  const [topology, cityTopology, data, municipalities] = await Promise.all([
    prefectureTopologyPromise,
    fetch(`/api/mf-topo/${code}`).then((r) => r.json() as Promise<Topology>),
    fetch(`/api/flow/migration/${code}`).then(
      (r) => r.json() as Promise<MigrationFlowData>,
    ),
    fetch(`/api/flow/migration-muni/${code}`).then(
      (r) => r.json() as Promise<MunicipalityData>,
    ),
  ]);

  prefectureTopologyCache = topology;
  return { topology, cityTopology, data, municipalities };
}
