import { describe, expect, it } from "vitest";

import { SITEMAP_SEGMENTS } from "@/config/sitemap-segments";

/**
 * sitemap index (`/sitemap.xml`) と各 shard (`/sitemap/<id>.xml`) の件数一致を固定する。
 *
 * ★なぜ要るか (2026-08-20 実測):
 *   index 側が `const SEGMENT_COUNT = 8` とハードコードされ、「追加時は両方を更新」
 *   というコメントだけで同期を担保していた。実際には守られず、
 *   **cities (1,080 URL) が 2 か月・japan (19 URL) が新設直後から index に載らず**、
 *   Google に一度も提出されていなかった。shard 自体は 200 で配信されていたため、
 *   ページを直接叩く監視では発見できない (index を経由して初めて分かる)。
 *
 * ★この検査は「件数」ではなく「同じ配列を読んでいること」を担保する方向で書く。
 *   数値を書くと、それ自体が 3 つ目の手動同期先になる。
 */
describe("sitemap index ↔ shard の件数整合", () => {
  it("index route が SITEMAP_SEGMENTS.length ぶんの <sitemap> を出す", async () => {
    const { GET } = await import("@/app/sitemap.xml/route");
    const xml = await (await GET()).text();
    const count = (xml.match(/<sitemap>/g) ?? []).length;
    expect(count).toBe(SITEMAP_SEGMENTS.length);
  });

  it("generateSitemaps が SITEMAP_SEGMENTS.length ぶんの id を返す", async () => {
    const { generateSitemaps } = await import("@/app/sitemap");
    const ids = await generateSitemaps();
    expect(ids.length).toBe(SITEMAP_SEGMENTS.length);
    // id は配列 index と 1:1 (順序を変えると公開済み URL が変わるため)
    expect(ids.map((x) => x.id)).toEqual(SITEMAP_SEGMENTS.map((_, i) => i));
  });

  it("index が列挙する URL に全 shard が含まれる (欠番なし)", async () => {
    const { GET } = await import("@/app/sitemap.xml/route");
    const xml = await (await GET()).text();
    for (let id = 0; id < SITEMAP_SEGMENTS.length; id += 1) {
      expect(xml).toContain(`/sitemap/${id}.xml`);
    }
  });

  it("japan segment が末尾にあり index に載る (GEO-SCOPE-SEPARATION-01 の完了条件)", () => {
    expect(SITEMAP_SEGMENTS[SITEMAP_SEGMENTS.length - 1]).toBe("japan");
  });
});
