/**
 * migrate-data-source-sections — 公開記事本文の手書き「## データ出典」節を一括移行する
 *
 * 出典の一覧はページ側の `DataSourceList` が chart lineage (snapshot の `sources`) から描画する。
 * 本文の手書き節は次の決定的変換で移行する (判定と変換は描画時と同じ関数を共有する):
 *   - 引用だけの節            → 節ごと削除 (removed)
 *   - 計算方法・定義などを含む → 見出しを「データについて」へ改名して残す (renamed)
 *   - snapshot の sources が空 → 手書き節が唯一の出典なので変更しない (skipped-no-sources)
 *   - Kindle 書籍の章に使われている記事 → 変更しない (kindle-pinned)。書籍は校閲済みの本文に
 *     校正指示 (editorial-corrections.ts) を当てて生成し、置換元の文字列が変わると生成を止める設計なので、
 *     本文を変えると書籍を作り直せなくなる (2026-09-25 実測: 校正指示を持つ 64 記事中 23 記事が該当)。
 *     Web では描画時に同じ変換がかかるので、表示は他の記事と同じになる。
 * 散文・frontmatter・updatedAt は変更しない。
 *
 * 入力: snapshot (`sources` を焼き込み済みの all.json) + R2 公開 URL の article.md
 * 出力: `.local/blog-datasource-fix/out/<slug>/article.md` (変更記事のみ)
 *       `.local/blog-datasource-fix/_src/<slug>/article.md` (原本。ロールバック用)
 *       `.local/blog-datasource-fix/report.json`
 *
 * 使い方:
 *   npx tsx .claude/scripts/blog/migrate-data-source-sections.ts                     # 集計のみ (dry-run)
 *   npx tsx .claude/scripts/blog/migrate-data-source-sections.ts --apply             # out/ へ書き出し
 *   npx tsx .claude/scripts/blog/migrate-data-source-sections.ts --snapshot <path>   # 既定は R2 の all.json
 *   npx tsx .claude/scripts/blog/migrate-data-source-sections.ts --outbox --apply    # docs/21 の原稿を in-place 変換
 * R2 反映:
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --src .local/blog-datasource-fix/out [--apply]
 * ロールバック:
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --src .local/blog-datasource-fix/_src --apply
 */
import * as fs from "fs";
import * as path from "path";

import { migrateLegacyDataSourceSection } from "../../../apps/web/src/features/blog/components/md-preprocessor";
import { KINDLE_BOOKS } from "../../../packages/product-factory/src/channels/kindle/book-catalog";

/** Kindle 書籍の章として本文を使う blog slug。本文を変えると書籍の校正指示が外れる。 */
const KINDLE_PINNED_SLUGS = new Set(
  KINDLE_BOOKS.flatMap((book) => book.chapters.flatMap((chapter) => (chapter.blogSlug ? [chapter.blogSlug] : []))),
);

const ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = (process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp").replace(/\/+$/, "");
const WORK_DIR = path.join(ROOT, ".local/blog-datasource-fix");
const OUTBOX_DIR = path.join(ROOT, "docs/21_ブログ記事原稿");
const CONCURRENCY = 8;

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const OUTBOX = argv.includes("--outbox");
const snapshotArg = argv.indexOf("--snapshot");
const SNAPSHOT = snapshotArg >= 0 ? argv[snapshotArg + 1] : `${R2_BASE}/app/blog/all.json`;

interface SnapshotArticle {
  slug: string;
  published: boolean | null;
  format: string | null;
  sources?: unknown[];
}

async function readText(source: string): Promise<string> {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`);
    return res.text();
  }
  return fs.readFileSync(source, "utf8");
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}

function writeFile(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

async function migratePublished(): Promise<void> {
  const snapshot = JSON.parse(await readText(SNAPSHOT)) as { articles: SnapshotArticle[] };
  const published = snapshot.articles.filter((article) => article.published === true);
  const unbaked = published.filter((article) => article.sources === undefined);
  if (unbaked.length > 0) {
    throw new Error(
      `snapshot に sources が焼かれていない公開記事が ${unbaked.length} 件あります (例: ${unbaked[0].slug})。` +
        " export-blog-snapshot.ts で sources を焼いた snapshot を --snapshot に渡してください。",
    );
  }

  const report = {
    removed: [] as string[],
    renamed: [] as string[],
    skippedNoSources: [] as string[],
    kindlePinned: [] as string[],
    none: 0,
  };
  await mapLimit(published, CONCURRENCY, async (article) => {
    const file = article.format === "mdx" ? "article.mdx" : "article.md";
    const original = await readText(`${R2_BASE}/app/blog/${article.slug}/${file}`);
    const { content, action } = migrateLegacyDataSourceSection(original);
    if (action === "none") {
      report.none++;
      return;
    }
    if (KINDLE_PINNED_SLUGS.has(article.slug)) {
      report.kindlePinned.push(article.slug);
      return;
    }
    if ((article.sources ?? []).length === 0) {
      report.skippedNoSources.push(article.slug);
      return;
    }
    report[action].push(article.slug);
    if (!APPLY) return;
    writeFile(path.join(WORK_DIR, "_src", article.slug, file), original);
    writeFile(path.join(WORK_DIR, "out", article.slug, file), content);
  });

  for (const list of [report.removed, report.renamed, report.skippedNoSources, report.kindlePinned]) list.sort();
  writeFile(path.join(WORK_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `公開 ${published.length} 本: 削除 ${report.removed.length} / 改名 ${report.renamed.length} / ` +
      `出典未解決で据え置き ${report.skippedNoSources.length} / Kindle 章で据え置き ${report.kindlePinned.length} / 節なし ${report.none}`,
  );
  if (report.skippedNoSources.length > 0) {
    console.log(`  据え置き (source.json に displaySources を付けて再実行): ${report.skippedNoSources.join(", ")}`);
  }
  console.log(APPLY ? `→ ${path.relative(ROOT, path.join(WORK_DIR, "out"))} に書き出しました` : "(dry-run。--apply で書き出し)");
}

function migrateOutbox(): void {
  if (!fs.existsSync(OUTBOX_DIR)) return;
  const changed: string[] = [];
  for (const slug of fs.readdirSync(OUTBOX_DIR)) {
    const file = path.join(OUTBOX_DIR, slug, "article.md");
    if (!fs.existsSync(file)) continue;
    const { content, action } = migrateLegacyDataSourceSection(fs.readFileSync(file, "utf8"));
    if (action === "none") continue;
    changed.push(`${slug} (${action})`);
    if (APPLY) fs.writeFileSync(file, content);
  }
  console.log(`docs/21 原稿: ${changed.length} 本${APPLY ? "を変換" : " が対象 (dry-run)"}${changed.length ? `: ${changed.join(", ")}` : ""}`);
}

async function main(): Promise<void> {
  if (OUTBOX) {
    migrateOutbox();
    return;
  }
  await migratePublished();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
