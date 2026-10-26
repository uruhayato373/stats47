#!/usr/bin/env node
/**
 * 週次監査をまとめて走らせ、結果の要約表を出す (2026-10-26 に CI の週次監査 11 本を週次レビューへ移した)。
 *
 * Usage:
 *   npm run weekly:audits                       # 全部を 1 本ずつ順に走らせる
 *   npm run weekly:audits -- --only ci-health,provenance
 *   npm run weekly:audits -- --list
 *
 * 各監査の手順は weekly-audits/<id>.sh (旧 workflow の監査部分だけを移したもの)。Issue の作成と push はしない。
 * 毎週は土曜ランナー (scripts/scheduled/weekly-saturday.sh) が専用 clone で走らせ、監査が書いた記録をコミットする。
 * 手で走らせたときは、監査が書いた data/ の記録を週次レビューのセッションがレビュー本文と一緒にコミットする。
 * 1 本ずつ順に走らせるのは、backlog.md を書く監査が 2 本 (estat-year-coverage・blog-remediation) あり、
 * 文書を検査する consistency は他の監査が書き終えた後に走らせる必要があるため。
 * 出力: .local/weekly-audits/<YYYY-MM-DD>/{<id>.log,summary.md,summary.json}。1 本でも落ちたら exit 1。
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, createWriteStream } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRIPTS = ".claude/scripts/management/weekly-audits";

// 時間制限 (分) は旧 workflow と同じ。ただし internal-links は Mac からだと CI の十数倍かかる (2026-10-26 実測: ページ側の
// リンク 4,782 件が CI は 4 分、Mac は 20 分で 1,600 件。東京の edge にキャッシュが無く 1 件 4〜6 秒の SSR になる) ので広げた。
// consistency は文書の最終状態を見るので最後に置く
const AUDITS = [
  { id: "ci-health", label: "CI の健全性 (連続失敗の cron・配信データの鮮度)", timeout: 15 },
  { id: "internal-links", label: "サイト内リンク", timeout: 90 },
  { id: "provenance", label: "出典・再現性", timeout: 30 },
  { id: "ranking-integrity", label: "ランキングのデータ整合・データ品質キュー", timeout: 30 },
  { id: "estat-year-coverage", label: "e-Stat の年カバレッジ", timeout: 60 },
  { id: "estat-ssds", label: "SSDS 指標の列挙", timeout: 20 },
  { id: "survey-taxonomy", label: "調査分類・survey portfolio", timeout: 35 },
  { id: "note-circulation", label: "note の公開記事・導線・マガジン・カード", timeout: 60 },
  { id: "note-product-cards", label: "note の商品カード", timeout: 30 },
  { id: "blog-remediation", label: "ブログの是正キュー・公開済み原稿の掃除", timeout: 25 },
  { id: "consistency", label: "agent・skill・文書・公開 snapshot の整合", timeout: 10 },
];

function parseArgs(argv) {
  const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1]?.split(",").filter(Boolean) : null;
  return { only, list: argv.includes("--list") };
}

function runOne(audit, logPath) {
  return new Promise((done) => {
    const started = Date.now();
    const log = createWriteStream(logPath);
    // 台本の下で動く node まで止めるため、別のプロセスグループで起動してグループごと止める (bash だけ止めると
    // 子の node が出力をつかんだまま残り、close が来ずに後続の監査が始まらない。2026-10-26 に internal-links で実測)
    const child = spawn("bash", [join(SCRIPTS, `${audit.id}.sh`)], { cwd: ROOT, env: process.env, detached: true });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    const timer = setTimeout(() => {
      log.write(`\n[run-weekly-audits] ${audit.timeout} 分の時間制限で止めた\n`);
      process.kill(-child.pid, "SIGTERM");
    }, audit.timeout * 60_000);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      log.end();
      const status = signal ? "timeout" : code === 0 ? "pass" : "fail";
      done({ id: audit.id, label: audit.label, status, code, minutes: Math.round((Date.now() - started) / 6000) / 10, log: logPath });
    });
  });
}

const args = parseArgs(process.argv.slice(2));
if (args.list) {
  for (const a of AUDITS) console.log(`${a.id}\t${a.label}`);
  process.exit(0);
}
const unknown = (args.only ?? []).filter((id) => !AUDITS.some((a) => a.id === id));
if (unknown.length) {
  console.error(`未知の監査: ${unknown.join(", ")} (--list で一覧)`);
  process.exit(2);
}
const targets = args.only ? AUDITS.filter((a) => args.only.includes(a.id)) : AUDITS;
const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
const outDir = join(ROOT, ".local/weekly-audits", day);
mkdirSync(outDir, { recursive: true });

const results = [];
for (const audit of targets) {
  process.stdout.write(`▶ ${audit.id} (${audit.label}) ... `);
  const r = await runOne(audit, join(outDir, `${audit.id}.log`));
  console.log(`${r.status} ${r.minutes} 分`);
  results.push(r);
}

const mark = { pass: "✅ 通過", fail: "❌ 異常あり", timeout: "⏱ 時間切れ" };
const table = [
  "| 監査 | 結果 | 所要 (分) | ログ |",
  "|---|---|---|---|",
  ...results.map((r) => `| ${r.label} (\`${r.id}\`) | ${mark[r.status]} | ${r.minutes} | \`${r.log.replace(`${ROOT}/`, "")}\` |`),
].join("\n");
writeFileSync(join(outDir, "summary.md"), `# 週次監査 ${day}\n\n${table}\n`);
writeFileSync(join(outDir, "summary.json"), JSON.stringify({ day, results }, null, 2) + "\n");
console.log(`\n${table}`);
process.exit(results.every((r) => r.status === "pass") ? 0 : 1);
