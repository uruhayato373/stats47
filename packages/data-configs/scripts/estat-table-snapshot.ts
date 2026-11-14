/** Local table snapshots; explicit --push uploads existing files to private R2. */
import { SITE } from "@stats47/types";
import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { createEstatIngestClient, ESTAT_MAX_CONCURRENCY, planTablePartitions, readAxes, makeSliceKey,
  type Axis, type EstatIngestClient, type IngestResult } from "../../estat-api/src/ingest.js";
import { ESTAT_API_VERSION, type StatsDataCacheEnvelope } from "../../estat-api/src/stats-data/repositories/cache/envelope.js";
import type { GetStatsDataParams, EstatValue } from "../../estat-api/src/stats-data/types/index.js";
import { collectReferences } from "./estat-table-inventory.js";
import { pushPrivateR2Snapshot, type PrivateSnapshotObject } from "../../r2-storage/src/scripts/push-private-r2-snapshot-core.js";
import { R2_PRIVATE_BUCKET } from "../../r2-storage/src/scripts/r2-key-classes.js";

export { makeSliceKey } from "../../estat-api/src/stats-data/utils/table-partitions.js";
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const DEFAULT_OUT = resolve(REPO_ROOT, ".local/estat-tables");
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected catalog object");
  return value as JsonObject;
}
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof object(value).$ === "string") return String(object(value).$);
  throw new Error("Missing catalog text");
}

export interface TableMetadata {
  statsDataId: string;
  title: string;
  statCode: string;
  updatedDate: string;
  fetchedAt: string;
  sha256: string;
  axes: Axis[];
  prefDim: string | null;
  reportedRows: number | null;
}

