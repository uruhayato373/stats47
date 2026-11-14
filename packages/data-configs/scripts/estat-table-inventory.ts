/**
 * Stage 1 only: catalog-based dense-grid estimates, no e-Stat API or R2 writes.
 * node --import tsx packages/data-configs/scripts/estat-table-inventory.ts --out <scratchpad>
 * node --import tsx --test packages/data-configs/scripts/__tests__/estat-table-inventory.test.ts
 * Inputs are public R2 GETs; only the four requested reports are written.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { SITE } from "@stats47/types";

const PUBLIC_ORIGIN = SITE.r2PublicBaseUrl.replace(/\/+$/, "");
const REQUEST_LIMIT = 100_000;
const CONCURRENCY = 6;
const SAMPLE_KEY = "estat-api/stats-data/0000010101/cdCat01=A1101.json";
const PRICING_URL = "https://developers.cloudflare.com/r2/pricing/";
const GB = 1_000_000_000;
type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected JSON object");
  return value as JsonObject;
}

function array(value: unknown): unknown[] {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function string(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeSum(values: readonly number[]): number {
  const result = values.reduce((sum, n) => sum + n, 0);
  if (!Number.isSafeInteger(result)) throw new Error("Unsafe total");
  return result;
}

export { countSlices, makeSliceKey, readAxes, planTablePartitions } from "../../estat-api/src/stats-data/utils/table-partitions.js";
import { countSlices, makeSliceKey, readAxes, planTablePartitions, DEFAULT_TABLE_FILE_ROW_LIMIT } from "../../estat-api/src/stats-data/utils/table-partitions.js";
export type { Axis } from "../../estat-api/src/stats-data/utils/table-partitions.js";

export interface Reference {
  metricKey: string;
  path: string;
  sourceKind: string | null;
  query: JsonObject;
}

/** Walk runtime definitions, never TS text. Includes supplemental/sampleCount/external provenance. */
export function collectReferences(metrics: readonly { key: string; isActive?: boolean }[]): Map<string, Reference[]> {
  const result = new Map<string, Reference[]>();
  for (const metric of metrics) {
    if (metric.isActive === false) continue; // page-data-batch's public-metric predicate
    const root = object(metric);
    const sourceKind = root.source ? string(object(root.source).kind) : null;
    const visit = (value: unknown, path: string): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach((child, index) => visit(child, `${path}.${index}`));
        return;
      }
      const record = object(value);
      if (record.statsDataId != null) {
        const id = string(record.statsDataId);
        if (!id || !/^\d{10}$/.test(id)) throw new Error(`Invalid table reference: ${metric.key}.${path}`);
        const query = Object.fromEntries(Object.entries(record).filter(([key]) =>
          /^(statsDataId|cdTab|cdCat\d+|tabCombination|axisSum|axisRatio|areaAxis)$/.test(key)));
        const refs = result.get(id) ?? [];
        refs.push({ metricKey: metric.key, path, sourceKind, query });
        result.set(id, refs);
      }
      for (const [key, child] of Object.entries(record)) visit(child, path ? `${path}.${key}` : key);
    };
    visit(metric, "");
  }
  return new Map([...result].sort(([a], [b]) => a.localeCompare(b)));
}

