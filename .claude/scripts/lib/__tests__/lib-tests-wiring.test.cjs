// .claude/scripts/lib/__tests__ のテストは、どれも workflow・package.json の script・.husky のどこかが名前で走らせる
// (CI-TOOLING-FOLLOWUP-03)。
//
// 名前がどこにも無いテストは、pre-push の「変更したテストだけ」でしか走らない。検査の側が壊れても、
// そのテスト自身を変えない限り誰も実行しないので、壊れたまま緑の commit が続く (2026-11-14 に 39 本あった)。
// まとめて走らせる口は package.json の test:claude-lib-contracts で、PR の Static Gates が実行する。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const TEST_DIR = ".claude/scripts/lib/__tests__";

function wiringText() {
  const sources = [path.join(ROOT, "package.json")];
  for (const dir of [".github/workflows", ".husky"]) {
    for (const name of fs.readdirSync(path.join(ROOT, dir))) {
      const file = path.join(ROOT, dir, name);
      if (fs.statSync(file).isFile()) sources.push(file);
    }
  }
  return sources.map((file) => fs.readFileSync(file, "utf8")).join("\n");
}

/** 走らせる口の文字列に、テストのパスがそのまま書かれていないものを返す */
function unwired(testFiles, text) {
  return testFiles.filter((name) => !text.includes(`${TEST_DIR}/${name}`));
}

test(".claude/scripts/lib/__tests__ のテストは全部、workflow・package.json・.husky のどこかが名前で走らせる", () => {
  const testFiles = fs.readdirSync(path.join(ROOT, TEST_DIR)).filter((name) => /\.test\.(?:c|m)?js$/.test(name)).sort();
  assert.ok(testFiles.length >= 50, `テストを ${testFiles.length} 本しか読めていない`);
  assert.deepEqual(unwired(testFiles, wiringText()), [], "test:claude-lib-contracts の一覧に足す");
});

/** 走らせる口に名前で書かれたテストのパス (glob は除く) のうち、実在しないもの */
function missingTestPaths(text, exists) {
  const paths = new Set();
  for (const match of text.matchAll(/(?:^|[\s"'`=])((?:\.claude|\.github|apps|packages)\/[\w./-]+\.test\.[cm]?[jt]sx?)(?=$|[\s"'`\\])/gm)) paths.add(match[1]);
  return [...paths].filter((file) => !exists(file)).sort();
}

test("workflow・package.json・.husky が名前で走らせるテストのパスは実在する", () => {
  // node --test は存在しないパスを警告なしで読み飛ばす。テストを移したのに走らせる口のパスを直し忘れると、
  // そのテストは誰にも実行されないまま緑が続く (2026-11-19 に test:claude-lib-contracts の 8 本で起きた)。
  assert.deepEqual(missingTestPaths(wiringText(), (file) => fs.existsSync(path.join(ROOT, file))), [], "走らせる口のパスを移した先に直す");
});

test("[mutation] 実在しないテストのパスを見逃さない", () => {
  const text = 'run: node --test packages/ops/src/x/__tests__/gone.test.mjs .claude/scripts/lib/__tests__/kept.test.cjs\n"a": "node --test \\"src/**/__tests__/*.test.mjs\\""';
  assert.deepEqual(missingTestPaths(text, (file) => file.includes("kept")), ["packages/ops/src/x/__tests__/gone.test.mjs"]);
});

test("test:claude-lib-contracts は PR の workflow が実行する", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.match(pkg.scripts["test:claude-lib-contracts"], /^node --test /);
  const workflow = fs.readFileSync(path.join(ROOT, ".github/workflows/pr-quality-check.yml"), "utf8");
  assert.match(workflow, /run: npm run test:claude-lib-contracts/);
});

test("[mutation] 名前がどこにも無いテストを見逃さない", () => {
  const text = wiringText();
  assert.deepEqual(unwired(["no-such-wiring-fixture.test.cjs"], text), ["no-such-wiring-fixture.test.cjs"]);
  // パスの一部 (別ディレクトリの同名テスト) では数えない
  assert.deepEqual(unwired(["x.test.cjs"], "node --test other/__tests__/x.test.cjs"), ["x.test.cjs"]);
});
