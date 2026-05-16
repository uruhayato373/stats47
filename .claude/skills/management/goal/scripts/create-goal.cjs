#!/usr/bin/env node
/**
 * /goal define の実体スクリプト。
 * 新規 goal を構造化登録し、md と meta.json を作成する。
 *
 * 使い方:
 *   node create-goal.cjs \
 *     --slug psi-mobile-lcp-2500 \
 *     --metric psi \
 *     --title "全 URL Mobile LCP < 2,500ms 達成" \
 *     --success-criteria "全 19 URL で Mobile LCP < 2,500ms かつ Performance >= 80" \
 *     --abort-criteria "6 cycles or 累計 40h 経過で未達" \
 *     --max-cycles 6 \
 *     --baseline-source ".claude/state/metrics/psi/psi-batch-2026-05-09T17-40-53.json" \
 *     --baseline-value "Mobile LCP 平均 10,500ms / Performance 平均 49" \
 *     --baseline-date "2026-05-09" \
 *     --hypothesis-pool "A1: Cookie banner SSR 化,B1: AdSense chunk 分離,B5: 広告密度削減" \
 *     --related-docs "改善策カタログ: docs/04_レビュー/performance-report/psi-improvement-strategy-2026-05-16.md"
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  ".claude/skills/management/goal/reference/goal-template.md"
);
const METRIC_ADAPTERS_PATH = path.join(
  PROJECT_ROOT,
  ".claude/skills/management/goal/reference/metric-adapters.md"
);
const GOALS_DOC_DIR = path.join(PROJECT_ROOT, "docs/04_レビュー/goals");
const GOALS_STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/goals");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = value;
        i++;
      }
    }
  }
  return args;
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function kebabOk(s) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

function formatHypothesisPool(raw) {
  if (!raw) return "_(未指定)_";
  return raw
    .split(",")
    .map((h) => `- [ ] ${h.trim()}`)
    .join("\n");
}

function formatRelatedDocs(raw) {
  if (!raw) return "_(未指定)_";
  return raw
    .split(";")
    .map((d) => `- ${d.trim()}`)
    .join("\n");
}

function main() {
  const args = parseArgs(process.argv);

  // 必須引数チェック
  const required = ["slug", "metric", "title", "success-criteria", "abort-criteria"];
  const missing = required.filter((k) => !args[k]);
  if (missing.length > 0) {
    console.error(`ERROR: 必須引数が不足: ${missing.join(", ")}`);
    process.exit(1);
  }

  const slug = args.slug;
  if (!kebabOk(slug)) {
    console.error(`ERROR: slug は kebab-case で指定してください: '${slug}'`);
    process.exit(1);
  }

  // slug 重複チェック
  const stateDir = path.join(GOALS_STATE_DIR, slug);
  if (fs.existsSync(stateDir)) {
    console.error(`ERROR: slug '${slug}' は既に存在します。別の slug を指定してください。`);
    console.error(`  既存: ${stateDir}`);
    process.exit(1);
  }

  // 進行中 goal 数チェック(最大 3)
  if (fs.existsSync(GOALS_STATE_DIR)) {
    const existing = fs
      .readdirSync(GOALS_STATE_DIR)
      .map((d) => path.join(GOALS_STATE_DIR, d, "meta.json"))
      .filter((f) => fs.existsSync(f))
      .map((f) => JSON.parse(fs.readFileSync(f, "utf8")))
      .filter((m) => m.status === "ACTIVE");
    if (existing.length >= 3) {
      console.warn(`⚠️ 進行中 goal が ${existing.length} 個あります(推奨上限 3)。既存 goal の進捗を確認してください。`);
      console.warn(`  進行中: ${existing.map((m) => m.slug).join(", ")}`);
    }
  }

  const startDate = isoDate();
  const maxCycles = parseInt(args["max-cycles"] || "6", 10);

  // metric-adapters.md から連携 improvement skill を取得
  const metric = args.metric;
  let improvementSkill = "(custom)";
  try {
    const adapters = fs.readFileSync(METRIC_ADAPTERS_PATH, "utf8");
    const row = adapters.split("\n").find((l) => l.startsWith(`| ${metric} |`));
    if (row) {
      const cells = row.split("|").map((c) => c.trim());
      improvementSkill = cells[2] || "(未設定)";
    }
  } catch (e) {
    console.warn(`⚠️ metric-adapters.md 読み込み失敗: ${e.message}`);
  }

  // テンプレ読み込み
  const tmpl = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const md = tmpl
    .replace(/\{\{TITLE\}\}/g, args.title)
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{METRIC\}\}/g, metric)
    .replace(/\{\{IMPROVEMENT_SKILL\}\}/g, improvementSkill)
    .replace(/\{\{START_DATE\}\}/g, startDate)
    .replace(/\{\{SUCCESS_CRITERIA\}\}/g, args["success-criteria"])
    .replace(/\{\{ABORT_CRITERIA\}\}/g, args["abort-criteria"])
    .replace(/\{\{MAX_CYCLES\}\}/g, String(maxCycles))
    .replace(/\{\{BASELINE_DATE\}\}/g, args["baseline-date"] || "_(未計測)_")
    .replace(/\{\{BASELINE_VALUE\}\}/g, args["baseline-value"] || "_(未計測)_")
    .replace(/\{\{BASELINE_SOURCE\}\}/g, args["baseline-source"] || "_(未指定)_")
    .replace(/\{\{HYPOTHESIS_POOL\}\}/g, formatHypothesisPool(args["hypothesis-pool"]))
    .replace(/\{\{RELATED_DOCS\}\}/g, formatRelatedDocs(args["related-docs"]));

  // ディレクトリ作成
  fs.mkdirSync(GOALS_DOC_DIR, { recursive: true });
  fs.mkdirSync(stateDir, { recursive: true });

  // md 書き出し
  const mdPath = path.join(GOALS_DOC_DIR, `${slug}-${startDate}.md`);
  fs.writeFileSync(mdPath, md);

  // meta.json 書き出し
  const meta = {
    slug,
    title: args.title,
    metric,
    improvement_skill: improvementSkill,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    closed_at: null,
    close_reason: null,
    success_criteria: args["success-criteria"],
    abort_criteria: args["abort-criteria"],
    max_cycles: maxCycles,
    baseline: {
      date: args["baseline-date"] || null,
      value: args["baseline-value"] || null,
      source: args["baseline-source"] || null,
    },
    md_path: path.relative(PROJECT_ROOT, mdPath),
    cycles: [],
    current_cycle: null,
    hypothesis_pool: args["hypothesis-pool"]
      ? args["hypothesis-pool"].split(",").map((h) => h.trim())
      : [],
  };
  fs.writeFileSync(path.join(stateDir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

  console.log(`✅ Goal 登録完了: ${slug}`);
  console.log(`   md: ${path.relative(PROJECT_ROOT, mdPath)}`);
  console.log(`   meta: ${path.relative(PROJECT_ROOT, path.join(stateDir, "meta.json"))}`);
  console.log(`   metric: ${metric} (連携: ${improvementSkill})`);
  if (args["baseline-value"]) {
    console.log(`   ベースライン: ${args["baseline-value"]}`);
  }
  console.log(`次: /goal cycle ${slug}`);
}

main();
