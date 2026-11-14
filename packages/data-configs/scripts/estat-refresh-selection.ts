/** Read-only refresh planning. No e-Stat requests, snapshot writes or credentials. */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "@stats47/types";
import { buildRecipe } from "../src/recipe.js";
import type { MetricConfig } from "../src/types.js";
import { collectReferences } from "./estat-table-inventory.js";

export interface SnapshotVersion {
  statsDataId: string;
  statCode: string;
  catalogVersion: string;
  status: "local-only" | "pushed" | "verified";
}
export interface CatalogVersion { statsDataId: string; updatedDate: string; removedAt?: string | null }
export interface TableUpdate {
  statsDataId: string;
  ledgerVersion: string;
  catalogVersion: string;
  metricKeys: string[];
}
type MetricReference = { key: string; isActive?: boolean };
function dateVersion(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid catalog date: ${value}`);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) throw new Error(`Invalid catalog date: ${value}`);
  return timestamp;
}

/** All ledger statuses have a version; verification is an ingestion decision, not an update filter. */
export function findTableUpdates(ledger: readonly SnapshotVersion[], catalog: readonly CatalogVersion[], metrics: readonly MetricReference[]): TableUpdate[] {
  const references = collectReferences(metrics);
  const index = new Map<string, CatalogVersion>();
  for (const row of catalog) {
    if (index.has(row.statsDataId)) throw new Error(`Duplicate catalog table: ${row.statsDataId}`);
    index.set(row.statsDataId, row);
  }
  const seen = new Set<string>();
  return [...ledger].sort((a, b) => a.statsDataId.localeCompare(b.statsDataId)).flatMap((entry) => {
    if (seen.has(entry.statsDataId)) throw new Error(`Duplicate ledger table: ${entry.statsDataId}`);
    seen.add(entry.statsDataId);
    const row = index.get(entry.statsDataId);
    if (!row || row.removedAt) throw new Error(`Catalog table missing/deleted: ${entry.statsDataId}`);
    if (dateVersion(row.updatedDate) <= dateVersion(entry.catalogVersion)) return [];
    return [{ statsDataId: entry.statsDataId, ledgerVersion: entry.catalogVersion, catalogVersion: row.updatedDate,
      metricKeys: [...new Set((references.get(entry.statsDataId) ?? []).map((ref) => ref.metricKey))].sort() }];
  });
}

type ReadJson = (key: string) => Promise<unknown | null>;
export function publicJsonReader(transport: typeof fetch = globalThis.fetch): ReadJson {
  return async (key) => {
    if (!/^(estat-catalog\/index\/tables\/\d+\.json|app\/stats\/[a-z0-9-]+\/values\.json)$/.test(key)) throw new Error(`Invalid input key: ${key}`);
    const response = await transport(`${SITE.r2PublicBaseUrl.replace(/\/+$/, "")}/${key}`,
      { method: "GET", redirect: "error", signal: AbortSignal.timeout(60_000) });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
    return response.json();
  };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected JSON object");
  return value as Record<string, unknown>;
}

export async function readSnapshotVersions(): Promise<SnapshotVersion[]> {
  const { datasetPath } = await import(new URL("../../../config/datasets.mjs", import.meta.url).href) as {
    datasetPath: (id: string) => string;
  };
  const { assertDatasetShape } = await import(new URL("../../../.claude/scripts/lib/dataset-shape.mjs", import.meta.url).href) as {
    assertDatasetShape: (id: string, value: unknown) => void;
  };
  const value: unknown = JSON.parse(await readFile(new URL(`../../../${datasetPath("estat.table-snapshots")}`, import.meta.url), "utf8"));
  assertDatasetShape("estat.table-snapshots", value);
  return object(value).tables as SnapshotVersion[];
}

export async function checkTableUpdates(metrics: readonly MetricReference[], options: {
  ledger?: readonly SnapshotVersion[]; readJson?: ReadJson;
} = {}): Promise<TableUpdate[]> {
  const ledger = options.ledger ?? await readSnapshotVersions();
  const readJson = options.readJson ?? publicJsonReader();
  const catalog: CatalogVersion[] = [];
  // One request per referenced survey shard; never probe the live API or every catalog table.
  for (const statCode of [...new Set(ledger.map((entry) => entry.statCode))].sort()) {
    if (!/^\d+$/.test(statCode)) throw new Error("Invalid ledger statCode");
    const rows = await readJson(`estat-catalog/index/tables/${statCode}.json`);
    if (!Array.isArray(rows)) throw new Error(`Catalog shard missing/malformed: ${statCode}`);
    for (const value of rows) {
      const row = object(value);
      if (typeof row.statsDataId !== "string" || typeof row.updatedDate !== "string") throw new Error("Malformed catalog row");
      catalog.push({ statsDataId: row.statsDataId, updatedDate: row.updatedDate, removedAt: typeof row.removedAt === "string" ? row.removedAt : null });
    }
  }
  return findTableUpdates(ledger, catalog, metrics);
}

export interface RefreshSelection {
  metricKeys: string[];
  tableUpdates: TableUpdate[];
  reasons: { key: string; updatedTables: string[]; configHashChanged: boolean; storedConfigHash: string | null; currentConfigHash: string }[];
}

/** Missing values/recipe count as an absent hash. HTTP/JSON errors abort, never become a full refresh. */
export async function selectRefreshMetrics(metrics: readonly MetricConfig[], options: {
  ledger?: readonly SnapshotVersion[]; readJson?: ReadJson; tableUpdates?: TableUpdate[];
} = {}): Promise<RefreshSelection> {
  const active = metrics.filter((metric) => metric.isActive !== false);
  const readJson = options.readJson ?? publicJsonReader();
  const tableUpdates = options.tableUpdates ?? await checkTableUpdates(active, { ...options, readJson });
  const reasons: RefreshSelection["reasons"] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, active.length) }, async () => {
    while (next < active.length) {
      const metric = active[next++];
      const value = await readJson(`app/stats/${metric.key}/values.json`);
      let storedConfigHash: string | null = null;
      if (value !== null) {
        const meta = object(value).meta;
        const recipe = meta == null ? undefined : object(meta).recipe;
        const hash = recipe == null ? undefined : object(recipe).configHash;
        if (hash !== undefined && typeof hash !== "string") throw new Error(`Invalid configHash: ${metric.key}`);
        storedConfigHash = hash ?? null;
      }
      const currentConfigHash = buildRecipe(metric).configHash;
      const updatedTables = tableUpdates.filter((table) => table.metricKeys.includes(metric.key)).map((table) => table.statsDataId).sort();
      const configHashChanged = storedConfigHash !== currentConfigHash;
      if (updatedTables.length || configHashChanged) reasons.push({ key: metric.key, updatedTables, configHashChanged, storedConfigHash, currentConfigHash });
    }
  }));
  reasons.sort((a, b) => a.key.localeCompare(b.key));
  return { metricKeys: reasons.map((reason) => reason.key), tableUpdates, reasons };
}

/** Standalone command prints a JSON plan only. --metric limits the hash reads for diagnosis. */
export async function selectionCommand(args: string[]) {
  const { listAllMetrics } = await import("../src/registry.js");
  let metrics = listAllMetrics();
  if (args.length) {
    if (args.length !== 2 || args[0] !== "--metric" || !args[1].trim()) throw new Error("Usage: estat-refresh-selection.ts [--metric key,key]");
    const keys = new Set(args[1].split(",").map((key) => key.trim()));
    if ([...keys].some((key) => !metrics.some((metric) => metric.key === key))) throw new Error("Unknown metric key");
    metrics = metrics.filter((metric) => keys.has(metric.key));
  }
  console.log(JSON.stringify(await selectRefreshMetrics(metrics), null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  selectionCommand(process.argv.slice(2)).catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
