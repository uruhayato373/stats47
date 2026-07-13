const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-accessibility-static.cjs");
function fixture(source) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-a11y-static-"));
  const checker = path.join(root, ".claude/scripts/lib/check-accessibility-static.cjs");
  const component = path.join(root, "apps/web/src/Component.tsx");
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.mkdirSync(path.dirname(component), { recursive: true });
  fs.copyFileSync(CHECKER, checker); fs.writeFileSync(component, source);
  return { root, checker };
}
function run(item, args = []) {
  const result = spawnSync(process.execPath, [item.checker, "--json", ...args], {
    cwd: item.root, encoding: "utf8", env: { ...process.env, NODE_PATH: path.join(ROOT, "node_modules") },
  });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("適切な画像・リンク・操作要素を受理する", (t) => {
  const item = fixture(`export const C=()=> <><img alt=""/><a target="_blank" rel="noopener noreferrer">x</a><button onClick={()=>{}}>x</button><input id="q"/></>`);
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item); assert.equal(result.status, 0, result.stderr);
});

test("alt欠落と危険なblank linkを検出する", (t) => {
  const item = fixture(`export const C=()=> <><img/><a target="_blank">x</a></>`);
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item); const codes=result.output.findings.map((v)=>v.code);
  assert.equal(result.status, 1); assert.ok(codes.includes("IMAGE_ALT_MISSING")); assert.ok(codes.includes("BLANK_REL_MISSING"));
});

test("click-only divと名前のないinputを検出する", (t) => {
  const item = fixture(`export const C=()=> <><div onClick={()=>{}}>x</div><input/></>`);
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item); const codes=result.output.findings.map((v)=>v.code);
  assert.equal(result.status, 1); assert.ok(codes.includes("CLICK_ONLY_NONINTERACTIVE")); assert.ok(codes.includes("FORM_NAME_MISSING"));
});

test("baseline内の既存違反は許容する", (t) => {
  const item = fixture(`export const C=()=> <img/>`);
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  execFileSync(process.execPath, [item.checker, "--write-baseline"], { cwd: item.root, env: { ...process.env, NODE_PATH: path.join(ROOT, "node_modules") } });
  const result = run(item,["--baseline"]); assert.equal(result.status,0,result.stderr);
});
