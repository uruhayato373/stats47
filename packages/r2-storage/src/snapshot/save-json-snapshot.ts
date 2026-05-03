import "server-only";

import { logger } from "@stats47/logger/server";

import { saveToR2 } from "../lib";

export interface JsonSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

export interface SaveJsonSnapshotOptions {
  key: string;
  data: unknown;
  count: number;
  label: string;
  startedAt?: number;
}

export async function saveJsonSnapshot(
  opts: SaveJsonSnapshotOptions,
): Promise<JsonSnapshotResult> {
  const startedAt = opts.startedAt ?? Date.now();
  const body = JSON.stringify(opts.data);
  const result = await saveToR2(opts.key, body, {
    contentType: "application/json; charset=utf-8",
  });
  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      key: result.key,
      count: opts.count,
      sizeBytes: result.size,
      durationMs,
    },
    `${opts.label} snapshot を R2 に保存しました`,
  );
  return {
    key: result.key,
    count: opts.count,
    sizeBytes: result.size,
    durationMs,
  };
}
