/**
 * 章素材を R2 (公開 URL) から取得する。
 * - blog 章: `app/blog/<slug>/article.md` を取得し frontmatter を除去、参照 SVG を PNG 化して同梱する。
 * 出典メタ (title/description/tags) は frontmatter から取り出し、書籍の出典一覧に使う。
 */
import sharp from "sharp";
import { correctBookArticle } from "./editorial-corrections";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

export interface FetchedImage {
  /** EPUB 内のファイル名 (images/<name>.png)。 */
  readonly fileName: string;
  readonly png: Buffer;
  readonly alt: string;
}

export interface FetchedArticle {
  readonly slug: string;
  /** frontmatter title。 */
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  /** frontmatter を除いた本文 markdown (画像参照は EPUB 用ファイル名に書き換え済)。 */
  readonly body: string;
  readonly images: readonly FetchedImage[];
}

interface Frontmatter {
  title?: string;
  description?: string;
  tags?: string[];
}

/** 素朴な frontmatter パーサ (title/description/tags のみ・ブログ frontmatter は単純構造)。 */
function parseFrontmatter(md: string): { fm: Frontmatter; body: string } {
  if (!md.startsWith("---")) return { fm: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: md };
  const head = md.slice(3, end).trim();
  const body = md.slice(end + 4).replace(/^\s*\n/, "");
  const fm: Frontmatter = {};
  const tags: string[] = [];
  let inTags = false;
  for (const raw of head.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      inTags = false;
      const [, key, valRaw] = kv;
      const val = valRaw.replace(/^["']|["']$/g, "").trim();
      if (key === "title") fm.title = val;
      else if (key === "description") fm.description = val;
      else if (key === "tags") inTags = true;
    } else if (inTags) {
      const t = line.match(/^\s*-\s*(.+)$/);
      if (t) tags.push(t[1].replace(/^["']|["']$/g, "").trim());
    }
  }
  fm.tags = tags;
  return { fm, body };
}

/** SVG バイト列を PNG に変換する (density 288 = Retina 2x・幅上限 1600px)。 */
async function svgToPng(svg: Buffer): Promise<Buffer> {
  const text = svg.toString("utf8");
  const m = text.match(/viewBox="0 0 (\d+(?:\.\d+)?) /);
  const logicalW = m ? parseFloat(m[1]) : 680;
  const density = logicalW < 1280 ? 288 : 144;
  let img = sharp(svg, { density });
  const meta = await img.metadata();
  if ((meta.width ?? 0) > 1600) img = img.resize({ width: 1600 });
  return img.png().toBuffer();
}

/**
 * blog 記事を R2 から取得し、frontmatter 除去 + SVG→PNG 変換して返す。
 * 画像参照 `![alt](data/foo.svg)` は `![alt](images/<slug>__foo.png)` に書き換える。
 */
export async function fetchBlogArticle(slug: string): Promise<FetchedArticle> {
  const res = await fetch(`${R2_BASE}/app/blog/${slug}/article.md`);
  if (!res.ok) throw new Error(`R2 fetch 失敗 (${res.status}): app/blog/${slug}/article.md`);
  const md = await res.text();
  const { fm, body: originalBody } = parseFrontmatter(md);
  const body = correctBookArticle(slug, originalBody);
  if (!body.trim()) throw new Error(`Empty blog body: ${slug}`);

  const images: FetchedImage[] = [];
  const imgRe = /!\[([^\]]*)\]\(data\/([a-z0-9-]+)\.svg\)/gi;
  const refs: { alt: string; name: string }[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = imgRe.exec(body)) !== null) refs.push({ alt: mm[1], name: mm[2] });

  let rewritten = body;
  for (const ref of refs) {
    const svgUrl = `${R2_BASE}/app/blog/${slug}/data/${ref.name}.svg`;
    const svgRes = await fetch(svgUrl);
    const epubName = `${slug}__${ref.name}.png`;
    if (svgRes.ok) {
      const svgBuf = Buffer.from(await svgRes.arrayBuffer());
      try {
        const png = await svgToPng(svgBuf);
        images.push({ fileName: epubName, png, alt: ref.alt });
        rewritten = rewritten.split(`data/${ref.name}.svg`).join(`images/${epubName}`);
      } catch (error) {
        throw new Error(
          `Blog image conversion failed: ${slug}/data/${ref.name}.svg: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      throw new Error(`Blog image fetch failed (${svgRes.status}): ${slug}/data/${ref.name}.svg`);
    }
  }

  return {
    slug,
    title: fm.title ?? slug,
    description: fm.description ?? "",
    tags: fm.tags ?? [],
    body: rewritten,
    images,
  };
}
