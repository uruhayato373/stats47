import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

describe("GET /api/content", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("既存SSOTを共通契約へ正規化しno-storeで返す", async () => {
    root = makeFixtureRoot({
      posts: [
        { id: 1, platform: "x", status: "scheduled" },
        { id: 2, platform: "instagram", status: "posted" },
      ],
      stateFiles: {
        ".claude/config/kdp-listings.json": JSON.stringify({
          listings: {
            "K-S1-01": {
              id: "K-S1-01",
              title: "テスト書籍",
              status: "draft",
              priceYen: 500,
              epubPath: ".local/kindle-books/K-S1-01/v1/book.epub",
              coverPath: ".local/kindle-books/K-S1-01/v1/cover.jpg",
            },
          },
        }),
        ".claude/state/products/kindle-status.json": JSON.stringify({
          generatedAt: "2026-08-27T00:00:00.000Z",
          books: [{ id: "K-S1-01", status: "generated" }],
        }),
        ".claude/state/products/kindle-archives.json": JSON.stringify({
          schemaVersion: 1,
          archiveFormat: "aes-256-gcm-v1",
          bucket: "stats47",
          prefix: "archive/kindle-encrypted",
          generatedAt: "2026-08-30T00:00:00.000Z",
          books: {
            "K-S1-01": {
              id: "K-S1-01",
              version: "v1",
              latestRevision: "rev1",
              revisions: [{
                revision: "rev1",
                archivedAt: "2026-08-30T00:00:00.000Z",
                verifiedAt: "2026-08-30T00:00:00.000Z",
                remotePrefix: "archive/kindle-encrypted/K-S1-01/v1/rev1",
                manifestSha256: "a".repeat(64),
                files: [{ name: "book.epub", plainSha256: "b".repeat(64), plainSize: 1 }],
              }],
            },
          },
        }),
        ".claude/state/note-draft-index.json": JSON.stringify({ drafts: {} }),
      },
    });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();

    const { GET } = await import("@/app/api/content/route");
    const response = GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(json.channels.map((x: { channel: string }) => x.channel)).toEqual([
      "x",
      "instagram",
      "note",
      "kindle",
    ]);
    expect(json.kindle[0]).toMatchObject({
      id: "K-S1-01",
      stage: "ready",
      archiveStatus: "remote-only",
    });
    expect(json.note.length).toBeGreaterThan(0);
    expect(json.audit.errors).toBe(0);
    expect(json.references).toMatchObject({
      summary: { productionUnits: 0 },
      audit: { status: "fail" },
    });
  });
});
