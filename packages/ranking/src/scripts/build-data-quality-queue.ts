/**
 * build-data-quality-queue — 既存の週次監査の結果を全 active metric のデータ品質キューへまとめる。
 * DATA-QUALITY-LOOP-01 ①②。新しい監査ではなく、次の 2 つの監査の出力を読むだけの集約器。
 *
 *   - ranking-integrity-audit-weekly → `data/ranking/integrity-audit.json` の `deliveredYears`
 *     (配信 values.json の実在年。`years: "all"` の metric もここで最新年が分かる)
 *   - estat-year-coverage-audit-weekly → `data/estat/year-coverage/queue.json`
 *
 * 年表記は SSDS 原典 (cdcat01-sources.generated.json) と config の yearFormat で判定する。
 * 需要は search-growth の GSC 表示 (候補集合に含まれる URL だけ。無ければ null = 未観測)。
 *
 *   npx tsx packages/ranking/src/scripts/build-data-quality-queue.ts [--fetch-missing] [--today YYYY-MM-DD]
 *
 * `--fetch-missing`: deliveredYears に無い key を R2 公開 item.json (availableYears) から読む (read-only)。
 * 出力: data/data-quality/checks/{queue.json,LATEST.md}
 * 判定の SSOT: packages/ranking/src/scripts/lib/data-quality-queue.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import type { MetricConfig } from "@stats47/data-configs";

import { classifyQueueEntry, resolveSources, sortQueue, type CdcatEntry, type QueueEntry } from "./lib/data-quality-queue";
import { SITE } from "@stats47/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const INTEGRITY = path.join(ROOT, "data/ranking/integrity-audit.json");
const YEAR_COVERAGE = path.join(ROOT, "data/estat/year-coverage/queue.json");
const CDCAT01 = path.join(ROOT, "packages/data-configs/src/ssds/cdcat01-sources.generated.json");
const SEARCH_GROWTH = path.join(ROOT, "data/search-growth/candidates.json");
const OUT_DIR = path.join(ROOT, "data/data-quality/checks");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;

const args = process.argv.slice(2);
const FETCH_MISSING = args.includes("--fetch-missing");
const todayIdx = args.indexOf("--today");
const TODAY = todayIdx >= 0 ? new Date(args[todayIdx + 1]) : new Date();

function readJson<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

async function fetchItemYears(key: string): Promise<string[] | null> {
  try {
    const res = await fetch(`${R2_BASE}/app/ranking/${key}/item.json`);
    if (!res.ok) return null;
    const body = (await res.json()) as { item?: { availableYears?: Array<{ yearCode?: string }> } };
    return (body.item?.availableYears ?? []).map((y) => y.yearCode ?? "").filter((y) => /^\d{4}/.test(y));
  } catch {
    return null;
  }
}

async function main() {
  const integrity = readJson<{ generatedAt?: string; deliveredYears?: Record<string, string[]> }>(INTEGRITY);
  const deliveredYears: Record<string, string[]> = { ...(integrity?.deliveredYears ?? {}) };
  const coverage = readJson<{ results?: Record<string, { verdict?: string }> }>(YEAR_COVERAGE);
  const cdcat = readJson<Record<string, CdcatEntry>>(CDCAT01) ?? {};
  const growth = readJson<{
    generatedAt?: string;
    candidates?: Array<{ url: string; evidence?: Array<{ source: string; metric: string; value: number }> }>;
  }>(SEARCH_GROWTH);

  const demand: Record<string, number> = {};
  for (const c of growth?.candidates ?? []) {
    const m = /^\/ranking\/([^/?#]+)$/.exec(c.url);
    if (!m) continue;
    for (const e of c.evidence ?? []) {
      if (e.source === "gsc" && e.metric === "impressions" && typeof e.value === "number") {
        demand[m[1]] = Math.max(demand[m[1]] ?? 0, e.value);
      }
    }
  }

  const active = Object.entries(METRICS_REGISTRY as Record<string, MetricConfig>).filter(([, c]) => c.isActive);

  let fetched = 0;
  if (FETCH_MISSING) {
    const missing = active.map(([k]) => k).filter((k) => !deliveredYears[k]);
    for (let i = 0; i < missing.length; i += 16) {
      const chunk = missing.slice(i, i + 16);
      const res = await Promise.all(chunk.map((k) => fetchItemYears(k)));
      chunk.forEach((k, j) => {
        const y = res[j];
        if (y && y.length > 0) {
          deliveredYears[k] = y;
          fetched++;
        }
      });
    }
  }

  const currentYear = TODAY.getFullYear();
  const entries: QueueEntry[] = active.map(([key, config]) => {
    const src = config.source as { kind?: string; cdCat01?: string };
    const cd = src?.kind === "estat" ? src.cdCat01 : undefined;
    const sources = cd ? resolveSources(cdcat, cd) : null;
    const years = (deliveredYears[key] ?? []).map((y) => Number(y.slice(0, 4))).filter(Number.isFinite);
    return classifyQueueEntry({
      key,
      yearFormat: config.yearFormat,
      sources,
      surveyId: config.surveyId ?? null,
      years,
      currentYear,
      estatExtendCandidate: coverage?.results?.[key]?.verdict === "extend-candidate",
      demand: demand[key] ?? null,
    });
  });

  const sorted = sortQueue(entries);
  const count = (t: number) => sorted.filter((e) => e.treatment === t).length;
  const summary = {
    activeMetrics: sorted.length,
    withDeliveredYears: sorted.filter((e) => e.latestYear !== null).length,
    treatment1: count(1),
    treatment2: count(2),
    treatment3: count(3),
    treatment4: count(4),
    noAction: sorted.filter((e) => e.treatment === null).length,
    yearLabelError: sorted.filter((e) => e.yearLabel === "error").length,
    yearLabelOk: sorted.filter((e) => e.yearLabel === "ok").length,
    yearLabelUnknown: sorted.filter((e) => e.yearLabel === "unknown").length,
    freshnessUnknown: sorted.filter((e) => e.freshness === "unknown").length,
  };
  const generatedAt = new Date().toISOString();
  const queue = {
    generatedAt,
    today: TODAY.toISOString().slice(0, 10),
    inputs: {
      integrityAudit: integrity?.generatedAt ?? null,
      integrityHasDeliveredYears: Boolean(integrity?.deliveredYears),
      fetchedFromR2: fetched,
      estatYearCoverage: Boolean(coverage),
      demandSource: growth ? `search-growth/candidates.json (${growth.generatedAt}) GSC impressions` : null,
    },
    basis:
      "1=確認済み時点統計の yearFormat 誤り / 2・3=配信年から推定した周期遅れ (公式最新公表は未照会) / 4=観測1〜2年かつ需要未観測または≤10",
    summary,
    entries: sorted.filter((e) => e.treatment !== null),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "queue.json"), `${JSON.stringify(queue, null, 2)}\n`);

  const labels: Record<number, string> = { 1: "誤り", 2: "更新", 3: "調査終了候補", 4: "noindex候補" };
  const section = (t: number) => {
    const list = sorted.filter((e) => e.treatment === t);
    return [
      `## ${t}. ${labels[t]} (${list.length} 件・需要順 上位 15)`,
      "",
      ...list.slice(0, 15).map((e) => `- \`${e.key}\` — GSC表示 ${e.demand ?? "未観測"} / ${e.reason}`),
      "",
    ];
  };
  const md = [
    "# データ品質キュー (LATEST)",
    "",
    `- 生成: ${generatedAt} (基準日 ${queue.today})`,
    `- 対象: active metric ${summary.activeMetrics} 件 (配信年あり ${summary.withDeliveredYears} 件)`,
    `- 入力: ranking-integrity ${queue.inputs.integrityAudit ?? "なし"} / estat-year-coverage ${coverage ? "あり" : "なし"} / 需要 ${queue.inputs.demandSource ?? "なし"}`,
    `- 判定: ${queue.basis}`,
    "",
    "## サマリ",
    "",
    `- 1 誤り: ${summary.treatment1} / 2 更新: ${summary.treatment2} / 3 調査終了候補: ${summary.treatment3} / 4 noindex候補: ${summary.treatment4} / 処置なし: ${summary.noAction}`,
    `- 年表記: 誤り ${summary.yearLabelError} / 正しい ${summary.yearLabelOk} / 判定不能 (公式表記未確認の調査) ${summary.yearLabelUnknown}`,
    "",
    ...section(1),
    ...section(2),
    ...section(3),
    ...section(4),
    "全件は queue.json。判定の SSOT: `packages/ranking/src/scripts/lib/data-quality-queue.ts`",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "LATEST.md"), md);
  process.stdout.write(
    `データ品質キュー: 1誤り ${summary.treatment1} / 2更新 ${summary.treatment2} / 3終了候補 ${summary.treatment3} / 4noindex候補 ${summary.treatment4} / 年表記誤り ${summary.yearLabelError}・unknown ${summary.yearLabelUnknown}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`::error::[build-data-quality-queue] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
