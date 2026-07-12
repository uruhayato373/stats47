const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-repo-hygiene.cjs");

function createFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-repo-hygiene-"));
  execFileSync("git", ["init", "-q"], { cwd: fixtureRoot });
  const checkerPath = path.join(fixtureRoot, ".claude/scripts/lib/check-repo-hygiene.cjs");
  fs.mkdirSync(path.dirname(checkerPath), { recursive: true });
  fs.copyFileSync(CHECKER, checkerPath);
  fs.writeFileSync(path.join(fixtureRoot, "README.md"), "ok\n");
  execFileSync("git", ["add", "."], { cwd: fixtureRoot });
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "fixture"], {
    cwd: fixtureRoot,
  });
  return { fixtureRoot, checkerPath };
}

function add(fixture, file, content = "x") {
  const absolute = path.join(fixture.fixtureRoot, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
  execFileSync("git", ["add", file], { cwd: fixture.fixtureRoot });
}

function run(fixture, args = []) {
  const result = spawnSync(process.execPath, [fixture.checkerPath, "--json", ...args], {
    cwd: fixture.fixtureRoot,
    encoding: "utf8",
    env: { ...process.env, REPO_HYGIENE_MAX_BYTES: "32" },
  });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("baseline内の既存違反は許容する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  add(fixture, "type-check-output.txt");
  execFileSync(process.execPath, [fixture.checkerPath, "--write-baseline"], {
    cwd: fixture.fixtureRoot,
    env: { ...process.env, REPO_HYGIENE_MAX_BYTES: "32" },
  });
  const result = run(fixture, ["--baseline"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output.regressions.length, 0);
});

test("新規一時ファイルを検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  execFileSync(process.execPath, [fixture.checkerPath, "--write-baseline"], { cwd: fixture.fixtureRoot });
  add(fixture, "tmp/debug.log");
  const result = run(fixture, ["--baseline"]);
  assert.equal(result.status, 1);
  assert.ok(result.output.regressions.some((item) => item.code === "FORBIDDEN_ARTIFACT"));
});

test("新規大容量ファイルを検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  execFileSync(process.execPath, [fixture.checkerPath, "--write-baseline"], { cwd: fixture.fixtureRoot });
  add(fixture, "assets/large.bin", "x".repeat(64));
  const result = run(fixture, ["--baseline"]);
  assert.equal(result.status, 1);
  assert.ok(result.output.regressions.some((item) => item.code === "LARGE_FILE"));
});

test("大文字小文字だけ異なるpathを検出する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  const blob = execFileSync("git", ["hash-object", "-w", "--stdin"], {
    cwd: fixture.fixtureRoot,
    input: "fixture\n",
    encoding: "utf8",
  }).trim();
  execFileSync("git", ["update-index", "--add", "--cacheinfo", "100644", blob, "docs/Guide.md"], {
    cwd: fixture.fixtureRoot,
  });
  execFileSync("git", ["update-index", "--add", "--cacheinfo", "100644", blob, "docs/guide.md"], {
    cwd: fixture.fixtureRoot,
  });
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.ok(result.output.regressions.some((item) => item.code === "CASE_COLLISION"));
});

test("--stagedは staged fileだけを検査する", (t) => {
  const fixture = createFixture();
  t.after(() => fs.rmSync(fixture.fixtureRoot, { recursive: true, force: true }));
  add(fixture, "tmp/new.tmp");
  const result = run(fixture, ["--staged"]);
  assert.equal(result.status, 1);
  assert.equal(result.output.checked, 1);
});
