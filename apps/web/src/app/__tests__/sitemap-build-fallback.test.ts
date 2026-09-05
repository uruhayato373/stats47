/**
 * sitemap のビルド時フォールバック回帰テスト。
 *
 * 守る不変条件: **R2 が空を返しても sitemap の各 segment が空にならないこと**。
 *
 * 背景 (2026-08-06): sitemap は generateSitemaps() を持つためビルド時に prerender されるが、
 * ビルド環境には R2 到達手段が無く reader が「成功した空」(`ok([])`) を返していた。
 * 結果、公開 422 記事 / survey 73 / category 17 / tag 59 が **1 件も提出されていなかった**
 * (本番実測: sitemap/4.xml は /blog のみ、5.xml と 7.xml は 0 件)。
 * 型検査でも lint でも見えず、本番 sitemap を数えて初めて判明した種類の欠陥なので、
 * 「R2 が空のとき」を明示的に再現して守る。
 */
import { CATEGORY_KEYS } from "@stats47/data-configs";
import { ok } from "@stats47/types";
import { describe, it, expect, vi } from "vitest";

import { SITEMAP_BLOG_ENTRIES, SITEMAP_SURVEY_IDS, SITEMAP_TAG_ENTRIES } from "@/config/sitemap-blog-entries";
import { SITEMAP_SEGMENTS } from "@/config/sitemap-segments";

import sitemap from "../sitemap";

// R2 reader をすべて「成功した空」にする = ビルド時と同じ状態を再現する
// (vi.mock は vitest が巻き上げるため import より後に書いても効く)
vi.mock("@stats47/category/server", () => ({
  readCategoriesFromR2: vi.fn(async () => ok([])),
}));
vi.mock("@stats47/ranking/server", () => ({
  readActiveKeysForSitemapFromR2: vi.fn(async () => ok([])),
  readSurveysFromR2: vi.fn(async () => ok([])),
}));
vi.mock("@/features/blog/server", () => ({
  listLatestArticles: vi.fn(async () => []),
  listAllTagsWithCount: vi.fn(async () => []),
}));

/**
 * segment → shard id。**手写ししない**。
 * 単一ソース `@/config/sitemap-segments` の index から導出する
 * (2026-08-20: index 側の件数ハードコードで cities/japan が 2 か月漏れた再発防止)。
 */
const idOf = (name: (typeof SITEMAP_SEGMENTS)[number]): number =>
  SITEMAP_SEGMENTS.indexOf(name);
const SEGMENT_ID = {
  blog: idOf("blog"),
  categories: idOf("categories"),
  surveys: idOf("surveys"),
  tags: idOf("tags"),
} as const;

