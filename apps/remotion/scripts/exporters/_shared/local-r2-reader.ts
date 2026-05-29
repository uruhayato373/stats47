import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  MigrationFlowPayload,
  StatsValuesPayload,
} from "@stats47/stats-r2/types";
import { statsR2Key } from "@stats47/stats-r2/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");
const LOCAL_R2_ROOT = resolve(REPO_ROOT, ".local/r2");

/**
 * Local R2 (`.local/r2/`) から JSON を直接読む Node 用 reader。
 * `@stats47/r2-storage/server` の server-only バリアを回避するため、
 * Remotion prepare-data の CLI コンテキスト専用に局所定義する。
 *
 * production / Workers では使わない (このスクリプト自体が dev のみ運用)。
 */
export function readLocalR2Json<T>(key: string): T | null {
  const filePath = resolve(LOCAL_R2_ROOT, key);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function readLocalStatsValues(
  metricKey: string,
  entityKind: "prefecture" | "city" | "port",
): StatsValuesPayload | null {
  return readLocalR2Json<StatsValuesPayload>(statsR2Key(metricKey, entityKind));
}

export function readLocalMigrationFlow(
  metricKey: string,
  year: number,
): MigrationFlowPayload | null {
  return readLocalR2Json<MigrationFlowPayload>(
    statsR2Key(metricKey, "migration-flow", year),
  );
}

export { LOCAL_R2_ROOT };
