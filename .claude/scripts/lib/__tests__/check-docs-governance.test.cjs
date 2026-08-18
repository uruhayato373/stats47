"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  fixImplementationPlanIndex,
  inspectRepository,
  isIsoDate,
  isoWeek,
  parseFrontmatter,
} = require("../check-docs-governance.cjs");

function write(root, file, content) {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function markdown({ title, type, status = "active", updated = "2026-07-30", extra = "", body = "" }) {
  return `---
title: ${title}
type: ${type}
status: ${status}
updated: ${updated}
${extra}---

# ${title}

${body}
`;
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-docs-governance-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const config = {
    version: 1,
    policyDocument: ".claude/rules/docs-vs-issues.md",
    sharedAgentInstructions: { canonical: "CLAUDE.md", mirrors: ["AGENTS.md"] },
    requiredReferences: [],
    topLevel: {
      allowedFiles: ["docs/INDEX.md"],
      allowedDirectories: ["docs/00", "docs/01", "docs/02", ".claude/todo"],
    },
    fixedDirectories: {
      "docs/00": ["01_project.md"],
      "docs/01": ["01_architecture.md"],
      ".claude/todo": ["04_improvements.md", "05_features.md", "06_indicators.md"],
    },
    governedDirectories: ["docs/00", "docs/01", "docs/02", ".claude/todo"],
    flatDirectories: ["docs/00", "docs/01", "docs/02", ".claude/todo"],
    frontmatter: {
      requiredFields: ["title", "type", "status", "updated"],
      allowedStatuses: ["active", "adopted", "draft", "in-progress"],
      inactiveStatuses: ["archived", "completed", "deprecated", "obsolete", "retired", "superseded"],
    },
    naming: {
      implementationPlanPattern: "^(?:00_INDEX|[0-9]{2}_.+)\\.md$",
      datedFilePattern: "(?:^|[-_])[0-9]{4}-[0-9]{2}(?:-[0-9]{2})?(?:[-_]|\\.)",
      forbiddenDirectoryNames: ["review", "reviews", "archive", "04_レビュー"],
      forbiddenFileTerms: ["レビュー", "review", "handoff"],
    },
    contentRootsExcludedFromGovernedNaming: [],
    freshness: [{ pathPrefix: "docs/", maxAgeDays: 365 }],
    implementationPlans: {
      directory: "docs/02",
      index: "docs/02/00_INDEX.md",
      generatedBlockStart: "<!-- docs-governance:active-plans:start -->",
      generatedBlockEnd: "<!-- docs-governance:active-plans:end -->",
      requiredRelatedBacklog: true,
    },
    todo: {
      files: [
        ".claude/todo/04_improvements.md",
        ".claude/todo/05_features.md",
        ".claude/todo/06_indicators.md",
      ],
      idPattern: "^[A-Z0-9]+(?:-[A-Z0-9]+)+$",
      allowedImprovementStatuses: ["pending", "in-progress", "effect/pending"],
    },
  };

  write(root, "CLAUDE.md", "shared instructions\n");
  fs.symlinkSync("CLAUDE.md", path.join(root, "AGENTS.md"));
  write(root, "docs/INDEX.md", "# docs\n");
  write(root, "docs/00/01_project.md", markdown({
    title: "Project",
    type: "strategy",
  }));
  write(root, "docs/01/01_architecture.md", markdown({
    title: "Architecture",
    type: "technical-design",
    status: "adopted",
  }));
  write(root, ".claude/todo/04_improvements.md", markdown({
    title: "Improvements",
    type: "improvement-backlog",
    body: `| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| DOCS-IMPROVE-01 | Improve docs | pending | 2026-08-30 | claude | docs |`,
  }));
  write(root, ".claude/todo/05_features.md", markdown({
    title: "Features",
    type: "feature-backlog",
    body: `### [DOCS-FEATURE-01] Checker

- **status**: in-progress
- **owner**: claude
- **次**: checkerを実装する。
- **完了条件**: testが通る。`,
  }));
  write(root, ".claude/todo/06_indicators.md", markdown({
    title: "Indicators",
    type: "indicator-backlog",
    body: `### [DOCS-INDICATOR-01] Indicator

- **status**: deferred
- **owner**: claude
- **trigger**: 必要になったとき。`,
  }));
  write(root, "docs/02/00_INDEX.md", markdown({
    title: "Plan index",
    type: "index",
    body: `## 🟢 領域別の実行計画（active）

<!-- docs-governance:active-plans:start -->
stale
<!-- docs-governance:active-plans:end -->

## 関連`,
  }));
  write(root, "docs/02/42_plan.md", markdown({
    title: "Plan",
    type: "implementation-spec",
    status: "in-progress",
    extra: "related_backlog: DOCS-FEATURE-01\n",
  }));
  fixImplementationPlanIndex(root, config);
  return { root, config };
}

test("compliant repository passes without findings", (t) => {
  const { root, config } = fixture(t);
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
  assert.equal(report.todoDefinitions, 3);
  assert.equal(report.implementationPlans, 1);
});

test("fixed directory growth, missing frontmatter and inactive docs fail", (t) => {
  const { root, config } = fixture(t);
  write(root, "docs/00/02_extra.md", "# extra\n");
  write(root, "docs/01/01_architecture.md", markdown({
    title: "Architecture",
    type: "technical-design",
    status: "superseded",
  }));
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  const codes = new Set(report.errors.map((item) => item.code));
  assert.ok(codes.has("DG012"));
  assert.ok(codes.has("DG020"));
  assert.ok(codes.has("DG022"));
});

test("duplicate TODO ids and missing action are rejected", (t) => {
  const { root, config } = fixture(t);
  write(root, ".claude/todo/06_indicators.md", markdown({
    title: "Indicators",
    type: "indicator-backlog",
    body: `### [DOCS-FEATURE-01] Duplicate

- **status**: pending
- **owner**: claude`,
  }));
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  const codes = new Set(report.errors.map((item) => item.code));
  assert.ok(codes.has("DG057"));
  assert.ok(codes.has("DG060"));
});

test("--fix target regenerates only the implementation plan block", (t) => {
  const { root, config } = fixture(t);
  const index = path.join(root, "docs/02/00_INDEX.md");
  const before = fs.readFileSync(index, "utf8");
  fs.writeFileSync(index, before.replace("| [`42_plan.md`]", "| stale |"), "utf8");
  assert.equal(fixImplementationPlanIndex(root, config), true);
  const after = fs.readFileSync(index, "utf8");
  assert.match(after, /\[`42_plan\.md`\]/);
  assert.match(after, /## 関連/);
  assert.equal(fixImplementationPlanIndex(root, config), false);
});

test("frontmatter parser and ISO week are deterministic", () => {
  const parsed = parseFrontmatter("---\ntitle: X\nstatus: active\n---\n# X\n");
  assert.equal(parsed.values.title, "X");
  assert.equal(parsed.values.status, "active");
  assert.equal(isIsoDate("2026-07-30"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isoWeek("2026-07-30"), "2026-W31");
});

test("missing fixed directory, forbidden nested archive and malformed improvement row fail", (t) => {
  const { root, config } = fixture(t);
  fs.rmSync(path.join(root, "docs/01"), { recursive: true });
  config.topLevel.allowedDirectories.push("docs/content");
  config.contentRootsExcludedFromGovernedNaming.push("docs/content");
  write(root, "docs/content/archive/result.json", "{}\n");
  write(root, ".claude/todo/04_improvements.md", markdown({
    title: "Improvements",
    type: "improvement-backlog",
    body: `| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| DOCS-IMPROVE-01 | Improve docs | pending | 2026-02-30 | claude |`,
  }));
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  const codes = new Set(report.errors.map((item) => item.code));
  assert.ok(codes.has("DG013"));
  assert.ok(codes.has("DG015"));
  assert.ok(codes.has("DG049"));
});

// ── DG003: mirror (AGENTS.md) の同一性判定 ──────────────────────────
// Windows の core.symlinks=false なチェックアウトでは git が symlink を
// 「リンク先パス 1 行の通常ファイル」として展開する。これを誤検知すると
// Windows から文書を触るたびに DG003 が上がり続ける (2026-08-04 実測)。

test("materialized symlink (Windows checkout) is accepted as mirror", (t) => {
  const { root, config } = fixture(t);
  const mirror = path.join(root, "AGENTS.md");
  fs.rmSync(mirror, { force: true });
  fs.writeFileSync(mirror, "CLAUDE.md", "utf8"); // git が symlink を展開した形
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  assert.equal(
    report.errors.filter((item) => item.code === "DG003").length,
    0,
    "実体が canonical に解決するので同一とみなす",
  );
});

test("drifted mirror copy is still rejected", (t) => {
  const { root, config } = fixture(t);
  const mirror = path.join(root, "AGENTS.md");
  fs.rmSync(mirror, { force: true });
  fs.writeFileSync(mirror, "shared instructions\nSTALE COPY\n", "utf8");
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  assert.equal(
    report.errors.filter((item) => item.code === "DG003").length,
    1,
    "本物のドリフトは従来どおり検出する",
  );
});

test("mirror pointing somewhere other than canonical is rejected", (t) => {
  const { root, config } = fixture(t);
  const mirror = path.join(root, "AGENTS.md");
  fs.rmSync(mirror, { force: true });
  fs.writeFileSync(mirror, "docs/INDEX.md", "utf8"); // 解決するが canonical ではない
  const report = inspectRepository({ root, config, now: "2026-07-30" });
  assert.equal(
    report.errors.filter((item) => item.code === "DG003").length,
    1,
    "canonical 以外を指すパスは通さない",
  );
});
