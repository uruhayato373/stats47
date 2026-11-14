/** Read-only, pinned table snapshots. Missing/corrupt pushed data must never fall back to live API. */
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { datasetPath } from "../../../../config/datasets.mjs";
import { makeSliceKey, type Axis } from "../../../estat-api/src/stats-data/utils/table-partitions.js";
import type { TableSnapshotManifest, SnapshotFile } from "../estat-table-snapshot.js";
import type { SourceConfig } from "../../src/types.js";

type EstatSource = Extract<SourceConfig, { kind: "estat" }>;
type ObjectValue = Record<string, unknown>;
export interface SourceEvidence {
  kind: "estat-table-snapshot" | "estat-api";
  statsDataId: string;
  catalogVersion: string | null;
  sliceKeys: string[];
  manifestSha256: string | null;
}
export interface SnapshotEntry {
  statsDataId: string;
  status: string;
  catalogVersion: string;
  manifestKey: string;
  manifestSha256: string;
  depth: number;
  partitionAxes: string[];
  fileCount: number;
  rowCount: number;
  bucket: string;
}
export interface SnapshotRead { response: ObjectValue; source: SourceEvidence }
export type SnapshotReader = (source: EstatSource) => Promise<SnapshotRead | null>;
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid snapshot object");
  return value as ObjectValue;
}
function array(value: unknown): unknown[] { return value == null ? [] : Array.isArray(value) ? value : [value]; }
const parameter = (axis: string) => `cd${axis[0].toUpperCase()}${axis.substring(1)}`;
function filters(source: EstatSource): [string, string[]][] {
  return ["tab", "cat01", "cat02", "cat03", "cat04", "cat05"].flatMap((axis) => {
    const value = (source as unknown as Record<string, unknown>)[parameter(axis)];
    return typeof value === "string" && value ? [[axis, value.split(",")] as [string, string[]]] : [];
  });
}

