/**
 * 開発画面の確認が守る意図:
 *   - 下書きの題・説明がそのまま索引の 1 行になり、記事ページが見つけられる
 *   - 本番の索引の形 (parseBlogSnapshot) を満たす
 */
import assert from "node:assert/strict";
import test from "node:test";

import { buildPreviewEntry, parseFrontmatter } from "../preview-draft-core.mjs";

const article = `---\r\ntitle: "空き家が増えたのは人口が減った町だけか"\r\nseoTitle: "増えた空き家の97%"\r\ndescription: "説明"\r\ntags:\r\n  - 空き家\r\n  - 住宅\r\npublishedAt: 2026-11-06\r\npublished: false\r\n---\r\n本文\r\n`;

test("frontmatter の引用符を外し、tags の行を集める (CRLF でも同じ)", () => {
  const frontmatter = parseFrontmatter(article);
  assert.equal(frontmatter.title, "空き家が増えたのは人口が減った町だけか");
  assert.deepEqual(frontmatter.tags, ["空き家", "住宅"]);
  assert.equal(frontmatter.published, "false");
  assert.throws(() => parseFrontmatter("本文だけ"), /frontmatter/);
});

test("下書きは公開前でも索引では公開扱いにする。そうしないと記事ページが 404 になる", () => {
  const entry = buildPreviewEntry({ slug: "a", frontmatter: parseFrontmatter(article) });
  assert.equal(entry.published, true);
  assert.equal(entry.slug, "a");
  assert.equal(entry.filePath, "app/blog/a/article.md");
  assert.equal(entry.format, "md");
});
