#!/usr/bin/env node
/** Bounded, resumable runner for browser-confirmed blank note cards. */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const value = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const reportPath = resolve(value("--report", "data/note/card-visibility-latest.json"));
const journalPath = resolve(value("--journal", ".local/note-card-repair-journal.json"));
const slug = value("--slug", null);
const maxArticles = Number(value("--max-articles", "1"));
const maxCards = Number(value("--max-cards", "2"));
const commit = args.includes("--commit");
const skipBlocked = args.includes("--skip-blocked");
if (!Number.isInteger(maxArticles) || maxArticles < 1 || maxArticles > 5) throw new Error("--max-articles は1〜5");
if (!Number.isInteger(maxCards) || maxCards < 1 || maxCards > 10) throw new Error("--max-cards は1〜10");
const audit = JSON.parse(readFileSync(reportPath, "utf8"));
if (audit.schemaVersion !== 1 || audit.account !== "stats47" || !Array.isArray(audit.articles)) throw new Error("stats47監査レポートが必要です");
if (commit && Date.now() - Date.parse(audit.generatedAt) > 24 * 60 * 60 * 1000) throw new Error("監査レポートが24時間超。再監査してください");
if (commit && !slug && audit.summary?.checked !== audit.summary?.catalogArticles) throw new Error("全件監査レポートが必要です");
if (slug && !audit.articles.some((row) => row.key === slug)) throw new Error(`監査レポートに記事がありません: ${slug}`);
let journal;
try { journal = JSON.parse(readFileSync(journalPath, "utf8")); } catch { journal = { schemaVersion: 1, account: "stats47", attempts: [] }; }
if (journal.schemaVersion !== 1 || journal.account !== "stats47" || !Array.isArray(journal.attempts)) throw new Error("journal形式が不正です");
const latestAttempt = (target) => journal.attempts.findLast((attempt) => attempt.slug === target.slug && attempt.key === target.key);

const candidates = audit.articles
  .filter((row) => !slug || row.key === slug)
  .filter((row) => !row.issues.some((issue) => ["fetch_failed", "browser_verify_failed", "card_empty_in_public_html", "card_missing_from_public_html"].includes(issue.code)))
  .map((row) => {
    const blank = row.issues.filter((issue) => issue.code === "card_blank_in_browser");
    return { slug: row.key, noteUrl: row.noteUrl, cards: blank
      .filter((issue) => blank.filter((other) => other.url === issue.url).length === 1)
      .map((issue) => ({ url: issue.url, key: issue.key }))
      .filter((card) => {
        const status = latestAttempt({ slug: row.key, ...card })?.status;
        return status !== "verified" && (!skipBlocked || !status);
      }) };
  })
  .filter((row) => row.cards.length)
  .slice(0, maxArticles);
const plan = [];
for (const row of candidates) {
  for (const card of row.cards) {
    if (plan.length >= maxCards) break;
    const target = { slug: row.slug, noteUrl: row.noteUrl, ...card };
    const prior = latestAttempt(target);
    if (prior?.status === "verified") continue;
    if (commit && prior && prior.status !== "verified") throw new Error(`${target.slug} ${target.key}: 前回試行が未完了。journalを確認してください`);
    plan.push(target);
  }
  if (plan.length >= maxCards) break;
}
console.log(JSON.stringify({ commit, skipBlocked, report: reportPath, maxArticles, maxCards, plan }, null, 2));
if (!commit || !plan.length) process.exit(0);

function saveJournal() {
  mkdirSync(dirname(journalPath), { recursive: true });
  writeFileSync(`${journalPath}.tmp`, `${JSON.stringify(journal, null, 2)}\n`);
  renameSync(`${journalPath}.tmp`, journalPath);
}
let completed = 0;
for (const target of plan) {
  const attempt = { ...target, startedAt: new Date().toISOString(), status: "running" };
  journal.attempts.push(attempt);
  saveJournal();
  const repair = spawnSync(process.execPath, [".claude/scripts/note/repair-note-blank-card.mjs", "--slug", target.slug, "--url", target.url, "--expected-key", target.key, "--commit"], { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
  attempt.repairExitCode = repair.status;
  attempt.repairOutput = `${repair.stdout || ""}\n${repair.stderr || ""}`.trim().slice(-2_000);
  if (repair.status !== 0 || repair.error) {
    attempt.status = "repair_failed";
    attempt.finishedAt = new Date().toISOString();
    saveJournal();
    throw new Error(`${target.slug} ${target.url}: 修復失敗。journalを確認してください`);
  }
  const targetReport = resolve(`/tmp/note-card-batch-audit-${target.slug}-${process.pid}-${completed}.json`);
  spawnSync("npm", ["run", "note:cards:audit", "--", "--slug", target.slug, "--browser-verify", "--output", targetReport], { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
  let checked;
  try { checked = JSON.parse(readFileSync(targetReport, "utf8")); } catch { checked = null; }
  const row = checked?.articles?.[0];
  const targetIssues = row?.issues?.filter((issue) => issue.url === target.url && ["card_blank_in_browser", "card_empty_in_public_html"].includes(issue.code)) || [];
  if (!row || checked.summary.fetchFailed || checked.summary.browserVerifyFailedArticles || targetIssues.length) {
    attempt.status = "verification_failed";
    attempt.issues = targetIssues;
    attempt.finishedAt = new Date().toISOString();
    saveJournal();
    throw new Error(`${target.slug} ${target.url}: 公開後検証失敗。次のカードへ進みません`);
  }
  attempt.status = "verified";
  attempt.spacingFollowUp = row.issues.some((issue) => issue.url === target.url && issue.code === "card_extra_blank_paragraph");
  attempt.finishedAt = new Date().toISOString();
  saveJournal();
  completed++;
  console.log(JSON.stringify({ verified: target, completed, remainingInPlan: plan.length - completed }));
}
