/**
 * fetch-popular-blog-articles.mjs のテスト — GA4 のページから「よく読まれている記事」を選ぶ規則 (2026-11-12)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { blogSlugOf, selectPopularArticles } from "../fetch-popular-blog-articles.mjs";

test("ブログ記事のページだけを slug にする (タグ一覧・一覧・クエリ付きの扱い)", () => {
  assert.equal(blogSlugOf("/blog/alcohol-prefecture-map"), "alcohol-prefecture-map");
  assert.equal(blogSlugOf("/blog/alcohol-prefecture-map/?utm_source=x"), "alcohol-prefecture-map");
  assert.equal(blogSlugOf("/blog"), null);
  assert.equal(blogSlugOf("/blog/tags"), null);
  assert.equal(blogSlugOf("/blog/tags/人口"), null);
  assert.equal(blogSlugOf("/ranking/total-population"), null);
});

test("同じ記事の行は合算し、閲覧数の多い順に件数まで返す", () => {
  const rows = [
    { pagePath: "/blog/b", screenPageViews: "50" },
    { pagePath: "/blog/a", screenPageViews: "30" },
    { pagePath: "/blog/a?x=1", screenPageViews: "40" },
    { pagePath: "/blog/tags", screenPageViews: "999" },
    { pagePath: "/blog/c", screenPageViews: "10" },
  ];
  assert.deepEqual(selectPopularArticles(rows, 2), [
    { slug: "a", pageViews: 70 },
    { slug: "b", pageViews: 50 },
  ]);
});
