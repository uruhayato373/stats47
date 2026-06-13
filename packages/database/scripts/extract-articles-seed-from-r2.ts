/**
 * extract-articles-seed-from-r2: R2 の app/blog/<slug>/article.md frontmatter から
 * articles テーブルの seed JSON を再構成する。
 *
 * 設計上の含意 (docs/01_技術設計/archive/17_リモートD1ハイブリッド設計.md):
 *   articles テーブルは article.md の frontmatter から全列が再構成可能 = Derived。
 *   D1 を SSOT にする必要は無く、R2 (article.md) が真実源。本 script はその実証兼 seed 生成。
 *
 * ローカルビルド DB / Mac に依存せず、クラウドからでも R2 (S3 API) だけで完結する。
 *
 * 使い方:
 *   npx tsx packages/database/scripts/extract-articles-seed-from-r2.ts
 *   → packages/database/seed/articles.json を出力
 *
 * 必要な env: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

config({ path: path.resolve(__dirname, "..", "..", "..", ".env.local") });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
const BLOG_PREFIX = "app/blog/";
const OUT_PATH = path.resolve(__dirname, "..", "seed", "articles.json");

function createS3(): S3Client {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error(
      "エラー: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY が未設定です",
    );
    process.exit(1);
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** app/blog/ 配下の全キーを 1 度のページネーションで取得 (delimiter なし) */
async function listAllKeys(s3: S3Client, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const r = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    (r.Contents ?? []).forEach((o) => o.Key && keys.push(o.Key));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function getText(s3: S3Client, key: string): Promise<string> {
  const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return (await r.Body!.transformToString()) as string;
}

interface Frontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  tags?: string[];
  publishedAt?: unknown;
  updatedAt?: unknown;
  published?: boolean;
  ogImage?: string;
  [key: string]: unknown;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return (yaml.load(match[1]) as Frontmatter) ?? {};
  } catch {
    return {};
  }
}

function normalizeDate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v && /^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).slice(0, 10);
  return null;
}

/** DB ネイティブの snake_case 列名で出力する (seed-to-d1-sql.ts が汎用に扱えるよう統一) */
interface ArticleSeed {
  slug: string;
  title: string;
  seo_title: string | null;
  description: string | null;
  file_path: string;
  format: string;
  has_charts: number; // 0/1 (SELECT * ダンプと同じ表現)
  published: number; // 0/1
  published_at: string | null;
  og_image_type: string | null;
  tags: string; // JSON 文字列 (schema の text default "[]")
}

async function main() {
  const s3 = createS3();
  console.log(`R2 bucket=${BUCKET} prefix=${BLOG_PREFIX} を走査中...`);
  const keys = await listAllKeys(s3, BLOG_PREFIX);

  // slug ごとに article.{md,mdx} と data/*.json の有無を index 化
  const slugInfo = new Map<
    string,
    { ext: "md" | "mdx" | null; hasCharts: boolean }
  >();
  for (const key of keys) {
    const rest = key.slice(BLOG_PREFIX.length); // <slug>/...
    const slash = rest.indexOf("/");
    if (slash < 0) continue;
    const slug = rest.slice(0, slash);
    const file = rest.slice(slash + 1);
    const info = slugInfo.get(slug) ?? { ext: null, hasCharts: false };
    if (file === "article.mdx") info.ext = "mdx";
    else if (file === "article.md" && info.ext !== "mdx") info.ext = "md";
    if (file.startsWith("data/") && file.endsWith(".json")) info.hasCharts = true;
    slugInfo.set(slug, info);
  }

  const slugs = [...slugInfo.entries()]
    .filter(([, v]) => v.ext !== null)
    .map(([slug]) => slug)
    .sort();
  console.log(`article.{md,mdx} を持つ記事: ${slugs.length} 件`);

  const seeds: ArticleSeed[] = [];
  let i = 0;
  for (const slug of slugs) {
    const info = slugInfo.get(slug)!;
    const ext = info.ext!;
    const content = await getText(s3, `${BLOG_PREFIX}${slug}/article.${ext}`);
    const fm = parseFrontmatter(content);
    seeds.push({
      slug,
      title: fm.title ?? slug,
      seo_title: fm.seoTitle ?? null,
      description: fm.description ?? null,
      file_path: `blog/${slug}/article.${ext}`,
      format: ext,
      has_charts: info.hasCharts ? 1 : 0,
      published: fm.published ? 1 : 0,
      published_at: normalizeDate(fm.publishedAt),
      og_image_type: typeof fm.ogImage === "string" ? "static" : null,
      tags: JSON.stringify(Array.isArray(fm.tags) ? fm.tags : []),
    });
    if (++i % 50 === 0) console.log(`  ...${i}/${slugs.length}`);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(seeds, null, 2) + "\n");

  const published = seeds.filter((s) => s.published).length;
  const withCharts = seeds.filter((s) => s.has_charts).length;
  console.log(`\n✅ ${seeds.length} 件を ${path.relative(process.cwd(), OUT_PATH)} に出力`);
  console.log(`   published=${published} / draft=${seeds.length - published} / hasCharts=${withCharts}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
