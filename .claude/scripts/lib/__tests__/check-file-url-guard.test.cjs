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

test("行コメントの中の禁止パターンは違反にしない (規約を説明できる)", () => {
  // ★これを見ないと「なぜ file:// を連結してはいけないか」を書いた行が違反になり、
  //   規約を残せなくなる (commit 件名に skip-ci トークンを引用すると CI が止まるのと同型)。
  const src = [
    "// 文字列連結 (`file://${process.argv[1]}`) は Windows で不一致になる",
    "const ok = pathToFileURL(process.argv[1]).href;",
  ].join("\n");
  assert.deepEqual(findViolations(src), []);
});

test("コードに書かれた禁止パターンは、同じ行にコメントがあっても検出する", () => {
  const src = "const bad = `file://${p}`; // これは本物の違反";
  const found = findViolations(src);
  assert.equal(found.length, 1);
  assert.equal(found[0].kind, "template-literal");
});

test("文字列リテラル内の // をコメント開始と誤認しない", () => {
  const src = 'const u = "https://example.com"; const bad = "file://" + p;';
  assert.equal(findViolations(src).length, 1, "URL の // でコメント扱いして違反を見逃している");
});
