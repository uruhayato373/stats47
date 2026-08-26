import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const SCRIPT = path.join(PROJECT_ROOT, ".claude/scripts/source-vault/japan-zue-bundle.mjs");

async function fixture() {
  const root = path.join(tmpdir(), `stats47-source-vault-test-${process.pid}-${Date.now()}`);
  const source = path.join(root, "日本国勢図絵");
  await mkdir(path.join(source, "md"), { recursive: true });
  await mkdir(path.join(source, "pages", "01"), { recursive: true });
  await writeFile(path.join(source, "md", "p026.md"), "sample\n");
  await writeFile(path.join(source, "pages", "01", "p026.jpg"), "image-bytes\n");
  await writeFile(path.join(source, "page-dims.json"), "{}\n");
  return {
    root,
    source,
    bundle: path.join(root, "stats47-japan-zue-2025-26-r1.tar.gz"),
    manifest: path.join(root, "stats47-japan-zue-2025-26-r1.manifest.json"),
    parts: path.join(root, "parts"),
  };
}

async function run(args) {
  return execFileAsync(process.execPath, [SCRIPT, ...args], { cwd: PROJECT_ROOT });
}

test("create and verify produce a complete immutable manifest", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));

  await run([
    "create",
    "--source",
    paths.source,
    "--bundle",
    paths.bundle,
    "--manifest",
    paths.manifest,
    "--parts-dir",
    paths.parts,
    "--part-size-mib",
    "1",
  ]);
  const manifest = JSON.parse(await readFile(paths.manifest, "utf8"));
  assert.equal(manifest.fileCount, 3);
  assert.equal(manifest.componentCounts.markdown, 1);
  assert.equal(manifest.componentCounts.pageImages, 1);
  assert.equal(manifest.componentCounts.auxiliary, 1);
  assert.equal(manifest.files.length, 3);
  assert.equal(manifest.bundle.parts.length, 1);

  const verified = await run([
    "verify",
    "--manifest",
    paths.manifest,
    "--bundle",
    paths.bundle,
    "--source",
    paths.source,
    "--parts-dir",
    paths.parts,
  ]);
  assert.match(verified.stdout, /"fileCount": 3/);
});

test("verify rejects changed and unexpected source files", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    "create",
    "--source",
    paths.source,
    "--bundle",
    paths.bundle,
    "--manifest",
    paths.manifest,
    "--parts-dir",
    paths.parts,
    "--part-size-mib",
    "1",
  ]);
  await writeFile(path.join(paths.source, "md", "p026.md"), "changed\n");
  await writeFile(path.join(paths.source, "extra.txt"), "extra\n");

  await assert.rejects(
    run(["verify", "--manifest", paths.manifest, "--source", paths.source]),
    /Source verification failed/,
  );
});

test("restore verifies the bundle and refuses overwrite", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    "create",
    "--source",
    paths.source,
    "--bundle",
    paths.bundle,
    "--manifest",
    paths.manifest,
    "--parts-dir",
    paths.parts,
    "--part-size-mib",
    "1",
  ]);
  const target = path.join(paths.root, "restored", "日本国勢図絵");
  await run(["restore", "--manifest", paths.manifest, "--bundle", paths.bundle, "--target", target]);
  assert.equal(await readFile(path.join(target, "md", "p026.md"), "utf8"), "sample\n");
  await assert.rejects(
    run(["restore", "--manifest", paths.manifest, "--bundle", paths.bundle, "--target", target]),
    /refusing to overwrite/,
  );
});

test("restore assembles verified parts", async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    "create",
    "--source",
    paths.source,
    "--bundle",
    paths.bundle,
    "--manifest",
    paths.manifest,
    "--parts-dir",
    paths.parts,
    "--part-size-mib",
    "1",
  ]);
  await rm(paths.bundle);
  const target = path.join(paths.root, "parts-restored", "日本国勢図絵");
  await run([
    "restore",
    "--manifest",
    paths.manifest,
    "--parts-dir",
    paths.parts,
    "--target",
    target,
  ]);
  assert.equal(await readFile(path.join(target, "md", "p026.md"), "utf8"), "sample\n");
});
