import { describe, expect, it } from "vitest";

import { buildContentOperations, type ContentOperationsInput } from "@/lib/content-operations/core";

function fixture(overrides: Partial<ContentOperationsInput> = {}): ContentOperationsInput {
  return {
    generatedAt: "2026-08-27T00:00:00.000Z",
    socialPosts: [
      { platform: "x", status: "scheduled" },
      { platform: "instagram", status: "posted" },
    ],
    kindleListings: [
      {
        id: "K-S1-01",
        title: "書名",
        status: "draft",
        priceYen: 500,
        epubPath: ".local/book.epub",
        coverPath: ".local/cover.jpg",
        hasEpub: true,
        hasCover: true,
        manuscriptCount: 3,
      },
    ],
    kindleBuildBooks: [{ id: "K-S1-01", status: "generated" }],
    noteArticles: [
      {
        key: "ready-note",
        title: "公開準備済み記事",
        vertical: "stats47-note",
        magazine: null,
        isPaid: false,
        status: "draft",
        r2Path: "note/stats47-note/ready-note",
      },
      {
        key: "live-note",
        title: "公開済み記事",
        vertical: "stats47-note",
        magazine: "s47-population",
        isPaid: false,
        status: "published",
        noteUrl: "https://note.com/stats47/n/example",
        publishedAt: "2026-08-20",
        r2Path: "note/stats47-note/live-note",
      },
    ],
    noteDraftStatuses: { "ready-note": "ready-to-publish" },
    backlogText: "# backlog\n\n### [SYSTEM-CONTENT-01] 運用基盤の改善\n",
    kdpPolicy: {
      mode: "active",
      decisionStatus: "decided",
      title: "出版継続",
      reason: "需要確認済み",
      resumeCondition: "不要",
      source: "fixture",
    },
    ...overrides,
  };
}

describe("content operations core", () => {
  it("4チャネルを共通stageへ正規化する", () => {
    const result = buildContentOperations(fixture());

    expect(result.audit.status).toBe("pass");
    expect(result.channels.map((x) => [x.channel, x.total])).toEqual([
      ["x", 1],
      ["instagram", 1],
      ["note", 2],
      ["kindle", 1],
    ]);
    expect(result.kindle[0]).toMatchObject({ stage: "ready", manuscriptCount: 3 });
    expect(result.note.map((x) => [x.key, x.stage])).toEqual([
      ["ready-note", "ready"],
      ["live-note", "published"],
    ]);
  });

  it("listedの証跡欠落とnote孤児をerrorとして検出する", () => {
    const input = fixture({
      kindleListings: [
        {
          ...fixture().kindleListings[0],
          status: "listed",
          hasEpub: false,
          hasCover: false,
        },
      ],
      noteDraftStatuses: { orphan: "draft" },
    });
    const result = buildContentOperations(input);

    expect(result.audit.status).toBe("fail");
    expect(result.audit.findings.map((x) => x.code)).toEqual(
      expect.arrayContaining(["KDP_LISTED_EVIDENCE_MISSING", "NOTE_DRAFT_ORPHAN"]),
    );
  });

  it("審査中を公開済みと誤認せず、ASIN割当前でもreviewにする", () => {
    const input = fixture({
      kindleListings: [
        {
          ...fixture().kindleListings[0],
          status: "listed",
          draftId: "draft-1",
          publishedAt: "2026-08-27",
          asin: null,
          kdpStatus: "in_review",
          kdpStatusLabel: "レビュー中",
          kdpStatusCheckedAt: "2026-08-30T00:00:00.000Z",
          archiveVersion: "v1",
          archiveRevision: "rev1",
          archiveArchivedAt: "2026-08-30T00:00:00.000Z",
          archiveVerifiedAt: "2026-08-30T00:00:00.000Z",
          localArchiveRevision: "rev1",
        },
      ],
      noteArticles: [
        {
          ...fixture().noteArticles[1],
          publishedAt: undefined,
        },
      ],
      noteDraftStatuses: {},
    });
    const result = buildContentOperations(input);

    expect(result.audit.status).toBe("warn");
    expect(result.audit.errors).toBe(0);
    expect(result.audit.findings.map((x) => x.code)).toContain("NOTE_PUBLISHED_AT_UNKNOWN");
    expect(result.kindle[0]).toMatchObject({
      stage: "review",
      archiveStatus: "verified",
      kdpStatus: "in_review",
    });
  });

  it("build台帳とKDP listingの集合差を双方向で検出する", () => {
    const result = buildContentOperations(
      fixture({ kindleBuildBooks: [{ id: "K-S1-99", status: "generated" }] }),
    );

    expect(result.audit.findings.map((x) => x.code)).toEqual(
      expect.arrayContaining(["KINDLE_BUILD_STATE_MISSING", "KDP_LISTING_MISSING"]),
    );
  });

  it("個別コンテンツをTODOカードへ複製すると拒否する", () => {
    const result = buildContentOperations(
      fixture({ backlogText: "### [K-S1-01] この本を公開する\n" }),
    );

    expect(result.audit.status).toBe("fail");
    expect(result.audit.findings).toContainEqual(
      expect.objectContaining({ code: "BACKLOG_CONTENT_ITEM_MIRROR", itemId: "K-S1-01" }),
    );
  });
});
