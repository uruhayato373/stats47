/**
 * page-data-batch — TS-config 駆動の e-Stat → R2 直行バッチ
 *
 * data-configs registry を walk して各 MetricConfig の source から data を fetch し、
 * R2 namespace (app/stats/<metric>/values.json 等) へ書き込む。
 *
 * Phase 6.4 の核心バッチ。Phase 6.3 で D1 → R2 一括移行が済んでいる前提で、
 * 本バッチは「以後の data 更新」(新規 metric / 年度更新) を D1 をスキップして実行する。
 *
 * 使い方:
 *   tsx packages/data-configs/scripts/page-data-batch.ts                    # 全 metric
 *   tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>     # 単一
 *   tsx packages/data-configs/scripts/page-data-batch.ts --kind city        # entity 限定
 *   tsx packages/data-configs/scripts/page-data-batch.ts --since 2024-01    # 更新が古いものだけ
 *   tsx packages/data-configs/scripts/page-data-batch.ts --dry-run          # 計画のみ
 *
 * 制約:
 *   - 計算系 metric (source.kind === "calculated") は本バッチでは対応しない (別 skill)
 *   - mlit / external source も別 fetcher 必要
 *   - 現状サポート: estat / kakei-chousa
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listAllMetrics } from "../src/registry.js";
import type { MetricConfig, SourceConfig } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const R2_LOCAL = resolve(REPO_ROOT, ".local/r2");

interface Args {
  metric?: string;
  kind?: string;
  since?: string;
  dryRun: boolean;
  concurrency: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { dryRun: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metric") out.metric = argv[++i];
    else if (a === "--kind") out.kind = argv[++i];
    else if (a === "--since") out.since = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
  }
  return out;
}

function readAppId(): string {
  const envPath = resolve(REPO_ROOT, ".env.local");
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
  const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  if (!id) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID not set in .env.local");
  return id;
}

/** R2 file 最終更新時刻を取得 (since フィルタ用) */
function getR2FileMtime(key: string): number | null {
  const filePath = resolve(R2_LOCAL, key);
  if (!existsSync(filePath)) return null;
  return statSync(filePath).mtimeMs;
}

interface EstatValue {
  "@cat01"?: string;
  "@cat02"?: string;
  "@area": string;
  "@time": string;
  $: string;
}

/** e-Stat API から data を fetch */
async function fetchEstatData(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
): Promise<EstatValue[]> {
  const params = new URLSearchParams({
    appId,
    statsDataId: config.statsDataId,
    limit: "100000",
  });
  if (config.cdCat01) params.set("cdCat01", config.cdCat01);
  if (config.cdCat02) params.set("cdCat02", config.cdCat02);
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const stat = (json.GET_STATS_DATA as Record<string, unknown> | undefined)
    ?.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!stat) {
    throw new Error(`e-Stat response invalid for ${config.statsDataId}`);
  }
  return ((stat.DATA_INF as Record<string, unknown>).VALUE as EstatValue[]) ?? [];
}

/** 5 桁エリアコード判定 */
function isPrefCode5(code: string): boolean {
  if (!/^\d{2}000$/.test(code)) return false;
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

/** 取得 raw values → StatsValues 構造 (prefecture のみ実装) */
function shapeForPrefecture(metricKey: string, values: EstatValue[]) {
  const rows = values
    .filter((v) => isPrefCode5(v["@area"]))
    .map((v) => ({
      areaCode: v["@area"],
      areaName: "",
      yearCode: v["@time"].slice(0, 4),
      yearName: v["@time"].slice(0, 4) + "年",
      value: v.$ === "***" || v.$ === "-" ? null : Number(v.$),
      unit: "",
      rank: null as number | null,
    }))
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );

  const years = Array.from(new Set(rows.map((r) => r.yearCode))).sort();
  const areas = new Set(rows.map((r) => r.areaCode));

  return {
    metricKey,
    entityKind: "prefecture" as const,
    rows,
    meta: {
      rowCount: rows.length,
      yearRange: years.length > 0 ? [years[0], years[years.length - 1]] : null,
      areaCount: areas.size,
      generatedAt: new Date().toISOString(),
    },
  };
}

interface ProcessResult {
  key: string;
  ok: boolean;
  message: string;
  rows?: number;
}

async function processOne(
  config: MetricConfig,
  appId: string,
  dryRun: boolean,
): Promise<ProcessResult> {
  if (!config.entities.includes("prefecture")) {
    return { key: config.key, ok: false, message: "non-prefecture skipped (Phase 6.4 future scope)" };
  }
  if (config.source.kind === "calculated") {
    return { key: config.key, ok: false, message: "calculated metric skipped (deps required)" };
  }
  if (config.source.kind === "external" || config.source.kind === "mlit") {
    return { key: config.key, ok: false, message: `${config.source.kind} source skipped (fetcher not implemented yet)` };
  }
  if (config.source.kind === "kakei-chousa") {
    return { key: config.key, ok: false, message: "kakei-chousa skipped (fetcher not yet implemented)" };
  }

  try {
    const values = await fetchEstatData(appId, config.source);
    const payload = shapeForPrefecture(config.key, values);
    if (dryRun) {
      return { key: config.key, ok: true, message: "would write", rows: payload.rows.length };
    }
    const outPath = resolve(R2_LOCAL, `app/stats/${config.key}/values.json`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(payload));
    return { key: config.key, ok: true, message: "wrote", rows: payload.rows.length };
  } catch (e) {
    return { key: config.key, ok: false, message: (e as Error).message };
  }
}

async function main() {
  const args = parseArgs();
  const appId = readAppId();
  const all = listAllMetrics();
  console.log(`[batch] registry size: ${all.length}`);

  let targets = all;
  if (args.metric) targets = targets.filter((c) => c.key === args.metric);
  if (args.kind) targets = targets.filter((c) => c.entities.includes(args.kind as MetricConfig["entities"][number]));
  if (args.since) {
    const sinceMs = new Date(args.since).getTime();
    targets = targets.filter((c) => {
      const mtime = getR2FileMtime(`app/stats/${c.key}/values.json`);
      return mtime == null || mtime < sinceMs;
    });
  }

  console.log(`[batch] targets after filter: ${targets.length}`);
  if (args.dryRun) {
    const sample = targets.slice(0, 10).map((c) => c.key).join(", ");
    console.log(`[dry-run] first 10: ${sample}`);
    return;
  }

  let ok = 0;
  let fail = 0;
  let skip = 0;

  // concurrency-limited execution
  const queue = [...targets];
  const workers = Array.from({ length: args.concurrency }, async () => {
    while (queue.length > 0) {
      const c = queue.shift();
      if (!c) break;
      const result = await processOne(c, appId, false);
      if (result.ok) {
        ok++;
        if (ok % 20 === 0) console.log(`  ok=${ok} fail=${fail} skip=${skip} remaining=${queue.length}`);
      } else if (result.message.includes("skipped")) {
        skip++;
      } else {
        fail++;
        console.error(`  [fail] ${result.key}: ${result.message}`);
      }
    }
  });
  await Promise.all(workers);

  console.log(`\n[done] ok=${ok}, fail=${fail}, skip=${skip}`);
  console.log(
    `Next: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