export function createSnapshotReader(entries: readonly SnapshotEntry[], get: (key: string) => Promise<Buffer | null>): SnapshotReader {
  const manifests = new Map<string, Promise<TableSnapshotManifest>>();
  const slices = new Map<string, Promise<ObjectValue>>();
  async function manifest(entry: SnapshotEntry) {
    if (!manifests.has(entry.statsDataId)) manifests.set(entry.statsDataId, (async () => {
      if (entry.bucket !== "stats47-private" || entry.manifestKey !== `estat-tables/${entry.statsDataId}/manifest.json`) throw new Error("Invalid snapshot ledger location");
      const bytes = await get(entry.manifestKey);
      if (!bytes || sha256(bytes) !== entry.manifestSha256) throw new Error(`Snapshot manifest SHA mismatch/missing: ${entry.manifestKey}`);
      const result = JSON.parse(bytes.toString("utf8")) as TableSnapshotManifest;
      if (result.schemaVersion !== 1 || result.statsDataId !== entry.statsDataId || result.catalogVersion !== entry.catalogVersion ||
        result.partition.depth !== entry.depth || JSON.stringify(result.partition.partitionAxes) !== JSON.stringify(entry.partitionAxes) ||
        result.fileCount !== entry.fileCount || result.files.length !== entry.fileCount || result.rowCount !== entry.rowCount ||
        result.files.reduce((n, f) => n + f.rowCount, 0) !== result.rowCount ||
        new Set([...result.files, ...result.emptyPartitions].map((f) => f.key)).size !== result.files.length + result.emptyPartitions.length) {
        throw new Error(`Snapshot manifest contract mismatch: ${entry.statsDataId}`);
      }
      return result;
    })());
    return manifests.get(entry.statsDataId)!;
  }
  async function slice(entry: SnapshotEntry, file: SnapshotFile, codes: Record<string, string>) {
    if (!slices.has(file.key)) slices.set(file.key, (async () => {
      const bytes = await get(file.key);
      if (!bytes || bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Snapshot slice SHA/bytes mismatch/missing: ${file.key}`);
      const raw = gunzipSync(bytes);
      if (raw.length !== file.uncompressedBytes) throw new Error(`Snapshot uncompressed bytes mismatch: ${file.key}`);
      const envelope = object(JSON.parse(raw.toString("utf8")));
      const params = object(envelope.params);
      const response = object(envelope.response);
      const root = object(response.GET_STATS_DATA);
      const stat = object(root.STATISTICAL_DATA);
      const values = array(object(stat.DATA_INF).VALUE);
      if (envelope.apiVersion !== "3.0" || !envelope.cachedAt || params.statsDataId !== entry.statsDataId ||
        object(stat.TABLE_INF)["@id"] !== entry.statsDataId || Number(object(root.RESULT).STATUS) !== 0 || values.length !== file.rowCount ||
        Object.entries(codes).some(([axis, code]) => params[parameter(axis)] !== code || values.some((row) => object(row)[`@${axis}`] !== code))) {
        throw new Error(`Snapshot envelope/rows mismatch: ${file.key}`);
      }
      return stat;
    })());
    return slices.get(file.key)!;
  }
  return async (source) => {
    const entry = entries.find((item) => item.statsDataId === source.statsDataId && item.status === "pushed");
    if (!entry) return null;
    const info = await manifest(entry);
    const selections = filters(source);
    const prefix = `estat-tables/${entry.statsDataId}/data/`;
    const records = [...info.files, ...info.emptyPartitions].map((file) => {
      if (!file.key.startsWith(prefix) || !file.key.endsWith(".json.gz")) throw new Error("Invalid slice key prefix");
      const parts = file.key.substring(prefix.length, file.key.length - ".json.gz".length).split("/");
      if (entry.depth === 0) {
        if (parts.join("/") !== "all") throw new Error("Invalid depth zero key");
        return { file, codes: {} as Record<string, string> };
      }
      if (parts.length !== entry.depth) throw new Error("Invalid slice depth");
      const codes: Record<string, string> = {};
      parts.forEach((part, index) => {
        const axis = entry.partitionAxes[index];
        if (!part.startsWith(`${axis}=`)) throw new Error("Invalid slice axis order");
        codes[axis] = part.substring(axis.length + 1);
      });
      return { file, codes };
    });
    const axes: Axis[] = entry.partitionAxes.map((id) => ({ id, name: null, codes: [...new Set(records.map((r) => r.codes[id]))] }));
    // Every recorded prefix must use the same exported key function as the writer.
    for (const record of records) if (makeSliceKey(entry.statsDataId, axes, record.codes, entry.depth) !== record.file.key) throw new Error("Noncanonical slice key");
    const expected = axes.reduce((n, axis) => n * axis.codes.length, 1);
    if (records.length !== expected || records.length !== info.partition.fileCount) throw new Error("Incomplete snapshot partition grid");
    const selected = records.filter(({ codes }) => selections.every(([axis, wanted]) => !(axis in codes) || wanted.includes(codes[axis])));
    let first: ObjectValue | undefined;
    const values: ObjectValue[] = [];
    const keys: string[] = [];
    for (const { file, codes } of selected) {
      if (!("sha256" in file)) continue; // Explicitly recorded empty API partition.
      const stat = await slice(entry, file, codes);
      first ??= stat;
      keys.push(file.key);
      for (const row of array(object(stat.DATA_INF).VALUE)) {
        const value = object(row);
        if (selections.every(([axis, wanted]) => wanted.includes(String(value[`@${axis}`])))) values.push({ ...value });
      }
    }
    const sourceEvidence: SourceEvidence = { kind: "estat-table-snapshot", statsDataId: entry.statsDataId,
      catalogVersion: entry.catalogVersion, sliceKeys: keys, manifestSha256: entry.manifestSha256 };
    return { source: sourceEvidence, response: { GET_STATS_DATA: { RESULT: { STATUS: values.length ? 0 : 1 },
      STATISTICAL_DATA: { ...first, DATA_INF: { VALUE: values }, RESULT_INF: { TOTAL_NUMBER: values.length, TO_NUMBER: values.length } } } } };
  };
}

let defaultReader: SnapshotReader | undefined;
async function readDefault(source: EstatSource) {
  if (!defaultReader) {
    const ledger = JSON.parse(readFileSync(datasetPath("estat.table-snapshots"), "utf8")) as { tables: SnapshotEntry[] };
    // Lazily construct the transport: tables not yet in the snapshot ledger (old e-Stat path) need no private R2 credentials. 削除条件: 段 3 で全表が切片の経路に移り、旧経路を消したとき
    let store: import("../../../r2-storage/src/lib/clients/private-r2-store.mjs").PrivateR2Store | undefined;
    defaultReader = createSnapshotReader(ledger.tables, async (key) => {
      if (!store) {
        const moduleUrl = new URL("../../../r2-storage/src/lib/clients/private-r2-store.mjs", import.meta.url).href;
        const { createR2Store } = await import(moduleUrl) as typeof import("../../../r2-storage/src/lib/clients/private-r2-store.mjs");
        store = createR2Store({ bucket: "stats47-private" });
        console.log(`[estat-table-snapshot] private R2 transport=${store.transport}`);
      }
      return store.get(key);
    });
  }
  return defaultReader(source);
}

const readers = new AsyncLocalStorage<SnapshotReader>();
export const withSnapshotReader = <T>(reader: SnapshotReader, work: () => T): T => readers.run(reader, work);
export const readSnapshot = (source: EstatSource) => (readers.getStore() ?? readDefault)(source);
export function sourceEvidence(observations: readonly SourceEvidence[]): SourceEvidence & { inputs?: SourceEvidence[] } {
  const inputs: SourceEvidence[] = [];
  for (const item of observations) {
    const previous = inputs.find((s) => s.kind === item.kind && s.statsDataId === item.statsDataId && s.manifestSha256 === item.manifestSha256);
    if (previous) previous.sliceKeys = [...new Set([...previous.sliceKeys, ...item.sliceKeys])].sort();
    else inputs.push({ ...item, sliceKeys: [...item.sliceKeys].sort() });
  }
  if (!inputs.length) throw new Error("Missing ingestion source evidence");
  return { ...inputs[0], ...(inputs.length > 1 ? { inputs } : {}) };
}
/** Audit/local trial kill switch. Checked before either live e-Stat endpoint. */
export function assertLiveEstatAllowed(statsDataId: string) {
  if (process.env.ESTAT_SNAPSHOT_ONLY === "1") throw new Error(`Live e-Stat disabled (ESTAT_SNAPSHOT_ONLY): ${statsDataId}`);
}
