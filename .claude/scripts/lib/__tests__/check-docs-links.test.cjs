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
