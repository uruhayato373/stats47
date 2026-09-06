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
import { fetchRankingValues } from "./load-ranking-values";
import { productIndicatorLabel } from "./product-indicator-label";

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

const R2_TOP = "https://www.stat.go.jp/data/ssds/index.htm";

/** metric config (registry) から出典行を導く。基準年・単位は fetch 実測を優先する。 */
function toSourceRow(
  cfg: Record<string, unknown>,
  key: string,
  year: string,
  unit: string,
  retrievedAt: string,
): SourceRow {
  const src = (cfg.source ?? {}) as Record<string, unknown>;
  const filter = (src.filter ?? {}) as Record<string, unknown>;
  const statsDataId = String(src.statsDataId ?? filter.statsDataId ?? "-");
  const displayName = String(src.displayName ?? cfg.title ?? key);
  const url = typeof src.url === "string" && src.url ? src.url : R2_TOP;
  const note = typeof cfg.note === "string" ? cfg.note : "";
  return {
    surveyName: displayName,
    tableName: productIndicatorLabel(key, cfg),
    statsDataId,
    url,
    year,
    retrievedAt,
    unit,
    transform: `都道府県別・基準年（${year}）を stats47 が R2 (app/ranking/${key}/values.json) から抽出。`,
    notes: note
      ? `${note} 基準年固定（${year}）。e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。`
      : `基準年固定（${year}）。e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。`,
  };
}

/** null 値に missing 理由を付与して 47 県 datum を作る (0 埋めしない)。 */
function toDatums(values: readonly { code5: string; value: number | null }[]): PrefectureDatum[] {
  const byCode = new Map(values.map((v) => [v.code5, v.value]));
  return PREFECTURE_CODES5.map((code5) => {
    const value = byCode.get(code5) ?? null;
    return value === null ? { code5, value: null, missing: "missing" as const } : { code5, value };
  });
}

interface FetchOutcome {
  readonly key: string;
  readonly ok: boolean;
  readonly indicator?: SnapshotIndicator;
  readonly reason?: string;
}

/** 1 キーを取得し snapshot 指標へ変換する。失敗は ok:false + reason。 */
async function fetchOne(
  key: string,
  registry: Record<string, Record<string, unknown>>,
  retrievedAt: string,
): Promise<FetchOutcome> {
  const cfg = registry[key];
  if (!cfg) return { key, ok: false, reason: "registry 未登録" };
  try {
    const fetched = await fetchRankingValues(key);
    const nonNull = fetched.values.filter((v) => v.value !== null).length;
    if (nonNull === 0) return { key, ok: false, reason: "全県 null" };
    const unit = fetched.unit || String(cfg.unit ?? "");
    const indicator: SnapshotIndicator = {
      rankingKey: key,
      indicator: productIndicatorLabel(key, cfg),
      unit,
      category: String(cfg.category ?? "?"),
      year: fetched.year,
      source: toSourceRow(cfg, key, fetched.year, unit, retrievedAt),
      values: toDatums(fetched.values),
    };
    return { key, ok: true, indicator };
  } catch (e) {
    return { key, ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** 並列プールで keys を取得する (順序保持)。 */
async function fetchAll(
  keys: readonly string[],
  registry: Record<string, Record<string, unknown>>,
  retrievedAt: string,
  concurrency: number,
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
      const out = await fetchOne(key, registry, retrievedAt);
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
  readonly skipped: readonly { key: string; reason: string }[];
  readonly path: string;
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
  } = {},
): Promise<PackSnapshotResult[]> {
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const retrievedAt = opts.retrievedAt ?? generatedAt.slice(0, 10);
  const concurrency = opts.concurrency ?? 16;
  mkdirSync(PACK_SNAPSHOT_DIR, { recursive: true });

  const uniqueKeys = [...new Set(packs.flatMap((p) => p.rankingKeys))];
  const outcomes = await fetchAll(uniqueKeys, registry, retrievedAt, concurrency, opts.onProgress);

  const results: PackSnapshotResult[] = [];
  for (const pack of packs) {
    const indicators: SnapshotIndicator[] = [];
    const skipped: { key: string; reason: string }[] = [];
    for (const key of pack.rankingKeys) {
      const out = outcomes.get(key);
      if (out?.ok && out.indicator) indicators.push(out.indicator);
      else skipped.push({ key, reason: out?.reason ?? "未取得" });
    }
    const snapshot: PackSnapshot = {
      packId: pack.id,
      title: pack.title,
      generatedAt,
      indicatorCount: indicators.length,
      indicators,
    };
    const path = join(PACK_SNAPSHOT_DIR, `${pack.id}.json`);
    writeFileSync(path, JSON.stringify(snapshot, null, 0) + "\n");
    results.push({ packId: pack.id, requested: pack.rankingKeys.length, built: indicators.length, skipped, path });
  }
  return results;
}

/** snapshot JSON があれば読み込み、build 用の Dataset[] に変換する (無ければ null)。 */
export function loadPackSnapshotDatasets(packId: string): { title: string; datasets: Dataset[] } | null {
  const path = join(PACK_SNAPSHOT_DIR, `${packId}.json`);
  if (!existsSync(path)) return null;
  const snap = JSON.parse(readFileSync(path, "utf8")) as PackSnapshot;
  if (!snap.indicators || snap.indicators.length === 0) return null;
  const datasets: Dataset[] = snap.indicators.map((ind) => ({
    indicator: ind.indicator,
    unit: ind.unit,
    year: ind.year,
    category: ind.category,
    source: ind.source,
    isSample: false,
    values: ind.values,
  }));
  return { title: snap.title, datasets };
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
