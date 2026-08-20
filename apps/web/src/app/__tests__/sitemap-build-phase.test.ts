/**
 * ビルド条件 (NEXT_PHASE=phase-production-build) での sitemap 実物検証。
 *
 * 姉妹テスト `sitemap-build-fallback.test.ts` は reader を **モック**して「空を返したら」を検証する。
 * こちらは **モックせず実物の reader** を使い、`NEXT_PHASE` を立てることでビルド時と同じ分岐
 * (`isNextProductionBuild()` の早期 return) を通す。ネットワークには出ない — ガードが fetch より
 * 手前で返すため。両方あって初めて「ビルドすると本当にこの件数になる」と言える。
 *
 * Windows では `next build` が vendored @vercel/og の path.join バグで完走しないため、
 * ビルド成果物そのものを手元で作れない。その代替検証がこのテスト。
 */
import { CATEGORY_KEYS } from "@stats47/data-configs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { SITEMAP_BLOG_ENTRIES, SITEMAP_SURVEY_IDS, SITEMAP_TAG_ENTRIES } from "@/config/sitemap-blog-entries";

import sitemap, { generateSitemaps } from "../sitemap";

const SEGMENT_ID = { blog: 4, categories: 5, surveys: 6, tags: 7 } as const;

describe("sitemap: NEXT_PHASE=phase-production-build (実 reader)", () => {
  let original: string | undefined;

  beforeAll(() => {
    original = process.env.NEXT_PHASE;
    process.env.NEXT_PHASE = "phase-production-build";
  });
  afterAll(() => {
    if (original === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = original;
  });

  it("blog segment がビルド時も公開記事を全件出す", async () => {
    const entries = await sitemap({ id: SEGMENT_ID.blog });
    // 修正前はここが 1 (/blog のみ) だった
    expect(entries.length).toBe(SITEMAP_BLOG_ENTRIES.length + 1);
    expect(entries.length).toBeGreaterThan(100);
  });

  it("categories segment がビルド時も 17 軸を出す", async () => {
    // 修正前はここが 0 だった
    const entries = await sitemap({ id: SEGMENT_ID.categories });
    expect(entries.length).toBe(CATEGORY_KEYS.length);
  });

  it("surveys segment がビルド時も配信中の調査を全件出す", async () => {
    // 修正前はここが 1 (/survey のみ) だった
    const entries = await sitemap({ id: SEGMENT_ID.surveys });
    expect(entries.length).toBe(SITEMAP_SURVEY_IDS.length + 1);
  });

  it("tags segment がビルド時もタグを出す", async () => {
    // 修正前はここが 0 だった
    const entries = await sitemap({ id: SEGMENT_ID.tags });
    expect(entries.length).toBe(SITEMAP_TAG_ENTRIES.length);
  });

  it("全 segment の合計がビルド前の実測 (4,177) を上回る", async () => {
    // ハードコードした segment 数だと新規 segment 追加時に無言でテスト対象から漏れる
    // (GEO-SCOPE-SEPARATION-01 WP5 で japan segment を追加した際に発見)。
    // generateSitemaps() を単一ソースにして総数を動的に導出する。
    const segmentIds = await generateSitemaps();
    let total = 0;
    for (const { id } of segmentIds) {
      total += (await sitemap({ id })).length;
    }
    // 2026-08-06 の本番実測は 4,177 URL。欠落 4 segment を埋めた分だけ増える。
    expect(total).toBeGreaterThan(4177);
  });

  it("japan segment がビルド時も pilot テーマを出す (R2 非依存の git constant)", async () => {
    const segmentIds = await generateSitemaps();
    const japanId = segmentIds.length - 1; // WP5: 末尾に追記 (既存 id を変えない)
    const entries = await sitemap({ id: japanId });
    expect(entries.some((e) => e.url.endsWith("/japan"))).toBe(true);
    expect(entries.some((e) => e.url.endsWith("/japan/education-culture"))).toBe(true);
  });
});
