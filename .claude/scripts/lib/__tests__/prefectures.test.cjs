"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const filename = path.resolve(__dirname, "../prefectures.cjs");
const source = fs.readFileSync(filename, "utf8");
const root = path.resolve(__dirname, "../../../..");

function load(dirname, cwd) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    require: createRequire(filename), module, __dirname: dirname,
    process: { cwd: () => cwd },
  }, { filename });
  return module.exports;
}

for (const cwd of [root, path.join(root, "apps/admin")]) {
  test(`bundled __dirname でも実行場所 ${path.relative(root, cwd) || "."} から台帳を読む`, () => {
    const { PREF_AREA_CODES, PREF_NAMES } = load("/ROOT/.claude/scripts/lib", cwd);
    assert.equal(PREF_AREA_CODES.length, 47);
    assert.equal(PREF_AREA_CODES[0], "01000");
    assert.equal(PREF_AREA_CODES.at(-1), "47000");
    assert.equal(PREF_NAMES[0], "北海道");
  });
}

test("CLI は作業ディレクトリがリポジトリ外でもモジュールの場所から読む", () => {
  assert.equal(load(path.dirname(filename), os.tmpdir()).PREFECTURES.length, 47);
});

test("どちらの場所にも台帳が無ければ空配列を返さず停止する", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-prefectures-"));
  try {
    assert.throws(() => load("/ROOT/.claude/scripts/lib", directory), /台帳を解決できません/);
  } finally {
    fs.rmdirSync(directory);
  }
});
