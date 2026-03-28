import "server-only";

import {
  fetchKsjTopologyFromLocal,
  listDownloadedDatasets,
  getDatasetDef,
} from "@stats47/gis/mlit-ksj";

import type { TopoJSONTopology } from "@stats47/types";

export interface GisLayerData {
  dataId: string;
  name: string;
  nameEn: string;
  geometryType: string;
  license: string;
  version: string;
  filename: string;
  topology: TopoJSONTopology;
}

export interface GisExplorerData {
  layers: GisLayerData[];
  availableDatasets: Array<{
    dataId: string;
    name: string;
    geometryType: string;
    version: string;
    files: string[];
  }>;
}

/**
 * GIS Explorer に表示するデータをロード
 *
 * デフォルトでは鉄道路線（N02）をロードし、
 * 利用可能なデータセット一覧を返す。
 */
export async function loadGisExplorerData(
  initialLayerIds: string[] = ["N02"]
): Promise<GisExplorerData> {
  const downloaded = listDownloadedDatasets();

  // 利用可能データセット
  const availableDatasets = downloaded.map((d) => {
    let def;
    try {
      def = getDatasetDef(d.dataId);
    } catch {
      def = null;
    }
    return {
      dataId: d.dataId,
      name: def?.name ?? d.dataId,
      geometryType: def?.geometryType ?? "unknown",
      version: d.version,
      files: d.files,
    };
  });

  // 初期表示レイヤーをロード
  const layers: GisLayerData[] = [];
  for (const dataId of initialLayerIds) {
    const dataset = downloaded.find((d) => d.dataId === dataId);
    if (!dataset) continue;

    let def;
    try {
      def = getDatasetDef(dataId);
    } catch {
      continue;
    }

    // 鉄道は路線区間ファイルを優先
    const filename =
      dataset.files.find((f) => f.includes("RailroadSection")) ??
      dataset.files.find((f) => f.includes("HighwaySection")) ??
      dataset.files[0];

    try {
      const topology = fetchKsjTopologyFromLocal({
        dataId,
        version: dataset.version,
        filename,
      });

      layers.push({
        dataId,
        name: def.name,
        nameEn: def.nameEn,
        geometryType: def.geometryType,
        license: def.license,
        version: dataset.version,
        filename,
        topology,
      });
    } catch {
      // ファイル読み込みエラーはスキップ
    }
  }

  return { layers, availableDatasets };
}
