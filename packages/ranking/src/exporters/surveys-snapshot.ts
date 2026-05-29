import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Source } from "../types/snapshot";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  SURVEYS_SNAPSHOT_KEY,
  type SurveysSnapshot,
} from "../types/snapshot";

export interface ExportSurveysSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

/**
 * surveys snapshot を R2 に書き出す (完全DBレス: docs/01_技術設計/19)。
 *
 * SSOT は D1 `sources` (sourceKind='survey') テーブルではなく git TS マスタ
 * `packages/ranking/src/data/surveys.json` (配信 app/survey/all.json から抽出した静的 reference,
 * displayOrder 順)。survey は低頻度更新の reference データで git TS を SSOT とする (port master と同方針)。
 */
export async function exportSurveysSnapshot(): Promise<ExportSurveysSnapshotResult> {
  const startedAt = Date.now();

  const dataPath = path.resolve(__dirname, "../data/surveys.json");
  const surveys = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as Source[];

  const snapshot: SurveysSnapshot = {
    generatedAt: new Date().toISOString(),
    count: surveys.length,
    surveys,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(SURVEYS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    { key: result.key, count: surveys.length, sizeBytes: result.size, durationMs },
    "surveys snapshot (完全DBレス) を R2 に保存しました",
  );

  return {
    key: result.key,
    count: surveys.length,
    sizeBytes: result.size,
    durationMs,
  };
}
