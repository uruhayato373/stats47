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
  "workflow-health-daily.yml",
  "gsc-operations-cycle-weekly.yml",
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

/**
 * gh issue create に渡すカスタムラベルは、同じ workflow 内で `gh label create --force` して
 * 存在を保証すること。
 *
 * ★背景 (2026-08-13)。sync-rakuten-catalog.yml は rakuten-alert を ensure しておらず、
 * リポジトリにそのラベルが無かったため `gh issue create` が
 * `could not add label: 'rakuten-alert' not found` で落ちていた。結果として
 * **アラートが 1 度も飛ばず**、日次同期が 9 日間死んでいたことに誰も気づけなかった。
 * さらに悪いことに、ログの最終行が本当の原因ではなくラベルエラーになり原因を隠す。
 *
 * ★対象 workflow は glob で拾う。上の WORKFLOWS は手書きの列挙で、まさにこの
 * sync-rakuten-catalog.yml が載っていなかった (手書きは必ず載せ忘れる)。
 */
test("gh issue create に渡すカスタムラベルは同じ workflow で ensure する", () => {
  // 事前に存在する前提の共通ラベル (どの workflow でも作らない)
  const PRE_EXISTING = new Set(["auto-generated", "enhancement", "bug"]);
  const dir = path.join(ROOT, ".github/workflows");
  const violations = [];
  let scanned = 0;

  for (const filename of fs.readdirSync(dir).filter((f) => f.endsWith(".yml"))) {
    const source = fs.readFileSync(path.join(dir, filename), "utf8");
    if (!/gh issue create/.test(source)) continue;
    scanned += 1;
    const used = new Set();
    for (const match of source.matchAll(/--label\s+"?([A-Za-z0-9,_-]+)"?/g)) {
      for (const label of match[1].split(",")) {
        if (label && !PRE_EXISTING.has(label)) used.add(label);
      }
    }
    for (const label of used) {
      if (!new RegExp(`gh label create ${label}(\\s|$)`, "m").test(source)) {
        violations.push(`${filename}: ${label}`);
      }
    }
  }

  assert.ok(scanned >= 10, `alert workflow を ${scanned} 件しか走査していない = 収集が壊れている`);
  assert.deepEqual(
    violations,
    [],
    `gh label create で ensure されていないラベルがある (アラートが飛ばなくなる):\n${violations.join("\n")}`,
  );
});
