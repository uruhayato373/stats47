import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertPrivateSourcePath } from "./ingest-cultural-heritage.mjs";
test("raw HTML/PDF cannot be placed in a public R2 tree, including misleading relative names", () => {
  const root = "/tmp/heritage-test-public-root";
  for (const path of [root, `${root}/app/source`, `${root}/..foo/source`])
    assert.throws(() => assertPrivateSourcePath(path, root));
  assert.doesNotThrow(() =>
    assertPrivateSourcePath("/tmp/heritage-test-private", root),
  );
});
test("a source symlink cannot disguise a directory inside public R2", () => {
  const dir = mkdtempSync(join(tmpdir(), "heritage-path-test-"));
  try {
    const publicRoot = join(dir, "public");
    const inside = join(publicRoot, "app");
    mkdirSync(inside, { recursive: true });
    const link = join(dir, "private-alias");
    symlinkSync(inside, link);
    assert.throws(() => assertPrivateSourcePath(link, publicRoot));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
