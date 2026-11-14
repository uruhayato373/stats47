/** Manual migration audit: legitimate upstream revisions can differ from published values.
 * node --import tsx packages/data-configs/scripts/verify-table-snapshot-equivalence.ts --table <id> [--out <dir>]
 * Remote reads only. Generates local artifacts, never calls live e-Stat. Classification: quality-gates.json.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { datasetPath } from "../../../config/datasets.mjs";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { SITE } from "@stats47/types";
import { listAllMetrics } from "../src/registry.js";
import { processOne, cityEstatSource, kakeiEstatSource, WAGE_SAMPLE_REFERENCE_BELOW } from "./page-data-batch.js";
import type { MetricConfig } from "../src/types.js";
import type { SnapshotEntry, SourceEvidence } from "./lib/estat-table-reader.js";
type Row = Record<string, unknown> & { areaCode: string; yearCode: string; sampleCount?: number | null; isReference?: boolean };
interface Payload { metricKey: string; entityKind: string; rows: Row[]; meta: Record<string, unknown> }
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
const root = fileURLToPath(new URL("../../../", import.meta.url));

/** Compare all public fields except metadata and the two newly added annotations. No numeric tolerance. */
export function compareValues(local: Payload, published: Payload) {
  const strip = ({ sampleCount: _count, isReference: _reference, ...row }: Row) => row;
  const index = (rows: Row[]) => {
    const result = new Map(rows.map((row) => [`${row.areaCode}|${row.yearCode}`, strip(row)]));
    if (result.size !== rows.length) throw new Error("Duplicate area/year in comparison input");
    return result;
  };
  const left = index(local.rows);
  const right = index(published.rows);
  const differences = [...new Set([...left.keys(), ...right.keys()])].sort().flatMap((coordinate) => {
    const a = left.get(coordinate);
    const b = right.get(coordinate);
    if (isDeepStrictEqual(a, b)) return [];
    return [{ coordinate, fields: [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].filter((field) => !isDeepStrictEqual(a?.[field], b?.[field])), local: a ?? null, published: b ?? null }];
  });
  const { rows: _a, meta: _am, ...localHeader } = local;
  const { rows: _b, meta: _bm, ...publishedHeader } = published;
  const headerMatches = isDeepStrictEqual(localHeader, publishedHeader);
  return { matches: differences.length === 0 && headerMatches, headerMatches, localRows: local.rows.length, publishedRows: published.rows.length, differences };
}

type Entity = "prefecture" | "city";
export interface AuditTarget { config: MetricConfig; entity: Entity }

/** Resolve actual ingestion coordinates, including city overrides and supplemental tables. */
export function selectTableSnapshotTargets(table: string, entries: readonly Pick<SnapshotEntry, "statsDataId" | "status">[], metrics: readonly MetricConfig[]): AuditTarget[] {
  if (!/^\d{10}$/.test(table)) throw new Error("--table must be a 10-digit statsDataId");
  const matches = entries.filter((entry) => entry.statsDataId === table);
  if (matches.length !== 1 || matches[0].status !== "pushed") throw new Error(`Table must have exactly one pushed ledger entry: ${table}`);
  const targets: AuditTarget[] = [];
  for (const config of metrics) {
    if (config.isActive === false || config.source.kind === "calculated") continue;
    const primary = config.source.kind === "estat" ? config.source
      : config.source.kind === "kakei-chousa" ? kakeiEstatSource(config.source) : null;
    const city = primary ? cityEstatSource(config, primary) : config.citySource;
    const supplemental = config.supplementalSources?.some((item) => item.source.statsDataId === table) ?? false;
    for (const entity of ["prefecture", "city"] as const) {
      const source = entity === "prefecture" ? primary : city;
      if (config.entities.includes(entity) && source && (source.statsDataId === table || supplemental)) targets.push({ config, entity });
    }
  }
  if (!targets.length) throw new Error(`No active ingestible metrics reference table ${table}`);
  return targets;
}

export function parseAuditArgs(argv: readonly string[]) {
  let table: string | undefined;
  let out: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if ((flag !== "--table" && flag !== "--out") || !argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(`Invalid argument: ${flag}`);
    if (flag === "--table") {
      if (table) throw new Error("Specify one --table per run");
      table = argv[++i];
    } else {
      if (out) throw new Error("Duplicate --out");
      out = argv[++i];
    }
  }
  if (!table || !/^\d{10}$/.test(table)) throw new Error("Usage: verify-table-snapshot-equivalence.ts --table <10-digit id> [--out <directory>]");
  return { table, out: resolve(out ?? resolve(tmpdir(), "stats47-table-snapshot-equivalence", table)) };
}

/** No stale local artifact or mixed live-API input may be reported as a snapshot comparison. */
export function assertSnapshotPayload(payload: Payload, target: AuditTarget, entry: SnapshotEntry, startedAt: Date) {
  const generatedAt = Date.parse(String(payload.meta.generatedAt));
  const source = payload.meta.source as (SourceEvidence & { inputs?: SourceEvidence[] }) | undefined;
  const inputs = source?.inputs ?? (source ? [source] : []);
  if (payload.metricKey !== target.config.key || payload.entityKind !== target.entity || !Number.isFinite(generatedAt) || generatedAt < startedAt.getTime() ||
    !source || source.kind !== "estat-table-snapshot" || inputs.some((input) => input.kind !== "estat-table-snapshot") ||
    !inputs.some((input) => input.statsDataId === entry.statsDataId && input.manifestSha256 === entry.manifestSha256 && input.catalogVersion === entry.catalogVersion)) {
    throw new Error(`Fresh snapshot output/provenance missing: ${target.config.key}/${target.entity}`);
  }
}

