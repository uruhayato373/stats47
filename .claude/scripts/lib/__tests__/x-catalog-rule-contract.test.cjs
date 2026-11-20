"use strict";

/** rule の Markdown が機械の読む表を持たず、台帳 sns.x-catalog の id を指すことの検査 (X-CATALOG-RULES-PARSE-01)。 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const catalog = require("../../../../packages/ops/src/sns/x-catalog.cjs");

const ROOT = path.resolve(__dirname, "../../../..");
const RULE_PATH = path.join(ROOT, ".claude/rules/sns-content-standards.md");

test("rule の Markdown には機械が読む表を置かず、台帳の id を指す", () => {
  const rule = fs.readFileSync(RULE_PATH, "utf8");
  // アンカーが残っていると、表を直せば挙動が変わると読めてしまう。読む口も rule のパスを持たない
  assert.doesNotMatch(rule, /<!-- x-catalog:/);
  assert.match(rule, /sns\.x-catalog/);
  assert.equal("RULES_PATH" in catalog, false);
});
