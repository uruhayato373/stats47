/**
 * 日本全国値 artifact (`app/japan/<metric>/series.json`) を生成する
 * (GEO-SCOPE-SEPARATION-01 WP3)。
 *
 * ★対象 metric 以外を書かない (doc 43 §7 WP3 step 3)。1 回の実行 = 1 metric。
 * ★sourceMode は呼び出し側が明示する (このスクリプトは official/derived を推測しない)。
 *   判定根拠は `.claude/state/geo-scope/wp0-inventory-*.json` を参照すること。
 * ★derived-additive/derived-ratio は今回未実装 (education-culture pilot は全て official)。
 *   実装するときは resolveJapanValue の該当分岐を年ごとに正しく呼ぶこと。
 * ★既定は local write のみ (`.local/r2/app/japan/...`)。remote R2 push は別スクリプト
 *   (diff-push-r2.ts) + 別承認。このスクリプトは push しない。
 *
 * ★e-Stat 取得は `@stats47/estat-api/server` を使わず自前 fetch にする。あのモジュールは
 *   `import "server-only"` を持ち Next.js の RSC 境界外 (素の tsx 実行) では即 throw する
 *   (`packages/data-configs/scripts/ingest-commute-flow.ts` と同じ回避)。パースは
 *   client-safe な `formatStatsData`/`convertToStatsSchema` (root export、server-only 無し) を
 *   再利用し、年コード正規化 (`extractYearCode`) を含む本番と同じ変換ロジックを保つ。
 *
 * 要 env: NEXT_PUBLIC_ESTAT_APP_ID (apps/web/.env.development に公開ID)。
 * 企業ネットワークでは HTTPS_PROXY/HTTP_PROXY が要る (undici ProxyAgent、自動検出)。
 *
 * Usage:
 *   NEXT_PUBLIC_ESTAT_APP_ID=<id> npx tsx packages/stats-r2/src/scripts/generate-japan-series.ts \
 *     --metric library-count-per-million --source-mode official [--dry-run]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

import { buildRecipe, getMetricConfig } from "@stats47/data-configs";
import { buildJapanSeriesRows } from "@stats47/data-configs/geo-scope";
import { convertToStatsSchema, formatStatsData } from "@stats47/estat-api";
import type { EstatStatsDataResponse } from "@stats47/estat-api";

import { R2_LOCAL_DIR, REPO_ROOT } from "./_lib";
import { japanR2Key } from "../types";
import type { JapanSeriesArtifact, JapanSourceMode } from "../types";

interface Args {
  metric?: string;
  sourceMode?: JapanSourceMode;
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metric") out.metric = argv[++i];
    else if (a === "--source-mode") out.sourceMode = argv[++i] as JapanSourceMode;
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function hash64(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function resolveAppId(): string {
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  try {
    const env = readFileSync(resolve(REPO_ROOT, "apps/web/.env.development"), "utf8");
    const m = env.match(/^NEXT_PUBLIC_ESTAT_APP_ID=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    // fall through
  }
  throw new Error("NEXT_PUBLIC_ESTAT_APP_ID が解決できません");
}

/** 自前 e-Stat fetch (server-only 回避)。企業プロキシは自動検出。 */
async function fetchEstatRaw(
  statsDataId: string,
  cdCat01: string | undefined,
): Promise<EstatStatsDataResponse> {
  const appId = resolveAppId();
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxyUrl
    ? new (await import("undici")).ProxyAgent(proxyUrl)
    : undefined;
  const query = new URLSearchParams({
    appId,
    statsDataId,
    limit: "1000",
    ...(cdCat01 ? { cdCat01 } : {}),
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${query}`;
  const fetchOptions: RequestInit & { dispatcher?: unknown } = {
    signal: AbortSignal.timeout(30_000),
  };
  if (dispatcher) fetchOptions.dispatcher = dispatcher;
  const res = await fetch(url, fetchOptions);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const body = (await res.json()) as EstatStatsDataResponse;
  const status = body?.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0) {
    throw new Error(`e-Stat error: ${body?.GET_STATS_DATA?.RESULT?.ERROR_MSG ?? status}`);
  }
  return body;
}

const NATIONAL_AREA_CODE = "00000";

export type GenerateOneResult =
  | { ok: true; metricKey: string; rows: number; rangeFrom: string; rangeTo: string; latestValue: number; latestUnit: string; outPath: string; artifact: JapanSeriesArtifact }
  | { ok: false; metricKey: string; reason: string };

/**
 * 1 metric の日本全国 artifact を fetch+build する (CLI と batch verifier の共有コア)。
 * write するかどうかは呼び出し側が `write` オプションで制御する
 * (batch verifier は「値レベル検証」のみに使い、artifact 生成は検証 OK のものだけ別途行う想定)。
 */
export async function generateOneMetric(
  metricKey: string,
  opts: { write: boolean },
): Promise<GenerateOneResult> {
  const config = getMetricConfig(metricKey);
  if (!config) return { ok: false, metricKey, reason: "metric config not found" };
  if (config.source.kind !== "estat") {
    return { ok: false, metricKey, reason: `unsupported source.kind: ${config.source.kind}` };
  }

  const statsDataId = config.source.statsDataId;
  const cdCat01 = config.source.cdCat01;

  const response = await fetchEstatRaw(statsDataId, cdCat01);
  const formatted = formatStatsData(response);
  const schema = formatted.values
    .map(convertToStatsSchema)
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  const nationalRaw = schema
    .filter((r) => r.areaCode === NATIONAL_AREA_CODE)
    .map((r) => ({ yearCode: r.yearCode, yearName: r.yearName, value: r.value, unit: r.unit }));

  const built = buildJapanSeriesRows(nationalRaw, config.unit);
  if (!built.ok) {
    return { ok: false, metricKey, reason: built.reason };
  }
  const { rows } = built;
  if (rows.length === 0) {
    return { ok: false, metricKey, reason: "no valid year rows (all placeholder/non-finite)" };
  }

  const recipe = buildRecipe(config);
  const artifact: JapanSeriesArtifact = {
    schemaVersion: 1,
    metricKey,
    geographyScope: "japan",
    sourceMode: "official",
    rows,
    meta: {
      generatedAt: new Date().toISOString(),
      configHash: recipe.configHash,
      recipeHash: hash64(JSON.stringify({ statsDataId, cdCat01: cdCat01 ?? null, areaCode: NATIONAL_AREA_CODE })),
      sourceId: config.source.statsDataId,
    },
  };

  const outPath = resolve(R2_LOCAL_DIR, japanR2Key(metricKey));
  if (opts.write) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(artifact, null, 2));
  }

  const last = rows[rows.length - 1];
  return {
    ok: true,
    metricKey,
    rows: rows.length,
    rangeFrom: rows[0].yearCode,
    rangeTo: last.yearCode,
    latestValue: last.value,
    latestUnit: last.unit,
    outPath,
    artifact,
  };
}

async function main() {
  const args = parseArgs();
  if (!args.metric) {
    console.error("使い方: --metric <key> --source-mode official [--dry-run]");
    process.exit(1);
  }
  if (args.sourceMode !== "official") {
    // derived-additive/derived-ratio は resolveJapanValue の別分岐を年ごとに正しく
    // 呼ぶ実装が要る (未実装)。誤って derived を official 扱いしないよう明示的に拒否する。
    console.error(
      `--source-mode '${args.sourceMode ?? "(未指定)"}' は未実装。現在 official のみ対応`,
    );
    process.exit(1);
  }

  console.log(`[fetch] metric=${args.metric}`);
  const result = await generateOneMetric(args.metric, { write: false });
  if (!result.ok) {
    console.error(`停止します (推測で埋めない): ${result.reason}`);
    process.exit(1);
  }

  console.log(
    `[result] metric=${result.metricKey} rows=${result.rows} ` +
      `range=${result.rangeFrom}..${result.rangeTo} latest=${result.latestValue}${result.latestUnit}`,
  );

  if (args.dryRun) {
    console.log(`[dry-run] would write: ${result.outPath}`);
    console.log(JSON.stringify(result.artifact, null, 2));
    return;
  }

  mkdirSync(dirname(result.outPath), { recursive: true });
  writeFileSync(result.outPath, JSON.stringify(result.artifact, null, 2));
  console.log(`[wrote] ${result.outPath} (local only. remote push は別スクリプト+別承認)`);
}

// ESM エントリポイント判定は argv[1] の絶対パス比較で行う (Windows では file:// URL の
// 文字列連結比較が一致しない。.claude/rules/local-environment.md 「file:// URL を文字列連結しない」)。
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
