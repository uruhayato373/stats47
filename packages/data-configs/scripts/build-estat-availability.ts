/**
 * build-estat-availability — e-Stat の実在年の台帳を作り、metric config の `years` との差分を報告する。
 *
 * 台帳は「取り込みが全年を許したら、どの年に何県の値が出るか」を表ごと・取り出し条件ごとに数えたもの。
 * 取得と県の判定は取り込み (`page-data-batch.ts` の `fetchPrefectureRowsAllYears`) と同じ経路を通り、
 * `years` による絞り込みだけを外す。表全体の `time` 一覧は指標ごとの年と一致しないので使わない。
 * 経緯と段取り: `.claude/todo/backlog.md` ESTAT-YEAR-AVAILABILITY-01。第 1 段なので取り込みと R2 には触れない。
 *
 *   npx tsx packages/data-configs/scripts/build-estat-availability.ts             # 更新日が変わった表と未取得の条件だけ取り直す
 *   npx tsx packages/data-configs/scripts/build-estat-availability.ts --table 0000010207[,…]
 *   npx tsx packages/data-configs/scripts/build-estat-availability.ts --force      # 更新日に関係なく取り直す
 *   npx tsx packages/data-configs/scripts/build-estat-availability.ts --offline    # 取得せず、今の台帳から差分の報告だけ作る
 *
 * 出力: data/estat/availability/tables/<statsDataId>.json (台帳) と diff.json・LATEST.md (差分)
 * 対象: 有効な metric のうち県の値を e-Stat (estat / kakei-chousa) から取り込むもの。市区町村の値は対象外。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";
import {
  availabilityQueryKey,
  availabilityQueryOf,
  diffYearAvailability,
  expandYearSpec,
  formatYearList,
  type EstatAvailabilityEntry,
  type EstatAvailabilityQuery,
  type EstatAvailabilityTable,
  type YearAvailabilityDiff,
} from "../src/estat-availability.js";
import { listAllMetrics } from "../src/registry.js";
import { listThemeCatalogs } from "../src/theme-catalog/index.js";
import type { EstatSource, MetricConfig } from "../src/types.js";
import { fetchPrefectureRowsAllYears, kakeiEstatSource, readAppId } from "./page-data-batch.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = resolve(REPO_ROOT, datasetDir("estat.availability"));
const TABLE_DIR = resolve(OUT_DIR, "tables");
const DEFAULT_CONCURRENCY = 3;
const REQUEST_GAP_MS = 200;
const REPORT_ROWS = 40;

interface Target {
  config: MetricConfig;
  src: EstatSource;
  query: EstatAvailabilityQuery;
  queryKey: string;
}

/** 県の値を e-Stat から取り込む有効な metric と、取り込みが投げる条件。 */
function collectTargets(): Target[] {
  const targets: Target[] = [];
  for (const config of listAllMetrics()) {
    if (!config.isActive || !config.entities.includes("prefecture")) continue;
    const src =
      config.source.kind === "estat"
        ? config.source
        : config.source.kind === "kakei-chousa"
          ? kakeiEstatSource(config.source)
          : null;
    if (!src) continue;
    const query = availabilityQueryOf(src);
    targets.push({ config, src, query, queryKey: availabilityQueryKey(query) });
  }
  return targets;
}

function tablePath(statsDataId: string): string {
  return resolve(TABLE_DIR, `${statsDataId}.json`);
}

function readTable(statsDataId: string): EstatAvailabilityTable | null {
  const path = tablePath(statsDataId);
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as EstatAvailabilityTable) : null;
}

/** 年の対応表は 1 行に詰める (2,000 条件 × 数十年を 1 年 1 行にすると読めない)。 */
function writeTable(table: EstatAvailabilityTable): void {
  mkdirSync(TABLE_DIR, { recursive: true });
  const text = JSON.stringify(table, null, 2).replace(/"years": \{[^}]*\}/g, (m) => m.replace(/\s+/g, " "));
  writeFileSync(tablePath(table.statsDataId), `${text}\n`);
}

/** e-Stat 応答の `{ $: "..." }` と素の文字列の両方を文字列にする。 */
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$" in value) return String((value as { $: unknown }).$);
  return "";
}

