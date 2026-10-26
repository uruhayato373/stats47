/**
 * パック単位の実データスナップショット (基準年固定・完全DBレス準拠)。
 *
 * pack.rankingKeys (= そのテーマの全指標) を R2 `app/ranking/<key>/values.json` から一括取得し、
 * 出典メタ (metric config) を添えて `src/data/pack-snapshots/<id>.json` に焼き込む。R2 に無い or
 * 47 県フルが取れないキーはスキップし件数を報告する (0 埋め・架空値は作らない)。
 *
 * これが各パックの「全部入りデータ集」の実データソース。build-databook はこの snapshot を
 * 全指標ソースに使う (無ければ従来 datasets 経路)。
 *
 * 生成 CLI:
 *   npx tsx src/data/pack-snapshot.ts --id P-02
 *   npx tsx src/data/pack-snapshot.ts --all
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PREFECTURE_CODES5 } from "./prefectures";
import type { Dataset, PrefectureDatum } from "./dataset";
import type { SourceRow } from "./sources";
import { fetchRankingValues, MissingFullYearError, type FetchedValues } from "./load-ranking-values";
import { productIndicatorLabel } from "./product-indicator-label";
import { buildSourceRow, unconfirmedLicense, type MetricRegistry } from "./metric-source";
import type { ExcludedIndicator } from "./databook";
import { METRICS_REGISTRY } from "@stats47/data-configs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const PACK_SNAPSHOT_DIR = resolve(HERE, "pack-snapshots");

/** snapshot に焼き込む 1 指標。値は 47 県 (PREFECTURE_CODES5 順)。 */
export interface SnapshotIndicator {
  readonly rankingKey: string;
  readonly indicator: string;
  readonly unit: string;
  readonly category: string;
  readonly year: string;
  readonly source: SourceRow;
  readonly values: readonly PrefectureDatum[];
}

export interface PackSnapshot {
  readonly packId: string;
  readonly title: string;
  readonly generatedAt: string;
  readonly indicatorCount: number;
  readonly indicators: readonly SnapshotIndicator[];
}

/** null 値に missing 理由を付与して 47 県 datum を作る (0 埋めしない)。 */
function toDatums(values: readonly { code5: string; value: number | null }[]): PrefectureDatum[] {
  const byCode = new Map(values.map((v) => [v.code5, v.value]));
  return PREFECTURE_CODES5.map((code5) => {
    const value = byCode.get(code5) ?? null;
    return value === null ? { code5, value: null, missing: "missing" as const } : { code5, value };
  });
}

/**
 * 指標を飛ばした理由の種類。
 * - data: 元データ側の事情 (registry 未登録・全県 null・47 県そろいの年が無い)。取り直しても変わらない
 * - fetch: 取得の失敗 (R2 の HTTP 失敗・接続失敗など)。取り直せば変わりうるので、黙って飛ばすと件数が揺れる
 */
export type SkipKind = "data" | "fetch";

type FetchValues = (rankingKey: string) => Promise<FetchedValues>;

interface FetchOutcome {
  readonly key: string;
  readonly ok: boolean;
  readonly indicator?: SnapshotIndicator;
  readonly reason?: string;
  readonly kind?: SkipKind;
}

/** 1 キーを取得し snapshot 指標へ変換する。失敗は ok:false + reason。 */
async function fetchOne(
  key: string,
  registry: Record<string, Record<string, unknown>>,
  retrievedAt: string,
  fetchValues: FetchValues,
): Promise<FetchOutcome> {
  const cfg = registry[key];
  if (!cfg) return { key, ok: false, reason: "registry 未登録", kind: "data" };
  try {
    const fetched = await fetchValues(key);
    const nonNull = fetched.values.filter((v) => v.value !== null).length;
    if (nonNull === 0) return { key, ok: false, reason: "全県 null", kind: "data" };
    const unit = fetched.unit || String(cfg.unit ?? "");
    const indicator: SnapshotIndicator = {
      rankingKey: key,
      indicator: productIndicatorLabel(key, cfg),
      unit,
      category: String(cfg.category ?? "?"),
      year: fetched.year,
      source: buildSourceRow(cfg, key, fetched.year, unit, retrievedAt, productIndicatorLabel(key, cfg), registry),
      values: toDatums(fetched.values),
    };
    return { key, ok: true, indicator };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return { key, ok: false, reason, kind: e instanceof MissingFullYearError ? "data" : "fetch" };
  }
}

