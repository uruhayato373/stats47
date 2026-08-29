/**
 * 日本全国値 artifact (`app/japan/<metric>/series.json`) を生成する
 * (GEO-SCOPE-SEPARATION-01 WP3)。
 *
 * ★対象 metric 以外を書かない (doc 43 §7 WP3 step 3)。1 回の実行 = 1 metric。
 * ★sourceMode は呼び出し側が明示する (このスクリプトは official/derived を推測しない)。
 *   判定根拠は `.claude/state/geo-scope/wp0-inventory-*.json` を参照すること。
 * ★derived-additive は `JAPAN_DERIVED_METRIC_DECISIONS` で採用済みのmetricだけを扱う。
 *   derived-ratio は分子・分母の全国artifactが揃うまで拒否する。
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
 *   npx tsx packages/stats-r2/src/scripts/generate-japan-series.ts \
 *     --metric railway-station-count --source-mode derived-additive --dry-run
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

import { buildRecipe, getMetricConfig } from "@stats47/data-configs";
import {
  buildDerivedAdditiveJapanSeriesRows,
  buildJapanSeriesRows,
  getJapanDerivedMetricDecision,
} from "@stats47/data-configs/geo-scope";
import type { BuildJapanSeriesResult } from "@stats47/data-configs/geo-scope";
import { convertToStatsSchema, formatStatsData } from "@stats47/estat-api";
import type { EstatStatsDataResponse } from "@stats47/estat-api";

import { R2_LOCAL_DIR, REPO_ROOT } from "./_lib";
import { parseStatsValuesPayload } from "../schemas";
import { japanR2Key, statsR2Key } from "../types";
import type { JapanSeriesArtifact, JapanSourceMode, StatsValuesPayload } from "../types";

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
/**
 * e-Stat の分類軸パラメータ。**allowlist を自前で緩めない**。
 * 正典は `packages/ranking/src/utils/source-config.ts` の ESTAT_QUERY_KEYS と同じ集合。
 *
 * ★2026-08-20 の実測バグ: ここが cdCat01 だけを送っており、cdTab / cdCat02〜05 を
 *   落としていた。賃金構造基本統計 (0003445758) は同じ表に「年齢(歳)」「勤続年数」
 *   「給与(千円)」が並ぶため、全国行として**年齢の行**を拾い、42 metric が
 *   「単位不一致: config.unit='千円' / e-Stat unit='歳'」で誤って unsupported 判定
 *   されていた。cdTab を送れば正しく 318.0 千円 が返る (実測)。
 */
const ESTAT_AXIS_KEYS = [
  "cdCat01",
  "cdCat02",
  "cdCat03",
  "cdCat04",
  "cdCat05",
  "cdTab",
] as const;

export function axisParams(config: { source: Record<string, unknown> }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ESTAT_AXIS_KEYS) {
    const v = (config.source as Record<string, unknown>)[key];
    if (typeof v === "string" && v.length > 0) out[key] = v;
  }
  return out;
}

