/**
 * 家計調査の台帳 (data/estat/kakei-ledger/ledger.json) を作る・検査する。
 *
 *   npm run estat:kakei-ledger:build   # e-Stat カタログ + metric config + decisions.json → ledger.json
 *   npm run estat:kakei-ledger:check   # ledger.json と今の metric config・decisions.json の整合 (問題があれば exit 1)
 *
 * build の入力は pull 済みの e-Stat カタログ (npm run estat:catalog:pull → .local/estat-catalog/)。
 * R2 へ反映する前の staging を使うときは --catalog-dir .local/r2/estat-catalog。
 * 家計調査の表が無い・meta を取っていない表がある・品目表の分類が無いときは書かずに止める (fail-closed)。
 * 導出と検査の本体は .claude/scripts/lib/estat-catalog/kakei-ledger.mjs。
 */
import fs from "node:fs";
import path from "node:path";

import { KAKEI_ANALYSES } from "@stats47/data-configs";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { assertDatasetShape } from "../lib/dataset-shape.mjs";
import {
  buildKakeiLedger,
  checkKakeiLedger,
  KAKEI_STAT_CODE,
  kakeiMetricInput,
  type KakeiDecisions,
  type KakeiMetricInput,
} from "../lib/estat-catalog/kakei-ledger.mjs";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_CATALOG_DIR = ".local/estat-catalog";

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function argValue(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] ?? null : null;
}

function loadMetrics(): KakeiMetricInput[] {
  return Object.values(METRICS_REGISTRY)
    .filter((m) => m.isActive !== false)
    .map((m) => kakeiMetricInput(m))
    .filter((m): m is KakeiMetricInput => m !== null);
}

/** 分析単位 (全国ページの図など)。指標と同じく表の使い手として数える */
function loadAnalyses(): { id: string; statsDataId: string; state: "configured" | "staged" | "proposed" }[] {
  return KAKEI_ANALYSES.map((a) => ({ id: a.id, statsDataId: a.source.statsDataId, state: a.placement.state }));
}

/** 切り口台帳 (data/surveys/lenses/kakei-chousa.json) の表 → その表を使う切り口 */
function loadLensTables(): Map<string, string[]> {
  const file = path.join(PROJECT_ROOT, datasetDir("surveys.lenses"), "kakei-chousa.json");
  const doc = readJson<{ lenses: { id: string; dataTables: string[] }[] }>(file);
  const byTable = new Map<string, string[]>();
  for (const lens of doc.lenses) for (const t of lens.dataTables) byTable.set(t, [...(byTable.get(t) ?? []), lens.id]);
  return byTable;
}

function loadDecisions(): KakeiDecisions {
  const doc = readJson<KakeiDecisions>(path.join(PROJECT_ROOT, datasetPath("estat.kakei-decisions")));
  assertDatasetShape("estat.kakei-decisions", doc);
  return doc;
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function build(): void {
  const catalogDir = path.resolve(PROJECT_ROOT, argValue("--catalog-dir") ?? DEFAULT_CATALOG_DIR);
  const tablesFile = path.join(catalogDir, `index/tables/${KAKEI_STAT_CODE}.json`);
  const classesFile = path.join(catalogDir, `index/classes/${KAKEI_STAT_CODE}.json`);
  if (!fs.existsSync(tablesFile)) {
    fail(`${path.relative(PROJECT_ROOT, tablesFile)} が無い。e-Stat カタログに家計調査が入っていない (npm run estat:catalog:pull)`);
  }
  const tables = readJson<{ statsDataId: string; meta: unknown; removedAt: string | null }[]>(tablesFile).filter((t) => !t.removedAt);
  const withoutMeta = tables.filter((t) => !t.meta).map((t) => t.statsDataId);
  if (withoutMeta.length) {
    fail(`meta を取っていない表が ${withoutMeta.length} 件 (${withoutMeta.slice(0, 5).join(", ")})。catalog.mjs run --meta-stat-codes ${KAKEI_STAT_CODE} を先に回す`);
  }
  const classes = fs.existsSync(classesFile) ? readJson<Parameters<typeof buildKakeiLedger>[0]["classes"]>(classesFile) : [];
  const decisions = loadDecisions();
  for (const [measure, id] of Object.entries(decisions.itemTables)) {
    if (!classes.some((c) => c.statsDataId === id && c.dim === "cat01")) fail(`品目表 ${measure}=${id} の品目分類がカタログに無い`);
  }
  const manifestFile = path.join(catalogDir, "manifest.json");
  const catalogGeneratedAt = fs.existsSync(manifestFile) ? readJson<{ generatedAt?: string }>(manifestFile).generatedAt ?? null : null;

  const ledger = buildKakeiLedger({
    tables,
    classes,
    metrics: loadMetrics(),
    analyses: loadAnalyses(),
    decisions,
    generatedAt: new Date().toISOString(),
    catalogGeneratedAt,
  });
  assertDatasetShape("estat.kakei-ledger", ledger);
  const out = path.join(PROJECT_ROOT, datasetPath("estat.kakei-ledger"));
  fs.writeFileSync(out, `${JSON.stringify(ledger, null, 1)}\n`);
  console.log(`✓ ${path.relative(PROJECT_ROOT, out)}: 表 ${ledger.summary.tables} / 品目 金額 ${ledger.summary.items.amount.total}・数量 ${ledger.summary.items.quantity.total}`);
  console.log(JSON.stringify(ledger.summary, null, 1));
}

function check(): void {
  const file = path.join(PROJECT_ROOT, datasetPath("estat.kakei-ledger"));
  if (!fs.existsSync(file)) fail(`${datasetPath("estat.kakei-ledger")} が無い。npm run estat:kakei-ledger:build で作る`);
  const ledger = readJson<ReturnType<typeof buildKakeiLedger>>(file);
  assertDatasetShape("estat.kakei-ledger", ledger);
  const findings = checkKakeiLedger({
    ledger,
    metrics: loadMetrics(),
    analyses: loadAnalyses(),
    lensTables: loadLensTables(),
    decisions: loadDecisions(),
  });
  for (const f of findings) console.log(`${f.level === "error" ? "✗" : "⚠"} [${f.code}] ${f.message}`);
  const errors = findings.filter((f) => f.level === "error").length;
  if (errors) fail(`家計調査の台帳: error ${errors} 件`);
  console.log(`✓ 家計調査の台帳: 表 ${ledger.summary.tables}・品目 ${ledger.items.length} 行が metric config と判断に一致`);
}

const sub = process.argv[2];
if (sub === "build") build();
else if (sub === "check") check();
else fail("使い方: kakei-ledger.ts <build|check> [--catalog-dir <dir>]");