async function publicGet(key: string): Promise<Buffer | null> {
  const url = new URL(key, `${PUBLIC_ORIGIN}/`);
  if (url.origin !== PUBLIC_ORIGIN || !/^(estat-catalog|estat-api)\//.test(key)) throw new Error(`Disallowed input: ${key}`);
  const response = await fetch(url, { method: "GET", redirect: "error", signal: AbortSignal.timeout(60_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET ${url}: ${response.status}`); // never mark 403/5xx as absent
  return Buffer.from(await response.arrayBuffer());
}

async function requiredJson(key: string): Promise<unknown> {
  const data = await publicGet(key);
  if (!data) throw new Error(`Required catalog input missing: ${key}`);
  return JSON.parse(data.toString("utf8")) as unknown;
}

async function mapConcurrent<T, R>(items: readonly T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }));
  return results;
}

export function measureSample(raw: Buffer) {
  const envelope = object(JSON.parse(raw.toString("utf8")));
  const data = object(object(object(envelope.response).GET_STATS_DATA).STATISTICAL_DATA);
  const rows = array(object(data.DATA_INF).VALUE);
  if (!rows.length) throw new Error("Calibration sample has no VALUE rows");
  const total = Number(object(data.RESULT_INF).TOTAL_NUMBER);
  if (total !== rows.length) throw new Error(`Calibration sample is paginated: ${rows.length}/${total}`);
  const gzipBytes = gzipSync(raw, { level: 6 }).byteLength;
  const valuesOnly = Buffer.from(JSON.stringify(rows));
  return {
    url: `${PUBLIC_ORIGIN}/${SAMPLE_KEY}`,
    cachedAt: envelope.cachedAt ?? null,
    sha256: createHash("sha256").update(raw).digest("hex"),
    rowCount: rows.length,
    rawBytes: raw.byteLength, gzipBytes, gzipLevel: 6,
    rawBytesPerRow: raw.byteLength / rows.length,
    gzipBytesPerRow: gzipBytes / rows.length,
    gzipRatio: gzipBytes / raw.byteLength,
    valuesOnlyRawBytes: valuesOnly.byteLength,
    valuesOnlyGzipBytes: gzipSync(valuesOnly, { level: 6 }).byteLength,
    basis: "公開キャッシュ封筒全体（メタデータ込み）/ VALUE 行数。gzip は同じバイト列を実圧縮。",
  };
}

interface CatalogSummary {
  tableRow: { statsDataId: string; title: string; statName: string; statCode: string | null; updatedDate: string | null };
  prefDim: string | null;
  has47Pref: boolean;
  sourceUpdatedDate: string | null;
}

type Counts = ReturnType<typeof countSlices>;
interface InventoryTable {
  statsDataId: string;
  title: string | null;
  statName: string | null;
  statCode: string | null;
  updatedDate: string | null;
  hasMeta: boolean;
  metaUrl: string;
  indexPresent: boolean;
  metaFetchedAt: string | null;
  metaUpdatedDate: string | null;
  metaSha256: string | null;
  catalogPrefDim: string | null;
  effectivePrefDim: string | null;
  axes: { id: string; name: string | null; codeCount: number; role: "slice" | "region" | "time" }[] | null;
  counts: Counts | null;
  partition: ReturnType<typeof planTablePartitions> | null;
  catalogReportedRows: number | null;
  metricKeys: string[];
  activeMetricCount: number;
  references: Reference[];
  fetchStrategy: Counts["fetchStrategy"] | "未判定";
  sliceKeyExample: string | null;
  warnings: string[];
}

async function main(outDir: string): Promise<void> {
  // Relative registry import uses this worktree, not a node_modules link to another checkout.
  const { METRICS_REGISTRY } = await import("../src/registry.js");
  // Typed boundary for existing untyped JS; do not duplicate prefDim detection logic.
  const normalizeUrl = new URL("../../../.claude/scripts/lib/estat-catalog/normalize.mjs", import.meta.url);
  const { summarizeMeta } = await import(normalizeUrl.href) as { summarizeMeta: (value: unknown) => CatalogSummary };
  const metrics = Object.values(METRICS_REGISTRY);
  const references = collectReferences(metrics);
  console.log(`Runtime registry: ${references.size} referenced tables`);
  const [manifestRaw, surveysRaw, sampleRaw] = await Promise.all([
    requiredJson("estat-catalog/manifest.json"), requiredJson("estat-catalog/index/surveys.json"), publicGet(SAMPLE_KEY),
  ]);
  const manifest = object(manifestRaw);
  if (!sampleRaw) throw new Error("Calibration sample missing");
  const sample = measureSample(sampleRaw);
  const index = new Map<string, JsonObject>();
  const shards = await mapConcurrent(array(surveysRaw), async (survey) => {
    const statCode = string(object(survey).statCode);
    if (!statCode || !/^\d+$/.test(statCode)) throw new Error("Invalid statCode");
    return array(await requiredJson(`estat-catalog/index/tables/${statCode}.json`));
  });
  for (const shard of shards) for (const entry of shard) {
    const row = object(entry);
    const id = string(row.statsDataId);
    if (!id) throw new Error("Catalog index row lacks statsDataId");
    if (references.has(id)) {
      if (index.has(id)) throw new Error(`Duplicate catalog table: ${id}`);
      index.set(id, row);
    }
  }
  console.log(`Read ${shards.length} catalog index shards; fetching ${references.size} metadata envelopes`);
  let completed = 0;
  const tables = await mapConcurrent([...references], async ([statsDataId, refs]): Promise<InventoryTable> => {
    const row = index.get(statsDataId);
    const raw = await publicGet(`estat-catalog/meta/${statsDataId}.json`);
    const metricKeys = [...new Set(refs.map((ref) => ref.metricKey))].sort();
    const result: InventoryTable = {
      statsDataId, title: string(row?.title), statName: string(row?.statName), statCode: string(row?.statCode),
      updatedDate: string(row?.updatedDate), hasMeta: raw !== null,
      metaUrl: `${PUBLIC_ORIGIN}/estat-catalog/meta/${statsDataId}.json`, indexPresent: !!row,
      metaFetchedAt: null, metaUpdatedDate: null, metaSha256: null,
      catalogPrefDim: null, effectivePrefDim: null, axes: null, counts: null, partition: null, catalogReportedRows: null,
      metricKeys, activeMetricCount: metricKeys.length, references: refs,
      fetchStrategy: "未判定", sliceKeyExample: null, warnings: [],
    };
    if (!row) result.warnings.push("一覧索引に表IDなし。統計コードはメタ情報で解決し、推測しない。");
    if (row?.removedAt) result.warnings.push(`一覧から削除済み: ${String(row.removedAt)}`);
    if (!raw) {
      result.warnings.push("公開メタURLが HTTP 404。切片・行数・容量は未算定（0扱いしない）。");
    } else {
      const envelope = object(JSON.parse(raw.toString("utf8")));
      const response = object(envelope.response);
      const meta = object(response.GET_META_INFO);
      if (Number(object(meta.RESULT).STATUS) !== 0) throw new Error(`Invalid metadata status: ${statsDataId}`);
      const metadata = object(meta.METADATA_INF);
      const summary = summarizeMeta(response);
      if (summary.tableRow.statsDataId !== statsDataId) throw new Error(`Mismatched metadata: ${statsDataId}`);
      const axes = readAxes(object(metadata.CLASS_INF).CLASS_OBJ);
      const configuredRegions = [...new Set(refs.flatMap((ref) => {
        const hint = ref.query.areaAxis;
        return hint ? [String(object(hint).axis)] : [];
      }))];
      if (configuredRegions.length > 1) throw new Error(`Conflicting areaAxis: ${statsDataId}`);
      const configuredRegion = configuredRegions[0] ?? null;
      if (configuredRegion && summary.has47Pref && summary.prefDim !== configuredRegion) throw new Error(`Conflicting prefDim: ${statsDataId}`);
      // summarizeMeta cannot detect sequential/name-based prefecture codes; the metric declares these.
      const prefDim = configuredRegion ?? (summary.has47Pref ? summary.prefDim : null);
      const counts = countSlices(axes, prefDim);
      result.title ??= summary.tableRow.title;
      result.statName ??= summary.tableRow.statName;
      result.statCode ??= summary.tableRow.statCode;
      result.updatedDate ??= summary.sourceUpdatedDate;
      result.metaUpdatedDate = summary.sourceUpdatedDate;
      result.metaFetchedAt = string(envelope.fetchedAt);
      result.metaSha256 = createHash("sha256").update(raw).digest("hex");
      result.catalogPrefDim = summary.prefDim;
      result.effectivePrefDim = prefDim;
      result.axes = axes.map((axis) => ({ id: axis.id, name: axis.name, codeCount: axis.codes.length,
        role: counts.regionAxes.includes(axis.id) ? "region" : axis.id === "time" ? "time" : "slice" }));
      result.counts = counts;
      const partition = planTablePartitions(axes, prefDim);
      result.partition = partition;
      if (!partition.fitsRowLimit) result.warnings.push("地域×時間だけで行数上限を超えるため、許された軸分割では上限を満たせない。取得は停止する。");
      const reported = object(metadata.TABLE_INF).OVERALL_TOTAL_NUMBER;
      if (reported != null) {
        const n = Number(reported);
        if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Invalid OVERALL_TOTAL_NUMBER: ${statsDataId}`);
        result.catalogReportedRows = n;
      }
      result.fetchStrategy = !partition.fitsRowLimit ? "未判定" : partition.depth === 0 ? "丸ごと" : "軸で分ける";
      const firstCodes = Object.fromEntries(axes.filter((axis) => partition.partitionAxes.includes(axis.id)).map((axis) => [axis.id, axis.codes[0]]));
      result.sliceKeyExample = makeSliceKey(statsDataId, axes, firstCodes, partition.depth, prefDim);
      if (configuredRegion && !summary.has47Pref) result.warnings.push(`県軸は metric.areaAxis=${configuredRegion} で補完（カタログの5桁県コード検出では認識不可）。`);
      if (result.updatedDate !== result.metaUpdatedDate) result.warnings.push("一覧の更新日とメタの更新日が不一致。取得前に版の整合が必要。");
      if (counts.implicitRegion || counts.implicitTime) result.warnings.push("欠けた地域/時間軸の掛け算係数は1。軸が存在するという意味ではない。");
      if (counts.requestsPerSliceEstimate > 1) result.warnings.push("1切片も100,000行を超える見積もり。切片内のページ取得が必要。");
      if (result.catalogReportedRows !== null && result.catalogReportedRows > counts.rowCountEstimate) result.warnings.push("カタログ記載行数が直積より大きい。軸/版の再確認が必要。");
    }
    if (++completed % 25 === 0) console.log(`Metadata: ${completed}/${references.size}`);
    return result;
  });

  const known = tables.filter((table) => table.counts !== null);
  const missing = tables.filter((table) => !table.hasMeta);
  const sliceCount = safeSum(known.map((table) => table.partition!.fileCount));
  const unpartitionable = known.filter((table) => !table.partition!.fitsRowLimit);
  const rowCountEstimate = safeSum(known.map((table) => table.counts!.rowCountEstimate));
  const rawBytesEstimate = Math.ceil(rowCountEstimate * sample.rawBytesPerRow);
  const gzipBytesEstimate = Math.ceil(rowCountEstimate * sample.gzipBytesPerRow);
  const primaryTables = tables.filter((table) => table.references.some((ref) => ref.path === "source" || ref.path === "source.filter"));
  const operationalTables = tables.filter((table) => table.references.some((ref) =>
    ref.path === "source" || ref.path === "source.filter" || ref.path === "citySource" || ref.path.startsWith("supplementalSources.") || ref.path === "sampleCount" || ref.path.startsWith("sampleCount.")));
  const primaryTableCount = primaryTables.length;
  const operationalTableCount = operationalTables.length;
  const scopeTotals = ([ ["主出典", primaryTables], ["補完・市表等込み", operationalTables], ["ID明記の外部取り込み込み", tables] ] as const).map(([scope, subset]) => {
    const rows = safeSum(subset.map((table) => table.counts?.rowCountEstimate ?? 0));
    return { scope, tables: subset.length, withMeta: subset.filter((table) => table.hasMeta).length,
      missingMeta: subset.filter((table) => !table.hasMeta).length,
      fileCount: safeSum(subset.map((table) => table.partition?.fileCount ?? 0)), rowCountEstimate: rows,
      rawBytesEstimate: Math.ceil(rows * sample.rawBytesPerRow), gzipBytesEstimate: Math.ceil(rows * sample.gzipBytesPerRow) };
  });
  const summary = {
    registryMetricCount: metrics.length, activeMetricCount: metrics.filter((metric) => metric.isActive !== false).length,
    referencedActiveMetricCount: new Set(tables.flatMap((table) => table.metricKeys)).size,
    primaryTableCount, operationalTableCount, referencedTableCount: tables.length, scopeTotals,
    withMetaCount: known.length, missingMetaCount: missing.length,
    fileCount: sliceCount, rowLimit: DEFAULT_TABLE_FILE_ROW_LIMIT, unpartitionableTables: unpartitionable.map((table) => table.statsDataId),
    feasibleFileCount: safeSum(known.filter((table) => table.partition!.fitsRowLimit).map((table) => table.partition!.fileCount)),
    unpartitionableFileCount: safeSum(unpartitionable.map((table) => table.partition!.fileCount)),
    rowCountEstimate, rawBytesEstimate, gzipBytesEstimate,
    catalogReportedRows: safeSum(known.map((table) => table.catalogReportedRows ?? 0)),
    tablesWithReportedRows: known.filter((table) => table.catalogReportedRows !== null).length,
    wholeTableRequestsEstimate: safeSum(known.map((table) => table.counts!.wholeTableRequestsEstimate)),
    fetchStrategies: { whole: known.filter((table) => table.fetchStrategy === "丸ごと").length,
      split: known.filter((table) => table.fetchStrategy === "軸で分ける").length, unknown: missing.length + unpartitionable.length },
    exceeds100000Slices: sliceCount > 100_000, exceeds2GBGzip: gzipBytesEstimate > 2 * GB,
    coverage: "メタがある表だけの小計。欠落表は未算定。ファイル数は軸の最小深さから算出、行数・容量は直積の見積もり。上限不達表も最大深さのファイル候補数を含む。",
  };
  const costs = {
    source: PRICING_URL, pricingCheckedOn: "2026-11-14", currency: "USD", storageClass: "Standard",
    bytesPerGB: GB, storagePerGBMonth: 0.015, classAPerMillion: 4.5, classBPerMillion: 0.36,
    freeTier: { storageGBMonth: 10, classA: 1_000_000, classB: 10_000_000 },
    storageUnroundedGrossMonthly: gzipBytesEstimate / GB * 0.015,
    storageRoundedGrossMonthly: Math.ceil(gzipBytesEstimate / GB) * 0.015,
    storageRoundedWithEntireFreeTierMonthly: Math.max(0, Math.ceil(gzipBytesEstimate / GB) - 10) * 0.015,
    fullRewriteUnroundedGross: sliceCount / 1_000_000 * 4.5,
    fullRewriteRoundedGross: Math.ceil(sliceCount / 1_000_000) * 4.5,
    fullRewriteRoundedWithEntireFreeTier: Math.max(0, Math.ceil(sliceCount / 1_000_000) - 1) * 4.5,
    oneReadPerSliceUnroundedGross: sliceCount / 1_000_000 * 0.36,
    note: "GB=10^9 bytesの予算仮定、全量を1か月保持。請求はGB-month/100万要求単位に切上げ。無料枠はアカウント共用のため空き不明。書込は1切片1 PUT、月次全再作成なら月額に加算（実行なし）。GET回数・CDNヒット率・Worker費用は未算定。",
  };
  const generatedAt = new Date().toISOString();
  const top = [...known].sort((a, b) => b.counts!.rowCountEstimate - a.counts!.rowCountEstimate).slice(0, 10);
  const assumptions = [
    "有効=isActive !== false（page-data-batchと同じ）。主出典、citySource、supplementalSources、sampleCount、外部取り込みの設定/出典に明記されたstatsDataIdを再帰抽出して重複除去。IDのない計算/外部定義は除外。自動導出される市表IDは追加しない。",
    "cdTab/cdCat・tabCombination・axisSum・axisRatioは参照証跡として保持するが、表全体の切片数を指標の抽出条件では絞らない。",
    "CLASS_OBJ順の全コード（総数・階層親・全国・市区町村も含む）。時間は年に丸めずtimeコード数。重複コードは一度だけ数える。",
    `ファイル分割=地域/timeを除いたCLASS_OBJ順の軸の先頭d本。d=0から増やして1ファイルの直積行数が${DEFAULT_TABLE_FILE_ROW_LIMIT}以下になる最小深さを選ぶ。残りの軸はVALUE行内に保持。`,
    "summarizeMeta.has47PrefのprefDimを利用し、連番/名称コードはmetric.areaAxisで補完。地域×時間が上限を超える表は最大深さでも不達として取得前に停止。勝手に地域/時間を分けない。",
    "直積は構造的に存在しない組合せや欠測を含む。ファイル候補数と行数見積もりであり、非空の切片数や実測VALUE行数ではない。OVERALL_TOTAL_NUMBERは目録記載値で、今回の値取得実測ではない。",
    "容量=行数見積もり×公開R2例の封筒全体bytes/VALUE行数。gzipは同じ実例をlevel 6で圧縮。1表1例の外挿で、他表の値の長さ・密度・小切片のgzip効率・切片ごとのメタ複製は未実測。厳密な容量上限ではない。",
    "保存時の丸ごと=d=0、軸で分ける=d>0。上限不達は未判定。APIページ送りは別で100,000行/要求を上限にNEXT_KEYで全件を読む。",
    "キーのコードは生のまま（先頭ゼロや#を保持）。HTTPアクセス時は各path segmentをURLエンコードする。d=0はdata/all.json.gz。",
    "欠落メタの数値はnullで小計から除外。404以外のHTTPエラー・不正メタ・版や地域軸の矛盾は隠さない。版は一覧updatedDateとメタUPDATED_DATEを別々に保持。",
  ];
  const inventory = { schemaVersion: 1, generatedAt, catalogGeneratedAt: manifest.generatedAt ?? null,
    inputOrigin: PUBLIC_ORIGIN, summary, calibration: sample, costs, assumptions, tables };
  const missingReport = { generatedAt, count: missing.length,
    candidateMetaStatCodes: [...new Set(missing.flatMap((table) => table.statCode ? [table.statCode] : []))].sort(),
    tables: missing.map((table) => ({ statsDataId: table.statsDataId, title: table.title, statCode: table.statCode,
      statName: table.statName, updatedDate: table.updatedDate, metricKeys: table.metricKeys,
      reason: "public-meta-http-404", indexPresent: table.indexPresent })) };
  const draft = { schemaVersion: 1, status: "draft-not-for-publish", generatedAt,
    catalogGeneratedAt: manifest.generatedAt ?? null, estimateOnly: true,
    tables: tables.map((table) => ({ statsDataId: table.statsDataId, title: table.title, statCode: table.statCode,
      updatedDate: table.updatedDate, metaUpdatedDate: table.metaUpdatedDate, metaFetchedAt: table.metaFetchedAt,
      hasMeta: table.hasMeta, partition: table.partition, fileCount: table.partition?.fileCount ?? null, fetchStrategy: table.fetchStrategy,
      partitionAxes: table.partition?.partitionAxes ?? null, regionAxes: table.counts?.regionAxes ?? null,
      sliceKeyExample: table.sliceKeyExample, warnings: table.warnings })) };
  const f = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  const md = (s: string | null) => (s ?? "不明").replace(/\|/g, "\\|").replace(/[\r\n]/g, " ");
  const report = [
    "# e-Stat 値の切片化: 段1の見積もり", "", `作成: ${generatedAt} / カタログ: ${String(manifest.generatedAt)}`, "",
    "## 合計（欠落表を除く見積もり）", "", "| 項目 | 内容 |", "| --- | --- |",
    `| 対象 | 主出典 ${primaryTableCount}表 / 補完・市表等込み ${operationalTableCount}表 / ID明記の外部取り込み込み ${tables.length}表 |`,
    `| メタ有 / 無 | ${known.length} / ${missing.length}（HTTP 404） |`,
    `| ファイル候補数 | ${f(sliceCount)}（上限不達${unpartitionable.length}表を含む） |`, `| 直積の行数見積もり | ${f(rowCountEstimate)} |`,
    `| 行数上限を満たすファイル数 | ${f(summary.feasibleFileCount)}（${known.length - unpartitionable.length}表）。不達${unpartitionable.length}表の${f(summary.unpartitionableFileCount)}ファイル候補は取得停止 |`,
    `| カタログ記載の行数（比較用） | ${f(summary.catalogReportedRows)} / ${summary.tablesWithReportedRows}表 |`,
    `| 生バイト見積もり | ${f(rawBytesEstimate)} bytes (${f(rawBytesEstimate / GB)} GB) |`,
    `| gzipバイト見積もり | ${f(gzipBytesEstimate)} bytes (${f(gzipBytesEstimate / GB)} GB) |`,
    `| 丸ごと / 軸で分ける / 未判定 | ${summary.fetchStrategies.whole} / ${summary.fetchStrategies.split} / ${summary.fetchStrategies.unknown}（欠落${missing.length}・上限不達${unpartitionable.length}） |`,
    `| 丸ごとページ取得した場合の要求数 | ${f(summary.wholeTableRequestsEstimate)}（全表合計、100,000行/要求） |`,
    `| 想定超過 | gzip 2 GB: ${summary.exceeds2GBGzip ? "超える" : "小計では超えない（欠落表未算定）"} / 100,000切片: ${summary.exceeds100000Slices ? "超える" : "小計では超えない（欠落表未算定）"} |`,
    "", "## 対象範囲別の内訳（各範囲でメタがある表だけの小計）", "",
    "| 範囲 | 対象表 | メタ有 | メタ無 | ファイル候補数 | 行数見積もり | gzip見積もりbytes |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...scopeTotals.map((scope) => `| ${scope.scope} | ${scope.tables} | ${scope.withMeta} | ${scope.missingMeta} | ${f(scope.fileCount)} | ${f(scope.rowCountEstimate)} | ${f(scope.gzipBytesEstimate)} |`),
    "", "## 公開R2実例による実測", "", `- URL: ${sample.url}`,
    `- キャッシュ作成: ${String(sample.cachedAt)} / sha256: ${sample.sha256}`,
    `- 生 ${f(sample.rawBytes)} bytes / VALUE ${f(sample.rowCount)}行 = ${f(sample.rawBytesPerRow)} bytes/行。`,
    `- 実gzip(level 6) ${f(sample.gzipBytes)} bytes、比率 ${f(sample.gzipRatio)}、${f(sample.gzipBytesPerRow)} bytes/行。`,
    `- 参考: VALUE配列だけなら生 ${f(sample.valuesOnlyRawBytes)} / gzip ${f(sample.valuesOnlyGzipBytes)} bytes。上の主見積もりは封筒全体で算定。`,
    "", "## R2 Standardの月額見積もり", "", `料金出典: ${PRICING_URL}（確認 2026-11-14）。`,
    "保存 $0.015/GB-month、Class A $4.50/100万回、Class B $0.36/100万回、インターネット転送無料。",
    `- 保存のみ: 無料枠適用前の比例額 $${f(costs.storageUnroundedGrossMonthly)}/月、GB単位切上げ $${f(costs.storageRoundedGrossMonthly)}/月。`,
    `- 10 GBの無料枠を全て使える仮定: 保存 $${f(costs.storageRoundedWithEntireFreeTierMonthly)}/月。`,
    `- 月1回の全切片再作成: ${f(sliceCount)} PUT、比例額 $${f(costs.fullRewriteUnroundedGross)}、100万回単位切上げ $${f(costs.fullRewriteRoundedGross)}（無料100万回を全て使える仮定なら $${f(costs.fullRewriteRoundedWithEntireFreeTier)}）を加算。`,
    `- 1切片を月1回GETする例: 比例額 $${f(costs.oneReadPerSliceUnroundedGross)}（実際の読取回数は未定）。`, costs.note,
    "", "## 大きい表の上位10（直積行数順、見積もり）", "", "| 表ID | 表名 | 深さd | ファイル数 | 最大行数/ファイル | 行数見積もり |", "| --- | --- | ---: | ---: | ---: | ---: |",
    ...top.map((table) => `| ${table.statsDataId} | ${md(table.title)} | ${table.partition!.depth} | ${f(table.partition!.fileCount)} | ${f(table.partition!.maxRowsPerFileEstimate)} | ${f(table.counts!.rowCountEstimate)} |`),
    "", "## 分類・計算の前提", "", ...assumptions.map((s) => `- ${s}`),
    "", "## 判断が要る点", "",
    `- 主出典${primaryTableCount}表に限定するか、補完とID明記の外部取り込みも保有するか。上の合計は後者。各表のreferences.pathで内訳を追える。`,
    "- 地域×時間だけで上限を超える表について、上限を変えるか地域/時間の追加分割を認めるか。実装は上限不達として停止する。",
    "- 実装はメタ情報を含む封筒v2を各ファイルへ保存する。合計容量は従来の1例の行あたりバイト数による外挿で、再分割によるgzip効率・メタ複製の差は未算定。更新時の再取得単位も後続で決める。",
    "- 欠落メタの統計をmeta_stat_codesへ加える範囲。missing-meta.jsonの候補コードを参照。",
    "", "## 個別の注意", "",
    ...tables.filter((table) => table.warnings.length).map((table) => `- ${table.statsDataId}: ${table.warnings.join(" / ")}`),
    "", "## 起票候補（この段では起票しない）", "",
    `- 欠落メタ${missing.length}表の補完。根拠: missing-meta.json。既存ファイルの編集は依頼範囲外のため起票しない。`,
    ...tables.filter((table) => table.warnings.some((warning) => warning.startsWith("一覧から削除済み"))).map((table) =>
      `- 有効な指標が参照中の${table.statsDataId}は一覧から削除済み。後継表の確認候補。根拠: inventory.jsonのwarnings。既存ファイルの編集は依頼範囲外のため起票しない。`),
    "", "## 再現", "", "```sh",
    `node --import tsx packages/data-configs/scripts/estat-table-inventory.ts --out ${JSON.stringify(outDir)}`,
    "node --import tsx --test packages/data-configs/scripts/__tests__/estat-table-inventory.test.ts", "```", "",
    "型検査: `npx tsc --noEmit --project packages/data-configs/tsconfig.json --incremental false`（スクリプトとテストを含むworkspace）。", "",
  ].join("\n");
  await mkdir(outDir, { recursive: true });
  for (const [name, value] of [["inventory.json", inventory], ["missing-meta.json", missingReport], ["table-snapshots.draft.json", draft]] as const) {
    await writeFile(resolve(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
  }
  await writeFile(resolve(outDir, "estimate.md"), report);
  console.log(JSON.stringify({ summary, costs, outDir }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out" || !args[1]) {
    console.error("Usage: node --import tsx packages/data-configs/scripts/estat-table-inventory.ts --out <scratchpad>");
    process.exitCode = 1;
  } else {
    main(resolve(args[1])).catch((error: unknown) => { console.error(error); process.exitCode = 1; });
  }
}
