import data from "../../../../data/open-data/catalog/datasets.json";
import type { OpenDatasetDefinition } from "./types";

/**
 * dataset カタログの読み込み口。記録の正本は台帳 `open-data.datasets`
 * (data/open-data/catalog/datasets.json + Schema)。ここは型を付けて export するだけ。
 * 配列の並びと ID は台帳が持つ (ID をテンプレートから作り直さない)。
 * 参照整合 (sourceId / datasetIds 双方向) は check-datasets の refs と validator が検証する。
 */
export const OPEN_DATASETS: readonly OpenDatasetDefinition[] =
  data.datasets as OpenDatasetDefinition[];

export function getOpenDataset(id: string): OpenDatasetDefinition | undefined {
  return OPEN_DATASETS.find((d) => d.id === id);
}

export function getDatasetsBySource(sourceId: string): readonly OpenDatasetDefinition[] {
  return OPEN_DATASETS.filter((d) => d.sourceId === sourceId);
}
