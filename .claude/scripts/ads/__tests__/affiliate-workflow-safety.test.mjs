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

// GA4週次は生snapshotをR2 state/へ置き、git書き戻しを週次集約CSVだけに限定する。
// Issue mutationは運用異常のalert/recoveryだけに使い、広告配信自体は変更しない。
test(`${files[1]}はgit書き戻しを週次集約CSVに限定し、広告配信を変更しない`, () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /permissions:\s*\n\s*contents: write/);
  assert.match(source, /^\s*issues: write/m);
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

test("GA4週次は確定7日を日曜に取得し、月曜に同じ窓を自動再取得する", () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /cron: "0 13 \* \* 0,1"/);
  assert.match(source, /ARGS=\(--weekly-finalized\)/);
  assert.match(source, /\[ "\$WINDOW_DAYS" = "7" \]/);
  assert.doesNotMatch(source, /^\s+days:\s*$/m);
});

test("GA4週次はR2とdevelop履歴行をread-backし、全step outcomeを最終ゲートへ含める", () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /cmp -s "\$FILE" \/tmp\/affiliate-readback\.json/);
  assert.match(source, /cmp -s "\$STAGE\/latest\.json" \/tmp\/affiliate-latest-readback\.json/);
  assert.match(source, /affiliate-index-readback\.json/);
  assert.match(source, /git show FETCH_HEAD:\.claude\/state\/ads\/ga4-affiliate-history\.csv/);
  assert.match(source, /line\.startsWith\(date \+ ",7,_all,_all,"\)/);
  for (const id of ["ga4", "publish", "history", "operations"]) {
    assert.match(source, new RegExp(`"${id}=\\$\\{\\{ steps\\.${id}\\.outcome \\}\\}"`));
  }
});

test("GA4週次は計測失敗を即時upsertし、復旧時に自動closeする", () => {
  const source = readFileSync(files[1], "utf8");
  assert.match(source, /github\.event_name == 'schedule' && steps\.measurement_gate\.outcome != 'success'/);
  assert.match(source, /github\.event_name == 'schedule' && steps\.measurement_gate\.outcome == 'success'/);
  assert.match(source, /gh issue create/);
  assert.match(source, /gh issue edit/);
  assert.match(source, /gh issue close/);
  assert.match(source, /gh label create affiliate-measurement-alert/);
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
