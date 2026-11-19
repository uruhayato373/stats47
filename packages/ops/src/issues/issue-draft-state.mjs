/**
 * 図の配信先の下書き (contents/blog/<slug>) が公開までの何待ちかを読む。
 * issues:figures と管理画面の問いの進み具合が同じ判定を使うため、ファイルの読み込みをここに 1 つだけ置く。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { classifyDraft } from "./issue-graph-core.mjs";

/**
 * @param {string} root リポジトリの絶対パス
 * @param {Array<{ destinations: Array<{ slug?: string }> }>} figures
 * @returns {Map<string, string>} slug → 待ちの状態
 */
export function readDraftStates(root, figures) {
  const slugs = [...new Set(figures.flatMap((f) => f.destinations.map((d) => d.slug)).filter(Boolean))];
  return new Map(
    slugs.map((slug) => {
      const dir = join(root, "contents/blog", slug);
      if (!existsSync(dir)) return [slug, "下書きなし"];
      const read = (file) => (existsSync(join(dir, file)) ? readFileSync(join(dir, file), "utf8") : "");
      const article = read("article.md");
      return [slug, classifyDraft({
        hasArticle: article !== "",
        published: /^published:\s*true\s*$/m.test(article),
        verdict: read("review.md").match(/^verdict:\s*(\w+)/m)?.[1] ?? null,
        hasBackground: ["fullbleed-backgrounds", "article-backgrounds"].some(dir => existsSync(join(root, "assets/blog", dir, `${slug}.jpg`))),
      })];
    }),
  );
}
