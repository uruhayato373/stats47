const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "../../../..");
const WORKFLOWS = [
  "psi-audit-daily.yml",
  "cloudflare-usage-daily.yml",
  "ranking-integrity-audit-weekly.yml",
  "ogp-image-audit-weekly.yml",
  "data-refresh.yml",
  "provenance-audit-weekly.yml",
  "internal-link-audit-weekly.yml",
];

test("domain alert は固定タイトルでupsertし、正常復帰時に自動Closeする", () => {
  for (const filename of WORKFLOWS) {
    const source = fs.readFileSync(
      path.join(ROOT, ".github/workflows", filename),
      "utf8",
    );
    assert.match(source, /gh issue create/, `${filename}: issue create がない`);
    assert.match(source, /gh issue (?:edit|comment)/, `${filename}: upsert がない`);
    assert.match(source, /gh issue close/, `${filename}: recovery close がない`);
    assert.doesNotMatch(
      source,
      /TITLE=.*\$(?:\{)?DATE/,
      `${filename}: 日付入りタイトルは日次重複Issueを作る`,
    );
  }
});

test("PSI alert は日付単位ではなくlabel単位で既存Issueを検索する", () => {
  const source = fs.readFileSync(
    path.join(ROOT, ".github/workflows/psi-audit-daily.yml"),
    "utf8",
  );
  assert.match(source, /--label psi-alert/);
  assert.doesNotMatch(source, /search "\\"\\$TITLE\\" in:title"/);
});

test("作業候補と運用queueはIssue台帳を作らずWorkflow Summaryへ出す", () => {
  for (const filename of [
    "blog-remediation-daily.yml",
    "ctr-improvement-monthly.yml",
    "improvement-log-reminder-weekly.yml",
  ]) {
    const source = fs.readFileSync(
      path.join(ROOT, ".github/workflows", filename),
      "utf8",
    );
    assert.match(source, /GITHUB_STEP_SUMMARY/, `${filename}: Summary出力がない`);
    assert.doesNotMatch(source, /gh issue/, `${filename}: 作業queueをIssue化している`);
    assert.doesNotMatch(source, /^\s+issues:\s+write\s*$/m, `${filename}: 不要なIssue権限`);
  }
});
