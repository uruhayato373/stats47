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
    expect(json.kindle[0]).toMatchObject({ id: "K-S1-01", stage: "draft" });
    expect(json.note.length).toBeGreaterThan(0);
    expect(json.audit.errors).toBe(0);
  });
});
