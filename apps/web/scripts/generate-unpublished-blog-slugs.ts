/**
 * unpublished-blog-slugs.ts の生成スクリプト
 *
 * 真実源: R2 `app/blog/all.json` の `articles[].published === false`。
 *
 * なぜ要るか (2026-07-24 実測):
 *   未公開記事の `/blog/<slug>` は 404 ではなく **HTTP 200 +「記事が見つかりません」**
 *   (soft 404) を返していた。ページは `notFound()` を呼んでいるが、OpenNext が
 *   notFound を prerender として焼き付け `x-nextjs-stale-time: 4294967294` で固着させるため
 *   (.claude/rules/nextjs-ssg-preservation.md)。middleware で前段短絡すれば確実に潰せる。
 *
 *   手編集の GONE_BLOG_SLUGS と分けているのは、未公開は**状態であって決定ではない**から。
 *   記事を再公開したら次回の生成でこの集合から自動的に消える (手動メンテ不要)。
 *
 * 使い方: `cd apps/web && npx tsx scripts/generate-unpublished-blog-slugs.ts [--check]`
 * 更新タイミング: ブログの公開状態を変えて R2 blog snapshot を更新した後。
 *                 commit + デプロイで middleware に反映される。
 */

import fs from "node:fs";
import path from "node:path";

import { GONE_BLOG_SLUGS } from "../src/config/gone-blog-slugs";

const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const OUT_PATH = path.resolve(__dirname, "../src/config/unpublished-blog-slugs.ts");
const CHECK_ONLY = process.argv.includes("--check");

async function run() {
  const url = `${R2_PUBLIC}/app/blog/all.json`;
  console.log(`[generate-unpublished-blog-slugs] fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`blog snapshot fetch failed: HTTP ${res.status} ${url}`);
  const snapshot = (await res.json()) as {
    articles?: { slug?: string; published?: boolean }[];
  };
  const articles = snapshot.articles;
  if (!Array.isArray(articles) || articles.length === 0) {
    // 空を書き出すと検知が無効化される (fail-open 禁止)。
    throw new Error("blog snapshot に articles がありません。生成を中止します。");
  }

  const slugs = articles
    .filter((a) => typeof a.slug === "string" && a.slug.length > 0 && a.published === false)
    .map((a) => a.slug as string)
    // 恒久削除が確定している slug は gone-blog-slugs.ts (手編集) の責務。
    // 両方に入れても挙動は同じ 410 だが、「状態」と「決定」を混ぜないため除外する。
    .filter((slug) => !GONE_BLOG_SLUGS.has(slug));
  slugs.sort();

  const today = new Date().toISOString().slice(0, 10);
  const header = `/**
 * 未公開 (published:false) のブログ slug 一覧
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * 用途: middleware が \`/blog/<slug>\` を 410 Gone で前段短絡する。
 *   これが無いと OpenNext が焼き付けた notFound prerender が
 *   **HTTP 200 +「記事が見つかりません」** として永久配信される (soft 404)。
 *
 * 真実源: R2 \`app/blog/all.json\` の \`published === false\`。
 * 記事を再公開したら次回生成でこの集合から自動的に消える (手動メンテ不要)。
 *
 * 恒久削除が確定した slug は \`gone-blog-slugs.ts\` (手編集) に置く。
 *
 * 更新方法: \`cd apps/web && npx tsx scripts/generate-unpublished-blog-slugs.ts\`
 *
 * 最終生成日: ${today}
 * 件数: ${slugs.length}
 */
export const UNPUBLISHED_BLOG_SLUGS: ReadonlySet<string> = new Set([
`;
  const body = slugs.map((s) => `  ${JSON.stringify(s)},`).join("\n");
  const footer = `\n]);\n`;
  const content = header + body + footer;

  if (CHECK_ONLY) {
    const committed = new Set(
      [...fs.readFileSync(OUT_PATH, "utf-8").matchAll(/^ {2}"([a-z0-9-]+)",$/gm)].map((m) => m[1]),
    );
    const missing = slugs.filter((s) => !committed.has(s));
    const extra = [...committed].filter((s) => !slugs.includes(s));
    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ unpublished-blog-slugs は最新 (${slugs.length} 件)`);
      return;
    }
    console.error(
      `❌ unpublished-blog-slugs が R2 の実態と一致しません (R2 ${slugs.length} 件 / コミット ${committed.size} 件)`,
    );
    if (missing.length) {
      console.error(`   未公開だが未登録 (= /blog/<slug> が 200 soft 404 になる): ${missing.join(", ")}`);
    }
    if (extra.length) {
      console.error(`   再公開されたのに登録が残っている (= 410 で塞いだままになる): ${extra.join(", ")}`);
    }
    console.error("   修正: cd apps/web && npx tsx scripts/generate-unpublished-blog-slugs.ts");
    process.exit(1);
  }

  fs.writeFileSync(OUT_PATH, content, "utf-8");
  console.log(`[generate-unpublished-blog-slugs] wrote ${slugs.length} slugs to ${OUT_PATH}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
