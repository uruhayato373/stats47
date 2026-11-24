import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertProposalMatchesCurrentBook, prepareFirst, prepareNewEdition, prepareUpdate } from "../src/channels/kindle/promote-kdp-listing";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import { authoredBookSha256 } from "../src/channels/kindle/revision-evidence";
import { KDP_LISTINGS } from "../../../config/paths.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const entry = resolve(root, "packages/product-factory/src/channels/kindle/export-kdp-listings.ts");
const publication = resolve(root, KDP_LISTINGS);
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

  it("in-place update of a new edition keeps the predecessor disclaimer at the top of the description", () => {
    const edition = {
      ...live,
      title: "新題",
      subtitle: "新副題",
      replacesAsin: "B000000009",
      previousEditions: [{ asin: "B000000009", title: "旧版の題", author: "stats47" }],
    };
    const out = prepareUpdate(edition, { ...candidate, title: "新題", subtitle: "新副題", description: "本文の説明" });
    expect(out.description).toBe("Previously published as 旧版の題 by stats47.\n\n本文の説明");
    const again = prepareUpdate(edition, { ...candidate, title: "新題", subtitle: "新副題", description: out.description });
    expect(again.description).toBe(out.description);
  });

  it("first は台帳に行が無い本だけに使え、運用の項目を落として下書きの準備から始める", () => {
    const out = prepareFirst(undefined, candidate, "2026-11-14T00:00:00.000Z");
    expect(out).toMatchObject({ title: "新題", status: "draft", kdpStatus: "draft", asin: null, publishedAt: null, publicationStage: "prepared" });
    expect(out).not.toHaveProperty("draftId");
    expect(out.publicationStageEvidence).toEqual({ prepared: { at: "2026-11-14T00:00:00.000Z", mode: "first" } });
    // [mutation] 行がある本に first を使うと、販売中の記録を上書きしてしまうので止める
    expect(() => prepareFirst(live, candidate, "2026-11-14T00:00:00.000Z")).toThrow(/no ledger row/);
  });
});

describe("KDP promote refuses a proposal made before the book's ledger/manuscript changed", () => {
  const factoryRoot = resolve(root, "packages/product-factory");
  const version = "v-stale-test";
  const book = KINDLE_BOOKS[0];
  const setup = () => {
    const booksRoot = mkdtempSync(join(tmpdir(), "kdp-promote-"));
    const dir = join(booksRoot, book.id, version);
    mkdirSync(dir, { recursive: true });
    const sha = authoredBookSha256(book, factoryRoot);
    writeFileSync(join(dir, "metadata.json"), JSON.stringify({ version, title: book.title, authoredSha256: sha }));
    return { booksRoot, sha };
  };

  it("通常の流れ (EPUB・提案・今の書籍が同じ版) では通る", () => {
    const { booksRoot, sha } = setup();
    try {
      expect(() => assertProposalMatchesCurrentBook({ authoredSha256ByBook: { [book.id]: sha } }, book, version, booksRoot, factoryRoot)).not.toThrow();
    } finally { rmSync(booksRoot, { recursive: true, force: true }); }
  });

  it("書籍の台帳を変えたあとに古い提案で promote すると error になる", () => {
    const { booksRoot, sha } = setup();
    try {
      const changed = { ...book, concept: `${book.concept} (台帳を変更)` };
      expect(() => assertProposalMatchesCurrentBook({ authoredSha256ByBook: { [book.id]: sha } }, changed, version, booksRoot, factoryRoot))
        .toThrow(/differs from the requested EPUB edition/);
    } finally { rmSync(booksRoot, { recursive: true, force: true }); }
  });

  it("提案の照合値が今の書籍と違う・無いときも error になる", () => {
    const { booksRoot } = setup();
    try {
      expect(() => assertProposalMatchesCurrentBook({ authoredSha256ByBook: { [book.id]: "0".repeat(64) } }, book, version, booksRoot, factoryRoot)).toThrow(/stale/);
      expect(() => assertProposalMatchesCurrentBook({}, book, version, booksRoot, factoryRoot)).toThrow(/stale/);
    } finally { rmSync(booksRoot, { recursive: true, force: true }); }
  });
});
