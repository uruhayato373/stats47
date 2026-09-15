/**
 * audit-estat-year-coverage — 単年設定 (`years.from === years.to` 等) の metric config が、
 * e-Stat に本当はもっと多くの年の実データを持っていないかを機械的に検査する。
 *
 * ## 何を埋める検査か
 *
 * 2026-09-15、ThemeCatalog の line-chart (推移を見せるためのチャート) が単年指標を参照して
 * 折れ線を描けない事故が 13 件見つかり、全件を e-Stat 実測したところ**全件**に本来もっと
 * 多くの年の実データが存在した (config の `years` を最新 1 年だけに絞ったまま登録していた)。
 * active metric 2,445 件中 755 件 (31%) が同じ単年設定であり、個別に確認しない限り
 * 同じ見落としが埋もれている。詳細: `.claude/rules/metric-config-standards.md`
 * 「`years` は最新年だけに絞らない」。
 *
 * `audit-reingest-queue.ts` (config を後から直したのに配信が古いままの metric) とは別の懸念で、
 * 本スクリプトは「config 自体が e-Stat の実際のカバレッジより狭い」ことを検出する。
 *
 * ## 使い方
 *
 *   npx tsx packages/ranking/src/scripts/audit-estat-year-coverage.ts [--batch-size 100] [--json]
 *
 * 755 件を一度に本番 e-Stat へ照会すると負荷が大きいため、**1 回の実行では
 * 未確認 (または最終確認が最も古い) 候補から `--batch-size` 件だけ**を確認し、
 * 前回までの結果と統合して state に保存する (週次 cron で少しずつ全件を巡回する設計)。
 *
 * 出力: .claude/state/data/estat-year-coverage/{queue.json,LATEST.md}
 *
 * 正典: .claude/rules/metric-config-standards.md「`years` は最新年だけに絞らない」
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import type { MetricConfig } from "@stats47/data-configs";

import { resolveEstatParams } from "../utils/source-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/data/estat-year-coverage");
const QUEUE_PATH = path.join(STATE_DIR, "queue.json");
const LATEST_PATH = path.join(STATE_DIR, "LATEST.md");

const args = process.argv.slice(2);
const AS_JSON = args.includes("--json");
const batchSizeArg = args.indexOf("--batch-size");
const BATCH_SIZE =
  batchSizeArg >= 0 && args[batchSizeArg + 1] ? Number(args[batchSizeArg + 1]) : 100;
const SAMPLE_PREFECTURE = "01000"; // 北海道1件で「複数年に実データがあるか」を代表判定する

// ---- プロキシ対応 fetch (会社ネットワーク越しの実行を許容する) ----
// 手本: packages/ranking/src/scripts/audit-ranking-data-integrity.ts の getProxyDispatcher。
let cachedDispatcher: unknown | null | undefined;
async function getProxyDispatcher(): Promise<unknown | null> {
  if (cachedDispatcher !== undefined) return cachedDispatcher;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) {
    cachedDispatcher = null;
    return null;
  }
  try {
    const { ProxyAgent } = await import("undici");
    cachedDispatcher = new ProxyAgent(proxyUrl);
    return cachedDispatcher;
  } catch {
    cachedDispatcher = null;
    return null;
  }
}

/**
 * page-data-batch.ts の readAppId と同じ規約 (process.env 優先、無ければ root .env.local) に加え、
 * ローカル開発機のフォールバックとして apps/web/.env.development も見る
 * (`.claude/rules/local-environment.md`: 「e-Stat の app ID は apps/web/.env.development にある」
 * — 公開 ID・git tracked・秘密ではない)。
 */
function readAppId(): string | null {
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  for (const rel of [".env.local", "apps/web/.env.development"]) {
    const envPath = path.join(PROJECT_ROOT, rel);
    if (!fs.existsSync(envPath)) continue;
    const line = fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
    const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    if (id) return id;
  }
  return null;
}

