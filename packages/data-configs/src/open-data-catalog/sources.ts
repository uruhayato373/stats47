import data from "../../../../data/open-data/catalog/sources.json";
import { OPEN_DATASETS } from "./datasets";
import type { OpenDataSource } from "./types";

/**
 * source カタログの読み込み口。記録の正本は台帳 `open-data.sources`
 * (data/open-data/catalog/sources.json + Schema)。登録・編集は open-data-curator が公式一次情報を確認して行う。
 * lastVerifiedAt は実際に公式ページを開いて確認した日だけ更新する。
 * datasetIds は台帳に持たず、dataset の sourceId から導く (双方向の不一致を構造的に防ぐ)。
 */
export const OPEN_DATA_SOURCES: readonly OpenDataSource[] = (
  data.sources as Omit<OpenDataSource, "datasetIds">[]
).map((source) => ({
  ...source,
  datasetIds: OPEN_DATASETS.filter((d) => d.sourceId === source.id).map((d) => d.id),
}));

export function getOpenDataSource(id: string): OpenDataSource | undefined {
  return OPEN_DATA_SOURCES.find((s) => s.id === id);
}
