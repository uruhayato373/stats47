#!/usr/bin/env node
/**
 * audit-note-unverified.mjs — 「作り手が試していない」断り書き (検証状況・実機確認は未了 など) が
 * 公開本文に残っていないかを検査する。判定は lib/unverified-disclosure.mjs。
 *
 *   node .claude/scripts/note/audit-note-unverified.mjs --file <draft.md|body.txt> [--file ...]   # 公開前 (見つかれば exit 1)
 *   node .claude/scripts/note/audit-note-unverified.mjs --published [--output <json>]              # 公開済み全記事 (週次)
 *
 * --published は記事台帳の公開済み記事を note の公開 API で読む (有料記事は無料部分だけ)。
 * 取得に失敗した記事があれば exit 2 (0 件扱いにしない)。note への書き込みはしない。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findUnverifiedDisclosures, formatDisclosures } from "./lib/unverified-disclosure.mjs";
import { datasetPath } from "../../../config/datasets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const argv = process.argv.slice(2);
const files = argv.flatMap((a, i) => (a === "--file" ? [argv[i + 1]] : []));
const output = argv.includes("--output") ? argv[argv.indexOf("--output") + 1] : null;
const CONCURRENCY = 4;
const RETRIES = 3;

function checkFiles() {
  let failed = 0;
  for (const file of files) {
    if (!file || !existsSync(file)) continue;
    const hits = findUnverifiedDisclosures(readFileSync(file, "utf8"));
    if (!hits.length) continue;
    failed++;
    console.error(`FAIL 未検証の断り書きが本文に残っている: ${file}\n${formatDisclosures(hits)}`);
  }
  if (failed) {
    console.error("検証してから書き直すか、公開しない (.claude/scripts/note/lib/unverified-disclosure.mjs)。");
    process.exit(1);
  }
  console.log(`OK 未検証の断り書きなし (${files.length} files)`);
}

async function fetchPublicBody(noteKey) {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(`https://note.com/api/v3/notes/${noteKey}`);
      if (res.ok) return (await res.json()).data;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function auditPublished() {
  const ledger = JSON.parse(readFileSync(path.join(ROOT, datasetPath("note.articles")), "utf8"));
  const articles = (Array.isArray(ledger) ? ledger : ledger.articles).filter((a) => a.status === "published" && a.noteUrl);
  const queue = [...articles];
  const findings = [];
  const fetchFailed = [];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const a = queue.shift();
      const noteKey = a.noteUrl.split("/n/")[1].split(/[?#]/)[0];
      const data = await fetchPublicBody(noteKey);
      if (!data) { fetchFailed.push(a.key); continue; }
      const hits = findUnverifiedDisclosures(`${data.name}\n${data.body}`);
      if (hits.length) findings.push({ key: a.key, noteUrl: a.noteUrl, title: data.name, isPaid: Boolean(a.isPaid), hits });
    }
  }));
  findings.sort((x, y) => x.key.localeCompare(y.key));
  const report = {
    checkedAt: new Date().toISOString(),
    summary: { total: articles.length, affected: findings.length, fetchFailed: fetchFailed.length },
    fetchFailed,
    findings,
  };
  if (output) writeFileSync(path.resolve(ROOT, output), `${JSON.stringify(report, null, 2)}\n`);
  for (const f of findings) console.log(`- ${f.key} ${f.noteUrl}\n${formatDisclosures(f.hits)}`);
  console.log(`note unverified audit: ${findings.length}/${articles.length} articles affected, fetchFailed=${fetchFailed.length}`);
  if (fetchFailed.length) process.exit(2);
  if (findings.length) process.exit(1);
}

if (argv.includes("--published")) await auditPublished();
else if (files.length) checkFiles();
else { console.error("usage: --file <path> [...] | --published [--output <json>]"); process.exit(64); }
