// 広告のサイズ検査 (--check-size) は pre-commit から呼ばれる。検査の経路が data/affiliate/ に
// inventory-*.json を書くと、コミットのたびに作業ツリーへ差分と未追跡ファイルが残る。
// 書き出しは --check-size を付けない通常の棚卸しだけが行うことを固定する。
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SCRIPT = ".claude/scripts/ads/audit-affiliate-inventory.ts";
const LATEST = join(ROOT, "data/affiliate/inventory-latest.json");
const DATE = "2099-01-01";
const DATED = join(ROOT, `data/affiliate/inventory-${DATE}.json`);

function run(args) {
  return execFileSync(join(ROOT, "node_modules/.bin/tsx"), [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("--check-size は inventory-latest.json も日付付きの記録も書かない", () => {
  const backup = mkdtempSync(join(tmpdir(), "inv-latest-"));
  const hadLatest = existsSync(LATEST);
  const before = hadLatest ? readFileSync(LATEST, "utf8") : null;
  if (before !== null) writeFileSync(join(backup, "latest.json"), before);
  try {
    rmSync(DATED, { force: true });
    const out = run(["--json", "--check-size", "--date", DATE]);
    assert.ok(JSON.parse(out).sizeViolations, "検査の結果は標準出力へ出す");
    assert.equal(existsSync(DATED), false, "日付付きの記録を書いてはならない");
    assert.equal(
      hadLatest ? readFileSync(LATEST, "utf8") : null,
      before,
      "inventory-latest.json を書き換えてはならない",
    );
  } finally {
    rmSync(DATED, { force: true });
    if (before !== null) writeFileSync(LATEST, before);
    rmSync(backup, { recursive: true, force: true });
  }
});

test("--check-size なしの棚卸しは従来どおり記録を書く", () => {
  const before = existsSync(LATEST) ? readFileSync(LATEST, "utf8") : null;
  try {
    rmSync(DATED, { force: true });
    run(["--json", "--date", DATE]);
    assert.equal(existsSync(DATED), true, "通常の棚卸しは日付付きの記録を書く");
  } finally {
    rmSync(DATED, { force: true });
    if (before !== null) writeFileSync(LATEST, before);
  }
});
