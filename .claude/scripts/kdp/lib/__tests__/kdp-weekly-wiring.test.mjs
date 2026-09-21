import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "../../../../..");
const read = (relative) => readFileSync(resolve(root, relative), "utf8");

test("weekly review generates the KDP gate without publishing", () => {
  const skill = read(".claude/skills/management/weekly-review/SKILL.md");
  assert.match(skill, /npm run kdp:weekly -- --week \[YYYY-Www\] --write/);
  assert.match(skill, /レビュー単独では公開しない/);
});

test("weekly plan exposes only the exact-id approved publish entry", () => {
  const skill = read(".claude/skills/management/weekly-plan/SKILL.md");
  assert.match(skill, /npm run kdp:weekly-publish -- --week \[YYYY-Www\] --id <KINDLE_ID> --owner-approved <KINDLE_ID> --commit/);
  assert.match(skill, /計画への記載は公開承認ではない/);
});

test("root scripts expose deterministic gate and guarded publisher", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["kdp:weekly"], "npm run products:kindle:weekly --workspace=@stats47/product-factory --");
  assert.equal(pkg.scripts["kdp:weekly-publish"], "node .claude/scripts/kdp/kdp-weekly-publish.mjs");
});
