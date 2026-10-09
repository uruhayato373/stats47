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
 * 出力: data/estat/availability/tables/<statsDataId>.json (台帳) と diff.json・LATEST.md (差分)。
 *       控えの無い表と更新日が変わった表は、メタ情報の控え data/estat/meta/<statsDataId>.json も取り直す。
 * 対象: 有効な metric のうち県・市区町村の値を e-Stat (estat / kakei-chousa / citySource) から取り込むもの。
 *       市区町村は報告だけで、years は県の値で決める (sync-estat-years.ts)。
 */
import { spawnSync } from "node:child_process";
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
  YEAR_EXCLUSION_INHERITED,
  type EstatAvailabilityEntry,
  type EstatAvailabilityLevel,
  type EstatAvailabilityQuery,
  type EstatAvailabilityTable,
  type YearAvailabilityDiff,
} from "../src/estat-availability.js";
import { listAllMetrics } from "../src/registry.js";
import { listThemeCatalogs } from "../src/theme-catalog/index.js";
import type { EstatSource, MetricConfig } from "../src/types.js";
import {
  cityEstatSource,
  fetchCityRowsAllYears,
  fetchPrefectureRowsAllYears,
  kakeiEstatSource,
  readAppId,
} from "./page-data-batch.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = resolve(REPO_ROOT, datasetDir("estat.availability"));
const TABLE_DIR = resolve(OUT_DIR, "tables");
const DEFAULT_CONCURRENCY = 3;
const REQUEST_GAP_MS = 200;
const REPORT_ROWS = 40;

export interface Target {
  config: MetricConfig;
  /** 県 (values.json) か市区町村 (cities.json) か */
  level: EstatAvailabilityLevel;
  /** 取り込みが使う県の e-Stat 条件 (市区町村もここから表を選ぶ) */
  src: EstatSource;
  /** 台帳の表 (市区町村は市区町村の表) */
  table: string;
  query: EstatAvailabilityQuery;
  queryKey: string;
}