/** 表の名前と更新日だけを 1 行取りで読む。 */
async function fetchTableInfo(
  appId: string,
  statsDataId: string,
): Promise<Pick<EstatAvailabilityTable, "statName" | "title" | "updatedDate">> {
  const params = new URLSearchParams({ appId, statsDataId, limit: "1", metaGetFlg: "N" });
  const res = await fetch(`https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const json = (await res.json()) as {
    GET_STATS_DATA?: {
      RESULT?: { STATUS?: number; ERROR_MSG?: string };
      STATISTICAL_DATA?: { TABLE_INF?: Record<string, unknown> };
    };
  };
  const status = Number(json.GET_STATS_DATA?.RESULT?.STATUS ?? -1);
  if (status !== 0) throw new Error(`e-Stat STATUS=${status} ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG ?? ""}`);
  const info = json.GET_STATS_DATA?.STATISTICAL_DATA?.TABLE_INF ?? {};
  return {
    statName: textOf(info.STAT_NAME),
    title: textOf(info.TITLE),
    updatedDate: textOf(info.UPDATED_DATE),
  };
}

async function fetchEntry(appId: string, target: Target): Promise<EstatAvailabilityEntry> {
  const fetchedAt = new Date().toISOString();
  try {
    const { rows, raw } = await fetchPrefectureRowsAllYears(appId, target.config, target.src);
    const years: Record<string, number> = {};
    for (const row of rows) {
      if (row.value === null) continue;
      years[row.yearCode] = (years[row.yearCode] ?? 0) + 1;
    }
    return {
      query: target.query,
      fetchedAt,
      years: Object.fromEntries(Object.entries(years).sort(([a], [b]) => a.localeCompare(b))),
      rawRows: raw.toNumber,
      ...(raw.totalNumber > raw.toNumber ? { truncated: true } : {}),
    };
  } catch (e) {
    return { query: target.query, fetchedAt, error: e instanceof Error ? e.message : String(e) };
  }
}

async function runPool<T>(items: readonly T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++]!;
        await worker(item);
        await new Promise((r) => setTimeout(r, REQUEST_GAP_MS));
      }
    }),
  );
}

/** 表ごとに、更新日が変わった・未取得・前回失敗の条件だけを取り直して台帳を書く。 */
async function refreshLedger(
  targets: readonly Target[],
  opts: { tables: ReadonlySet<string> | null; force: boolean; concurrency: number },
): Promise<{ tables: number; fetched: number; failedTables: string[] }> {
  const appId = readAppId();
  const byTable = new Map<string, Map<string, Target>>();
  for (const t of targets) {
    if (opts.tables && !opts.tables.has(t.src.statsDataId)) continue;
    const queries = byTable.get(t.src.statsDataId) ?? new Map<string, Target>();
    if (!queries.has(t.queryKey)) queries.set(t.queryKey, t);
    byTable.set(t.src.statsDataId, queries);
  }

  let fetched = 0;
  const failedTables: string[] = [];
  const ids = [...byTable.keys()].sort();
  for (const [i, statsDataId] of ids.entries()) {
    const queries = byTable.get(statsDataId)!;
    let info: Pick<EstatAvailabilityTable, "statName" | "title" | "updatedDate">;
    try {
      info = await fetchTableInfo(appId, statsDataId);
    } catch (e) {
      failedTables.push(statsDataId);
      console.warn(`  [table-fail] ${statsDataId}: ${e instanceof Error ? e.message : String(e)} (台帳は前回のまま)`);
      continue;
    }
    const previous = readTable(statsDataId);
    const reuse = !opts.force && previous?.updatedDate === info.updatedDate;
    const kept = new Map<string, EstatAvailabilityEntry>();
    if (reuse) {
      for (const entry of previous.queries) {
        const key = availabilityQueryKey(entry.query);
        if (queries.has(key) && !entry.error) kept.set(key, entry);
      }
    }
    const todo = [...queries.entries()].filter(([key]) => !kept.has(key)).map(([, t]) => t);
    const entries = new Map(kept);
    await runPool(todo, opts.concurrency, async (t) => {
      entries.set(t.queryKey, await fetchEntry(appId, t));
    });
    fetched += todo.length;
    writeTable({
      statsDataId,
      ...info,
      queries: [...entries.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, e]) => e),
    });
    const errors = todo.filter((t) => entries.get(t.queryKey)?.error).length;
    console.log(
      `[${i + 1}/${ids.length}] ${statsDataId} ${info.title} — 条件 ${queries.size} (取り直し ${todo.length}` +
        `${errors > 0 ? `・失敗 ${errors}` : ""})`,
    );
  }
  return { tables: ids.length, fetched, failedTables };
}

// ---- 差分の報告 ----

type MetricStatus = "diff" | "clean" | "years-all" | "no-ledger" | "fetch-error" | "truncated";

interface MetricDiffRow extends Partial<YearAvailabilityDiff> {
  statsDataId: string;
  status: MetricStatus;
  configYears?: string;
  /** 全県の値がある年 (一部の県だけの年は partial) */
  ledgerYears?: string;
  /** 全県の数 (最も多く値が出た年の県の数) */
  fullCount?: number;
  error?: string;
  themes: string[];
}

const CATEGORIES = [
  { id: "missingInside", label: "取り込み忘れ", meaning: "設定の最初と最後の年のあいだに、全県の値があるのに設定にない年がある" },
  { id: "newer", label: "新しい年が出ている", meaning: "設定の最後の年より後に、全県の値がある年がある" },
  { id: "notInEstat", label: "e-Stat に無い年がある", meaning: "設定にあるのに e-Stat に 1 県も値が無い年がある (補完元の年は除く)" },
  { id: "older", label: "範囲より前にも年がある", meaning: "設定の最初の年より前に、全県の値がある年がある (基準の切り替えで外した年もここに出る)" },
] as const satisfies readonly { id: keyof YearAvailabilityDiff; label: string; meaning: string }[];

function themeIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const catalog of listThemeCatalogs()) {
    for (const metric of catalog.metrics) {
      const list = index.get(metric.rankingKey) ?? [];
      if (!list.includes(catalog.key)) list.push(catalog.key);
      index.set(metric.rankingKey, list);
    }
  }
  return index;
}

function buildReport(targets: readonly Target[]): { rows: Record<string, MetricDiffRow>; generatedAt: string } {
  const themes = themeIndex();
  const tables = new Map<string, Map<string, EstatAvailabilityEntry>>();
  if (existsSync(TABLE_DIR)) {
    for (const file of readdirSync(TABLE_DIR).filter((f) => f.endsWith(".json"))) {
      const table = JSON.parse(readFileSync(resolve(TABLE_DIR, file), "utf8")) as EstatAvailabilityTable;
      tables.set(table.statsDataId, new Map(table.queries.map((e) => [availabilityQueryKey(e.query), e])));
    }
  }

  const rows: Record<string, MetricDiffRow> = {};
  for (const t of [...targets].sort((a, b) => a.config.key.localeCompare(b.config.key))) {
    const base = { statsDataId: t.src.statsDataId, themes: themes.get(t.config.key) ?? [] };
    const entry = tables.get(t.src.statsDataId)?.get(t.queryKey);
    const configYears = expandYearSpec(t.config.years);
    const configText = configYears ? formatYearList(configYears) : "all";
    if (!entry) {
      rows[t.config.key] = { ...base, status: "no-ledger", configYears: configText };
      continue;
    }
    if (entry.error || !entry.years) {
      rows[t.config.key] = { ...base, status: "fetch-error", configYears: configText, error: entry.error };
      continue;
    }
    const ledgerYears = entry.years;
    const fullCount = Math.max(0, ...Object.values(ledgerYears));
    const ledgerText = formatYearList(
      Object.entries(ledgerYears).filter(([, n]) => n === fullCount).map(([y]) => Number(y)),
    );
    if (entry.truncated) {
      rows[t.config.key] = { ...base, status: "truncated", configYears: configText, ledgerYears: ledgerText };
      continue;
    }
    if (!configYears) {
      rows[t.config.key] = { ...base, status: "years-all", configYears: configText, ledgerYears: ledgerText, fullCount };
      continue;
    }
    const diff = diffYearAvailability({
      configYears,
      ledgerYears,
      suppliedYears: (t.config.supplementalSources ?? []).flatMap((s) => s.years),
    });
    const hasDiff = CATEGORIES.some((c) => diff[c.id].length > 0);
    rows[t.config.key] = {
      ...base,
      status: hasDiff ? "diff" : "clean",
      configYears: configText,
      ledgerYears: ledgerText,
      fullCount,
      ...diff,
    };
  }
  return { rows, generatedAt: new Date().toISOString() };
}

function writeReport(targets: readonly Target[]): void {
  const { rows, generatedAt } = buildReport(targets);
  const all = Object.entries(rows);
  const count = (status: MetricStatus) => all.filter(([, r]) => r.status === status).length;
  const inCategory = (id: (typeof CATEGORIES)[number]["id"]) =>
    all
      .filter(([, r]) => (r[id]?.length ?? 0) > 0)
      .sort(([ka, a], [kb, b]) =>
        (b.themes.length > 0 ? 1 : 0) - (a.themes.length > 0 ? 1 : 0) ||
        (b[id]?.length ?? 0) - (a[id]?.length ?? 0) ||
        ka.localeCompare(kb),
      );

  const summary = {
    metrics: all.length,
    queries: new Set(targets.map((t) => `${t.src.statsDataId} ${t.queryKey}`)).size,
    tables: new Set(targets.map((t) => t.src.statsDataId)).size,
    missingInside: inCategory("missingInside").length,
    newer: inCategory("newer").length,
    notInEstat: inCategory("notInEstat").length,
    older: inCategory("older").length,
    clean: count("clean"),
    yearsAll: count("years-all"),
    noLedger: count("no-ledger"),
    fetchError: count("fetch-error"),
    truncated: count("truncated"),
  };
  const kept = Object.fromEntries(all.filter(([, r]) => r.status !== "clean" && r.status !== "years-all"));
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, "diff.json"), `${JSON.stringify({ generatedAt, summary, metrics: kept }, null, 2)}\n`);

  const section = (c: (typeof CATEGORIES)[number]) => {
    const list = inCategory(c.id);
    if (list.length === 0) return [`## ${c.label}`, "", "なし", ""];
    return [
      `## ${c.label} (${list.length} 件)`,
      "",
      `${c.meaning}。テーマで使う指標を先に、該当する年の多い順。${list.length > REPORT_ROWS ? `上位 ${REPORT_ROWS} 件 (全件は diff.json)。` : ""}`,
      "",
      "| 指標 | 表 | 設定の年 | 該当する年 | 全県の値がある年 (県の数) | テーマ |",
      "|---|---|---|---|---|---|",
      ...list
        .slice(0, REPORT_ROWS)
        .map(
          ([key, r]) =>
            `| \`${key}\` | ${r.statsDataId} | ${r.configYears} | ${formatYearList(r[c.id] ?? [])} | ` +
            `${r.ledgerYears} (${r.fullCount}) | ${r.themes.join(", ")} |`,
        ),
      "",
    ];
  };
  const failures = all.filter(([, r]) => ["no-ledger", "fetch-error", "truncated"].includes(r.status));

  const md = [
    "# e-Stat の実在年と metric config の years の差分 (LATEST)",
    "",
    `- 生成: ${generatedAt}`,
    `- 対象: 県の値を e-Stat (estat / kakei-chousa) から取り込む有効な metric ${summary.metrics} 件` +
      ` (表 ${summary.tables}・取り出し条件 ${summary.queries})。市区町村の値は対象外`,
    `- 台帳: \`${datasetDir("estat.availability")}/tables/<statsDataId>.json\`。取り込みと同じ取得と県の判定で、` +
      "`years` で絞らずに年ごとの値のある県を数えたもの",
    "- 全県: その条件で最も多く値が出た年の県の数 (港湾・漁業のように 47 県がそろわない統計があるため 47 に固定しない)。" +
      "一部の県だけの年は分類に入れない (diff.json の `partial`)",
    "- 作り直し: `npx tsx packages/data-configs/scripts/build-estat-availability.ts` (`--offline` で報告だけ)",
    "",
    "## 件数",
    "",
    "| 分類 | 指標数 | 意味 |",
    "|---|---|---|",
    ...CATEGORIES.map((c) => `| ${c.label} | ${inCategory(c.id).length} | ${c.meaning} |`),
    `| 差分なし | ${summary.clean} | 設定の年が全県の値のある年と一致する |`,
    `| years: "all" | ${summary.yearsAll} | 許可リストが無く、取り込みは e-Stat の全年を使う |`,
    `| 台帳なし・取得失敗・打ち切り | ${failures.length} | 次の実行で取り直す (下の表) |`,
    "",
    "1 つの指標が複数の分類に入ることがある。",
    "",
    ...CATEGORIES.flatMap(section),
    "## 台帳なし・取得失敗・打ち切り",
    "",
    ...(failures.length === 0
      ? ["なし"]
      : [
          "| 指標 | 表 | 状態 | 理由 |",
          "|---|---|---|---|",
          ...failures.map(([key, r]) => `| \`${key}\` | ${r.statsDataId} | ${r.status} | ${(r.error ?? "").replace(/\|/g, "/").slice(0, 120)} |`),
        ]),
    "",
  ].join("\n");
  writeFileSync(resolve(OUT_DIR, "LATEST.md"), md);

  console.log(
    `差分: 取り込み忘れ ${summary.missingInside} / 新しい年 ${summary.newer} / e-Stat に無い年 ${summary.notInEstat} / ` +
      `範囲より前 ${summary.older} / 差分なし ${summary.clean} / all ${summary.yearsAll} / 失敗等 ${failures.length}`,
  );
  console.log(`→ ${datasetDir("estat.availability")}/LATEST.md`);
}

function parseArgs(argv: readonly string[]) {
  const value = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const tables = value("--table");
  return {
    offline: argv.includes("--offline"),
    force: argv.includes("--force"),
    tables: tables ? new Set(tables.split(",").map((s) => s.trim()).filter(Boolean)) : null,
    concurrency: Number(value("--concurrency") ?? DEFAULT_CONCURRENCY),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const targets = collectTargets();
  if (!args.offline) {
    const result = await refreshLedger(targets, args);
    console.log(`台帳: 表 ${result.tables} / 取り直した条件 ${result.fetched} / 表の情報を取れなかった表 ${result.failedTables.length}`);
  }
  writeReport(targets);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
