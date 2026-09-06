/**
 * sitemap-blog-entries.ts の生成スクリプト
 *
 * 真実源: R2 `app/blog/all.json` の `articles[]` (公開記事) と `tagMeta[]`。
 *
 * ★なぜ git 定数が要るか (2026-08-06):
 *   sitemap は `generateSitemaps()` を持つためビルド時に prerender される。
 *   ビルド環境 (deploy-workers.yml) には R2 到達手段が無く、blog / categories / surveys / tags の
 *   reader はビルド時ガードで `ok([])` を返すため、**空の sitemap がビルド成果物に焼かれていた**。
 *   ranking だけが `KNOWN_RANKING_KEYS` という git 定数を返していたので唯一埋まっていた
 *   (実測: 本番 sitemap/3.xml = 2,173 件 = SITEMAP_RANKING_KEYS と一致、
 *    sitemap/4.xml = 1 件 (/blog のみ)、5.xml = 0、6.xml = 1、7.xml = 0)。
 *   本ファイルは blog / tags / surveys に同じ git 定数方式を与えて sitemap を埋める。
 *   categories だけは git TS の CATEGORY_KEYS (17 軸) をそのまま使うため生成対象外。
 *   surveys は git の surveys.json ではなく **R2 の配信実態**から生成する
 *   (master には本番 404 の id が混ざるため。SITEMAP_SURVEY_IDS の項を参照)。
 *
 * ★生成物は環境をまたいで再現できること。ソートに localeCompare を使わない (byCodeUnit)。
 *
 * 使い方: `cd apps/web && npx tsx scripts/generate-sitemap-blog-entries.ts`
 *         `--check` でファイルを書かず、コミット済み内容と R2 の実態が一致するかだけ検証する
 *         (PR CI の鮮度ゲート。known-tag-keys / theme-catalog と同じ流儀)。
 * 更新タイミング: ブログ記事を公開して R2 blog snapshot が変わった後。
 *                 commit + デプロイで sitemap に反映される
 *                 (prerender なのでデプロイしないと本番 sitemap は変わらない)。
 */

import fs from "node:fs";
import path from "node:path";

import { GONE_BLOG_SLUGS } from "../src/config/gone-blog-slugs";

const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const OUT_PATH = path.resolve(__dirname, "../src/config/sitemap-blog-entries.ts");
const CHECK_ONLY = process.argv.includes("--check");

/** sitemap の tag セグメントは記事 5 本以上のタグだけを出す (既存 getTagPages の条件を踏襲)。 */
const TAG_MIN_ARTICLES = 5;

interface Article {
  slug: string;
  published?: boolean;
  publishedAt?: string | null;
  tags?: { tagKey: string }[];
}
interface TagMeta {
  tagKey: string;
  articleCount: number;
}

const DATE_LINE = /^ \* 最終生成日: .*$/m;

/**
 * ロケール非依存の文字列比較 (UTF-16 コードユニット順)。
 * `localeCompare` は実行環境のロケールで結果が変わるため使わない。
 * tagKey は日本語なので Windows (ja) と CI (Linux) で並び順が食い違い、
 * 件数が同じでも生成物が一致せず --check が落ちる (2026-08-06 に CI で発生)。
 * 生成物は環境をまたいで再現できなければならない。
 */
const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function buildContent(
  blog: { slug: string; lastModified: string | null }[],
  tags: { tagKey: string; lastModified: string | null }[],
  surveyIds: string[],
): string {
  const today = new Date().toISOString().slice(0, 10);
  const fmt = (o: { lastModified: string | null }) =>
    o.lastModified ? JSON.stringify(o.lastModified) : "null";
  return `/**
 * sitemap 用 blog / tag エントリ (自動生成・手動編集禁止)
 *
 * **生成: cd apps/web && npx tsx scripts/generate-sitemap-blog-entries.ts**
 *
 * ビルド時は R2 に到達できないため、sitemap.ts はこの git 定数を読む。
 * 詳細な背景は生成スクリプトの docstring を参照。
 *
 * 最終生成日: ${today}
 * 件数: blog ${blog.length} / tag ${tags.length} / survey ${surveyIds.length}
 */

export interface SitemapBlogEntry {
  readonly slug: string;
  /** ISO date (publishedAt)。無い記事は null。 */
  readonly lastModified: string | null;
}

export interface SitemapTagEntry {
  readonly tagKey: string;
  /** そのタグが付いた公開記事の最新 publishedAt。 */
  readonly lastModified: string | null;
}

export const SITEMAP_BLOG_ENTRIES: readonly SitemapBlogEntry[] = [
${blog.map((b) => `  { slug: ${JSON.stringify(b.slug)}, lastModified: ${fmt(b)} },`).join("\n")}
];

export const SITEMAP_TAG_ENTRIES: readonly SitemapTagEntry[] = [
${tags.map((t) => `  { tagKey: ${JSON.stringify(t.tagKey)}, lastModified: ${fmt(t)} },`).join("\n")}
];

/**
 * 配信されている survey id。
 * git の \`surveys.json\` (master) ではなく **R2 の配信実態**から生成する。
 * master には配信されていない id が混ざっており (実測 2026-08-06: livestock-statistics /
 * population-projection の 2 件が本番で 404)、master をそのまま提出すると 404 を増やすため。
 */
export const SITEMAP_SURVEY_IDS: readonly string[] = [
${surveyIds.map((id) => `  ${JSON.stringify(id)},`).join("\n")}
];
`;
}

