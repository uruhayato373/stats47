export const GIS_DATASETS_SNAPSHOT_KEY = "gis/datasets.json";

export interface GisDatasetRow {
  dataId: string;
  name: string;
  nameEn: string;
  category: string;
  geometryType: string;
  coverage: string;
  license: string;
  isDownloaded: boolean;
  r2Version: string | null;
  fileCount: number | null;
  totalSizeBytes: number | null;
  convertedAt: string | null;
  r2Prefix: string | null;
  attribution: string | null;
}

export interface GisDatasetsSnapshot {
  generatedAt: string;
  datasets: GisDatasetRow[];
}

/** _meta.json の files 配列の 1 要素 */
export interface KsjMetaFile {
  filename: string;
  sizeBytes: number;
  featureCount: number;
}

/** R2 に保存された _meta.json の構造 */
export interface KsjMeta {
  dataId: string;
  name: string;
  version: string;
  license: string;
  geometryType: string;
  files: KsjMetaFile[];
  convertedAt: string;
  attribution: string;
}
