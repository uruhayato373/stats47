import assert from "node:assert/strict";
import test from "node:test";
import { replaceRepoPaths, reviewLines, rewriteRelative } from "../move-script.mjs";

const OLD = ".claude/scripts/lib/x-lint.mjs";
const NEW = "packages/ops/src/blog/lint/x-lint.mjs";
const moved = new Map([[OLD, NEW], [".claude/scripts/lib/y-lint.mjs", "packages/ops/src/blog/lint/y-lint.mjs"]]);
const exists = (file) => ["config/datasets.mjs", "packages/area/mirror/prefectures.cjs", "."].includes(file);

test("読む側の相対パスは、移した先への相対パスに書き換える (拡張子の有無はそのまま)", () => {
  const reader = ".claude/scripts/blog/quality-gate.mjs";
  const text = `import { a } from '../lib/x-lint.mjs';\nconst b = require("../lib/y-lint");\nimport c from "../lib/untouched.mjs";`;
  assert.equal(
    rewriteRelative(text, reader, reader, moved, exists),
    `import { a } from '../../../packages/ops/src/blog/lint/x-lint.mjs';\nconst b = require("../../../packages/ops/src/blog/lint/y-lint");\nimport c from "../lib/untouched.mjs";`,
  );
});

test("移したファイル自身の読みは、新しい場所からの相対パスに付け替える", () => {
  const text = [
    `import { d } from "../../../config/datasets.mjs";`,
    `import { P } from "../../../packages/area/mirror/prefectures.cjs";`,
    `import { y } from "./y-lint.mjs";`,
    `const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");`,
  ].join("\n");
  assert.equal(rewriteRelative(text, OLD, NEW, moved, exists), [
    `import { d } from "../../../../../config/datasets.mjs";`,
    `import { P } from "../../../../area/mirror/prefectures.cjs";`,
    `import { y } from "./y-lint.mjs";`,
    `const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");`,
  ].join("\n"));
});

test("パスでない文字列は触らない (検査が比べる文字列・実行場所からの相対パス・fixture)", () => {
  const text = [
    `if (spec.startsWith("../") || spec === "./") return true;`,
    `execFileSync("node", ["./scripts/run.mjs"]);`,
    `const fixture = "import x from './provider'";`,
  ].join("\n");
  assert.equal(rewriteRelative(text, OLD, NEW, moved, exists), text);
});

test("リポジトリ直下からのパスの文字列を置き換える。入口を残すファイルは基準の JSON のキーだけ", () => {
  const moves = [{ from: OLD, to: NEW }, { from: ".claude/scripts/lib/cli.mjs", to: "packages/ops/src/cli.mjs", keepEntry: true }];
  const workflow = `run: node ${OLD} && node .claude/scripts/lib/cli.mjs`;
  assert.equal(replaceRepoPaths(workflow, ".github/workflows/a.yml", moves), `run: node ${NEW} && node .claude/scripts/lib/cli.mjs`);
  const baseline = `{ "exceptions": { ".claude/scripts/lib/cli.mjs": { "n": 1 } } }`;
  assert.equal(replaceRepoPaths(baseline, ".claude/config/area-year-entrypoint-baseline.json", moves), `{ "exceptions": { "packages/ops/src/cli.mjs": { "n": 1 } } }`);
  // 日本語のファイル名の文書も同じ関数を通る (ファイルの一覧は core.quotepath=off で取る)
  assert.equal(replaceRepoPaths(`\`${OLD}\` が読む`, "docs/00_プロジェクト管理/02_収益化戦略.md", moves), `\`${NEW}\` が読む`);
});

test("人が確かめる行: ROOT を求める式 (複数行に分かれていても) と .claude の文字列。コメントは出さない", () => {
  const text = [
    `// .claude/config/x.json はコメント`,
    `const ROOT = path.resolve(__dirname, "..", "..", "..");`,
    `const DIR = path.resolve(`,
    `  "../../..",`,
    `);`,
    `const BASELINE = ".claude/config/x-baseline.json";`,
    `const ok = "packages/ops";`,
  ].join("\n");
  assert.deepEqual(reviewLines(text).map((line) => Number(line.split(":")[0])), [2, 4, 6]);
});
