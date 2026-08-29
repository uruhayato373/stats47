import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const TSX = path.join(PROJECT_ROOT, "node_modules/tsx/dist/cli.mjs");
const SCRIPT = path.join(PROJECT_ROOT, ".claude/scripts/evidence/japan-zue.ts");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fixture() {
  const root = path.join(tmpdir(), `stats47-japan-zue-evidence-${process.pid}-${Date.now()}`);
  const sourceRoot = path.join(root, "日本国勢図絵");
  const stateDir = path.join(root, "state");
  const page26 = [
    "表1-1 公開してはいけない見出し",
    "| 区分 | 値 |",
    "| --- | ---: |",
    "| A | 12.3 |",
    "総務省「公開してはいけない統計調査」より作成。",
    "全国平均は10人だった。",
  ].join("\n");
  const page27 = "図1-1 公開してはいけない図見出し\n![図](../figures/p027-fig01.jpg)\n資料は表1-1に同じ。\n";
  await mkdir(path.join(sourceRoot, "md"), { recursive: true });
  await writeFile(path.join(sourceRoot, "md/p026.md"), page26);
  await writeFile(path.join(sourceRoot, "md/p027.md"), page27);
  const manifestPath = path.join(root, "manifest.json");
  await writeFile(
    manifestPath,
    JSON.stringify({
      sourceKey: "japan-zue",
      edition: "2025-26",
      bundle: { sha256: "a".repeat(64) },
      files: [
        { path: "md/p026.md", bytes: Buffer.byteLength(page26), sha256: sha256(page26) },
        { path: "md/p027.md", bytes: Buffer.byteLength(page27), sha256: sha256(page27) },
      ],
    }),
  );
  return { root, sourceRoot, stateDir, manifestPath };
}

async function run(command, paths, extra = []) {
  return execFileAsync(
    process.execPath,
    [
      TSX,
      SCRIPT,
      command,
      "--source",
      "japan-zue",
      "--edition",
      "2025-26",
      "--source-root",
      paths.sourceRoot,
      "--manifest",
      paths.manifestPath,
      "--state-dir",
      paths.stateDir,
      "--page-start",
      "26",
      "--page-end",
      "27",
      ...extra,
    ],
    { cwd: PROJECT_ROOT },
  );
}

test("extract is deterministic and never emits book text or values", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));

  await run("extract", paths);
  const first = await readFile(path.join(paths.stateDir, "candidates.json"), "utf8");
  await run("extract", paths);
  const second = await readFile(path.join(paths.stateDir, "candidates.json"), "utf8");

  assert.equal(second, first);
  assert.doesNotMatch(first, /公開してはいけない/);
  assert.doesNotMatch(first, /12\.3/);
  const parsed = JSON.parse(first);
  assert.deepEqual(
    parsed.candidates.map(({ id }) => id),
    [
      "japan-zue-2025-26-p026-table01",
      "japan-zue-2025-26-p026-textstat01",
      "japan-zue-2025-26-p027-figure01",
    ],
  );
});

test("extract fails closed when npm strips a value-taking option", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));

  await assert.rejects(
    execFileAsync(
      process.execPath,
      [TSX, SCRIPT, "extract", paths.stateDir],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env, npm_config_state_dir: "true" },
      },
    ),
    /pass it as --state-dir=<value>/,
  );
});

test("extract fails closed when a restored source page differs from the git manifest", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await writeFile(path.join(paths.sourceRoot, "md/p026.md"), "tampered\n");

  await assert.rejects(run("extract", paths), /Source page integrity mismatch: md\/p026\.md/);
});

test("coverage --check fails until every extracted item has a reviewed resolution", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run("extract", paths);

  await assert.rejects(run("coverage", paths, ["--check"]), (error) => {
    assert.match(error.stdout, /"isComplete": false/);
    assert.match(error.stdout, /japan-zue-2025-26-p027-figure01/);
    return true;
  });
});

test("review-queue groups every candidate without emitting source text or values", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run("extract", paths);

  const { stdout } = await run("review-queue", paths, ["--check"]);
  const summary = JSON.parse(stdout);
  const queueText = await readFile(path.join(paths.stateDir, "review-queue.json"), "utf8");
  const queue = JSON.parse(queueText);

  assert.equal(summary.isComplete, true);
  assert.equal(queue.groupedCandidateCount, queue.candidateCount);
  assert.doesNotMatch(queueText, /公開してはいけない/);
  assert.doesNotMatch(queueText, /12\.3/);
});

test("structure-audit treats the world-countries chapter as an explicit stats47 scope exclusion", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run("extract", paths);

  const { stdout } = await run("structure-audit", paths, ["--check"]);
  const audit = JSON.parse(stdout);

  assert.equal(audit.isSourceScopeComplete, true);
  assert.deepEqual(audit.sourceScope.missingPages, []);
  assert.deepEqual(audit.sourceScope.excludedRanges, [
    { start: 1, end: 25, reason: "outside-stats47-prefecture-content-scope" },
  ]);
});

test("diff reports deterministic candidate changes without exposing source text", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run("extract", paths);
  const previousPath = path.join(paths.root, "previous.json");
  const nextPath = path.join(paths.root, "next.json");
  const previous = JSON.parse(await readFile(path.join(paths.stateDir, "candidates.json"), "utf8"));
  const next = structuredClone(previous);
  next.candidates[0].contentSha256 = "b".repeat(64);
  await writeFile(previousPath, JSON.stringify(previous));
  await writeFile(nextPath, JSON.stringify(next));

  const { stdout } = await run("diff", paths, [`--previous=${previousPath}`, `--next=${nextPath}`]);

  assert.match(stdout, /"changedIds"/);
  assert.match(stdout, /japan-zue-2025-26-p026-table01/);
  assert.doesNotMatch(stdout, /公開してはいけない/);
});