export async function loadTableMetadata(statsDataId: string, transport: typeof fetch = globalThis.fetch): Promise<TableMetadata> {
  if (!/^\d{10}$/.test(statsDataId)) throw new Error("Invalid table ID");
  const response = await transport(`${SITE.r2PublicBaseUrl.replace(/\/+$/, "")}/estat-catalog/meta/${statsDataId}.json`,
    { method: "GET", redirect: "error", signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Catalog ${statsDataId}: HTTP ${response.status}; no live metadata fallback`);
  const raw = Buffer.from(await response.arrayBuffer());
  const envelope = object(JSON.parse(raw.toString("utf8")));
  const api = object(envelope.response);
  const root = object(api.GET_META_INFO);
  if (Number(object(root.RESULT).STATUS) !== 0) throw new Error("Invalid catalog status");
  const meta = object(root.METADATA_INF);
  const table = object(meta.TABLE_INF);
  if (table["@id"] !== statsDataId) throw new Error("Catalog table ID mismatch");
  const axes = readAxes(object(meta.CLASS_INF).CLASS_OBJ);
  const url = new URL("../../../.claude/scripts/lib/estat-catalog/normalize.mjs", import.meta.url);
  const { summarizeMeta } = await import(url.href) as { summarizeMeta: (value: unknown) => { has47Pref: boolean; prefDim: string | null } };
  const summary = summarizeMeta(api);
  const { METRICS_REGISTRY } = await import("../src/registry.js");
  const configured = [...new Set((collectReferences(Object.values(METRICS_REGISTRY)).get(statsDataId) ?? []).flatMap((ref) =>
    ref.query.areaAxis ? [String(object(ref.query.areaAxis).axis)] : []))];
  if (configured.length > 1 || (configured[0] && summary.has47Pref && configured[0] !== summary.prefDim)) throw new Error("Conflicting region axes");
  const prefDim = configured[0] ?? (summary.has47Pref ? summary.prefDim : null);
  const reportedRows = table.OVERALL_TOTAL_NUMBER == null ? null : Number(table.OVERALL_TOTAL_NUMBER);
  if (reportedRows !== null && (!Number.isSafeInteger(reportedRows) || reportedRows < 0)) throw new Error("Invalid catalog row total");
  return { statsDataId, title: text(table.TITLE), statCode: text(object(table.STAT_NAME)["@code"]),
    updatedDate: text(table.UPDATED_DATE), fetchedAt: text(envelope.fetchedAt), sha256: hash(raw), axes, prefDim, reportedRows };
}

function* combinations(axes: readonly Axis[], depth: number, selected: Record<string, string> = {}): Generator<Record<string, string>> {
  if (depth === 0) { yield selected; return; }
  const [axis, ...remaining] = axes;
  for (const code of axis.codes) yield* combinations(remaining, depth - 1, { ...selected, [axis.id]: code });
}

function queryFor(statsDataId: string, codes: Record<string, string>): GetStatsDataParams {
  return { statsDataId, ...Object.fromEntries(Object.entries(codes).map(([axis, code]) =>
    [axis === "tab" ? "cdTab" : `cdCat${axis.slice(3)}`, code])) };
}

export interface SnapshotFile {
  key: string;
  rowCount: number;
  sha256: string;
  bytes: number;
  uncompressedBytes: number;
}
export interface TableSnapshotManifest {
  schemaVersion: 1;
  statsDataId: string;
  title: string;
  statCode: string;
  catalogVersion: string;
  catalogFetchedAt: string;
  catalogSha256: string;
  fetchedAt: string;
  partition: ReturnType<typeof planTablePartitions>;
  fileCount: number;
  rowCount: number;
  maxRowsPerFile: number;
  gzipBytes: number;
  uncompressedBytes: number;
  requestCount: number;
  catalogReportedRows: number | null;
  warnings: string[];
  files: SnapshotFile[];
  emptyPartitions: { key: string; params: GetStatsDataParams }[];
}

/** All VALUE fields stay intact; one file is the complete paginated response for its prefix. */
export function encodeSnapshot(result: IngestResult, key: string, cachedAt: string) {
  if (!result.response) throw new Error("Cannot encode absent data");
  const envelope: StatsDataCacheEnvelope = { cachedAt, params: result.params, apiVersion: ESTAT_API_VERSION, response: result.response };
  const raw = Buffer.from(JSON.stringify(envelope));
  const compressed = gzipSync(raw, { level: 6 });
  const file: SnapshotFile = { key, rowCount: result.rowCount, sha256: hash(compressed), bytes: compressed.length, uncompressedBytes: raw.length };
  return { compressed, file };
}

export async function writeTableSnapshot(meta: TableMetadata, outDir: string, client: EstatIngestClient): Promise<TableSnapshotManifest> {
  const partition = planTablePartitions(meta.axes, meta.prefDim);
  if (!partition.fitsRowLimit) throw new Error(`${meta.statsDataId}: region × time exceeds row limit; owner decision required`);
  const prefix = `estat-tables/${meta.statsDataId}/`;
  const destination = resolve(outDir, prefix);
  try { await access(destination); throw new Error(`Snapshot already exists: ${meta.statsDataId}; refusing to refetch/overwrite`); }
  catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error; }
  const staging = resolve(outDir, `.estat-staging-${meta.statsDataId}-${randomUUID()}`);
  await mkdir(staging, { recursive: true });
  const files: SnapshotFile[] = [];
  const emptyPartitions: TableSnapshotManifest["emptyPartitions"] = [];
  let requestCount = 0;
  let failed: unknown;
  const iterator = combinations(meta.axes.filter((axis) => partition.partitionAxes.includes(axis.id)), partition.depth);
  try {
    await Promise.all(Array.from({ length: Math.min(ESTAT_MAX_CONCURRENCY, partition.fileCount) }, async () => {
      while (!failed) {
        const item = iterator.next();
        if (item.done) return;
        try {
          const codes = item.value;
          const key = makeSliceKey(meta.statsDataId, meta.axes, codes, partition.depth, meta.prefDim);
          const result = await client.fetchAll(queryFor(meta.statsDataId, codes));
          requestCount += result.requestCount;
          if (!result.response) { emptyPartitions.push({ key, params: result.params }); continue; }
          const data = result.response.GET_STATS_DATA.STATISTICAL_DATA;
          if (data.TABLE_INF.UPDATED_DATE !== meta.updatedDate) throw new Error(`Live table/catalog version mismatch: live=${data.TABLE_INF.UPDATED_DATE}, catalog=${meta.updatedDate}`);
          const rows = Array.isArray(data.DATA_INF.VALUE) ? data.DATA_INF.VALUE : [data.DATA_INF.VALUE];
          if (rows.length !== result.rowCount || rows.length > partition.rowLimit) throw new Error("Actual file rows exceed limit or result count");
          const coordinates = new Set<string>();
          for (const row of rows) {
            const coordinate = meta.axes.map((axis) => {
              const code = row[`@${axis.id}` as keyof EstatValue];
              if (!code || !axis.codes.includes(code)) throw new Error(`Unexpected coordinate: ${axis.id}=${code}`);
              if (codes[axis.id] !== undefined && codes[axis.id] !== code) throw new Error("Response escaped partition filter");
              return code;
            }).join("\u0000");
            if (coordinates.has(coordinate)) throw new Error("Duplicate VALUE coordinate");
            coordinates.add(coordinate);
          }
          const encoded = encodeSnapshot(result, key, new Date().toISOString());
          const localPath = resolve(staging, key.slice(prefix.length));
          await mkdir(dirname(localPath), { recursive: true });
          await writeFile(localPath, encoded.compressed, { flag: "wx" });
          files.push(encoded.file);
        } catch (error) { failed = error; }
      }
    })); // all in-flight writers settle before cleanup on failure
    if (failed) throw failed;
    files.sort((a, b) => a.key.localeCompare(b.key));
    emptyPartitions.sort((a, b) => a.key.localeCompare(b.key));
    const rowCount = files.reduce((sum, file) => sum + file.rowCount, 0);
    if (files.length + emptyPartitions.length !== partition.fileCount) throw new Error("Partition coverage mismatch");
    // Catalog OVERALL_TOTAL_NUMBER can lag/change independently of UPDATED_DATE.
    // Each live request is complete only after its own TOTAL_NUMBER/NEXT_KEY checks.
    const warnings = meta.reportedRows !== null && rowCount !== meta.reportedRows
      ? [`Catalog OVERALL_TOTAL_NUMBER differs from complete live partitions: ${rowCount}/${meta.reportedRows}`] : [];
    const manifest: TableSnapshotManifest = { schemaVersion: 1, statsDataId: meta.statsDataId, title: meta.title,
      statCode: meta.statCode, catalogVersion: meta.updatedDate, catalogFetchedAt: meta.fetchedAt, catalogSha256: meta.sha256,
      fetchedAt: new Date().toISOString(), partition, fileCount: files.length, rowCount,
      maxRowsPerFile: Math.max(0, ...files.map((file) => file.rowCount)),
      gzipBytes: files.reduce((sum, file) => sum + file.bytes, 0),
      uncompressedBytes: files.reduce((sum, file) => sum + file.uncompressedBytes, 0), requestCount,
      catalogReportedRows: meta.reportedRows, warnings, files, emptyPartitions };
    // Commit marker is last. Only a complete table directory is exposed to a later uploader.
    await writeFile(resolve(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    await mkdir(dirname(destination), { recursive: true });
    await rename(staging, destination);
    return manifest;
  } finally { await rm(staging, { recursive: true, force: true }); }
}

/** Read only committed local snapshots; --push never reacquires the source table. */
export async function readSnapshotForPush(statsDataId: string, outDir: string) {
  if (!/^\d{10}$/.test(statsDataId)) throw new Error("Invalid table ID");
  const prefix = `estat-tables/${statsDataId}/`;
  const manifestKey = `${prefix}manifest.json`;
  const manifestBytes = await readFile(resolve(outDir, manifestKey));
  const manifest = JSON.parse(manifestBytes.toString()) as TableSnapshotManifest;
  if (manifest.schemaVersion !== 1 || manifest.statsDataId !== statsDataId || !Array.isArray(manifest.files) ||
      manifest.files.length !== manifest.fileCount || manifest.fileCount === 0) throw new Error("Invalid local manifest");
  const objects: PrivateSnapshotObject[] = [];
  for (const file of manifest.files) {
    if (!file.key.startsWith(`${prefix}data/`) || !file.key.endsWith(".json.gz") ||
        file.key.split("/").some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
      throw new Error("Invalid manifest key");
    }
    const bytes = await readFile(resolve(outDir, file.key));
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`Local SHA/size mismatch: ${file.key}`);
    objects.push({ key: file.key, bytes });
  }
  if (new Set(objects.map((o) => o.key)).size !== objects.length ||
      manifest.files.reduce((sum, f) => sum + f.rowCount, 0) !== manifest.rowCount ||
      objects.reduce((sum, f) => sum + f.bytes.length, 0) !== manifest.gzipBytes) throw new Error("Manifest totals mismatch");
  objects.push({ key: manifestKey, bytes: manifestBytes });
  return { manifest, manifestBytes, objects, manifestKey };
}

type SnapshotLedger = { schemaVersion: number; tables: { statsDataId: string; manifestSha256: string; status: string }[] };
async function checkedLedger(manifestBytes: Buffer, ledgerPath: string) {
  const { assertDatasetShape } = await import(new URL("../../../.claude/scripts/lib/dataset-shape.mjs", import.meta.url).href) as {
    assertDatasetShape: (id: string, value: unknown) => void;
  };
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as SnapshotLedger;
  assertDatasetShape("estat.table-snapshots", ledger);
  const manifest = JSON.parse(manifestBytes.toString()) as TableSnapshotManifest;
  const entries = ledger.tables.filter((t) => t.statsDataId === manifest.statsDataId);
  if (entries.length !== 1 || entries[0].manifestSha256 !== hash(manifestBytes)) throw new Error("Ledger/manifest mismatch; register the local snapshot first");
  return { ledger, entry: entries[0], assertDatasetShape };
}

/** Called after all objects and the final manifest pass S3 HEAD or OAuth GET size/SHA checks. */
export async function markSnapshotPushed(manifestBytes: Buffer, ledgerPath: string) {
  const { ledger, entry, assertDatasetShape } = await checkedLedger(manifestBytes, ledgerPath);
  if (entry.status === "verified") return;
  entry.status = "pushed";
  assertDatasetShape("estat.table-snapshots", ledger);
  const temporary = `${ledgerPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
    await rename(temporary, ledgerPath);
  } finally { await rm(temporary, { force: true }); }
}

/** Register each complete table immediately, so interrupted multi-table runs can resume. */
export async function registerLocalSnapshot(manifestBytes: Buffer, ledgerPath: string) {
  const { assertDatasetShape } = await import(new URL("../../../.claude/scripts/lib/dataset-shape.mjs", import.meta.url).href) as {
    assertDatasetShape: (id: string, value: unknown) => void;
  };
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as SnapshotLedger;
  assertDatasetShape("estat.table-snapshots", ledger);
  const m = JSON.parse(manifestBytes.toString()) as TableSnapshotManifest;
  const previous = ledger.tables.filter((entry) => entry.statsDataId === m.statsDataId);
  if (previous.length) {
    if (previous.length !== 1 || previous[0].manifestSha256 !== hash(manifestBytes)) throw new Error("Existing snapshot ledger differs; refusing replacement");
    return;
  }
  ledger.tables.push({ statsDataId: m.statsDataId, title: m.title, statCode: m.statCode,
    catalogVersion: m.catalogVersion, catalogSha256: m.catalogSha256, fetchedAt: m.fetchedAt,
    fileCount: m.fileCount, rowCount: m.rowCount, maxRowsPerFile: m.maxRowsPerFile,
    gzipBytes: m.gzipBytes, uncompressedBytes: m.uncompressedBytes, catalogReportedRows: m.catalogReportedRows,
    warnings: m.warnings, depth: m.partition.depth, partitionAxes: m.partition.partitionAxes, rowLimit: m.partition.rowLimit,
    manifestKey: `estat-tables/${m.statsDataId}/manifest.json`, manifestSha256: hash(manifestBytes),
    status: "local-only", bucket: R2_PRIVATE_BUCKET } as SnapshotLedger["tables"][number]);
  assertDatasetShape("estat.table-snapshots", ledger);
  const temporary = `${ledgerPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
    await rename(temporary, ledgerPath);
  } finally { await rm(temporary, { force: true }); }
}

export function parseSnapshotArgs(args: string[]) {
  const tables: string[] = [];
  let out = DEFAULT_OUT;
  let dryRun = false;
  let push = false;
  let checkUpdates = false;
  let allowAuthoritativeOverwrite = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--check-updates") checkUpdates = true;
    else if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--push") push = true;
    else if (args[i] === "--allow-authoritative-overwrite") allowAuthoritativeOverwrite = true;
    else if (args[i] === "--out" && args[i + 1] && !args[i + 1].startsWith("--")) out = resolve(args[++i]);
    else if (args[i] === "--table") {
      const start = tables.length;
      while (args[i + 1] && !args[i + 1].startsWith("--")) tables.push(...args[++i].split(","));
      if (tables.length === start) throw new Error("--table requires an ID");
    } else throw new Error(`Unknown/incomplete option: ${args[i]}`);
  }
  if (checkUpdates && args.length !== 1) throw new Error("--check-updates cannot be combined with acquisition options");
  if ((!checkUpdates && !tables.length) || tables.some((id) => !/^\d{10}$/.test(id))) throw new Error("--table requires 10-digit table IDs");
  if (allowAuthoritativeOverwrite && !push) throw new Error("--allow-authoritative-overwrite requires --push");
  return { tables: [...new Set(tables)], out, dryRun, push, allowAuthoritativeOverwrite, checkUpdates };
}

async function main() {
  const args = parseSnapshotArgs(process.argv.slice(2));
  if (args.checkUpdates) {
    const { checkTableUpdates } = await import("./estat-refresh-selection.js");
    const { listAllMetrics } = await import("../src/registry.js");
    console.log(JSON.stringify(await checkTableUpdates(listAllMetrics()), null, 2));
    return;
  }
  if (args.push) {
    // Native ESM import: the plain-JS transport uses an import-only proxy dependency.
    const { createR2Store, R2_BULK_REQUEST_INTERVAL_MS } = await import(new URL("../../r2-storage/src/lib/clients/private-r2-store.mjs", import.meta.url).href) as
      typeof import("../../r2-storage/src/lib/clients/private-r2-store.mjs");
    const { datasetPath } = await import(new URL("../../../config/datasets.mjs", import.meta.url).href) as { datasetPath: (id: string) => string };
    const ledgerPath = resolve(REPO_ROOT, datasetPath("estat.table-snapshots"));
    for (const id of args.tables) {
      const local = await readSnapshotForPush(id, args.out);
      await checkedLedger(local.manifestBytes, ledgerPath);
      const store = createR2Store({ bucket: R2_PRIVATE_BUCKET, minimumRequestIntervalMs: R2_BULK_REQUEST_INTERVAL_MS });
      const counts = await pushPrivateR2Snapshot({ ...local, store, dryRun: args.dryRun,
        allowAuthoritativeOverwrite: args.allowAuthoritativeOverwrite });
      if (!args.dryRun) await markSnapshotPushed(local.manifestBytes, ledgerPath);
      console.log(JSON.stringify({ statsDataId: id, dryRun: args.dryRun, ...counts }));
    }
    return;
  }
  const { datasetPath } = await import(new URL("../../../config/datasets.mjs", import.meta.url).href) as { datasetPath: (id: string) => string };
  const ledgerPath = resolve(REPO_ROOT, datasetPath("estat.table-snapshots"));
  let client: EstatIngestClient | undefined;
  for (const id of args.tables) {
    const manifestPath = resolve(args.out, `estat-tables/${id}/manifest.json`);
    if (!args.dryRun) {
      let complete = false;
      try { await access(manifestPath); complete = true; }
      catch (error) {
        if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
      }
      if (complete) {
        const local = await readSnapshotForPush(id, args.out);
        await registerLocalSnapshot(local.manifestBytes, ledgerPath);
        console.log(JSON.stringify({ statsDataId: id, skipped: "complete-local-manifest", manifest: manifestPath }));
        continue;
      }
    }
    const meta = await loadTableMetadata(id);
    if (args.dryRun) {
      console.log(JSON.stringify({ statsDataId: id, catalogVersion: meta.updatedDate, partition: planTablePartitions(meta.axes, meta.prefDim), out: args.out }));
      continue;
    }
    client ??= createEstatIngestClient();
    const manifest = await writeTableSnapshot(meta, args.out, client);
    await registerLocalSnapshot(await readFile(manifestPath), ledgerPath);
    console.log(JSON.stringify({ statsDataId: id, depth: manifest.partition.depth, fileCount: manifest.fileCount,
      rowCount: manifest.rowCount, gzipBytes: manifest.gzipBytes, uncompressedBytes: manifest.uncompressedBytes,
      requestCount: manifest.requestCount, manifest: manifestPath }));
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Snapshot failed"); process.exitCode = 1; });
}