/** 10桁の e-Stat time コードを4桁年へ (packages/estat-api の extractYearCode と同じ判定)。 */
function toYearCode(timeCode: string): string | null {
  if (typeof timeCode !== "string" || timeCode.length < 4) return null;
  const year = timeCode.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export type YearCoverageVerdict =
  | "extend-candidate"
  | "confirmed-single-year"
  | "fetch-failed"
  | "no-estat-source";

export interface YearCoverageResult {
  key: string;
  statsDataId: string | null;
  configYears: number | null;
  estatNonNullYears: number | null;
  availableYearCodes: string[];
  verdict: YearCoverageVerdict;
  checkedAt: string;
}

/** YearSpec から年数を数える (chart-temporal-fit 検査と同じ定義)。 */
export function yearSpecCount(years: MetricConfig["years"]): number | null {
  if (years === "all" || !years) return null;
  const y = years as { from?: number; to?: number; years?: number[] };
  if (Array.isArray(y.years)) return y.years.length;
  if (typeof y.from === "number" && typeof y.to === "number") return y.to - y.from + 1;
  return null;
}

/** 判定の純粋関数 (テスト対象)。ネットワーク結果を受け取って verdict を決めるだけ。 */
export function classifyYearCoverage(params: {
  key: string;
  statsDataId: string | null;
  configYears: number | null;
  nonNullYearCodes: string[] | null; // null = 取得失敗
}): Omit<YearCoverageResult, "checkedAt"> {
  const { key, statsDataId, configYears, nonNullYearCodes } = params;
  if (!statsDataId) {
    return {
      key,
      statsDataId,
      configYears,
      estatNonNullYears: null,
      availableYearCodes: [],
      verdict: "no-estat-source",
    };
  }
  if (nonNullYearCodes === null) {
    return {
      key,
      statsDataId,
      configYears,
      estatNonNullYears: null,
      availableYearCodes: [],
      verdict: "fetch-failed",
    };
  }
  const sorted = [...new Set(nonNullYearCodes)].sort();
  const verdict: YearCoverageVerdict =
    sorted.length > (configYears ?? 1) ? "extend-candidate" : "confirmed-single-year";
  return {
    key,
    statsDataId,
    configYears,
    estatNonNullYears: sorted.length,
    availableYearCodes: sorted,
    verdict,
  };
}

/** 単年設定の active e-Stat metric キー一覧 (検査候補の母集団)。 */
export function listSingleYearEstatCandidates(
  registry: Record<string, MetricConfig>
): string[] {
  const keys: string[] = [];
  for (const [key, config] of Object.entries(registry)) {
    if (!config.isActive) continue;
    if (config.source?.kind !== "estat") continue;
    if (yearSpecCount(config.years) === 1) keys.push(key);
  }
  return keys.sort();
}

async function fetchNonNullYearCodes(config: MetricConfig): Promise<string[] | null> {
  if (config.source?.kind !== "estat") return null;
  const estatParams = resolveEstatParams(config.source as unknown as Record<string, unknown>);
  if (!estatParams) return null;
  const appId = readAppId();
  if (!appId) return null;

  const dispatcher = await getProxyDispatcher();
  const params = new URLSearchParams({
    appId,
    lang: "J",
    cdArea: SAMPLE_PREFECTURE,
    ...(estatParams as unknown as Record<string, string>),
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const opts: RequestInit & { dispatcher?: unknown } = { signal: controller.signal };
    if (dispatcher) opts.dispatcher = dispatcher;
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      GET_STATS_DATA?: {
        RESULT?: { STATUS?: number };
        STATISTICAL_DATA?: { DATA_INF?: { VALUE?: unknown } };
      };
    };
    if (json.GET_STATS_DATA?.RESULT?.STATUS !== 0) return null;
    const raw = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE ?? [];
    const values = Array.isArray(raw) ? raw : [raw];
    const codes: string[] = [];
    for (const v of values as Array<Record<string, unknown>>) {
      const value = v["$"];
      if (value == null || value === "" || value === "-") continue;
      const time = v["@time"];
      if (typeof time !== "string") continue;
      const yearCode = toYearCode(time);
      if (yearCode) codes.push(yearCode);
    }
    return codes;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface QueueState {
  generatedAt: string;
  results: Record<string, YearCoverageResult>;
}

function loadPreviousState(): QueueState {
  try {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8")) as QueueState;
  } catch {
    return { generatedAt: new Date(0).toISOString(), results: {} };
  }
}

async function main() {
  const candidates = listSingleYearEstatCandidates(
    METRICS_REGISTRY as Record<string, MetricConfig>
  );
  const previous = loadPreviousState();

  // 未確認 (state に無い) を最優先、次に checkedAt が古い順。レジストリの増減があっても
  // 決定的に「確認が最も古いものから」巡回する (index カーソルより churn に強い)。
  const sorted = [...candidates].sort((a, b) => {
    const ta = previous.results[a]?.checkedAt ?? "";
    const tb = previous.results[b]?.checkedAt ?? "";
    return ta.localeCompare(tb);
  });
  const batch = sorted.slice(0, Math.max(1, BATCH_SIZE));

  const updated: Record<string, YearCoverageResult> = { ...previous.results };
  // 既に候補でなくなった (config が拡張された/inactiveになった) key は queue から外す。
  for (const key of Object.keys(updated)) {
    if (!candidates.includes(key)) delete updated[key];
  }

  for (const key of batch) {
    const config = METRICS_REGISTRY[key] as MetricConfig | undefined;
    if (!config) continue;
    const statsDataId =
      config.source?.kind === "estat" ? (config.source as { statsDataId?: string }).statsDataId ?? null : null;
    const nonNullYearCodes = await fetchNonNullYearCodes(config);
    const classified = classifyYearCoverage({
      key,
      statsDataId,
      configYears: yearSpecCount(config.years),
      nonNullYearCodes,
    });
    updated[key] = { ...classified, checkedAt: new Date().toISOString() };
    // e-Stat への配慮 (連続リクエストの間隔を空ける)
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const generatedAt = new Date().toISOString();
  const state: QueueState = { generatedAt, results: updated };
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(state, null, 2)}\n`);

  const all = Object.values(updated);
  const extendCandidates = all.filter((r) => r.verdict === "extend-candidate");
  const confirmed = all.filter((r) => r.verdict === "confirmed-single-year");
  const failed = all.filter((r) => r.verdict === "fetch-failed");
  const unchecked = candidates.length - all.length;

  const md = [
    "# e-Stat 年カバレッジ監査 (LATEST)",
    "",
    `- 生成: ${generatedAt}`,
    `- 対象母集団: 単年設定の active e-Stat metric ${candidates.length} 件 (今回確認 ${batch.length} 件)`,
    "- 判定: 都道府県1件 (北海道) をサンプルに `getStatsData` を実測し、値が non-null な年の件数を",
    "  config の `years` と比較する。全 47 都道府県の精査ではなく代表 1 件によるスクリーニング",
    "",
    "## サマリ",
    "",
    `- **要拡張候補 (extend-candidate)**: ${extendCandidates.length} 件`,
    `- 単年で確定 (confirmed-single-year): ${confirmed.length} 件`,
    `- 取得失敗 (fetch-failed・次回再試行): ${failed.length} 件`,
    `- 未確認 (次回以降のバッチで確認): ${unchecked} 件`,
    "",
    "## 要拡張候補 (config の years を広げて再取り込みする)",
    "",
    ...extendCandidates
      .slice(0, 120)
      .map(
        (r) =>
          `- \`${r.key}\` — config ${r.configYears}年 → e-Stat実在 ${r.estatNonNullYears}年 ` +
          `(${r.availableYearCodes[0]}-${r.availableYearCodes[r.availableYearCodes.length - 1]})`
      ),
    extendCandidates.length > 120
      ? `- … 他 ${extendCandidates.length - 120} 件 (全件は queue.json)`
      : "",
    "",
    "## 直し方",
    "",
    "- `extend-candidate`: `packages/data-configs/src/metrics/<key>.ts` の `years` を",
    "  `availableYearCodes` の範囲へ拡張し (5年おき等は `{years:[...]}` 形式)、",
    "  `validate:years`/`validate:config` 後、`data/data-refresh-requests.json` を push して",
    "  `data-refresh.yml` に再取り込みさせる。正典: `.claude/rules/metric-config-standards.md`",
    "- `confirmed-single-year`: 対応不要。この指標は本当に単年しかない",
    "- `fetch-failed`: 次回のバッチで自動的に再試行される (checkedAt が更新されないため優先度が高い)",
    "",
  ].join("\n");
  fs.writeFileSync(LATEST_PATH, md);

  if (AS_JSON) {
    process.stdout.write(`${JSON.stringify({ summary: { extendCandidates: extendCandidates.length, confirmed: confirmed.length, failed: failed.length, unchecked }, checked: batch }, null, 2)}\n`);
  } else {
    process.stdout.write(
      `e-Stat年カバレッジ監査: 母集団 ${candidates.length} / 今回確認 ${batch.length} / ` +
        `extend-candidate ${extendCandidates.length} / confirmed ${confirmed.length} / failed ${failed.length}\n`
    );
    for (const key of batch) {
      const r = updated[key];
      process.stdout.write(`  [${r.verdict}] ${key} — config${r.configYears ?? "?"}年/e-Stat${r.estatNonNullYears ?? "?"}年\n`);
    }
    process.stdout.write(`→ ${path.relative(PROJECT_ROOT, LATEST_PATH)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    process.stderr.write(
      `::error::[audit-estat-year-coverage] ${err instanceof Error ? err.message : String(err)}\n`
    );
    process.exit(2);
  });
}
