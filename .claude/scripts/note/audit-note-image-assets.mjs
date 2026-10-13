#!/usr/bin/env node
/**
 * note 記事の画像・データ資産の契約の検査 (契約: .claude/rules/note-image-assets.md)。
 *
 *   node .claude/scripts/note/audit-note-image-assets.mjs            # docs/31 に git の追跡ファイルがあれば exit 1
 *   node .claude/scripts/note/audit-note-image-assets.mjs --json     # 機械可読 (週次レビュー用)
 *   node .claude/scripts/note/audit-note-image-assets.mjs --verify-r2
 *       上に加え、台帳 (data/note/articles.json) が公開 R2 に保存済みとする本文と、ランキング記事の
 *       render-spec.json が参照する生成 AI の背景が R2 に実在するかを確認する (ネットワーク要・週次用)。
 *       確認できなかった (通信失敗) 場合は 0 件扱いにせず exit 2。private R2 の本文は note:article verify が見る。
 */
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCS31, auditBackgroundPresence, auditImageAssets, auditR2BodyPresence, isRankingArticleSlug } from "./lib/image-assets-audit.mjs";
import { readArticleLedger } from "./lib/article-ledger.mjs";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";

const ROOT = process.env.CLAUDE_PROJECT_DIR || resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = new Set(process.argv.slice(2));

const tracked = execFileSync("git", ["-c", "core.quotepath=off", "ls-files", "--", DOCS31], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const { findings, summary } = auditImageAssets({ tracked });

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const head = async (url) => {
  try {
    return (await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(20_000) })).status;
  } catch {
    return 0;
  }
};
let unknown = [];
if (args.has("--verify-r2")) {
  const articles = readArticleLedger(ROOT).articles;
  const publicSaved = articles.filter((a) => a.body.store === "r2-public" && a.body.manifest);
  const statusByPath = new Map(await Promise.all(publicSaved.map(async (a) => [a.r2Path, await head(`${R2_BASE}/${a.r2Path}/draft.md`)])));
  const r2 = auditR2BodyPresence(articles, statusByPath);
  findings.push(...r2.findings);
  unknown = r2.unknown;
  summary.r2BodyChecked = r2.checked;
  // 生成 AI の背景 (作り直せない入力) が R2 に実在するか。spec は公開 R2 の記事本文と一緒にある
  const backgrounds = [];
  await Promise.all(
    publicSaved.filter((a) => isRankingArticleSlug(a.key)).map(async (a) => {
      try {
        const res = await fetch(`${R2_BASE}/${a.r2Path}/render-spec.json`, { signal: AbortSignal.timeout(20_000) });
        if (res.status === 404) return;
        if (!res.ok) throw Error(String(res.status));
        const r2Key = (await res.json())?.background?.r2Key;
        if (r2Key) backgrounds.push({ slug: a.key, r2Key });
      } catch {
        unknown.push(a.key);
      }
    }),
  );
  const bgStatus = new Map(await Promise.all(backgrounds.map(async ({ r2Key }) => [r2Key, await head(`${R2_BASE}/${r2Key}`)])));
  const bg = auditBackgroundPresence(backgrounds, bgStatus);
  findings.push(...bg.findings);
  unknown = [...unknown, ...bg.unknown];
  summary.backgroundsChecked = bg.checked;
  summary.r2Unverified = unknown.length;
}

if (args.has("--json")) {
  console.log(JSON.stringify({ summary, findings }, null, 2));
} else if (findings.length === 0) {
  console.log(`✓ note 画像資産 OK — docs/31 の追跡 0 件${summary.r2BodyChecked !== undefined ? ` / 公開 R2 の本文 ${summary.r2BodyChecked} 件・背景 ${summary.backgroundsChecked} 件を確認` : ""}`);
} else {
  console.error(`✗ note 画像資産: ${findings.length} 件の違反 (契約 .claude/rules/note-image-assets.md)`);
  const shown = findings.slice(0, 40);
  for (const f of shown) console.error(`  [${f.code}] ${f.file}: ${f.message}`);
  if (findings.length > shown.length) console.error(`  ... 他 ${findings.length - shown.length} 件 (--json で全件)`);
}
// 通信できず確認できなかった記事があるのに 0 件で通すと、欠落を見逃す。判定不能は exit 2
if (unknown.length && !findings.length) {
  console.error(`✗ R2 の実在確認が ${unknown.length} 件できなかった (通信失敗)。0 件扱いにしない: ${unknown.slice(0, 5).join(", ")}`);
  process.exitCode = 2;
} else {
  process.exitCode = findings.length ? 1 : 0;
}
