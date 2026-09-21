import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { prepareNewEdition, prepareUpdate } from "../src/channels/kindle/promote-kdp-listing";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const entry = resolve(root, "packages/product-factory/src/channels/kindle/export-kdp-listings.ts");
const publication = resolve(root, ".claude/config/kdp-listings.json");
const CLI_TIMEOUT_MS = 60_000;

describe("KDP revision preparation cannot overwrite publication history", () => {
  it("rejects apply, missing/unsafe versions, and incomplete editions without changing the ledger", () => {
    const before = readFileSync(publication);
    const version = "absent-test-edition-9f423";
    for (const args of [["--apply"], [], ["--version", "../v1"], ["--version", version]]) {
      const result = spawnSync(process.execPath, ["--import", "tsx", entry, ...args], {
        cwd: root, encoding: "utf8", timeout: CLI_TIMEOUT_MS,
      });
      expect(result.status).not.toBe(0);
      expect(result.error).toBeUndefined();
      expect(readFileSync(publication).equals(before)).toBe(true);
    }
    expect(existsSync(resolve(root, ".local/kindle-listing-revisions", `${version}.json`))).toBe(false);
  }, 180_000);
});

describe("KDP revision promotion", () => {
  const live = {
    id: "K-S1-01",
    title: "旧題",
    subtitle: "旧副題",
    author: "stats47",
    status: "listed",
    kdpStatus: "live",
    asin: "B000000001",
    draftId: "A000000001",
    publishedAt: "2026-08-01",
  };
  const candidate = {
    id: "K-S1-01",
    title: "新題",
    subtitle: "新副題",
    author: "stats47",
    description: "新版の説明",
    status: "listed",
    kdpStatus: "live",
    asin: "B000000001",
    draftId: "A000000001",
    epubPath: ".local/kindle-books/K-S1-01/v2/book.epub",
    coverPath: ".local/kindle-books/K-S1-01/v2/cover.jpg",
  };

  it("new edition retains the predecessor and clears current operational identity", () => {
    const next = prepareNewEdition(live, candidate, "2026-09-20T00:00:00.000Z");
    expect(next.status).toBe("draft");
    expect(next.asin).toBeNull();
    expect(next.draftId).toBeUndefined();
    expect(next.editionNumber).toBe(2);
    expect(next.publicationStage).toBe("prepared");
    expect(next.replacesAsin).toBe("B000000001");
    expect(next.description).toBe("Previously published as 旧題 by stats47.\n\n新版の説明");
    expect(next.previousEditions).toEqual([
      expect.objectContaining({ asin: "B000000001", draftId: "A000000001", unpublishAfterReplacementLive: true }),
    ]);
  });

  it("in-place update rejects a locked title change", () => {
    expect(() => prepareUpdate(live, candidate)).toThrow(/title\/subtitle is locked/);
    expect(prepareUpdate(live, { ...candidate, title: "旧題", subtitle: "旧副題" }, "2026-09-20T00:00:00.000Z")).toEqual(
      expect.objectContaining({ asin: "B000000001", draftId: "A000000001", publicationStage: "prepared" }),
    );
  });
});
