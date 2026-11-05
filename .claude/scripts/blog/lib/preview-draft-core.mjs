/** 開発画面の確認用に、下書きの frontmatter から索引の 1 行を作る純粋関数。 */

/** 確認に要る項目だけを読む。値の二重引用符を外し、tags の行を集める */
export function parseFrontmatter(markdown) {
  const block = markdown.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/);
  if (!block) throw new Error("frontmatter が無い");
  const out = { tags: [] };
  let inTags = false;
  for (const line of block[1].split("\n")) {
    const tag = line.match(/^\s+-\s+(.+)$/);
    if (inTags && tag) {
      out.tags.push(tag[1].trim());
      continue;
    }
    inTags = false;
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field) continue;
    if (field[1] === "tags") {
      inTags = true;
      continue;
    }
    out[field[1]] = field[2].replace(/^"(.*)"$/, "$1");
  }
  return out;
}

/** 索引の形は apps/web の parseBlogSnapshot に合わせる。記事ページが見つけられるよう公開扱いにする */
export function buildPreviewEntry({ slug, frontmatter }) {
  return {
    slug,
    title: frontmatter.title,
    seoTitle: frontmatter.seoTitle ?? null,
    description: frontmatter.description ?? null,
    filePath: `app/blog/${slug}/article.md`,
    published: true,
    publishedAt: frontmatter.publishedAt ?? null,
    format: "md",
    hasCharts: true,
    ogImageType: null,
    proofreadAt: null,
    createdAt: null,
    updatedAt: null,
    tags: [],
  };
}
