#!/usr/bin/env node
/**
 * /goal cycle の状態遷移実体スクリプト。
 * meta.json を更新し、md の <!-- CYCLE_INSERTION_POINT --> 以前に cycle セクションを append する。
 *
 * 使い方:
 *   # proposed 状態の cycle を新規作成
 *   node update-cycle.cjs --slug psi-mobile-lcp-2500 --action propose \
 *     --hypothesis-ids "A1,B1,B5" \
 *     --expected-effect "Mobile LCP 16,000ms → 4,000ms" \
 *     --expected-rationale "EXP-003 で一時 785ms 達成実績"
 *
 *   # デプロイ完了
 *   node update-cycle.cjs --slug psi-mobile-lcp-2500 --action deploy --pr 999 --commit abc1234
 *
 *   # 計測完了
 *   node update-cycle.cjs --slug psi-mobile-lcp-2500 --action measure \
 *     --measurement-path ".claude/state/metrics/psi/psi-batch-2026-05-23T...json" \
 *     --measured-value "Mobile LCP 平均 4,200ms / Performance 平均 72"
 *
 *   # 判定確定
 *   node update-cycle.cjs --slug psi-mobile-lcp-2500 --action judge \
 *     --effect partial --judgment-rationale "実測 / 想定 = 60%、経過 4 日"
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

function readMeta(slug) {
  const p = path.join(GOALS_STATE_DIR, slug, "meta.json");
  if (!fs.existsSync(p)) {
    console.error(`ERROR: goal '${slug}' が見つかりません: ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeMeta(slug, meta) {
  const p = path.join(GOALS_STATE_DIR, slug, "meta.json");
  meta.updated_at = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(meta, null, 2) + "\n");
}

function appendCycleToMd(meta, cycleSection) {
  const mdPath = path.join(PROJECT_ROOT, meta.md_path);
  let md = fs.readFileSync(mdPath, "utf8");
  const marker = "<!-- CYCLE_INSERTION_POINT -->";
  const idx = md.indexOf(marker);
  if (idx === -1) {
    // marker なし: そのまま末尾に追加(過去 cycle がある状態)
    md = md.replace(/\n*$/, "\n\n") + cycleSection + "\n";
  } else {
    md = md.slice(0, idx) + cycleSection + "\n\n" + md.slice(idx);
  }
  fs.writeFileSync(mdPath, md);
}

function updateCycleSectionInMd(meta, cycleNumber, replacement) {
  const mdPath = path.join(PROJECT_ROOT, meta.md_path);
  const md = fs.readFileSync(mdPath, "utf8");
  const headerRe = new RegExp(
    `(### Cycle ${cycleNumber}\\s+\\([^)]*\\))[\\s\\S]*?(?=\n### Cycle |\n## |\n<!-- CYCLE_INSERTION_POINT -->)`,
    "m"
  );
  if (!headerRe.test(md)) {
    console.error(`ERROR: Cycle ${cycleNumber} section が md に見つかりません`);
    process.exit(1);
  }
  const updated = md.replace(headerRe, replacement);
  fs.writeFileSync(mdPath, updated);
}

function formatCycleSection(cycle) {
  const lines = [];
  lines.push(`### Cycle ${cycle.number} (${cycle.proposed_at?.slice(0, 10) || "_"} 〜 ${cycle.judged_at?.slice(0, 10) || "進行中"})`);
  lines.push("");
  lines.push(`- **仮説**: ${cycle.hypothesis_ids?.join(" + ") || "_"}`);
  if (cycle.expected_effect) {
    lines.push(`- **想定効果**: ${cycle.expected_effect} [根拠: ${cycle.expected_rationale || "_"}]`);
  }
  if (cycle.pr || cycle.commit_hash) {
    lines.push(`- **施策**: PR #${cycle.pr || "_"} (コミット ${cycle.commit_hash || "_"})`);
  }
  if (cycle.deployed_at) {
    lines.push(`- **デプロイ日**: ${cycle.deployed_at.slice(0, 10)}`);
  }
  if (cycle.measurement_path) {
    lines.push(`- **計測**:`);
    lines.push(`  - 計測日: ${cycle.measured_at?.slice(0, 10) || "_"}`);
    lines.push(`  - 結果: ${cycle.measured_value || "_"}`);
    lines.push(`  - ソース: \`${cycle.measurement_path}\``);
  }
  if (cycle.effect) {
    lines.push(`- **判定**: effect/${cycle.effect} [根拠: ${cycle.judgment_rationale || "_"}]`);
  }
  if (cycle.next_action) {
    lines.push(`- **次サイクル**: ${cycle.next_action}`);
  }
  return lines.join("\n");
}

function appendStatusLog(meta, message) {
  const mdPath = path.join(PROJECT_ROOT, meta.md_path);
  const md = fs.readFileSync(mdPath, "utf8");
  const date = new Date().toISOString().slice(0, 10);
  const log = `- ${date}: ${message}\n`;
  const re = /(## 6\. ステータスログ\s*\n(?:- .+\n)*)/m;
  if (re.test(md)) {
    fs.writeFileSync(mdPath, md.replace(re, (m) => m + log));
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.slug || !args.action) {
    console.error("ERROR: --slug と --action は必須です");
    process.exit(1);
  }

  const meta = readMeta(args.slug);
  if (meta.status !== "ACTIVE") {
    console.error(`ERROR: goal '${args.slug}' は ${meta.status} 状態。cycle 更新できません`);
    process.exit(1);
  }

  const now = new Date().toISOString();

  switch (args.action) {
    case "propose": {
      if (!args["hypothesis-ids"]) {
        console.error("ERROR: --hypothesis-ids が必須です");
        process.exit(1);
      }
      if (meta.cycles.length >= meta.max_cycles) {
        console.error(`ERROR: max_cycles (${meta.max_cycles}) に達しています。close を検討してください`);
        process.exit(1);
      }
      const number = meta.cycles.length + 1;
      const cycle = {
        number,
        status: "proposed",
        hypothesis_ids: args["hypothesis-ids"].split(",").map((s) => s.trim()),
        expected_effect: args["expected-effect"] || null,
        expected_rationale: args["expected-rationale"] || null,
        proposed_at: now,
        pr: null,
        commit_hash: null,
        deployed_at: null,
        measurement_path: null,
        measured_value: null,
        measured_at: null,
        effect: null,
        judgment_rationale: null,
        judged_at: null,
        next_action: null,
      };
      meta.cycles.push(cycle);
      meta.current_cycle = cycle;
      writeMeta(args.slug, meta);

      // md に cycle セクションを追加
      appendCycleToMd(meta, formatCycleSection(cycle));
      appendStatusLog(meta, `Cycle ${number} 開始 (仮説: ${cycle.hypothesis_ids.join("+")})`);
      console.log(`✅ Cycle ${number} を proposed 状態で登録`);
      console.log(`   次: PR 作成 → /goal cycle ${args.slug} (deploy)`);
      break;
    }

    case "deploy": {
      const cycle = meta.current_cycle;
      if (!cycle || cycle.status !== "proposed") {
        console.error(`ERROR: proposed 状態の cycle がありません`);
        process.exit(1);
      }
      cycle.status = "deployed";
      cycle.pr = args.pr || null;
      cycle.commit_hash = args.commit || null;
      cycle.deployed_at = now;
      meta.current_cycle = cycle;
      meta.cycles[cycle.number - 1] = cycle;
      writeMeta(args.slug, meta);

      // md のセクションを更新
      updateCycleSectionInMd(meta, cycle.number, formatCycleSection(cycle));
      appendStatusLog(meta, `Cycle ${cycle.number} デプロイ (PR #${cycle.pr})`);
      console.log(`✅ Cycle ${cycle.number} を deployed 状態に更新`);
      console.log(`   次: 計測 → /goal cycle ${args.slug} (measure)`);
      break;
    }

    case "measure": {
      const cycle = meta.current_cycle;
      if (!cycle || cycle.status !== "deployed") {
        console.error(`ERROR: deployed 状態の cycle がありません`);
        process.exit(1);
      }
      cycle.status = "measured";
      cycle.measurement_path = args["measurement-path"] || null;
      cycle.measured_value = args["measured-value"] || null;
      cycle.measured_at = now;
      meta.current_cycle = cycle;
      meta.cycles[cycle.number - 1] = cycle;
      writeMeta(args.slug, meta);

      updateCycleSectionInMd(meta, cycle.number, formatCycleSection(cycle));
      appendStatusLog(meta, `Cycle ${cycle.number} 計測完了`);
      console.log(`✅ Cycle ${cycle.number} を measured 状態に更新`);
      console.log(`   次: 判定 → /goal cycle ${args.slug} (judge)`);
      break;
    }

    case "judge": {
      const cycle = meta.current_cycle;
      if (!cycle || cycle.status !== "measured") {
        console.error(`ERROR: measured 状態の cycle がありません`);
        process.exit(1);
      }
      const effect = args.effect;
      if (!["full", "partial", "none", "adverse", "pending"].includes(effect)) {
        console.error(`ERROR: --effect は full / partial / none / adverse / pending のいずれか`);
        process.exit(1);
      }
      cycle.status = "judged";
      cycle.effect = effect;
      cycle.judgment_rationale = args["judgment-rationale"] || null;
      cycle.judged_at = now;
      cycle.next_action = args["next-action"] || null;
      meta.cycles[cycle.number - 1] = cycle;
      meta.current_cycle = null; // 判定完了で current をクリア
      writeMeta(args.slug, meta);

      updateCycleSectionInMd(meta, cycle.number, formatCycleSection(cycle));
      appendStatusLog(meta, `Cycle ${cycle.number} effect/${effect} 判定`);
      console.log(`✅ Cycle ${cycle.number} を effect/${effect} で判定`);

      // 撤退条件チェック
      if (cycle.number >= meta.max_cycles) {
        console.log(`⚠️ max_cycles (${meta.max_cycles}) に到達。/goal close ${args.slug} timeout を検討してください`);
      }
      if (effect === "adverse") {
        console.log(`⚠️ effect/adverse: 24 時間以内に revert PR を作成してください (EXP-002 ADVERSE の教訓)`);
      }
      break;
    }

    default:
      console.error(`ERROR: 未知の action: ${args.action}`);
      console.error(`  使用可能: propose / deploy / measure / judge`);
      process.exit(1);
  }
}

main();
