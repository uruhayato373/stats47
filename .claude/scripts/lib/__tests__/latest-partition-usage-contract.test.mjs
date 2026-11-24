/**
 * agent 定義と scripts が最新年の選び方の部品 (latestPartition) を使うことを固定する (ARTICLE-WRITER-PARTITION-ORDER-01)。
 * 実行: node --test .claude/scripts/lib/__tests__/latest-partition-usage-contract.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

test("agent 定義と scripts に「末尾 = 最新年」の手順が残っていない", () => {
  const targets = [
    path.join(ROOT, ".claude/agents/article-writer.md"),
    path.join(ROOT, "packages/ops/src/note/build-kakei-note-evidence-data.mjs"),
  ];
  for (const file of targets) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /partitions\[partitions\.length - 1\]/, file);
  }
  assert.match(
    fs.readFileSync(path.join(ROOT, "packages/ops/src/note/build-kakei-note-evidence-data.mjs"), "utf8"),
    /latestPartition\(values\.partitions\)/,
  );
});
