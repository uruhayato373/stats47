import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import yaml from "js-yaml";

const files = [
  ".github/workflows/affiliate-dashboard-refresh.yml",
  ".github/workflows/affiliate-ga4-weekly.yml",
];

for (const file of files) {
  test(`${file}は観測artifactだけで外部変更しない`, () => {
    const source = readFileSync(file, "utf8");
    assert.match(source, /permissions:\s*\n\s*contents: read/);
    assert.match(source, /upload-artifact/);
    assert.doesNotMatch(source, /\bgit\s+(push|commit)\b/);
    assert.doesNotMatch(source, /affiliate-apply|a8-browser[^\n]*apply|push-affiliate|wrangler r2/);
  });
}

test("GA4週次はportfolio・operations・pilotを同じrunで生成する", () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /build-affiliate-portfolio-state\.ts/);
  assert.match(source, /build-affiliate-operations-state\.ts/);
  assert.match(source, /build-affiliate-pilot-state\.ts/);
});

test("adminと単体HTMLは同じportfolio view modelを使う", () => {
  const admin = readFileSync("apps/admin/lib/server/ads.ts", "utf8");
  const dashboard = readFileSync(".claude/scripts/ads/build-affiliate-dashboard.ts", "utf8");
  assert.match(admin, /buildAffiliatePortfolioViewModel/);
  assert.match(dashboard, /buildAffiliatePortfolioViewModel/);
});

test("変更したworkflowはYAMLとして解釈できる", () => {
  for (const file of [...files, ".github/workflows/workflow-health-daily.yml"]) {
    const parsed = yaml.load(readFileSync(file, "utf8"));
    assert.equal(typeof parsed, "object", file);
  }
});
