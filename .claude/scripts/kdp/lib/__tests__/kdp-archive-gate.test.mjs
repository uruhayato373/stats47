import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { assertKindleAssetsArchived, captureKindleUpload } from "../kdp-archive-gate.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("ローカル完成物がR2 archive台帳と一致する場合だけ通す", () => {
  const root = mkdtempSync(join(tmpdir(), "kdp-archive-gate-"));
  try {
    const bytes = Buffer.from("epub");
    const listing = { epubPath: ".local/kindle-books/K-S1-01/v1/book.epub", coverPath: ".local/kindle-books/K-S1-01/v1/cover.jpg" };
    mkdirSync(join(root, ".local/kindle-books/K-S1-01/v1"), { recursive: true });
    mkdirSync(join(root, ".claude/state/products"), { recursive: true });
    writeFileSync(join(root, ".local/kindle-books/K-S1-01/v1/book.epub"), bytes);
    const files = ["book.epub", "cover.jpg", "cover.png", "metadata.json", "READINESS.md"].map(name => {
      writeFileSync(join(root, ".local/kindle-books/K-S1-01/v1", name), bytes);
      return { name, plainSize: bytes.length, plainSha256: sha256(bytes) };
    });
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
              files,
            }],
          },
        },
      }),
    );
    assert.equal(assertKindleAssetsArchived(root, "K-S1-01", listing).ok, true);
    const archived = assertKindleAssetsArchived(root, "K-S1-01", listing);
    const upload = captureKindleUpload(root, listing, archived);
    assert.deepEqual(upload.epub.buffer, bytes);
    assert.equal(upload.epub.name, "book.epub");
    writeFileSync(join(root, listing.epubPath), "concurrent edit");
    assert.deepEqual(upload.epub.buffer, bytes, "captured upload bytes remain immutable after a path edit");
    assert.throws(() => captureKindleUpload(root, listing, archived), /資産が変化/);
    writeFileSync(join(root, listing.epubPath), bytes);
    const statePath = join(root, ".claude/state/products/kindle-archives.json");
    const baseline = JSON.parse(readFileSync(statePath, "utf8"));
    for (const mutation of [
      null,
      { books: { "K-S1-01": { revisions: {} } } },
      ...[
        { verifiedAt: "" },
        { files: [] },
        { files: [files[0], files[0], ...files.slice(1)] },
        { files: [...files, { name: "../../secret" }] },
        { files: [null, ...files] },
      ].map(change => ({ books: { "K-S1-01": { ...baseline.books["K-S1-01"], revisions: [{ ...baseline.books["K-S1-01"].revisions[0], ...change }] } } })),
    ]) {
      writeFileSync(statePath, JSON.stringify(mutation));
      assert.equal(assertKindleAssetsArchived(root, "K-S1-01", listing).ok, false);
    }
    writeFileSync(statePath, JSON.stringify(baseline));
    assert.equal(assertKindleAssetsArchived(root, "K-S1-01", { ...listing, epubPath: 42 }).ok, false);
    const cover = join(root, listing.coverPath);
    const substitute = join(root, "same-bytes.jpg");
    writeFileSync(substitute, bytes);
    unlinkSync(cover);
    symlinkSync(substitute, cover);
    assert.match(assertKindleAssetsArchived(root, "K-S1-01", listing).reason, /symlink/);
    unlinkSync(cover);
    writeFileSync(cover, bytes);
    assert.equal(assertKindleAssetsArchived(root, "K-S1-01").ok, false);
    assert.match(assertKindleAssetsArchived(root, "K-S1-01", { ...listing, epubPath: listing.epubPath.replace("v1", "v2") }).reason, /送信版/);
    writeFileSync(join(root, ".local/kindle-books/K-S1-01/v1/book.epub"), "changed");
    assert.match(assertKindleAssetsArchived(root, "K-S1-01", listing).reason, /一致しません/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
