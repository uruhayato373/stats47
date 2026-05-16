#!/usr/bin/env node
/**
 * deploy 完了時の improvement-log への自動追記。
 *
 * commit message から施策 ID（EXP-NNN / EXP-NNNNa-z / T0/T1/T2/T3-XXX-NN）を抽出し、
 * 該当する improvement-log.md に `### <ID> | deploy YYYY-MM-DD | commit <sha>` の
 * 1 行スタブを append する。effect/pending 状態として記録され、後で人間が判定する。
 *
 * カテゴリ判定:
 * - PSI / LCP / CLS / CWV / performance → performance-improvement
 * - GSC / sitemap / indexing → gsc-improvement
 * - SNS / instagram / youtube post → sns-metrics-improvement
 * - その他は performance-improvement にフォールバック
 *
 * 既に同 ID のエントリがあれば skip（冪等）。
 *
 * Usage:
 *   node .claude/scripts/lib/append-improvement-log.mjs \
 *     --message "feat(lcp): EXP-005 banner ssr" \
 *     --sha abc1234 \
 *     --date 2026-05-16
 *
 *   GitHub Actions:
 *     node .claude/scripts/lib/append-improvement-log.mjs \
 *       --message "$(git log -1 --pretty=%s%n%b HEAD)" \
 *       --sha "${GITHUB_SHA::7}" \
 *       --date "$(date -u +%Y-%m-%d)"
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const message = getArg("--message") || "";
const sha = getArg("--sha") || "";
const date = getArg("--date") || new Date().toISOString().slice(0, 10);
const DRY_RUN = args.includes("--dry-run");

// 施策 ID 抽出
const ID_PATTERN = /\b(EXP-\d{3,}[a-z]?|T[0-3]-[A-Z]+(?:-[A-Z]+)*-\d{2,})\b/g;
const ids = [...new Set(Array.from(message.matchAll(ID_PATTERN), (m) => m[1]))];

if (ids.length === 0) {
  console.log("[append-improvement-log] No EXP-* or T[0-3]-* ID in commit message. Skip.");
  process.exit(0);
}

const KEYWORDS = {
  performance: /\b(LCP|CLS|FCP|TBT|INP|CWV|PSI|performance|lcp|cls|fcp|tbt|cwv|psi|leaflet|adsense.*lazy|banner.*ssr)\b/i,
  gsc: /\b(GSC|sitemap|indexing|search.console|robots|crawl|coverage|hreflang|canonical)\b/i,
  sns: /\b(SNS|instagram|tiktok|youtube.*post|publish-youtube|hashtag|engagement)\b/i,
  ga4: /\b(GA4|analytics|engagement.*session|bounce)\b/i,
  adsense: /\b(AdSense|ads\.txt|adunit)\b/i,
};

function categorize(msg) {
  for (const [cat, re] of Object.entries(KEYWORDS)) {
    if (re.test(msg)) return cat;
  }
  return "performance";
}

const CATEGORY_TO_FILE = {
  performance: ".claude/skills/analytics/performance-improvement/reference/improvement-log.md",
  gsc: ".claude/skills/analytics/gsc-improvement/reference/improvement-log.md",
  sns: ".claude/skills/analytics/sns-metrics-improvement/reference/improvement-log.md",
  ga4: ".claude/skills/analytics/ga4-improvement/reference/improvement-log.md",
  adsense: ".claude/skills/analytics/adsense-improvement/reference/improvement-log.md",
};

const category = categorize(message);
const logPath = path.join(PROJECT_ROOT, CATEGORY_TO_FILE[category] || CATEGORY_TO_FILE.performance);

if (!existsSync(logPath)) {
  console.log(`[append-improvement-log] log file not found: ${logPath}. Skip.`);
  process.exit(0);
}

const log = readFileSync(logPath, "utf-8");

const newEntries = [];
for (const id of ids) {
  if (log.includes(`### [${id}]`) || log.includes(`### ${id}`)) {
    console.log(`[append-improvement-log] ${id} already in log. Skip.`);
    continue;
  }
  const title = message.split("\n")[0].slice(0, 80);
  const stub = [
    `### [${id}] ${title}`,
    ``,
    `- **デプロイ日**: ${date} / コミット: \`${sha}\``,
    `- **想定効果**: (未記入 — \`.claude/rules/evidence-based-judgment.md\` に従って記入)`,
    `- **検証コマンド**: (未記入)`,
    `- **実測 (before)**: (未記入)`,
    `- **実測 (after)**: (未記入)`,
    `- **判定**: \`effect/pending\` — 自動 stub。判定は次の週次レビューで埋める`,
    `- **未確定 / 仮説**: 自動 stub。Append-only ルールに従い、後続で更新する場合は新エントリを追加`,
    ``,
    `_Auto-stub by \`.claude/scripts/lib/append-improvement-log.mjs\`_`,
    ``,
  ].join("\n");
  newEntries.push(stub);
}

if (newEntries.length === 0) {
  console.log("[append-improvement-log] All IDs already logged. Nothing to do.");
  process.exit(0);
}

const appended = log.trimEnd() + "\n\n---\n\n" + newEntries.join("\n---\n\n");

if (DRY_RUN) {
  console.log(`[dry-run] would append ${newEntries.length} entries to ${logPath}:\n`);
  console.log(newEntries.join("\n---\n\n"));
  process.exit(0);
}

writeFileSync(logPath, appended, "utf-8");
console.log(`✓ Appended ${newEntries.length} stub(s) to ${logPath} (category: ${category})`);
