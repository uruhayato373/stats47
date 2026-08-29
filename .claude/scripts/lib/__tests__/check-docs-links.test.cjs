const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-docs-links.cjs");

function createFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-docs-links-"));
  const checkerPath = path.join(fixtureRoot, ".claude/scripts/lib/check-docs-links.cjs");
  fs.mkdirSync(path.dirname(checkerPath), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, ".claude/config"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, "docs"), { recursive: true });
  fs.copyFileSync(CHECKER, checkerPath);
  fs.writeFileSync(path.join(fixtureRoot, "CLAUDE.md"), "See docs/missing-known.md\n");
  fs.writeFileSync(path.join(fixtureRoot, "docs/existing.md"), "# Existing\n");
  return { fixtureRoot, checkerPath };
}

function runChecker(fixture, args) {
  return spawnSync(process.execPath, [fixture.checkerPath, ...args], {
    cwd: fixture.fixtureRoot,
    encoding: "utf8",
  });
}

test("baseline内の既存broken参照は許容する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));

  execFileSync(process.execPath, [fixture.checkerPath, "--write-baseline"], {
    cwd: fixture.fixtureRoot,
  });
  const result = runChecker(fixture, ["--baseline"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /new 0/);
});

test("新規broken参照だけを回帰として検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));

  execFileSync(process.execPath, [fixture.checkerPath, "--write-baseline"], {
    cwd: fixture.fixtureRoot,
  });
  fs.writeFileSync(
    path.join(fixture.fixtureRoot, "docs/existing.md"),
    "# Existing\nSee docs/missing-new.md\n",
  );
  const result = runChecker(fixture, ["--baseline", "--json"]);
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.deepEqual(output.regressions, [
    { ref: "docs/missing-new.md", referrer: "docs/existing.md" },
  ]);
});

test("既存brokenの解消は回帰にしない", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));

  execFileSync(process.execPath, [fixture.checkerPath, "--write-baseline"], {
    cwd: fixture.fixtureRoot,
  });
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# Restored\n");
  const result = runChecker(fixture, ["--baseline", "--json"]);
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(output.regressions.length, 0);
  assert.deepEqual(output.resolved, [
    { ref: "docs/missing-known.md", referrer: "CLAUDE.md" },
  ]);
});

test(".claude/worktrees 配下の別 checkout は走査しない", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));

  const worktreeDir = path.join(fixture.fixtureRoot, ".claude/worktrees/stale");
  fs.mkdirSync(worktreeDir, { recursive: true });
  fs.writeFileSync(
    path.join(worktreeDir, "CLAUDE.md"),
    "See docs/missing-from-another-worktree.md\n",
  );

  const result = runChecker(fixture, ["--json"]);
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.deepEqual(output.broken, [
    { ref: "docs/missing-known.md", referrers: ["CLAUDE.md"] },
  ]);
});

test("backlog ledgerの完了時点コマンドは現行docs参照として走査しない", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));

  const ledgerDir = path.join(fixture.fixtureRoot, ".claude/state/backlog-loop");
  fs.mkdirSync(ledgerDir, { recursive: true });
  fs.writeFileSync(
    path.join(ledgerDir, "ledger.json"),
    JSON.stringify({ command: "check docs/21_ブログ記事原稿/published/article.md" }),
  );
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# restored\n");

  const result = runChecker(fixture, ["--json"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).broken, []);
});

test("別path segment末尾のdocsをルートdocs参照と誤認しない", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixture.fixtureRoot, ".claude/rules"), { recursive: true });
  fs.writeFileSync(
    path.join(fixture.fixtureRoot, ".claude/rules/example.md"),
    [
      ".claude/skills/management/maintain-docs/SKILL.md",
      ".claude/skills/blog/review-docs/SKILL.md",
    ].join("\n"),
  );
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# restored\n");
  const result = runChecker(fixture, ["--json"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).broken, []);
});
