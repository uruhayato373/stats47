/**
 * Indexing API compliance regression tests.
 *
 * Google Indexing API は公式に JobPosting / BroadcastEvent VideoObject 専用。
 * stats47 の通常ページ (ranking/area/theme/blog/410) への送信 path が存在しないことを
 * 決定的に保証する。URL Inspection (観測) は維持されることも確認する。
 *
 *   node --test .claude/scripts/search-growth/__tests__/compliance.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");

// needle は連結で作り、この test file 自身が「対象文字列を含むファイル」として
// 走査で誤検知されないようにする。
const PUBLISH_NEEDLE = "urlNotifications" + ".publish";
const INDEXING_CLIENT_NEEDLE = "google" + ".indexing(";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/** 指定ディレクトリ配下の実行スクリプトを walk する (__tests__ は除外)。 */
function walkScripts(rel) {
  const base = path.join(ROOT, rel);
  const out = [];
  const rec = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "__tests__" || e.name === "node_modules") continue;
        rec(p);
      } else if (/\.(mjs|cjs|js)$/.test(e.name)) {
        out.push(p);
      }
    }
  };
  if (fs.existsSync(base)) rec(base);
  return out;
}

test("auto-resubmit.mjs は Indexing API publish path を持たない", () => {
  const src = read(".claude/scripts/gsc/auto-resubmit.mjs");
  assert.ok(!src.includes(PUBLISH_NEEDLE), "urlNotifications.publish が残存している");
  assert.ok(!src.includes(INDEXING_CLIENT_NEEDLE), "google.indexing( クライアント生成が残存している");
  assert.ok(!/from\s+["']googleapis["']/.test(src), "googleapis import が残存している");
});

test("submit-cities-indexing.mjs は Indexing API publish path を持たない", () => {
  const src = read(".claude/scripts/gsc/submit-cities-indexing.mjs");
  assert.ok(!src.includes(PUBLISH_NEEDLE), "urlNotifications.publish が残存している");
  assert.ok(!src.includes(INDEXING_CLIENT_NEEDLE), "google.indexing( クライアント生成が残存している");
  assert.ok(!/from\s+["']googleapis["']/.test(src), "googleapis import が残存している");
});

test(".claude/scripts 配下の全スクリプトが Indexing API publish を参照しない", () => {
  const offenders = [];
  for (const file of walkScripts(".claude/scripts")) {
    const src = fs.readFileSync(file, "utf8");
    if (src.includes(PUBLISH_NEEDLE)) offenders.push(path.relative(ROOT, file));
  }
  assert.deepEqual(
    offenders,
    [],
    `通常運用スクリプトに Indexing API publish path が残存: ${offenders.join(", ")}`
  );
});

test("gsc-auto-resubmit-daily.yml は退役 (schedule トリガー無し・送信しない)", () => {
  const yml = read(".github/workflows/gsc-auto-resubmit-daily.yml");
  assert.ok(!/^\s*schedule:/m.test(yml), "schedule トリガーが残存している (自動送信が起きうる)");
  assert.ok(!/--execute/.test(yml), "--execute で送信するステップが残存している");
  assert.ok(/RETIRED/i.test(yml), "退役マーカーが無い");
});

test("URL Inspection (観測) は維持されている", () => {
  const p = path.join(ROOT, ".claude/scripts/gsc/url-inspection-daily.cjs");
  assert.ok(fs.existsSync(p), "url-inspection-daily.cjs が存在しない (観測 path は維持すべき)");
  const src = fs.readFileSync(p, "utf8");
  assert.ok(/urlInspection/.test(src), "urlInspection 参照が無い (観測 path が壊れている)");
});

test("coverage queue は resubmit ではなく observe-after-fix を使う", () => {
  const src = read(".claude/scripts/gsc/build-coverage-queue.mjs");
  assert.ok(src.includes("observe-after-fix"), "observe-after-fix action が無い");
  // 旧 action 値 "resubmit" が verdict 分類で使われていないこと (後方互換の入力キーは許容)
  assert.ok(
    !/action:\s*"resubmit"/.test(src),
    'classify が action:"resubmit" を返している (observe-after-fix にすべき)'
  );
});
