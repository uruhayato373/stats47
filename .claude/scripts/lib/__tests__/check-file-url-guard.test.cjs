"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { findViolations, inspect } = require("../check-file-url-guard.cjs");

// 検出したい書き方。テンプレートリテラルはこのファイル自身が
// 検査対象から外れている前提で、実物と同じ形を直接書く。
const TEMPLATE_GUARD =
  "if (import.meta.url === `file://" + "${process.argv[1]}`) main();";
const CONCAT_GUARD = 'const u = "file://" + process.argv[1];';

test("テンプレートリテラルでの file:// 連結を検出する", () => {
  const found = findViolations(TEMPLATE_GUARD);
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, "template-literal");
  assert.equal(found[0].line, 1);
});

test("文字列 + での file:// 連結を検出する", () => {
  const found = findViolations(CONCAT_GUARD);
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, "string-concat");
});

test("正しい書き方 (pathToFileURL / new URL) は検出しない", () => {
  const ok = [
    "if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();",
    'const u = new URL("./x.json", import.meta.url);',
    'const p = fileURLToPath(import.meta.url);',
    // 単なる file:// の言及 (コメント・ログ) は連結ではないので通す
    '// 出力は file:// で始まる URL',
    'console.log("file:///tmp/x");',
  ].join("\n");
  assert.deepEqual(findViolations(ok), []);
});

test("行番号を正しく返す", () => {
  const source = ["const a = 1;", "const b = 2;", CONCAT_GUARD].join("\n");
  const found = findViolations(source);
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 3);
});

test("リポジトリ全体に違反が無い", () => {
  const findings = inspect();
  assert.deepEqual(
    findings.map((f) => `${f.file}:${f.line}`),
    [],
    "file:// を文字列連結している。pathToFileURL / new URL を使う",
  );
});
