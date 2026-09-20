import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import yaml from "js-yaml";

const files = [
  ".github/workflows/affiliate-dashboard-refresh.yml",
  ".github/workflows/affiliate-ga4-weekly.yml",
];

// 広告そのものを変える操作 (提携申請・広告コード適用・広告 R2 push) はどちらの workflow にも置かない
const FORBIDDEN_AD_MUTATIONS = /affiliate-apply|a8-browser[^\n]*apply|push-affiliate|wrangler r2/;

test(`${files[0]}は観測artifactだけで外部変更しない`, () => {
  const source = readFileSync(files[0], "utf8");
  assert.match(source, /permissions:\s*\n\s*contents: read/);
  assert.match(source, /upload-artifact/);
  assert.doesNotMatch(source, /\bgit\s+(push|commit)\b/);
  assert.doesNotMatch(source, FORBIDDEN_AD_MUTATIONS);
});

// GA4 週次は 2026-09-14 (c8c15e202) から、生 snapshot を R2 state/ に置き、git には週次集約 CSV だけを
// commit-back する。書き戻しはその 1 ファイルに限定されていることを固定する。
test(`${files[1]}は週次集約CSVの commit-back 以外に外部変更しない`, () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /permissions:\s*\n\s*contents: write/);
  assert.match(source, /upload-artifact/);
  const staged = [...source.matchAll(/^\s*git add (.+)$/gm)].map((m) => m[1].trim());
  assert.deepEqual(staged, [".claude/state/ads/ga4-affiliate-history.csv"]);
  assert.match(source, /diff-push-r2\.ts --prefix "state\/ads\/ga4-affiliate\/"/);
  assert.doesNotMatch(source, /git push origin main/);
  assert.doesNotMatch(source, FORBIDDEN_AD_MUTATIONS);
});

test("GA4週次はportfolio・operations・pilotを同じrunで生成する", () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /build-affiliate-portfolio-state\.ts/);
  assert.match(source, /build-affiliate-operations-state\.ts/);
  assert.match(source, /build-affiliate-pilot-state\.ts/);
});

test("GA4週次は固定期間を受け取り、過去期間で latest を巻き戻さない", () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /start_date:/);
  assert.match(source, /end_date:/);
  assert.match(source, /--start-date "\$START_DATE" --end-date "\$END_DATE"/);
  assert.match(source, /snapshot_file=\$SNAPSHOT_FILE/);
  assert.match(source, /steps\.ga4\.outputs\.snapshot_file/);
  assert.doesNotMatch(source, /find \.claude\/state\/ads[^\n]+ga4-affiliate/);
  assert.match(source, /historical backfill: latest\.json/);
  assert.match(source, /\[\[ "\$LATEST_DATE" > "\$DATE" \]\]/);
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
