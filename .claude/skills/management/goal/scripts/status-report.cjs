#!/usr/bin/env node
/**
 * /goal status / /goal list の実体スクリプト。
 * meta.json を読み込んで markdown table を出力する。
 *
 * 使い方:
 *   node status-report.cjs                    # 進行中 goal 一覧
 *   node status-report.cjs --slug <slug>      # 指定 goal の詳細
 *   node status-report.cjs --all              # 全 goal (進行中 + 完了 + 撤退)
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const GOALS_STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/goals");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") {
      args.all = true;
    } else if (a.startsWith("--")) {
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

function loadAllGoals() {
  if (!fs.existsSync(GOALS_STATE_DIR)) return [];
  return fs
    .readdirSync(GOALS_STATE_DIR)
    .map((slug) => {
      const p = path.join(GOALS_STATE_DIR, slug, "meta.json");
      if (!fs.existsSync(p)) return null;
      try {
        return JSON.parse(fs.readFileSync(p, "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function daysSince(iso) {
  if (!iso) return null;
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

function detailReport(slug) {
  const metaPath = path.join(GOALS_STATE_DIR, slug, "meta.json");
  if (!fs.existsSync(metaPath)) {
    console.error(`ERROR: goal '${slug}' が見つかりません`);
    process.exit(1);
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const lastCycle = meta.cycles[meta.cycles.length - 1];
  const remainingHypotheses = meta.hypothesis_pool?.length || 0;

  console.log(`# Goal: ${meta.title} (${meta.slug})`);
  console.log("");
  console.log("| 項目 | 値 |");
  console.log("|---|---|");
  console.log(`| Status | ${meta.status} |`);
  console.log(`| Metric | ${meta.metric} |`);
  console.log(`| Cycle | ${meta.cycles.length} / ${meta.max_cycles} |`);
  console.log(`| 最終 effect | ${lastCycle?.effect ? `effect/${lastCycle.effect}` : "_"} |`);
  console.log(`| ベースライン | ${meta.baseline?.value || "_"} |`);
  console.log(`| 終了条件 | ${meta.success_criteria} |`);
  console.log(`| 撤退条件 | ${meta.abort_criteria} |`);
  console.log(`| 残仮説 | ${remainingHypotheses} 件 |`);
  console.log(`| 作成日 / 最終更新 | ${meta.created_at?.slice(0, 10)} / ${meta.updated_at?.slice(0, 10)} |`);
  console.log(`| md | \`${meta.md_path}\` |`);
  console.log("");

  if (meta.cycles.length > 0) {
    console.log("## サイクル履歴");
    console.log("");
    console.log("| # | 仮説 | デプロイ | 計測 | effect |");
    console.log("|---|---|---|---|---|");
    for (const c of meta.cycles) {
      console.log(
        `| ${c.number} | ${(c.hypothesis_ids || []).join("+")} | ${c.deployed_at?.slice(0, 10) || "_"} | ${c.measured_at?.slice(0, 10) || "_"} | ${c.effect ? `effect/${c.effect}` : c.status} |`
      );
    }
    console.log("");
  }

  if (meta.current_cycle) {
    console.log(`## 進行中 cycle: Cycle ${meta.current_cycle.number}`);
    console.log("");
    console.log(`- 状態: ${meta.current_cycle.status}`);
    console.log(`- 仮説: ${(meta.current_cycle.hypothesis_ids || []).join("+")}`);
    if (meta.current_cycle.deployed_at) {
      const d = daysSince(meta.current_cycle.deployed_at);
      console.log(`- デプロイから ${d} 日経過`);
    }
    console.log("");
  }
}

function listReport(includeClosed) {
  const all = loadAllGoals();
  const filtered = includeClosed ? all : all.filter((m) => m.status === "ACTIVE");
  filtered.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));

  if (filtered.length === 0) {
    if (includeClosed) {
      console.log("Goal はまだ登録されていません。");
    } else {
      console.log("進行中の goal はありません。");
      console.log("`/goal define <slug>` で新規登録できます。");
    }
    return;
  }

  console.log(`# Goals (${filtered.length} 件)`);
  console.log("");
  console.log("| Slug | Status | Cycle | 最終更新 | タイトル |");
  console.log("|---|---|---|---|---|");
  const warnings = [];
  for (const m of filtered) {
    const last = m.cycles[m.cycles.length - 1];
    const cycleStr = `${m.cycles.length}/${m.max_cycles}${last?.effect ? ` (${last.effect})` : ""}`;
    const days = daysSince(m.updated_at);
    const updatedStr = `${m.updated_at?.slice(0, 10) || "_"}${days !== null && m.status === "ACTIVE" ? ` (${days}d)` : ""}`;
    console.log(`| ${m.slug} | ${m.status} | ${cycleStr} | ${updatedStr} | ${m.title} |`);

    // 4 週(28 日)無更新の ACTIVE goal を警告
    if (m.status === "ACTIVE" && days !== null && days >= 28) {
      warnings.push(`⚠️ ${m.slug}: ${days} 日無更新 → \`/goal cycle ${m.slug}\` で再開 or \`/goal close ${m.slug} abandoned\``);
    }
  }
  if (warnings.length > 0) {
    console.log("");
    for (const w of warnings) console.log(w);
  }
  console.log("");

  // 進行中 3 個超過警告
  const active = all.filter((m) => m.status === "ACTIVE").length;
  if (active > 3) {
    console.log(`⚠️ 進行中 goal が ${active} 個(推奨上限 3)。focus を保つため一部を close 検討してください。`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.slug) {
    detailReport(args.slug);
  } else {
    listReport(args.all);
  }
}

main();