async function main() {
  const { table, out } = parseAuditArgs(process.argv.slice(2));
  const ledger = JSON.parse(readFileSync(datasetPath("estat.table-snapshots"), "utf8")) as { tables: SnapshotEntry[] };
  const targets = selectTableSnapshotTargets(table, ledger.tables, listAllMetrics());
  const entry = ledger.tables.find((item) => item.statsDataId === table)!;
  mkdirSync(resolve(out, "public-values"), { recursive: true });
  process.env.ESTAT_SNAPSHOT_ONLY = "1";
  const publicOrigin = new URL(SITE.r2PublicBaseUrl).origin;
  process.env.R2_PUBLIC_FETCH_URL = publicOrigin;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    if (url.origin !== publicOrigin || method !== "GET") throw new Error(`Audit prohibits request: ${url.origin}`);
    return originalFetch(input, init);
  };
  const comparisons = [];
  const samples = [];
  const errors = [];
  for (const target of targets) {
    const { config, entity } = target;
    const artifact = entity === "prefecture" ? "values.json" : "cities.json";
    try {
      const startedAt = new Date();
      // Scope generation to the entity referencing this table. Registry objects remain unchanged.
      const result = await processOne({ ...config, entities: [entity] }, "", false);
      if (!result.ok) throw new Error(result.message);
      const payload = JSON.parse(readFileSync(resolve(root, `.local/r2/app/stats/${config.key}/${artifact}`), "utf8")) as Payload;
      assertSnapshotPayload(payload, target, entry, startedAt);
      const url = `https://storage.stats47.jp/app/stats/${config.key}/${artifact}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Public baseline HTTP ${response.status}`);
      const raw = await response.text();
      const publicPath = resolve(out, `public-values/${config.key}/${artifact}`);
      mkdirSync(resolve(out, `public-values/${config.key}`), { recursive: true });
      writeFileSync(publicPath, raw);
      const published = JSON.parse(raw) as Payload;
      const compared = compareValues(payload, published);
      comparisons.push({ metricKey: config.key, entity, ...compared, source: payload.meta.source, publicMeta: published.meta,
        publicEvidence: { url, retrievedAt: new Date().toISOString(), sha256: hash(raw), etag: response.headers.get("etag"), lastModified: response.headers.get("last-modified"), path: publicPath } });
      // Estimated-worker annotations are optional outside wage tables; never assume particular tab codes or depth.
      if (payload.meta.sampleCount) {
        for (const year of [...new Set(payload.rows.map((row) => row.yearCode))].sort()) {
          const rows = payload.rows.filter((row) => row.yearCode === year);
          for (const row of rows) {
            if (!("sampleCount" in row) || row.isReference !== (row.sampleCount != null && row.sampleCount < WAGE_SAMPLE_REFERENCE_BELOW)) throw new Error(`Invalid sample annotation: ${row.areaCode}/${year}`);
          }
          samples.push({ metricKey: config.key, entity, year, estimatedWorkerTotal: rows.reduce((n, row) => n + (row.sampleCount ?? 0), 0),
            referenceAreaYears: rows.filter((row) => row.isReference).length, missingSampleCount: rows.filter((row) => row.sampleCount == null).length, areaYears: rows.length });
        }
      }
      console.log(`[table-audit] ${table}/${config.key}/${entity}: ${compared.matches ? "MATCH" : `DIFFERENT ${compared.differences.length}`} rows=${payload.rows.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ metricKey: config.key, entity, message });
      console.error(`[table-audit] ${table}/${config.key}/${entity}: ERROR ${message}`);
    }
  }
  const summary = { generatedAt: new Date().toISOString(), statsDataId: table, catalogVersion: entry.catalogVersion, manifestSha256: entry.manifestSha256,
    targetMetrics: new Set(targets.map((target) => target.config.key)).size, targetArtifacts: targets.length, comparedArtifacts: comparisons.length,
    matched: comparisons.filter((r) => r.matches).length, different: comparisons.filter((r) => !r.matches).length, errors: errors.length,
    rows: comparisons.reduce((n, result) => n + result.localRows, 0), referenceAreaYears: samples.reduce((n, r) => n + r.referenceAreaYears, 0),
    missingSampleCount: samples.reduce((n, r) => n + r.missingSampleCount, 0) };
  writeFileSync(resolve(out, "table-snapshot-equivalence.json"), JSON.stringify({ ...summary, comparisons, failures: errors }, null, 2) + "\n");
  writeFileSync(resolve(out, "table-snapshot-sample-counts.json"), JSON.stringify({ ...summary,
    kind: "estimated-workers", unit: "人", note: "人数の注記がある指標だけを集計。欠測は合計に含めず別掲。推計値であり調査回答者数ではない。指標間の重複を含むため指標間の総和には使わない。", rows: samples }, null, 2) + "\n");
  console.log(JSON.stringify(summary));
  if (summary.different || summary.errors) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
