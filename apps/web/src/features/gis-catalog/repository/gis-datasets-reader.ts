import "server-only";

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import {
  GIS_DATASETS_SNAPSHOT_KEY,
  type GisDatasetRow,
  type GisDatasetsSnapshot,
} from "../types";

let cached: GisDatasetsSnapshot | null = null;

async function loadSnapshot(): Promise<GisDatasetsSnapshot> {
  if (cached) return cached;
  const snapshot = await fetchFromR2AsJson<GisDatasetsSnapshot>(
    GIS_DATASETS_SNAPSHOT_KEY
  );
  if (!snapshot) {
    cached = { generatedAt: new Date(0).toISOString(), datasets: [] };
    return cached;
  }
  cached = snapshot;
  return cached;
}

export async function fetchGisDatasets(): Promise<GisDatasetRow[]> {
  const snapshot = await loadSnapshot();
  return snapshot.datasets;
}

export async function fetchGisDataset(dataId: string): Promise<GisDatasetRow | null> {
  const snapshot = await loadSnapshot();
  return snapshot.datasets.find((d) => d.dataId === dataId) ?? null;
}
