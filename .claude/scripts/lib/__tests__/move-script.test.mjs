import assert from "node:assert/strict";
import test from "node:test";
import { blockedByMainWorkflows, mainDefinitionJobsText, replaceRepoPaths, reviewLines, rewriteRelative } from "../move-script.mjs";

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

test("main の workflow の定義が名指しするパスは、入口か橋渡しを指定しない限り移さない", () => {
  const main = "run: node --test .claude/scripts/lib/__tests__/a.test.cjs\nimport x from './.claude/scripts/lib/b.mjs'";
  const moves = [
    { from: ".claude/scripts/lib/__tests__/a.test.cjs", to: "packages/ops/src/__tests__/a.test.cjs" },
    { from: ".claude/scripts/lib/b.mjs", to: "packages/ops/src/b.mjs", bridge: true },
    { from: ".claude/scripts/lib/c.mjs", to: "packages/ops/src/c.mjs" },
  ];
  const blocked = blockedByMainWorkflows(moves, main);
  assert.equal(blocked.length, 1);
  assert.match(blocked[0], /^\.claude\/scripts\/lib\/__tests__\/a\.test\.cjs: origin\/main の workflow/);
  assert.deepEqual(blockedByMainWorkflows([{ ...moves[0], keepEntry: true }], main), []);
});

test("main の定義で動き develop を checkout する workflow の jobs だけを見る (PR の検査・起動の条件の paths:・main を checkout する定期実行は見ない)", () => {
  const scheduled = "on:\n  schedule:\n    - cron: '0 0 * * *'\n  push:\n    paths:\n      - '.claude/scripts/x/only-in-paths.mjs'\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: develop\n      - run: node .claude/scripts/x/run-step.mjs";
  const pullRequest = "on:\n  pull_request:\n    branches: [main]\njobs:\n  b:\n    steps:\n      - run: node --test .claude/scripts/x/pr-only.test.mjs";
  const dispatchOnly = "on: workflow_dispatch\njobs:\n  c:\n    steps:\n      - uses: actions/checkout@v4\n        with: { ref: develop }\n      - run: node .claude/scripts/x/manual.mjs";
  const mainCode = "on:\n  schedule:\n    - cron: '0 0 * * *'\njobs:\n  d:\n    steps:\n      - uses: actions/checkout@v4\n      - run: node .claude/scripts/x/main-code.mjs";
  const text = mainDefinitionJobsText([scheduled, pullRequest, dispatchOnly, mainCode]);
  assert.match(text, /run-step\.mjs/);
  assert.match(text, /manual\.mjs/);
  assert.doesNotMatch(text, /only-in-paths|pr-only|main-code/);
  // 読めない YAML は全文を見る (止める側に倒す)
  assert.match(mainDefinitionJobsText(["on: [\n broken .claude/scripts/x/y.mjs"]), /y\.mjs/);
  assert.equal(mainDefinitionJobsText([""]), "");
});
