/**
 * migrate-data-source-sections — 公開記事本文の手書き「## データ出典」節を一括移行する
 *
 * 出典の一覧はページ側の `DataSourceList` が chart lineage (snapshot の `sources`) から描画する。
 * 本文の手書き節は次の決定的変換で移行する (判定と変換は描画時と同じ関数を共有する):
 *   - 引用だけの節            → 節ごと削除 (removed)
 *   - 計算方法・定義などを含む → 見出しを「データについて」へ改名して残す (renamed)
 *   - snapshot の sources が空 → 手書き節が唯一の出典なので変更しない (skipped-no-sources)
 *   - Kindle 書籍の章に使われている記事 → 書籍版で持つ出典節 (台帳 products.kindle-editorial-corrections の
 *     sourceSections) から移行後の本文を元の本文へ逐語で戻せるときだけ移行する。戻せない記事は変更しない
 *     (kindle-pinned)。書籍は校閲済みの本文に校正指示を当てて生成し、置換元の文字列が変わると生成を止める設計で、
 *     旧節の中を直す校正指示があるため (2026-09-25 実測: 校正指示を持つ 64 記事中 23 記事が該当)。
 *     書籍版の出典節は --kindle-freeze で R2 の本文から写す。Web では描画時に同じ変換がかかるので、
 *     据え置いた記事の表示も他の記事と同じになる。
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
 *   npx tsx .claude/scripts/blog/migrate-data-source-sections.ts --outbox --apply    # contents/blog の原稿を in-place 変換
 *   npx tsx .claude/scripts/blog/migrate-data-source-sections.ts --kindle-freeze [--apply] # Kindle 章の旧節を書籍版の台帳へ写す
 * R2 反映:
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --src .local/blog-datasource-fix/out [--apply]
 * ロールバック:
 *   npx tsx .claude/scripts/blog/push-article-md-r2.ts --src .local/blog-datasource-fix/_src --apply
 */
import * as fs from "fs";
import * as path from "path";

import { migrateLegacyDataSourceSection } from "../../../apps/web/src/features/blog/components/md-preprocessor";
import { datasetPath } from "../../../config/datasets.mjs";
import { KINDLE_BOOKS } from "../../../packages/product-factory/src/channels/kindle/book-catalog";
import { KINDLE_SOURCE_SECTIONS } from "../../../packages/product-factory/src/channels/kindle/editorial-corrections";
import {
  extractLegacySourceSection,
  restoreBookSourceSection,
} from "../../../packages/product-factory/src/channels/kindle/fetch-content";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";

/** Kindle 書籍の章として本文を使う blog slug。本文を変えると書籍の校正指示が外れる。 */
const KINDLE_PINNED_SLUGS = new Set(
  KINDLE_BOOKS.flatMap((book) => book.chapters.flatMap((chapter) => (chapter.blogSlug ? [chapter.blogSlug] : []))),
);

const ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = (process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL).replace(/\/+$/, "");
const WORK_DIR = path.join(ROOT, ".local/blog-datasource-fix");
const OUTBOX_DIR = path.join(ROOT, "contents/blog");
const KINDLE_LEDGER = path.join(ROOT, datasetPath("products.kindle-editorial-corrections"));
const CONCURRENCY = 8;

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const OUTBOX = argv.includes("--outbox");
const KINDLE_FREEZE = argv.includes("--kindle-freeze");
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
    kindleRestorable: [] as string[],
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
      // 書籍が移行後の本文から校閲済みの本文を逐語で作れる記事だけ移す (校正指示がそのまま当たる)
      if (restoreBookSourceSection(content, KINDLE_SOURCE_SECTIONS[article.slug]) !== original) {
        report.kindlePinned.push(article.slug);
        return;
      }
      report.kindleRestorable.push(article.slug);
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

  for (const list of [report.removed, report.renamed, report.skippedNoSources, report.kindlePinned, report.kindleRestorable]) list.sort();
  writeFile(path.join(WORK_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `公開 ${published.length} 本: 削除 ${report.removed.length} / 改名 ${report.renamed.length} / ` +
      `出典未解決で据え置き ${report.skippedNoSources.length} / Kindle 章で据え置き ${report.kindlePinned.length} / 節なし ${report.none}`,
  );
  console.log(`  Kindle 章のうち書籍版の出典節で元の本文へ戻せて移行対象: ${report.kindleRestorable.length} 本`);
  if (report.kindlePinned.length > 0) {
    console.log(`  Kindle 章で据え置き (--kindle-freeze で書籍版の出典節を写してから再実行): ${report.kindlePinned.join(", ")}`);
  }
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
  console.log(`contents/blog 原稿: ${changed.length} 本${APPLY ? "を変換" : " が対象 (dry-run)"}${changed.length ? `: ${changed.join(", ")}` : ""}`);
}

/**
 * Kindle 章の記事の旧「データ出典」節を、R2 の本文から書籍版の台帳 (sourceSections) へ逐語で写す。
 * 既に写した節は上書きしない (校閲済みの原文。R2 の本文が先に変わっていたら差分を報告して止める)。
 * 写すのは、一括移行後の本文からその節で元の本文へ戻せることを確かめた記事だけ。
 */
async function freezeKindleSections(): Promise<void> {
  const snapshot = JSON.parse(await readText(SNAPSHOT)) as { articles: SnapshotArticle[] };
  const formats = new Map(snapshot.articles.map((article) => [article.slug, article.format]));
  const ledger = JSON.parse(fs.readFileSync(KINDLE_LEDGER, "utf8")) as { sourceSections?: Record<string, string> };
  const sections: Record<string, string> = { ...(ledger.sourceSections ?? {}) };
  const added: string[] = [];
  const changed: string[] = [];
  await mapLimit([...KINDLE_PINNED_SLUGS].sort(), CONCURRENCY, async (slug) => {
    const file = formats.get(slug) === "mdx" ? "article.mdx" : "article.md";
    const original = await readText(`${R2_BASE}/app/blog/${slug}/${file}`);
    const section = extractLegacySourceSection(original);
    if (section === undefined) return;
    const { content } = migrateLegacyDataSourceSection(original);
    if (restoreBookSourceSection(content, section) !== original) {
      throw new Error(`${slug}: 移行後の本文に出典節を戻しても元の本文にならない (節が本文の最後に無い可能性)`);
    }
    if (sections[slug] === undefined) {
      sections[slug] = section;
      added.push(slug);
    } else if (sections[slug] !== section) {
      changed.push(slug);
    }
  });
  if (changed.length > 0) {
    throw new Error(`R2 の旧節が書籍版の記録と違う (再校閲してから記録を更新する): ${changed.sort().join(", ")}`);
  }
  const sorted = Object.fromEntries(Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)));
  console.log(`Kindle 章の出典節: 記録済み ${Object.keys(sorted).length} 本 (今回追加 ${added.length} 本)`);
  if (!APPLY) {
    console.log("(dry-run。--apply で台帳へ書き込む)");
    return;
  }
  fs.writeFileSync(KINDLE_LEDGER, `${JSON.stringify({ ...ledger, sourceSections: sorted }, null, 2)}\n`);
}

async function main(): Promise<void> {
  if (KINDLE_FREEZE) {
    await freezeKindleSections();
    return;
  }
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
