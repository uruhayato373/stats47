import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const WORKFLOW_PATH = path.join(ROOT, ".github/workflows/note-circulation-audit-weekly.yml");
const SOURCE = fs.readFileSync(WORKFLOW_PATH, "utf8");
const WORKFLOW = YAML.parse(SOURCE);
const STEPS = WORKFLOW.jobs.audit.steps;

function step(name) {
  return STEPS.find((candidate) => candidate.name === name);
}

test("weekly circulation workflow writes only the cover observations and the issue lifecycle", () => {
  // actions: read は前回 run の artifact (カード表示の前回結果) を gh run download で読むため (2026-09-27)。
  // contents: write はカバー台帳の観測 (data/note/cover-assets.json) を develop へ書き戻すため (b74d0effa)。それ以外は書かない
  assert.deepEqual(WORKFLOW.permissions, { contents: "write", actions: "read", issues: "write" });
  assert.deepEqual([...SOURCE.matchAll(/git add -- (\S+)/g)].map((m) => m[1]), ["data/note/cover-assets.json"]);
  assert.equal(WORKFLOW.jobs.audit["timeout-minutes"], 60);
  assert.equal(WORKFLOW.jobs.audit.runsOn ?? WORKFLOW.jobs.audit["runs-on"], "ubuntu-latest");
  assert.match(SOURCE, /cron:\s*['"]15 20 \* \* 5['"]/); // 土曜 05:15 JST (2026-10-26 に日曜から移動)
  assert.doesNotMatch(SOURCE, /wrangler\s+r2|note-magazine\.mjs.+--commit/);
});

test("catalog, unit and live audits feed one strict status", () => {
  const audit = step("🔍 Catalog・unit・live audit");
  assert.ok(audit, "audit step is missing");
  assert.equal(audit.id, "audit");
  assert.match(audit.run, /npm run note:catalog:validate/);
  assert.match(audit.run, /npm run note:circulation:test/);
  assert.match(audit.run, /npm run note:covers:test/);
  assert.match(audit.run, /npm run note:covers:audit[^\n]*\n\s*\[ "\$\{PIPESTATUS\[0\]\}" -eq 0 \] \|\| STATUS=1/);
  assert.match(audit.run, /npm run note:circulation:audit/);
  assert.match(audit.run, /summary\.compliantHashtags !== summary\.total/);
  assert.match(audit.run, /summary\.exactMagazineMemberships !== summary\.liveMagazines/);
  assert.match(audit.run, /summary\.pinnedArticles !== 1/);
  assert.match(audit.run, /summary\.profiledArticles !== 1/);
  assert.match(audit.run, /exit_code=\$STATUS/);
  assert.match(step("📤 Upload audit report").with.path, /note-cover-audit-latest\.json/);
});

test("failure updates one alert, recovery closes it, and final step propagates red", () => {
  const open = step("🚨 Open or update note circulation alert");
  const close = step("✅ Close recovered note circulation alert");
  const fail = step("❌ Fail on unresolved note circulation drift");
  assert.match(open?.if || "", /always\(\).*exit_code != '0'/);
  assert.match(open?.run || "", /note-circulation-alert/);
  assert.match(open?.run || "", /gh issue (?:edit|create)/);
  assert.match(close?.if || "", /always\(\).*exit_code == '0'/);
  assert.match(close?.run || "", /gh issue close/);
  assert.match(fail?.if || "", /always\(\).*exit_code != '0'/);
  assert.match(fail?.run || "", /exit 1/);
});
