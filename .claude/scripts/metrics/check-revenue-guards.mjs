/**
 * 収益計測の健全性ガード。破れていたら markdown を stdout に出して exit 1 で落ちる。
 *
 * なぜ必要か (2026-09-20):
 *   アフィリエイト観測が 2026-08-28 で止まったまま 3 週間気づかなかった。週次 cron は
 *   success で終わり、止まっていたのは誰も見ない state ファイルの中だけだったためである。
 *   同じ期間に検索流入は 4 週で倍増していたので、「過去最大の流入に対して収益がいくらか
 *   言えない」状態が最も価値の高い時期に続いた。
 *
 *   計測ラベルの欠陥 (impression の 29% が `other`) も同じ性質で、誰かが集計を覗くまで
 *   見えなかった。**見えない劣化を Issue にして毎週目へ入れる**のがこのスクリプトの役割。
 *
 * 閾値の SSOT: .claude/config/revenue-guards.json (ここに直書きしない)
 *
 * 使い方:
 *   node .claude/scripts/metrics/check-revenue-guards.mjs [--asof YYYY-MM-DD]
 *     exit 0 = 全ガード PASS (stdout は空)
 *     exit 1 = 1 つ以上 FAIL (stdout に markdown の本文)
 *     exit 2 = 入力が読めない等の実行時エラー (stderr にメッセージ)
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PROJECT_ROOT } from "./lib/auth.mjs";

const CONFIG_PATH = ".claude/config/revenue-guards.json";
const AFFILIATE_HISTORY = ".claude/state/ads/ga4-affiliate-history.csv";

function parseArgs(argv) {
  const opts = { asof: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--asof") opts.asof = argv[i + 1] ?? null;
  }
  return opts;
}

function readJson(relPath) {
  const p = join(PROJECT_ROOT, relPath);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

/** ga4-affiliate-history.csv の `_all`/`_all` 行だけを新しい順で返す。 */
export function readAffiliateTotals(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    if (cells[idx.affiliate_vertical] !== "_all") continue;
    if (cells[idx.link_position] !== "_all") continue;
    rows.push({
      date: cells[idx.date],
      days: Number(cells[idx.days]),
      impressions: Number(cells[idx.impressions]),
      clicks: Number(cells[idx.clicks]),
    });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/** vertical 別の行から「意図軸が解決していない」表示の比率を出す。 */
export function unresolvedVerticalShare(csvText, date) {
  const lines = csvText.trim().split("\n");
  const header = lines[0].split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  let total = 0;
  let unresolved = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    if (cells[idx.date] !== date) continue;
    const vertical = cells[idx.affiliate_vertical];
    const position = cells[idx.link_position];
    if (vertical === "_all" || position === "_all") continue;
    const imp = Number(cells[idx.impressions]) || 0;
    total += imp;
    if (vertical === "other" || vertical === "(not set)" || vertical === "") {
      unresolved += imp;
    }
  }
  if (total === 0) return null;
  return unresolved / total;
}

/**
 * 全ガードを評価する。純粋関数にしてテストから直接呼べるようにする
 * (I/O は呼び出し側が済ませる)。
 */
export function evaluateGuards({ thresholds, affiliateCsv, asof }) {
  const failures = [];
  const now = new Date(`${asof}T00:00:00Z`);

  if (!affiliateCsv) {
    failures.push({
      id: "affiliate-observation-missing",
      title: "アフィリエイト観測ファイルが無い",
      detail: `\`${AFFILIATE_HISTORY}\` が存在しない。週次 cron \`affiliate-ga4-weekly.yml\` を確認する。`,
    });
    return failures;
  }

  const totals = readAffiliateTotals(affiliateCsv);
  const latest = totals.length > 0 ? totals[totals.length - 1] : null;

  if (!latest) {
    failures.push({
      id: "affiliate-observation-missing",
      title: "アフィリエイト観測行が 1 件も無い",
      detail: `\`${AFFILIATE_HISTORY}\` に \`_all\`/\`_all\` の集計行が無い。`,
    });
    return failures;
  }

  const ageDays = Math.floor(
    (now.getTime() - new Date(`${latest.date}T00:00:00Z`).getTime()) / 86_400_000,
  );
  const maxAge = thresholds.affiliateObservationMaxAgeDays.value;
  if (ageDays > maxAge) {
    failures.push({
      id: "affiliate-observation-stale",
      title: `アフィリエイト観測が ${ageDays} 日古い (上限 ${maxAge} 日)`,
      detail:
        `最終観測 ${latest.date}。週次 cron \`affiliate-ga4-weekly.yml\` の GA4 取得か ` +
        `commit-back が止まっている可能性が高い。この状態では週次収益 (NSM) の ` +
        `アフィリエイト項目が「判定不能」になり、施策の effect 判定もできない。`,
    });
  }

  const share = unresolvedVerticalShare(affiliateCsv, latest.date);
  const maxShare = thresholds.unresolvedVerticalShareMax.value;
  if (share != null && share > maxShare) {
    failures.push({
      id: "affiliate-vertical-unresolved",
      title: `意図軸が未解決の表示が ${(share * 100).toFixed(1)}% (上限 ${(maxShare * 100).toFixed(0)}%)`,
      detail:
        `${latest.date} 時点。\`affiliate_vertical\` が \`other\` の表示が多いと、` +
        `どの意図軸が効くか判定できない。描画コンポーネントがページ文脈値を送っていないかを ` +
        `\`apps/web/src/features/ads/__tests__/affiliate-vertical-label-contract.test.ts\` で確認する。`,
    });
  }

  return failures;
}

function main() {
  const { asof } = parseArgs(process.argv.slice(2));
  const today = asof ?? new Date().toISOString().slice(0, 10);

  const config = readJson(CONFIG_PATH);
  if (!config?.guards) {
    process.stderr.write(`${CONFIG_PATH} が読めない、または guards が無い\n`);
    process.exit(2);
  }

  const csvPath = join(PROJECT_ROOT, AFFILIATE_HISTORY);
  const affiliateCsv = existsSync(csvPath) ? readFileSync(csvPath, "utf-8") : null;

  const failures = evaluateGuards({
    thresholds: config.guards,
    affiliateCsv,
    asof: today,
  });

  if (failures.length === 0) process.exit(0);

  const lines = [];
  lines.push("週次収益 (NSM) を判定できない状態、または計測が劣化した状態を検出しました。");
  lines.push("");
  for (const f of failures) {
    lines.push(`## ${f.title}`);
    lines.push("");
    lines.push(f.detail);
    lines.push("");
  }
  lines.push("## 再現");
  lines.push("");
  lines.push("```bash");
  lines.push("node .claude/scripts/metrics/check-revenue-guards.mjs");
  lines.push("```");
  lines.push("");
  lines.push(`閾値の SSOT: \`${CONFIG_PATH}\``);
  lines.push("正典: `docs/00_プロジェクト管理/02_収益化戦略.md` §1 /");
  lines.push("`.claude/memory/project_monetization_contract.md`");
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(1);
}

// import されたときは main を走らせない (テストから純粋関数だけ使う)
if (process.argv[1] && process.argv[1].endsWith("check-revenue-guards.mjs")) {
  main();
}