async function fetchEstatRaw(
  statsDataId: string,
  axes: Record<string, string>,
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
    ...axes,
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
const PUBLIC_R2 = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

export type GenerateOneResult =
  | { ok: true; metricKey: string; rows: number; rangeFrom: string; rangeTo: string; latestValue: number; latestUnit: string; outPath: string; artifact: JapanSeriesArtifact }
  | { ok: false; metricKey: string; reason: string };

async function fetchWithProxy(url: string): Promise<Response> {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxyUrl
    ? new (await import("undici")).ProxyAgent(proxyUrl)
    : undefined;
  const options: RequestInit & { dispatcher?: unknown } = {
    signal: AbortSignal.timeout(30_000),
  };
  if (dispatcher) options.dispatcher = dispatcher;
  return fetch(url, options);
}

async function readPrefectureStats(metricKey: string): Promise<StatsValuesPayload> {
  const key = statsR2Key(metricKey, "prefecture");
  const localPath = resolve(R2_LOCAL_DIR, key);
  let raw: unknown;
  if (existsSync(localPath)) {
    raw = JSON.parse(readFileSync(localPath, "utf8")) as unknown;
  } else {
    const response = await fetchWithProxy(`${PUBLIC_R2}/${key}`);
    if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
    raw = (await response.json()) as unknown;
  }

  const payload = parseStatsValuesPayload(raw);
  if (payload.metricKey !== metricKey || payload.entityKind !== "prefecture") {
    throw new Error(
      `${key}: payload identity mismatch (${payload.metricKey}/${payload.entityKind})`,
    );
  }
  return payload;
}

/**
 * 1 metric の日本全国 artifact を fetch+build する (CLI と batch verifier の共有コア)。
 * write するかどうかは呼び出し側が `write` オプションで制御する
 * (batch verifier は「値レベル検証」のみに使い、artifact 生成は検証 OK のものだけ別途行う想定)。
 */
export async function generateOneMetric(
  metricKey: string,
  opts: { write: boolean; sourceMode?: JapanSourceMode },
): Promise<GenerateOneResult> {
  const config = getMetricConfig(metricKey);
  if (!config) return { ok: false, metricKey, reason: "metric config not found" };
  const sourceMode = opts.sourceMode ?? "official";
  let built: BuildJapanSeriesResult;
  let recipeHashInput: object;
  let sourceId: string;

  if (sourceMode === "official") {
    if (config.source.kind !== "estat") {
      return { ok: false, metricKey, reason: `officialでは扱えないsource.kind: ${config.source.kind}` };
    }
    const statsDataId = config.source.statsDataId;
    const axes = axisParams(config as unknown as { source: Record<string, unknown> });
    const response = await fetchEstatRaw(statsDataId, axes);
    const formatted = formatStatsData(response);
    const schema = formatted.values
      .map(convertToStatsSchema)
      .filter((row): row is NonNullable<typeof row> => row !== undefined);
    const nationalRaw = schema
      .filter((row) => row.areaCode === NATIONAL_AREA_CODE)
      .map((row) => ({
        yearCode: row.yearCode,
        yearName: row.yearName,
        value: row.value,
        unit: row.unit,
      }));
    built = buildJapanSeriesRows(nationalRaw, config.unit);
    recipeHashInput = { statsDataId, axes, areaCode: NATIONAL_AREA_CODE };
    sourceId = statsDataId;
  } else if (sourceMode === "derived-additive") {
    const decision = getJapanDerivedMetricDecision(metricKey);
    if (
      !decision ||
      decision.verdict !== "adopted" ||
      decision.availability.status !== "derived-additive"
    ) {
      return {
        ok: false,
        metricKey,
        reason: "derived-additiveとして採用済みの判断がない",
      };
    }
    const source = await readPrefectureStats(decision.sourceMetricKey);
    built = buildDerivedAdditiveJapanSeriesRows(source.rows, config.unit);
    sourceId = statsR2Key(decision.sourceMetricKey, "prefecture");
    recipeHashInput = {
      recipeKey: decision.availability.recipeKey,
      sourceMetricKey: decision.sourceMetricKey,
      sourceConfigHash: source.meta.recipe?.configHash ?? null,
    };
  } else {
    return { ok: false, metricKey, reason: "derived-ratioは未採用・未実装" };
  }

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
    sourceMode,
    rows,
    meta: {
      generatedAt: new Date().toISOString(),
      configHash: recipe.configHash,
      recipeHash: hash64(JSON.stringify(recipeHashInput)),
      sourceId,
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
    console.error(
      "使い方: --metric <key> --source-mode <official|derived-additive> [--dry-run]",
    );
    process.exit(1);
  }
  if (args.sourceMode !== "official" && args.sourceMode !== "derived-additive") {
    console.error(
      `--source-mode '${args.sourceMode ?? "(未指定)"}' は未実装。official/derived-additiveのみ対応`,
    );
    process.exit(1);
  }

  console.log(`[fetch] metric=${args.metric}`);
  const result = await generateOneMetric(args.metric, {
    write: false,
    sourceMode: args.sourceMode,
  });
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
