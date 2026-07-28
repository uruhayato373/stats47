/**
 * asp-browser-base の artifact 保護 (maskSecrets / cleanupOldDebugDirs) のテスト (doc 42 §16.1)。
 * raw secret / email / token / cookie / account header を artifact へ残さないことを検証する。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { maskSecrets, cleanupOldDebugDirs, DEBUG_RETENTION_DAYS } from "../lib/asp-browser-base.mjs";

test("maskSecrets: email / Bearer / access_token を伏せる (既存挙動)", () => {
  const out = maskSecrets("mail=foo@example.com Authorization: Bearer abc.def-123 \"access_token\":\"xyz\"");
  assert.ok(!out.includes("foo@example.com"));
  assert.ok(!out.includes("abc.def-123"));
  assert.ok(!out.includes('"xyz"'));
});

test("maskSecrets: cookie / CSRF / session / JWT を伏せる (2026-07-29 拡張)", () => {
  const input = [
    "Set-Cookie: PHPSESSID=deadbeef1234; path=/",
    "cookie: a8_session=secretvalue999",
    'csrf_token="AbCdEf123456789"',
    "session_id=0123456789abcdef",
    "jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpM",
  ].join("\n");
  const out = maskSecrets(input);
  assert.ok(!out.includes("deadbeef1234"));
  assert.ok(!out.includes("secretvalue999"));
  assert.ok(!out.includes("AbCdEf123456789"));
  assert.ok(!out.includes("0123456789abcdef"));
  assert.ok(!out.includes("eyJhbGciOiJIUzI1NiJ9"));
});

test("maskSecrets: 口座 ID・氏名のアカウントヘッダ表示を伏せる", () => {
  const out = maskSecrets("南大輔さん（ID：460158） ログアウト / メディアID a25050375786");
  assert.ok(!out.includes("460158"));
  assert.ok(!out.includes("a25050375786"));
  assert.ok(!out.includes("南大輔"), `氏名が残っている: ${out}`);
});

test("cleanupOldDebugDirs: retention 超過ディレクトリだけ削除・ファイルと新しい dir は残す", () => {
  const root = mkdtempSync(join(tmpdir(), "asp-debug-test-"));
  mkdirSync(join(root, "old-run"));
  mkdirSync(join(root, "new-run"));
  writeFileSync(join(root, "scan-result.json"), "{}");
  // nowMs を retention+1 日進める → 実 mtime (今) から見て old 扱いになる
  const future = Date.now() + (DEBUG_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000;
  const removed = cleanupOldDebugDirs(root, { nowMs: future });
  assert.deepEqual(removed.sort(), ["new-run", "old-run"]); // 両方 retention 超過
  assert.ok(existsSync(join(root, "scan-result.json")), "直下ファイルは消さない");

  // 全 dir が新しければ何も消さない
  mkdirSync(join(root, "fresh"));
  assert.deepEqual(cleanupOldDebugDirs(root, { nowMs: Date.now() }), []);
  assert.ok(existsSync(join(root, "fresh")));
});

test("cleanupOldDebugDirs: root 不在なら no-op", () => {
  assert.deepEqual(cleanupOldDebugDirs("/nonexistent-path-for-test"), []);
});
