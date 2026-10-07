#!/usr/bin/env node
/**
 * note 原稿の画像資産契約の検査 (契約: .claude/rules/note-image-assets.md)。
 *
 *   node .claude/scripts/note/audit-note-image-assets.mjs            # 違反があれば exit 1
 *   node .claude/scripts/note/audit-note-image-assets.mjs --json     # 機械可読 (週次レビュー用)
 *   node .claude/scripts/note/audit-note-image-assets.mjs --verify-r2
 *       上に加え、catalog が r2_body:true とする記事の本文が R2 に実在するかを確認する (ネットワーク要・週次用)。
 *       確認できなかった (通信失敗) 場合は 0 件扱いにせず exit 2。
 *   node .claude/scripts/note/audit-note-image-assets.mjs --write-budget
 *       追跡中 PNG の予算を現在値へ「下げる」。上げる場合は --write-budget --allow-increase (理由をコミットに残す)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCS31, auditBackgroundPresence, auditImageAssets, auditR2BodyPresence } from "./lib/image-assets-audit.mjs";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";
import { datasetPath } from "../../../config/datasets.mjs";

const ROOT = process.env.CLAUDE_PROJECT_DIR || resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const BUDGET_PATH = resolve(ROOT, ".claude/config/note-image-assets-budget.json");
const args = new Set(process.argv.slice(2));

const git = (...gitArgs) =>
  execFileSync("git", ["-c", "core.quotepath=off", ...gitArgs], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\n")
    .filter(Boolean);

const tracked = git("ls-files", "--", DOCS31);
// 作業ツリーにだけある「無視された」ファイル。CI checkout では空になる (それで良い)
const ignoredUntracked = git("ls-files", "--others", "--ignored", "--exclude-standard", "--", DOCS31);

const pngBytes = new Map();
for (const file of tracked.filter((f) => /\.png$/i.test(f))) {
  const abs = resolve(ROOT, file);
  if (existsSync(abs)) pngBytes.set(file, statSync(abs).size);
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, file), "utf8"));
  } catch {
    return null;
  }
};

const readText = (file) => {
  try {
    return readFileSync(resolve(ROOT, file), "utf8");
  } catch {
    return null;
  }
};

const budget = readJson(".claude/config/note-image-assets-budget.json");
const { findings, summary } = auditImageAssets({ tracked, ignoredUntracked, pngBytes, readJson, readText, budget });

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
let r2Unknown = [];
let r2Checked = 0;
if (args.has("--verify-r2")) {
  const articles = readJson(datasetPath("note.published-urls"))?.articles ?? {};
  const statusByPath = new Map();
  await Promise.all(
    Object.values(articles)
      .filter((a) => a.r2_body && a.r2_path && !a.is_paid)
      .map(async (a) => {
        try {
          const res = await fetch(`${R2_BASE}/${a.r2_path}/draft.md`, { method: "HEAD", signal: AbortSignal.timeout(20_000) });
          statusByPath.set(a.r2_path, res.status);
        } catch {
          statusByPath.set(a.r2_path, 0);
        }
      }),
  );
  const r2 = auditR2BodyPresence(articles, statusByPath, budget?.r2BodyMissingKnown ?? []);
  findings.push(...r2.findings);
  r2Unknown = r2.unknown;
  r2Checked = r2.checked;
  // 生成 AI の背景 (作り直せない入力) が R2 に実在するか
  const backgrounds = tracked
    .filter((file) => file.endsWith("/render-spec.json"))
    .map((file) => ({ slug: file.split("/")[2], background: readJson(file)?.background }))
    .filter((entry) => entry.background?.r2Key)
    .map((entry) => ({ slug: entry.slug, r2Key: entry.background.r2Key }));
  const bgStatus = new Map();
  await Promise.all(
    backgrounds.map(async ({ r2Key }) => {
      try {
        bgStatus.set(r2Key, (await fetch(`${R2_BASE}/${r2Key}`, { method: "HEAD", signal: AbortSignal.timeout(20_000) })).status);
      } catch {
        bgStatus.set(r2Key, 0);
      }
    }),
  );
  const bg = auditBackgroundPresence(backgrounds, bgStatus);
  findings.push(...bg.findings);
  r2Unknown = [...r2Unknown, ...bg.unknown];
  summary.backgroundsChecked = bg.checked;
  summary.r2BodyChecked = r2Checked;
  summary.r2BodyMissingKnown = (budget?.r2BodyMissingKnown ?? []).length;
  summary.r2BodyUnverified = r2Unknown.length;
}

if (args.has("--write-budget")) {
  const next = { trackedPngBytes: summary.trackedPngBytes, trackedPngCount: summary.trackedPngCount, r2BodyMissingKnown: budget?.r2BodyMissingKnown ?? [] };
  const grows = budget && (next.trackedPngBytes > budget.trackedPngBytes || next.trackedPngCount > budget.trackedPngCount);
  if (grows && !args.has("--allow-increase")) {
    console.error("✗ 予算は縮小専用。増やす場合は --allow-increase を付け、理由をコミットメッセージに残す");
    process.exit(1);
  }
  mkdirSync(dirname(BUDGET_PATH), { recursive: true });
  writeFileSync(BUDGET_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`✓ 予算を更新: ${next.trackedPngCount} 枚 / ${next.trackedPngBytes} bytes`);
  process.exit(0);
}

if (args.has("--json")) {
  console.log(JSON.stringify({ summary, budget, findings }, null, 2));
} else if (findings.length === 0) {
  const mb = (summary.trackedPngBytes / 1e6).toFixed(1);
  console.log(
    `✓ note 画像資産 OK — 追跡 PNG ${summary.trackedPngCount} 枚 (${mb}MB) / 再生成元なし ${summary.sourcelessTrackedPng} 枚 ${JSON.stringify(summary.sourcelessByClass)} / ランキング記事 ${summary.rankingArticles} 本`,
  );
} else {
  console.error(`✗ note 画像資産: ${findings.length} 件の違反 (契約 .claude/rules/note-image-assets.md)`);
  const shown = findings.slice(0, 40);
  for (const f of shown) console.error(`  [${f.code}] ${f.file}: ${f.message}`);
  if (findings.length > shown.length) console.error(`  ... 他 ${findings.length - shown.length} 件 (--json で全件)`);
}
// 通信できず確認できなかった記事があるのに 0 件で通すと、欠落を見逃す。判定不能は exit 2
if (r2Unknown.length && !findings.length) {
  console.error(`✗ R2 の実在確認が ${r2Unknown.length} 件できなかった (通信失敗)。0 件扱いにしない: ${r2Unknown.slice(0, 5).join(", ")}`);
  process.exitCode = 2;
} else {
  process.exitCode = findings.length ? 1 : 0;
}