/** e-Stat から値を取り込む有効な metric と、取り込みが投げる条件 (県と市区町村)。 */
export function collectTargets(): Target[] {
  const targets: Target[] = [];
  for (const config of listAllMetrics()) {
    if (!config.isActive) continue;
    const src =
      config.source.kind === "estat"
        ? config.source
        : config.source.kind === "kakei-chousa"
          ? kakeiEstatSource(config.source)
          : null;
    if (src && config.entities.includes("prefecture")) {
      const query = availabilityQueryOf(src);
      targets.push({ config, level: "prefecture", src, table: src.statsDataId, query, queryKey: availabilityQueryKey(query) });
    }
    // 取り込みは e-Stat 以外の県の値でも、citySource があれば市区町村だけ e-Stat から取る
    const citySrc = src ?? config.citySource ?? null;
    const city = citySrc && config.entities.includes("city") ? cityEstatSource(config, citySrc) : null;
    if (citySrc && city) {
      const query = availabilityQueryOf(city);
      targets.push({ config, level: "city", src: citySrc, table: city.statsDataId, query, queryKey: availabilityQueryKey(query, "city") });
    }
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
    const fetched =
      target.level === "city"
        ? await fetchCityRowsAllYears(appId, target.config, target.src)
        : await fetchPrefectureRowsAllYears(appId, target.config, target.src);
    if (!fetched) throw new Error("市区町村の表が無い");
    const { rows, raw } = fetched;
    const areasByYear = new Map<string, Set<string>>();
    const seen = new Set<string>();
    let duplicateRows = false;
    for (const row of rows) {
      const cell = `${row.yearCode}|${row.areaCode}`;
      if (seen.has(cell)) duplicateRows = true;
      seen.add(cell);
      if (row.value === null) continue;
      const areas = areasByYear.get(row.yearCode) ?? new Set<string>();
      areas.add(row.areaCode);
      areasByYear.set(row.yearCode, areas);
    }
    return {
      query: target.query,
      ...(target.level === "city" ? { level: "city" as const } : {}),
      fetchedAt,
      years: Object.fromEntries([...areasByYear.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([y, a]) => [y, a.size])),
      rawRows: raw.toNumber,
      ...(raw.totalNumber > raw.toNumber ? { truncated: true } : {}),
      ...(duplicateRows ? { duplicateRows: true } : {}),
    };
  } catch (e) {
    return {
      query: target.query,
      ...(target.level === "city" ? { level: "city" as const } : {}),
      fetchedAt,
      error: e instanceof Error ? e.message : String(e),
    };
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
): Promise<{ tables: number; fetched: number; failedTables: string[]; updatedTables: string[] }> {
  const appId = readAppId();
  const byTable = new Map<string, Map<string, Target>>();
  for (const t of targets) {
    if (opts.tables && !opts.tables.has(t.table)) continue;
    const queries = byTable.get(t.table) ?? new Map<string, Target>();
    if (!queries.has(t.queryKey)) queries.set(t.queryKey, t);
    byTable.set(t.table, queries);
  }

  let fetched = 0;
  const failedTables: string[] = [];
  const updatedTables: string[] = [];
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
    if (previous?.updatedDate !== info.updatedDate) updatedTables.push(statsDataId);
    const kept = new Map<string, EstatAvailabilityEntry>();
    if (reuse) {
      for (const entry of previous.queries) {
        const key = availabilityQueryKey(entry.query, entry.level);
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
  return { tables: ids.length, fetched, failedTables, updatedTables };
}

// ---- 差分の報告 ----

type MetricStatus = "diff" | "clean" | "years-all" | "no-ledger" | "fetch-error" | "truncated" | "duplicate-rows";

interface MetricDiffRow extends Partial<YearAvailabilityDiff> {
  statsDataId: string;
  status: MetricStatus;
  configYears?: string;
  /** 全県の値がある年 (一部の県だけの年は partial) */
  ledgerYears?: string;
  /** 全県の数 (最も多く値が出た年の県の数) */
  fullCount?: number;
  /** 移行時に引き継いだだけで、まだ判断していない除外の年 */
  inheritedExclusions?: number[];
  /** 理由を書いて判断した除外の年 */
  judgedExclusions?: number[];
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

/** 台帳を「表 → 取り出し条件のキー → 行」で読む。 */
export function loadLedgerEntries(): Map<string, Map<string, EstatAvailabilityEntry>> {
  const tables = new Map<string, Map<string, EstatAvailabilityEntry>>();
  if (!existsSync(TABLE_DIR)) return tables;
  for (const file of readdirSync(TABLE_DIR).filter((f) => f.endsWith(".json"))) {
    const table = JSON.parse(readFileSync(resolve(TABLE_DIR, file), "utf8")) as EstatAvailabilityTable;
    tables.set(table.statsDataId, new Map(table.queries.map((e) => [availabilityQueryKey(e.query, e.level), e])));
  }
  return tables;
}

function buildReport(targets: readonly Target[]): { rows: Record<string, MetricDiffRow>; generatedAt: string } {
  const themes = themeIndex();
  const tables = loadLedgerEntries();

  const rows: Record<string, MetricDiffRow> = {};
  for (const t of [...targets].sort((a, b) => a.config.key.localeCompare(b.config.key))) {
    const base = { statsDataId: t.table, themes: themes.get(t.config.key) ?? [] };
    const entry = tables.get(t.table)?.get(t.queryKey);
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
    if (entry.truncated || entry.duplicateRows) {
      const status = entry.truncated ? "truncated" : "duplicate-rows";
      rows[t.config.key] = { ...base, status, configYears: configText, ledgerYears: ledgerText };
      continue;
    }
    if (!configYears) {
      rows[t.config.key] = { ...base, status: "years-all", configYears: configText, ledgerYears: ledgerText, fullCount };
      continue;
    }
    const exclusions = t.config.yearExclusions ?? [];
    const inherited = exclusions.filter((e) => e.reason === YEAR_EXCLUSION_INHERITED).flatMap((e) => e.years);
    const judged = exclusions.filter((e) => e.reason !== YEAR_EXCLUSION_INHERITED).flatMap((e) => e.years);
    const diff = diffYearAvailability({
      configYears,
      ledgerYears,
      suppliedYears: (t.config.supplementalSources ?? []).flatMap((s) => s.years),
      excludedYears: [...inherited, ...judged],
    });
    const hasDiff = CATEGORIES.some((c) => diff[c.id].length > 0);
    rows[t.config.key] = {
      ...base,
      status: hasDiff ? "diff" : "clean",
      configYears: configText,
      ledgerYears: ledgerText,
      fullCount,
      ...diff,
      ...(inherited.length > 0 ? { inheritedExclusions: inherited } : {}),
      ...(judged.length > 0 ? { judgedExclusions: judged } : {}),
    };
  }
  return { rows, generatedAt: new Date().toISOString() };
}

/** 市区町村の報告で「ほぼ全市区町村」とみなす割合 (最も多く値が出た年の市区町村の数に対して) */
const CITY_NEAR_FULL_RATIO = 0.9;

interface CityRow {
  statsDataId: string;
  status: MetricStatus;
  configYears: string;
  /** 市区町村の値がある年 */
  cityYears?: string;
  /** 最も多く値が出た年の市区町村の数 */
  maxCount?: number;
  /** 設定にあるのに市区町村の値が 1 つも無い年 (補完元の年は除く) */
  noValueYears?: number[];
  /** 設定に無いのに、ほぼ全市区町村の値がある年 */
  extraYears?: number[];
  error?: string;
}

/** 市区町村の台帳と years の差 (報告だけ。years は県の値で決める)。 */
function buildCityReport(targets: readonly Target[]): Record<string, CityRow> {
  const tables = loadLedgerEntries();
  const rows: Record<string, CityRow> = {};
  for (const t of [...targets].sort((a, b) => a.config.key.localeCompare(b.config.key))) {
    const entry = tables.get(t.table)?.get(t.queryKey);
    const configYears = expandYearSpec(t.config.years);
    const base = { statsDataId: t.table, configYears: configYears ? formatYearList(configYears) : "all" };
    if (!entry) {
      rows[t.config.key] = { ...base, status: "no-ledger" };
      continue;
    }
    if (entry.error || !entry.years) {
      rows[t.config.key] = { ...base, status: "fetch-error", error: entry.error };
      continue;
    }
    const years = entry.years;
    const maxCount = Math.max(0, ...Object.values(years));
    const cityYears = formatYearList(Object.keys(years).map(Number));
    if (entry.truncated || entry.duplicateRows) {
      rows[t.config.key] = { ...base, status: entry.truncated ? "truncated" : "duplicate-rows", cityYears, maxCount };
      continue;
    }
    if (!configYears) {
      rows[t.config.key] = { ...base, status: "years-all", cityYears, maxCount };
      continue;
    }
    const supplied = new Set((t.config.supplementalSources ?? []).flatMap((x) => x.years));
    const configured = new Set(configYears);
    const noValueYears = configYears.filter((y) => !supplied.has(y) && !years[String(y)]);
    const extraYears = Object.entries(years)
      .filter(([y, n]) => !configured.has(Number(y)) && n >= maxCount * CITY_NEAR_FULL_RATIO)
      .map(([y]) => Number(y));
    const hasDiff = noValueYears.length > 0 || extraYears.length > 0;
    rows[t.config.key] = {
      ...base,
      status: hasDiff ? "diff" : "clean",
      cityYears,
      maxCount,
      ...(noValueYears.length > 0 ? { noValueYears } : {}),
      ...(extraYears.length > 0 ? { extraYears } : {}),
    };
  }
  return rows;
}

function writeReport(targets: readonly Target[]): void {
  const prefTargets = targets.filter((t) => t.level === "prefecture");
  const cityTargets = targets.filter((t) => t.level === "city");
  const { rows, generatedAt } = buildReport(prefTargets);
  const cityRows = Object.entries(buildCityReport(cityTargets));
  const cityCount = (pred: (r: CityRow) => boolean) => cityRows.filter(([, r]) => pred(r)).length;
  const cityFailures = cityRows.filter(([, r]) => ["no-ledger", "fetch-error", "truncated", "duplicate-rows"].includes(r.status));
  const cityDiffs = cityRows
    .filter(([, r]) => r.status === "diff")
    .sort(([ka, a], [kb, b]) =>
      (b.noValueYears?.length ?? 0) + (b.extraYears?.length ?? 0) - (a.noValueYears?.length ?? 0) - (a.extraYears?.length ?? 0) ||
      ka.localeCompare(kb),
    );
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
    queries: new Set(prefTargets.map((t) => `${t.table} ${t.queryKey}`)).size,
    tables: new Set(prefTargets.map((t) => t.table)).size,
    missingInside: inCategory("missingInside").length,
    newer: inCategory("newer").length,
    notInEstat: inCategory("notInEstat").length,
    older: inCategory("older").length,
    clean: count("clean"),
    yearsAll: count("years-all"),
    noLedger: count("no-ledger"),
    fetchError: count("fetch-error"),
    truncated: count("truncated"),
    duplicateRows: count("duplicate-rows"),
    inheritedExclusions: all.filter(([, r]) => r.inheritedExclusions).length,
    judgedExclusions: all.filter(([, r]) => r.judgedExclusions).length,
  };
  const kept = Object.fromEntries(
    all.filter(([, r]) => (r.status !== "clean" && r.status !== "years-all") || r.inheritedExclusions || r.judgedExclusions),
  );
  mkdirSync(OUT_DIR, { recursive: true });
  const citySummary = {
    metrics: cityRows.length,
    tables: new Set(cityTargets.map((t) => t.table)).size,
    noValueYears: cityCount((r) => (r.noValueYears?.length ?? 0) > 0),
    extraYears: cityCount((r) => (r.extraYears?.length ?? 0) > 0),
    clean: cityCount((r) => r.status === "clean"),
    yearsAll: cityCount((r) => r.status === "years-all"),
    failures: cityFailures.length,
  };
  const keptCities = Object.fromEntries(cityRows.filter(([, r]) => r.status !== "clean" && r.status !== "years-all"));
  writeFileSync(
    resolve(OUT_DIR, "diff.json"),
    `${JSON.stringify({ generatedAt, summary, metrics: kept, citySummary, cities: keptCities }, null, 2)}\n`,
  );

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
  const failures = all.filter(([, r]) => ["no-ledger", "fetch-error", "truncated", "duplicate-rows"].includes(r.status));
  const unjudged = all
    .filter(([, r]) => r.inheritedExclusions)
    .sort(([ka, a], [kb, b]) =>
      (b.themes.length > 0 ? 1 : 0) - (a.themes.length > 0 ? 1 : 0) ||
      (b.inheritedExclusions?.length ?? 0) - (a.inheritedExclusions?.length ?? 0) ||
      ka.localeCompare(kb),
    );

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
    "- 作り直し: `npx tsx packages/data-configs/scripts/build-estat-availability.ts` (`--offline` で報告だけ)。" +
      "差分は `npx tsx packages/data-configs/scripts/sync-estat-years.ts` が years に反映する",
    "- `yearExclusions` に書いた年は判断済みとして差分に数えない",
    "",
    "## 件数",
    "",
    "| 分類 | 指標数 | 意味 |",
    "|---|---|---|",
    ...CATEGORIES.map((c) => `| ${c.label} | ${inCategory(c.id).length} | ${c.meaning} |`),
    `| 差分なし | ${summary.clean} | 設定の年が全県の値のある年と一致する |`,
    `| years: "all" | ${summary.yearsAll} | 許可リストが無く、取り込みは e-Stat の全年を使う |`,
    `| 台帳なし・取得失敗・打ち切り・重複行 | ${failures.length} | 差分を比べていない (下の表。取得失敗は次の実行で取り直し、打ち切りと重複行は metric config の軸を直す) |`,
    `| 未判断の除外 | ${summary.inheritedExclusions} | 移行時に当時の years から引き継いだ除外。根拠を書くか、外して年を戻す (下の表) |`,
    `| 理由付きの除外 | ${summary.judgedExclusions} | 判断して書いた除外 |`,
    "",
    "1 つの指標が複数の分類に入ることがある。",
    "",
    ...CATEGORIES.flatMap(section),
    `## 未判断の除外 (${unjudged.length} 件)`,
    "",
    ...(unjudged.length === 0
      ? ["なし", ""]
      : [
          "全県の値があるのに、2026-10 の移行時の years に無かったので除外として残した年。基準の切り替え・5 年おきの揃えなどの根拠があれば" +
            " `yearExclusions` の reason を具体的に書き換え、無ければ除外を消して `sync-estat-years.ts` で年を戻す。" +
            `テーマで使う指標を先に、除外の年の多い順。${unjudged.length > REPORT_ROWS ? `上位 ${REPORT_ROWS} 件 (全件は diff.json)。` : ""}`,
          "",
          "| 指標 | 表 | 設定の年 | 除外している年 | テーマ |",
          "|---|---|---|---|---|",
          ...unjudged
            .slice(0, REPORT_ROWS)
            .map(
              ([key, r]) =>
                `| \`${key}\` | ${r.statsDataId} | ${r.configYears} | ${formatYearList(r.inheritedExclusions ?? [])} | ${r.themes.join(", ")} |`,
            ),
          "",
        ]),
    "## 市区町村 (cities.json)",
    "",
    `- 対象: 市区町村の値を e-Stat から取り込む有効な metric ${citySummary.metrics} 件 (市区町村の表 ${citySummary.tables})。` +
      "数えるのは取り込みと同じく現行の市区町村マスタにあるコードだけ",
    "- **報告だけで years は変えない** (years は県の値で決める。市区町村は合併でコードが変わり、古い年ほど数が減るため「全市区町村の年」が定まらない)",
    `- 設定の年に市区町村の値が無い: ${citySummary.noValueYears} 件 / 設定に無い年に市区町村の ${Math.round(CITY_NEAR_FULL_RATIO * 100)}% 以上の値がある: ${citySummary.extraYears} 件 / ` +
      `差分なし: ${citySummary.clean} 件 / years: "all": ${citySummary.yearsAll} 件 / 台帳なし・失敗等: ${citySummary.failures} 件`,
    "",
    ...(cityDiffs.length === 0
      ? ["差分なし", ""]
      : [
          `該当する年の多い順。${cityDiffs.length > REPORT_ROWS ? `上位 ${REPORT_ROWS} 件 (全件は diff.json の cities)。` : ""}`,
          "",
          "| 指標 | 市区町村の表 | 設定の年 | 値が無い年 | 設定に無いが値がある年 | 値がある年 (最多の数) |",
          "|---|---|---|---|---|---|",
          ...cityDiffs
            .slice(0, REPORT_ROWS)
            .map(
              ([key, r]) =>
                `| \`${key}\` | ${r.statsDataId} | ${r.configYears} | ${formatYearList(r.noValueYears ?? [])} | ` +
                `${formatYearList(r.extraYears ?? [])} | ${r.cityYears} (${r.maxCount}) |`,
            ),
          "",
        ]),
    ...(cityFailures.length === 0
      ? []
      : [
          "| 指標 (市区町村) | 表 | 状態 | 理由 |",
          "|---|---|---|---|",
          ...cityFailures.map(([key, r]) => `| \`${key}\` | ${r.statsDataId} | ${r.status} | ${(r.error ?? "").replace(/\|/g, "/").slice(0, 120)} |`),
          "",
        ]),
    "## 台帳なし・取得失敗・打ち切り・重複行",
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
  console.log(
    `市区町村: 値が無い年 ${citySummary.noValueYears} / 設定に無い年 ${citySummary.extraYears} / 差分なし ${citySummary.clean} / 失敗等 ${citySummary.failures}`,
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

/**
 * 表のメタ情報の控え (`data/estat/meta/<statsDataId>.json`、分類コードの全項目) を、控えの無い表と更新日が変わった表について取り直す。
 * 取得は既存の fetch-estat-meta.mjs に任せる (控えの形を 1 か所で決めるため)。
 */
function refreshTableMeta(tables: readonly string[], updatedTables: readonly string[]): void {
  const metaDir = resolve(REPO_ROOT, datasetDir("estat.meta"));
  const ids = [...new Set([...tables.filter((id) => !existsSync(resolve(metaDir, `${id}.json`))), ...updatedTables])].sort();
  if (ids.length === 0) return;
  console.log(`メタ情報の控え: ${ids.length} 表を取り直す`);
  const result = spawnSync(
    process.execPath,
    [resolve(REPO_ROOT, ".claude/scripts/estat/fetch-estat-meta.mjs"), "--full", "--no-summary", "--ids", ids.join(",")],
    { stdio: "inherit" },
  );
  if (result.status !== 0) console.warn(`  [meta-fail] fetch-estat-meta.mjs が exit ${result.status} (控えは前回のまま)`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const targets = collectTargets();
  if (!args.offline) {
    const result = await refreshLedger(targets, args);
    console.log(`台帳: 表 ${result.tables} / 取り直した条件 ${result.fetched} / 表の情報を取れなかった表 ${result.failedTables.length}`);
    const tables = [...new Set(targets.map((t) => t.table))].filter((id) => !args.tables || args.tables.has(id));
    refreshTableMeta(tables, result.updatedTables);
  }
  writeReport(targets);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
