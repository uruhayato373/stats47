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
    JSON.stringify({ command: "check contents/blog/published/article.md" }),
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

function writeMd(fixture, relPath, body) {
  const abs = path.join(fixture.fixtureRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
}

test("実在しない相対リンクを、書かれた文書の場所を基準に解決して検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# restored\n");
  writeMd(fixture, "docs/sub/page.md", "[todo](todo/todo-standards.md)\n");

  const result = runChecker(fixture, ["--json"]);
  const output = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.deepEqual(output.broken, [
    { ref: "docs/sub/todo/todo-standards.md", referrers: ["docs/sub/page.md"] },
  ]);
});

test("実在する相対リンクは文書の場所基準で解決でき、anchor・title・親ディレクトリ参照も通る", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# restored\n");
  writeMd(fixture, "docs/sub/page.md", "[a](./sibling.md#h) [b](../existing.md \"title\") [c](<../existing.md>)\n");
  writeMd(fixture, "docs/sub/sibling.md", "# sibling\n");

  const result = runChecker(fixture, ["--json"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).broken, []);
});

test("URL・anchor・ルート絶対・コードブロック内・md以外のリンクは相対リンク検査の対象にしない", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# restored\n");
  writeMd(
    fixture,
    "docs/sub/page.md",
    [
      "[u](https://example.com/x.md) [m](mailto:a@b.md) [h](#anchor) [r](/abs/none.md) [i](img.png)",
      "`[inline](gone-inline.md)`",
      "```md",
      "[fenced](gone-fenced.md)",
      "```",
      "",
    ].join("\n"),
  );

  const result = runChecker(fixture, ["--json"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).broken, []);
});

test("symlink は実体の場所で検査し、リンク側の場所を基準に相対リンクを誤解決しない", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.fixtureRoot, "docs/missing-known.md"), "# restored\n");
  writeMd(fixture, "docs/real/a.md", "[b](./b.md)\n");
  writeMd(fixture, "docs/real/b.md", "# b\n");
  fs.mkdirSync(path.join(fixture.fixtureRoot, ".claude/alias"), { recursive: true });
  fs.symlinkSync("../../docs/real/a.md", path.join(fixture.fixtureRoot, ".claude/alias/a.md"));

  const result = runChecker(fixture, ["--json"]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).broken, []);
});
