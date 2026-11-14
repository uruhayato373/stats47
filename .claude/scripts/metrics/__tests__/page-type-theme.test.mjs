// テーマのページは /themes/<テーマ> のほか県別・市区町村別の URL でも同じ内容を出す。
// テーマごとの実績は全ルートをまとめて数える (全国版だけを数えると、検索から入る県別のページが抜ける。2026-11-14)。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

import { classifyPageType, themeOfPath } from "../lib/page-type.mjs";

const slug = readdirSync(new URL("../../../../data/themes/catalogs/", import.meta.url)).find((f) => f.endsWith(".json")).slice(0, -5);

test("全国版・県別・市区町村別の URL が同じテーマに当たり、ルートの形で区別できる", () => {
  assert.deepEqual(themeOfPath(`/themes/${slug}`), { themeSlug: slug, route: "/themes/[themeSlug]" });
  assert.deepEqual(themeOfPath(`https://stats47.jp/areas/13000/${slug}/?x=1#top`), { themeSlug: slug, route: "/areas/[areaCode]/[themeSlug]" });
  assert.equal(themeOfPath(`/areas/22000/cities/22212/${slug}`)?.route, "/areas/[areaCode]/cities/[cityCode]/[themeSlug]");
});

test("同じ形でもテーマの名前でないページは数えない", () => {
  assert.equal(themeOfPath("/areas/13000/cities"), null);
  assert.equal(themeOfPath("/ranking/total-population"), null);
  assert.equal(themeOfPath(`/themes/not-a-theme-${Date.now()}`), null);
  assert.equal(themeOfPath(null), null);
});

test("themeOfPath が当たる URL は、ページ種別でもテーマに分類される", () => {
  for (const path of [`/themes/${slug}`, `/areas/13000/${slug}`]) {
    assert.ok(themeOfPath(path));
    assert.equal(classifyPageType(path), "theme-detail");
  }
});
