import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { assertKindleAssetsArchived } from "../kdp-archive-gate.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("ローカル完成物がR2 archive台帳と一致する場合だけ通す", () => {
  const root = mkdtempSync(join(tmpdir(), "kdp-archive-gate-"));
  try {
    const bytes = Buffer.from("epub");
    mkdirSync(join(root, ".local/kindle-books/K-S1-01/v1"), { recursive: true });
    mkdirSync(join(root, ".claude/state/products"), { recursive: true });
    writeFileSync(join(root, ".local/kindle-books/K-S1-01/v1/book.epub"), bytes);
    writeFileSync(
      join(root, ".claude/state/products/kindle-archives.json"),
      JSON.stringify({
        books: {
          "K-S1-01": {
            version: "v1",
            latestRevision: "rev1",
            revisions: [{
              revision: "rev1",
              verifiedAt: "2026-08-30T00:00:00.000Z",
              files: [{ name: "book.epub", plainSize: bytes.length, plainSha256: sha256(bytes) }],
            }],
          },
        },
      }),
    );
    assert.equal(assertKindleAssetsArchived(root, "K-S1-01").ok, true);
    writeFileSync(join(root, ".local/kindle-books/K-S1-01/v1/book.epub"), "changed");
    assert.match(assertKindleAssetsArchived(root, "K-S1-01").reason, /一致しません/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