/** 並列プールで keys を取得する (順序保持)。 */
async function fetchAll(
  keys: readonly string[],
  registry: Record<string, Record<string, unknown>>,
  retrievedAt: string,
  concurrency: number,
  fetchValues: FetchValues,
  onEach?: (done: number, total: number) => void,
): Promise<Map<string, FetchOutcome>> {
  const results = new Map<string, FetchOutcome>();
  let idx = 0;
  let done = 0;
  const total = keys.length;
  async function worker(): Promise<void> {
    for (;;) {
      const i = idx++;
      if (i >= total) return;
      const key = keys[i];
      const out = await fetchOne(key, registry, retrievedAt, fetchValues);
      results.set(key, out);
      done += 1;
      onEach?.(done, total);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
  return results;
}

export interface PackSnapshotResult {
  readonly packId: string;
  readonly requested: number;
  readonly built: number;
  readonly skipped: readonly { key: string; reason: string; kind: SkipKind }[];
  readonly path: string;
}

/** 取得の失敗で指標を飛ばしかけたときに投げる。固定データは書かない (欠けたパックを手元に残さない)。 */
export class PackSnapshotFetchError extends Error {
  constructor(readonly failures: readonly { key: string; reason: string }[]) {
    super(
      `公開 R2 から ${failures.length} 指標を取得できなかった (固定データは書いていない): ` +
        failures.slice(0, 5).map((f) => `${f.key}(${f.reason})`).join(", ") +
        (failures.length > 5 ? " …" : ""),
    );
    this.name = "PackSnapshotFetchError";
  }
}

/**
 * 指定パック群のスナップショットを生成する。共有キーは 1 回だけ fetch し全パックで再利用する。
 * @param packs [{id,title,rankingKeys}]
 * @param registry METRICS_REGISTRY
 */
export async function buildPackSnapshots(
  packs: readonly { id: string; title: string; rankingKeys: readonly string[] }[],
  registry: Record<string, Record<string, unknown>>,
  opts: {
    generatedAt?: string;
    retrievedAt?: string;
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
    /** true なら取得の失敗が 1 件でもあれば何も書かずに PackSnapshotFetchError を投げる (テストの前処理用) */
    failOnFetchError?: boolean;
    /** 取得関数の差し替え (テスト用)。既定は公開 R2 の fetchRankingValues */
    fetchValues?: FetchValues;
    /** 書き出し先 (テスト用)。既定は PACK_SNAPSHOT_DIR */
    outDir?: string;
  } = {},
): Promise<PackSnapshotResult[]> {
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const retrievedAt = opts.retrievedAt ?? generatedAt.slice(0, 10);
  const concurrency = opts.concurrency ?? 16;
  const outDir = opts.outDir ?? PACK_SNAPSHOT_DIR;
  const fetchValues = opts.fetchValues ?? ((key: string) => fetchRankingValues(key));

  const uniqueKeys = [...new Set(packs.flatMap((p) => p.rankingKeys))];
  const outcomes = await fetchAll(uniqueKeys, registry, retrievedAt, concurrency, fetchValues, opts.onProgress);
  if (opts.failOnFetchError) {
    const failures = [...outcomes.values()]
      .filter((o) => !o.ok && o.kind === "fetch")
      .map((o) => ({ key: o.key, reason: o.reason ?? "未取得" }));
    if (failures.length > 0) throw new PackSnapshotFetchError(failures);
  }
  mkdirSync(outDir, { recursive: true });

  const results: PackSnapshotResult[] = [];
  for (const pack of packs) {
    const indicators: SnapshotIndicator[] = [];
    const skipped: { key: string; reason: string; kind: SkipKind }[] = [];
    for (const key of pack.rankingKeys) {
      const out = outcomes.get(key);
      if (out?.ok && out.indicator) indicators.push(out.indicator);
      else skipped.push({ key, reason: out?.reason ?? "未取得", kind: out?.kind ?? "fetch" });
    }
    const snapshot: PackSnapshot = {
      packId: pack.id,
      title: pack.title,
      generatedAt,
      indicatorCount: indicators.length,
      indicators,
    };
    const path = join(outDir, `${pack.id}.json`);
    writeFileSync(path, JSON.stringify(snapshot, null, 0) + "\n");
    results.push({ packId: pack.id, requested: pack.rankingKeys.length, built: indicators.length, skipped, path });
  }
  return results;
}

/** 値が完全に同じ (47 県すべて同値・欠損理由も同じ) 列を見分ける署名。 */
function valueSignature(values: readonly PrefectureDatum[]): string {
  return JSON.stringify(values.map((v) => [v.value, v.missing ?? null]));
}

/**
 * 47 県すべてで値が同じ列を 1 つにまとめる。先に現れた指標を残し、統合した指標キーを
 * `mergedRankingKeys` と SOURCES の注意事項に残す (同じ数値を別指標として数えない)。
 */
export function mergeIdenticalDatasets(datasets: readonly Dataset[]): Dataset[] {
  const kept: Dataset[] = [];
  const bySignature = new Map<string, number>();
  const merged = new Map<number, Dataset[]>();
  for (const ds of datasets) {
    const sig = valueSignature(ds.values);
    const at = bySignature.get(sig);
    if (at === undefined) {
      bySignature.set(sig, kept.length);
      kept.push(ds);
    } else {
      merged.set(at, [...(merged.get(at) ?? []), ds]);
    }
  }
  return kept.map((ds, i) => {
    const dups = merged.get(i);
    if (!dups) return ds;
    const labels = dups.map((d) => `${d.indicator}（${d.rankingKey ?? d.indicator}）`).join("・");
    return {
      ...ds,
      mergedRankingKeys: dups.map((d) => d.rankingKey ?? d.indicator),
      source: {
        ...ds.source,
        notes: `${ds.source.notes} 同じ値の指標（${labels}）は 47 都道府県すべてで値が同一のため、この列に統合しています。`,
      },
    };
  });
}

/**
 * snapshot JSON があれば読み込み、build 用の Dataset[] に変換する (無ければ null)。
 * 出典 (SOURCES 行) は焼き込み済みの値ではなく、指標定義 (metric config) の取得元から導き直す:
 * 補完出典で取った年の statsDataId・調査名、e-Stat 以外の提供元の注意事項を正しくするため。
 * 観測値・単位・年・表名は snapshot のまま使う (再取得しない)。
 */
export function loadPackSnapshotDatasets(
  packId: string,
  registry: MetricRegistry = METRICS_REGISTRY as unknown as MetricRegistry,
): { title: string; datasets: Dataset[]; excluded: ExcludedIndicator[] } | null {
  const path = join(PACK_SNAPSHOT_DIR, `${packId}.json`);
  if (!existsSync(path)) return null;
  const snap = JSON.parse(readFileSync(path, "utf8")) as PackSnapshot;
  if (!snap.indicators || snap.indicators.length === 0) return null;
  const excluded: ExcludedIndicator[] = [];
  const datasets: Dataset[] = [];
  for (const ind of snap.indicators) {
    const cfg = registry[ind.rankingKey];
    if (!cfg) throw new Error(`pack snapshot ${packId}: 指標定義が見つかりません: ${ind.rankingKey}`);
    // 権利状態が要確認 (再配布・商用利用の許諾が確認できない) の指標は有料パックに入れない
    const license = unconfirmedLicense(cfg, registry);
    if (license) {
      excluded.push({ rankingKey: ind.rankingKey, indicator: ind.indicator, reason: `権利状態が要確認のため除外: ${license}` });
      continue;
    }
    datasets.push({
      indicator: ind.indicator,
      unit: ind.unit,
      year: ind.year,
      category: ind.category,
      source: buildSourceRow(cfg, ind.rankingKey, ind.year, ind.unit, ind.source.retrievedAt, ind.source.tableName, registry),
      isSample: false,
      rankingKey: ind.rankingKey,
      values: ind.values,
    });
  }
  return { title: snap.title, datasets: mergeIdenticalDatasets(datasets), excluded };
}

// ---- CLI ----
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const all = argv.includes("--all");
  const idIdx = argv.indexOf("--id");
  const idArg = idIdx >= 0 ? argv[idIdx + 1] : undefined;
  const concIdx = argv.indexOf("--concurrency");
  const concurrency = concIdx >= 0 ? Number(argv[concIdx + 1]) : 16;

  (async (): Promise<number> => {
    const [{ PACKS }, dc] = await Promise.all([
      import("../catalog/products/packs"),
      import("@stats47/data-configs"),
    ]);
    const registry = dc.METRICS_REGISTRY as unknown as Record<string, Record<string, unknown>>;
    let targets = PACKS.filter((p) => p.rankingKeys.length > 0);
    if (!all) {
      if (!idArg) {
        console.error("usage: pack-snapshot.ts --id <P-XX> | --all [--concurrency N]");
        return 1;
      }
      targets = targets.filter((p) => p.id === idArg);
      if (targets.length === 0) {
        console.error(`❌ 対象パックなし (rankingKeys 空 or 未知): ${idArg}`);
        return 1;
      }
    }
    let lastLog = 0;
    const results = await buildPackSnapshots(
      targets.map((p) => ({ id: p.id, title: p.name, rankingKeys: p.rankingKeys })),
      registry,
      {
        concurrency,
        onProgress: (done, total) => {
          if (done - lastLog >= 100 || done === total) {
            lastLog = done;
            console.error(`  fetch ${done}/${total}`);
          }
        },
      },
    );
    for (const r of results) {
      console.log(`✅ ${r.packId}: built ${r.built}/${r.requested} 指標 (skip ${r.skipped.length}) → ${r.path}`);
      if (r.skipped.length > 0) {
        const sample = r.skipped.slice(0, 8).map((s) => `${s.key}(${s.reason})`).join(", ");
        console.log(`   skip 例: ${sample}${r.skipped.length > 8 ? " …" : ""}`);
      }
    }
    return 0;
  })().then((code) => process.exit(code));
}
