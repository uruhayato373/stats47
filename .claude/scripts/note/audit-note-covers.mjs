#!/usr/bin/env node
/** Read-only note カバー監査。入口・終了コードは audit-ogp-images/SKILL.md。 */
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditNoteCovers, coverAuditExitCode } from "./lib/cover-audit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Usage: npm run note:covers:audit -- [--output <file>]\nExit: 0=全件設定済み・集合一致 / 1=未設定またはカタログ差分 / 2=取得失敗・不完全\n公開記事だけをGETで確認。画像生成・note更新・R2書き込みなし。");
  process.exit(0);
}
let output = resolve(ROOT, ".claude/state/metrics/note-cover-audit-latest.json");
if (args.length) {
  if (args.length !== 2 || args[0] !== "--output" || !args[1] || args[1].startsWith("--")) {
    console.error("Invalid arguments. Use --help.");
    process.exit(2);
  }
  output = resolve(args[1]);
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "stats47-note-cover-audit/1.0", "cache-control": "no-cache" },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return await response.json();
      await response.body?.cancel();
      const error = new Error(`HTTP ${response.status}: ${url}`);
      if (response.status !== 429 && response.status < 500) { error.noRetry = true; throw error; }
      throw error;
    } catch (error) {
      lastError = error;
      if (error.noRetry) break;
      if (attempt < 2) await new Promise((done) => setTimeout(done, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

let report;
try {
  const catalog = JSON.parse(execFileSync(process.execPath,
    ["--import", "tsx", resolve(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts")],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  ));
  console.log("[note-cover] 公開一覧全ページ・カタログ・v3記事詳細を取得中...");
  report = await auditNoteCovers({ catalog, fetchJson });
} catch (error) {
  report = { schemaVersion: 1, generatedAt: new Date().toISOString(), account: "stats47", status: "incomplete", summary: null, coverage: { complete: false, issues: [{ code: "audit_failed", detail: String(error.message || error) }] } };
}
mkdirSync(dirname(output), { recursive: true });
const temporaryOutput = `${output}.${process.pid}.tmp`;
writeFileSync(temporaryOutput, `${JSON.stringify(report, null, 2)}\n`);
renameSync(temporaryOutput, output);
console.log(`[note-cover] ${report.status.toUpperCase()}`);
if (report.summary) {
  const s = report.summary;
  console.log(`確認対象 ${s.total}: 設定済み ${s.configured} / 未設定 ${s.missing} / 不明 ${s.unknown}`);
  console.log(`未設定だが一覧に本文画像あり: ${s.bodyImageUsedInList}`);
  console.log(`都道府県別家計調査: ${JSON.stringify(report.groups.prefectureHousehold)}`);
  console.log(`カタログ差分: liveのみ ${report.catalogDifferences.liveOnly.length} / catalogのみ ${report.catalogDifferences.catalogOnly.length}`);
  for (const article of report.articles.filter((a) => a.cover.status !== "configured")) {
    console.log(`  ${article.cover.status} | ${article.catalogKey || article.noteKey} | ${article.noteUrl} | ${article.cover.reason}`);
  }
}
for (const issue of report.coverage.issues) console.error(`[note-cover] ${JSON.stringify(issue)}`);
console.log(`report: ${output}`);
process.exitCode = coverAuditExitCode(report);
