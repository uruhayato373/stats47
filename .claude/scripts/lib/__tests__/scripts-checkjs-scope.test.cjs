// SCRIPT-LIB-CHECKJS-01: スクリプトの共通部品 (JavaScript) の型検査は、範囲を広げるだけで縮めない。
// 範囲から glob を外す・型検査の入口から tsconfig を外す・範囲内のファイルに @ts-nocheck を書く、の 3 つの
// 縮め方をここで止める。型エラーそのものは npm run type-check:scripts (pre-commit・CI の type-check) が止める。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CONFIG = ".claude/scripts/tsconfig.checkjs.json";
const REQUIRED_INCLUDE = [
  "lib/**/*.mjs",
  "lib/**/*.cjs",
  "lib/**/*.js",
  "measurement/**/*.mjs",
  "measurement/**/*.cjs",
  "metrics/lib/**/*.mjs",
  "metrics/lib/**/*.cjs",
];
const SCOPE_DIRS = [".claude/scripts/lib", ".claude/scripts/measurement", ".claude/scripts/metrics/lib"];
// 範囲内で型検査を外してよいファイル。理由の無い追加はしない。
const NOCHECK_ALLOWED = new Map([
  [".claude/scripts/lib/unit-semantics.mjs", "自動生成の鏡。型は正典 packages/data-configs/src/unit/unit-semantics.ts が検査する"],
]);

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
// tsconfig は行コメントだけを使う (scripts-type-check-coverage.test.cjs と同じ読み方)
const readJsonc = (rel) => JSON.parse(read(rel).replace(/^\s*\/\/.*$/gm, ""));

function scopeFiles(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return entry.name === "__tests__" || entry.name === "node_modules" ? [] : scopeFiles(rel);
    return /\.(?:mjs|cjs|js)$/.test(entry.name) ? [rel] : [];
  });
}

test("tsconfig.checkjs.json は範囲の glob をすべて含み、JS の型検査を有効にしている", () => {
  const config = readJsonc(CONFIG);
  const missing = REQUIRED_INCLUDE.filter((glob) => !(config.include ?? []).includes(glob));
  assert.deepEqual(missing, [], `範囲から外された glob がある (範囲は広げるだけで縮めない): ${missing.join(", ")}`);
  assert.equal(config.compilerOptions?.checkJs, true, "checkJs が無効になっている");
});

test("type-check:scripts が tsconfig.checkjs.json を検査する", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts["type-check:scripts"].includes(CONFIG), `type-check:scripts に ${CONFIG} が無い`);
});

test("範囲内のファイルは @ts-nocheck で型検査を外さない (理由つきの例外を除く)", () => {
  const files = SCOPE_DIRS.flatMap(scopeFiles);
  assert.ok(files.length > 100, `範囲のファイルが少なすぎる (${files.length} 件)。走査が壊れていないか`);
  const opted = files.filter((rel) => !NOCHECK_ALLOWED.has(rel) && /@ts-nocheck/.test(read(rel).split("\n").slice(0, 5).join("\n")));
  assert.deepEqual(opted, [], "型エラーは型注釈で直す。範囲外へ出すなら NOCHECK_ALLOWED に理由を書く");
  for (const rel of NOCHECK_ALLOWED.keys()) assert.ok(fs.existsSync(path.join(ROOT, rel)), `例外のファイルが無い: ${rel}`);
});
