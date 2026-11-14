const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-memory-index-size.cjs");

function runIn(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-memory-index-"));
  try {
    const file = path.join(dir, ".claude/memory/MEMORY.md");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return spawnSync(process.execPath, [CHECKER], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, STATS47_SCAN_ROOT: dir },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("上限以内の索引は通る", () => {
  const result = runIn("# Memory Index\n\n- [a](a.md) — 短い一行\n");
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("バイト数の上限を 1 バイト超えた索引は止まる", () => {
  const { MAX_BYTES } = require(CHECKER);
  const head = "# Memory Index\n- ";
  const body = head + "あ".repeat(Math.floor((MAX_BYTES - Buffer.byteLength(head)) / 3));
  const atLimit = body + "x".repeat(MAX_BYTES - Buffer.byteLength(body));
  assert.equal(Buffer.byteLength(atLimit), MAX_BYTES);
  assert.equal(runIn(atLimit).status, 0, "ちょうど上限は通る");
  const over = runIn(atLimit + "x");
  assert.equal(over.status, 1, "1 バイト超過は止まる");
  assert.match(over.stderr, /バイト/);
});

test("日本語は文字数でなくバイト数で数える (文字数なら通る量でも止まる)", () => {
  const { MAX_BYTES } = require(CHECKER);
  const text = "あ".repeat(Math.floor(MAX_BYTES / 2));
  assert.ok(text.length < MAX_BYTES, "文字数は上限未満");
  assert.equal(runIn(text).status, 1);
});

test("行数の上限を超えた索引は止まる", () => {
  const { MAX_LINES } = require(CHECKER);
  assert.equal(runIn("- a\n".repeat(MAX_LINES)).status, 0, "ちょうど上限は通る");
  const over = runIn("- a\n".repeat(MAX_LINES + 1));
  assert.equal(over.status, 1);
  assert.match(over.stderr, /行/);
});

test("索引が無いときは止まる", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-memory-index-"));
  try {
    const result = spawnSync(process.execPath, [CHECKER], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, STATS47_SCAN_ROOT: dir },
    });
    assert.equal(result.status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("リポジトリの現物の MEMORY.md は上限以内で通る", () => {
  const result = spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