describe("sitemap ビルド時フォールバック (R2 が空でも空にしない)", () => {
  it('公開終了した3記事をR2不在時にもサイトマップへ戻さない', async () => {
    const entries = await sitemap({ id: SEGMENT_ID.blog });
    for (const slug of ['airport-count-vs-wind-power-plant-count-facility', 'dam-count-prefecture-gap', 'dam-count-vs-road-expressway-length']) {
      expect(entries.some((entry) => entry.url.endsWith(`/blog/${slug}`))).toBe(false);
      expect(SITEMAP_BLOG_ENTRIES.some((entry) => entry.slug === slug)).toBe(false);
    }
  });

  it("blog: 公開記事が全件出る (/blog + 記事)", async () => {
    const entries = await sitemap({ id: SEGMENT_ID.blog });
    expect(SITEMAP_BLOG_ENTRIES.length).toBeGreaterThan(0);
    expect(entries).toHaveLength(SITEMAP_BLOG_ENTRIES.length + 1);
    expect(entries.some((e) => e.url.endsWith("/blog"))).toBe(true);
    expect(entries.filter((e) => e.url.includes("/blog/")).length).toBe(
      SITEMAP_BLOG_ENTRIES.length,
    );
  });

  it("categories: 17 軸が出る", async () => {
    const entries = await sitemap({ id: SEGMENT_ID.categories });
    expect(entries).toHaveLength(CATEGORY_KEYS.length);
    expect(entries.every((e) => e.url.includes("/category/"))).toBe(true);
  });

  it("surveys: 配信されている調査が全件出る (/survey + 各調査)", async () => {
    const entries = await sitemap({ id: SEGMENT_ID.surveys });
    expect(SITEMAP_SURVEY_IDS.length).toBeGreaterThan(0);
    expect(entries).toHaveLength(SITEMAP_SURVEY_IDS.length + 1);
  });

  it("tags: 記事 5 本以上のタグが出る", async () => {
    const entries = await sitemap({ id: SEGMENT_ID.tags });
    expect(SITEMAP_TAG_ENTRIES.length).toBeGreaterThan(0);
    expect(entries).toHaveLength(SITEMAP_TAG_ENTRIES.length);
    expect(entries.every((e) => e.url.includes("/tag/"))).toBe(true);
  });

  it("tag の URL は percent-encode されている (canonical と一致させる)", async () => {
    const entries = await sitemap({ id: SEGMENT_ID.tags });
    const jaTag = SITEMAP_TAG_ENTRIES.find((t) => /[^ -~]/.test(t.tagKey));
    expect(jaTag, "非 ASCII のタグが 1 件も無いと検査にならない").toBeDefined();
    const expected = `https://stats47.jp/tag/${encodeURIComponent(jaTag!.tagKey)}`;
    expect(entries.some((e) => e.url === expected)).toBe(true);
    // 生の日本語が loc に混ざっていないこと (ページの canonical は encode 形)
    expect(entries.every((e) => !/[^ -~]/.test(e.url))).toBe(true);
  });

  it("reader が throw しても空にしない (getter 内フォールバックが効かない経路)", async () => {
    const { readCategoriesFromR2 } = await import("@stats47/category/server");
    vi.mocked(readCategoriesFromR2).mockRejectedValueOnce(new Error("R2 unreachable"));
    const entries = await sitemap({ id: SEGMENT_ID.categories });
    expect(entries).toHaveLength(CATEGORY_KEYS.length);
  });

  it("survey id は本番 404 にならない形をしている (合成 id / 表記ゆれを提出しない)", () => {
    // ★個別 id をここに固定しない (2026-08-17 改訂)。
    //   旧版は「実測 2026-08-06: livestock-statistics は orphan」として id を直書きしていたが、
    //   dairy-cattle-count の配信が直って livestock-statistics が正当に配信対象へ入った途端に落ちた。
    //   どの調査が配信されるかは metric の isActive と観測値の有無で日々動くので、
    //   スナップショットを assert すると「データを直すとテストが落ちる」状態になる。
    //
    //   「git master のコピーではなく R2 の配信実態から導出されている」ことは
    //   Static Gates の generate-sitemap-blog-entries --check が毎 PR 実測する。
    //   ここは offline で検証できる構造 (= 404 になる形をしていないか) だけを見る。
    expect(SITEMAP_SURVEY_IDS.length).toBeGreaterThan(0);
    // 合成 id (`ssds-src:世界農林業センサス` / `src:*`) はマスタに実在せず /survey/<id> が 404 になる
    // (2026-07-24 に約 231 ランキングページが実際に 404 リンクを張っていた)
    expect(SITEMAP_SURVEY_IDS.filter((id) => /^(?:ssds-)?src:/.test(id))).toEqual([]);
    // surveys.json の id 規約は kebab-case ASCII。日本語や大文字が混ざるのは合成 id の兆候
    expect(SITEMAP_SURVEY_IDS.filter((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toEqual([]);
    expect(new Set(SITEMAP_SURVEY_IDS).size).toBe(SITEMAP_SURVEY_IDS.length);
  });
});
