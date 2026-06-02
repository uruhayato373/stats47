#!/usr/bin/env node
/**
 * select-conformance-candidates.mjs
 *
 * 「表現正典化スイープ (catch-up)」用の候補選定。GSC 非依存。
 * select-brushup-candidates.mjs は GSC snapshot 必須 (CTR 改善余地ベース) だが、本スクリプトは
 * audit-published-blog.mjs の出力 (公開記事の blocker 棚卸し) を入力に、blocker の多い記事から
 * N 件を選ぶ。クラウドルーティン (blog-auto-brushup-cloud-routine) の catch-up フェーズ用。
 *
 * 入力: audit JSON (audit-published-blog.mjs --json の出力)。{ results: [{slug, blockers, flags, ...}] }
 * 除外: auto-brushup-history.json で直近 --cooldown 日以内に改修済みの slug (チャーン防止)
 * 並び: blocker 数 降順 → prose 昇順 (薄い順) → slug。GSC が無くても決定的。
 *
 * Usage:
 *   node .claude/scripts/blog/select-conformance-candidates.mjs [--audit <path>] [--count 10] [--cooldown 21]
 *
 * 出力 (1 行 1 candidate, JSON):
 *   { "slug": "...", "blockers": 8, "prose": 1924, "topFlags": ["...","..."] }
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const AUDIT_PATH = getArg("--audit", "/tmp/published-blog-audit.json");
const COUNT = parseInt(getArg("--count", "10"), 10);
const COOLDOWN_DAYS = parseInt(getArg("--cooldown", "21"), 10);

if (!fs.existsSync(AUDIT_PATH)) {
  console.error(
    `[error] audit JSON not found: ${AUDIT_PATH}\n` +
      `  先に: node .claude/scripts/blog/audit-published-blog.mjs --json ${AUDIT_PATH}`
  );
  process.exit(2);
}

const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
const results = audit.results || audit.articles || [];

// cooldown: 直近 N 日以内に改修済みの slug を除外
const historyPath = path.join(PROJECT_ROOT, ".claude/state/blog/auto-brushup-history.json");
const recentlyBrushed = new Set();
if (fs.existsSync(historyPath)) {
  const hist = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  const cutoff = Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  for (const e of hist.entries || []) {
    const t = Date.parse(e.date);
    if (Number.isFinite(t) && t >= cutoff) recentlyBrushed.add(e.slug);
  }
}

const candidates = results
  .filter((a) => (a.blockers || 0) > 0)
  .filter((a) => !recentlyBrushed.has(a.slug))
  .sort(
    (a, b) =>
      (b.blockers || 0) - (a.blockers || 0) || // blocker 多い順
      (a.prose || 0) - (b.prose || 0) || // 薄い順
      a.slug.localeCompare(b.slug)
  )
  .slice(0, COUNT);

for (const c of candidates) {
  const topFlags = (c.flags || [])
    .filter((f) => f[0] === "blocker")
    .slice(0, 4)
    .map((f) => f[1]);
  process.stdout.write(
    JSON.stringify({ slug: c.slug, blockers: c.blockers, prose: c.prose, topFlags }) + "\n"
  );
}

if (candidates.length === 0) {
  console.error("[info] blocker のある未改修記事なし (catch-up 完了済みの可能性)");
}