// 社内プロキシ配下 (TLS 傍受) では Node の素の fetch が SELF_SIGNED_CERT_IN_CHAIN で落ちる。
// HTTPS_PROXY があれば明示 CONNECT する (前例: packages/ranking/src/scripts/audit-ranking-data-integrity.ts)。
// CI (proxy 無し) では dispatcher を作らず素の fetch のまま。
let cachedDispatcher: unknown | null | undefined;
async function getProxyDispatcher(): Promise<unknown | null> {
  if (cachedDispatcher !== undefined) return cachedDispatcher;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) {
    cachedDispatcher = null;
    return null;
  }
  try {
    const { ProxyAgent } = await import("undici");
    cachedDispatcher = new ProxyAgent(proxyUrl);
    return cachedDispatcher;
  } catch {
    cachedDispatcher = null;
    return null;
  }
}

async function run() {
  const url = `${R2_PUBLIC}/app/blog/all.json`;
  console.log(`[generate-sitemap-blog-entries] fetching ${url}`);
  const dispatcher = await getProxyDispatcher();
  const res = await fetch(url, dispatcher ? ({ dispatcher } as RequestInit) : undefined);
  if (!res.ok) {
    throw new Error(`blog snapshot fetch failed: HTTP ${res.status} ${url}`);
  }
  const snapshot = (await res.json()) as { articles?: Article[]; tagMeta?: TagMeta[] };

  const articles = snapshot.articles;
  if (!Array.isArray(articles) || articles.length === 0) {
    // 空を書き出すと sitemap が今の壊れた状態に戻る (fail-open 禁止)。
    throw new Error("blog snapshot に articles がありません。生成を中止します。");
  }

  const published = articles.filter(
    (a) => !GONE_BLOG_SLUGS.has(a.slug) && a.published !== false && typeof a.publishedAt === "string" && a.publishedAt.length > 0,
  );
  if (published.length === 0) {
    throw new Error("公開記事が 0 件です。生成を中止します。");
  }

  const blog = published
    .map((a) => ({ slug: a.slug, lastModified: a.publishedAt ?? null }))
    .sort((x, y) => byCodeUnit(x.slug, y.slug));

  // タグ別の最新 publishedAt (sitemap の lastmod に使う)
  const latestByTag = new Map<string, string>();
  for (const a of published) {
    for (const t of a.tags ?? []) {
      const prev = latestByTag.get(t.tagKey);
      if (!prev || (a.publishedAt as string) > prev) {
        latestByTag.set(t.tagKey, a.publishedAt as string);
      }
    }
  }
  const tagMeta = snapshot.tagMeta ?? [];
  const tags = tagMeta
    .filter((t) => typeof t.tagKey === "string" && t.articleCount >= TAG_MIN_ARTICLES)
    .map((t) => ({ tagKey: t.tagKey, lastModified: latestByTag.get(t.tagKey) ?? null }))
    .sort((x, y) => byCodeUnit(x.tagKey, y.tagKey));

  // survey は R2 の配信実態を真実源にする (git master には本番 404 の id が混ざる)
  const surveyUrl = `${R2_PUBLIC}/app/survey/all.json`;
  const surveyRes = await fetch(surveyUrl, dispatcher ? ({ dispatcher } as RequestInit) : undefined);
  if (!surveyRes.ok) {
    throw new Error(`survey snapshot fetch failed: HTTP ${surveyRes.status} ${surveyUrl}`);
  }
  const surveyJson = (await surveyRes.json()) as { surveys?: { id: string }[] } | { id: string }[];
  const surveyIds = (Array.isArray(surveyJson) ? surveyJson : (surveyJson.surveys ?? []))
    .map((s) => s.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .sort();
  if (surveyIds.length === 0) {
    throw new Error("survey snapshot が空です。生成を中止します。");
  }

  const content = buildContent(blog, tags, surveyIds);

  if (CHECK_ONLY) {
    if (!fs.existsSync(OUT_PATH)) {
      console.error(`❌ ${OUT_PATH} がありません`);
      console.error("   修正: cd apps/web && npx tsx scripts/generate-sitemap-blog-entries.ts");
      process.exit(1);
    }
    // 「最終生成日」行は毎回変わるので除いて比較する。
    const strip = (s: string) => s.replace(DATE_LINE, "").trim();
    const committed = fs.readFileSync(OUT_PATH, "utf-8");
    if (strip(committed) === strip(content)) {
      console.log(`✅ sitemap-blog-entries は最新 (blog ${blog.length} / tag ${tags.length} / survey ${surveyIds.length})`);
      return;
    }
    console.error(
      `❌ sitemap-blog-entries がコミット済みの内容と一致しません (R2: blog ${blog.length} / tag ${tags.length} / survey ${surveyIds.length})`,
    );
    console.error("   これは sitemap に載らない公開記事があることを意味する");
    console.error("   修正: cd apps/web && npx tsx scripts/generate-sitemap-blog-entries.ts");
    process.exit(1);
  }

  fs.writeFileSync(OUT_PATH, content, "utf-8");
  console.log(
    `[generate-sitemap-blog-entries] wrote blog ${blog.length} / tag ${tags.length} / survey ${surveyIds.length} to ${OUT_PATH}`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
