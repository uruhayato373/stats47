/**
 * 章素材を R2 (公開 URL) から取得する。
 * - blog 章: `app/blog/<slug>/article.md` を取得し frontmatter を除去、参照 SVG を PNG 化して同梱する。
 * 出典メタ (title/description/tags) は frontmatter から取り出し、書籍の出典一覧に使う。
 */
import sharp from "sharp";
import { correctBookArticle } from "./editorial-corrections";
import { correctBookFigure } from "./figure-corrections";

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
 * Web 記事としての自己言及 (「この記事」「本記事」) を書籍の章としての言い方に揃える。
 * 公開ブログ原文は変更しない (書籍版のみ)。2026-09-19 の全冊監査で S1 各冊に 11〜38 件残っていた。
 */
export function rewriteWebSelfReference(body: string): string {
  return (
    body
      .replace(/この記事/g, "この章")
      .replace(/本記事/g, "本章")
      // 社内用語 R2 (ストレージ名) は読者に意味が無い (2026-09-19 K-S1-07 で 9 か所)。「R2年」「R2-…」は触らない
      .replace(/R2(?![年0-9A-Za-z_-])/g, "収録データ")
  );
}

/**
 * サイト内回遊のための段落を書籍版から外す。対象は構造で決める (語で推測しない):
 *   - 「あわせて見る:」「本記事の対象データ:」「本記事の関連カテゴリ:」「関連ランキング:」「使用指標:」で始まる行
 *   - テーマページ (`/themes/`) へのリンクを含み「テーマページ」と書いている段落
 * 県名の `/areas/` リンクは分析文の中にあるので段落ごと消さない (mdToXhtml がリンクだけ落とす)。
 */
export function stripWebNavigation(body: string): string {
  return body
    .split("\n")
    .filter((line) => {
      if (/^(あわせて見る|本記事の対象データ|本記事の関連カテゴリ|関連ランキング|使用指標)[:：]/.test(line)) return false;
      if (/\]\(\/themes\//.test(line) && line.includes("テーマページ")) return false;
      return true;
    })
    .join("\n");
}

/**
 * サイトの出典カード `<data-source label=".." year="..">` を、章に「データ出典」見出しが無いときだけ
 * 章末の「## データ出典」に起こす。見出しがある章は本文が出典を書いているので、カードは
 * md-to-xhtml が落とす (2026-09-19 K-S1-11 F00537: sports-participation-map に出典節が無かった)。
 */
export function appendDataSourceSection(body: string): string {
  // 見出しの深さは記事により ##〜#### (2026-09-19 K-S1-09 G01: manufacturing-aichi-dominance は ###)。
  if (/^#{2,4}\s*(データ)?出典/m.test(body)) return body;
  const seen = new Set<string>();
  const items: string[] = [];
  for (const m of body.matchAll(/<data-source\b([^>]*)>/g)) {
    const attrs = m[1];
    const label = attrs.match(/\blabel="([^"]*)"/)?.[1]?.trim();
    if (!label) continue;
    const year = attrs.match(/\byear="([^"]*)"/)?.[1]?.trim();
    const line = year ? `${label}（${year}）` : label;
    if (seen.has(line)) continue;
    seen.add(line);
    items.push(`- ${line}`);
  }
  if (items.length === 0) return body;
  return `${body.replace(/\s+$/, "")}\n\n## データ出典\n\n${items.join("\n")}\n`;
}

let publishedSlugs: Promise<ReadonlySet<string>> | undefined;

/**
 * 公開中 (published !== false) の blog slug 集合。出典一覧に URL を出してよい記事を決める。
 * 未公開 slug は `/blog/<slug>` が 410 を返す (2026-09-19 K-S1-11 N30: sports-participation-map)。
 * 真実源は R2 `app/blog/all.json`。1 回だけ取得して使い回す。
 */
export function fetchPublishedSlugSet(): Promise<ReadonlySet<string>> {
  publishedSlugs ??= (async () => {
    const res = await fetch(`${R2_BASE}/app/blog/all.json`);
    if (!res.ok) throw new Error(`R2 fetch 失敗 (${res.status}): app/blog/all.json`);
    const json = (await res.json()) as { articles?: { slug: string; published?: boolean }[] };
    return new Set((json.articles ?? []).filter((a) => a.published !== false).map((a) => a.slug));
  })();
  return publishedSlugs;
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
  // 回遊行の除去は「本記事の…」を書き換える前に行う (書き換え後は行頭の語が変わり検出できない)。
  const body = appendDataSourceSection(rewriteWebSelfReference(stripWebNavigation(correctBookArticle(slug, originalBody))));
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
      // 図の中の文字 (図題・年の型) だけ書籍版で校訂してから PNG 化する (figure-corrections.ts)。
      const svgBuf = Buffer.from(correctBookFigure(slug, ref.name, Buffer.from(await svgRes.arrayBuffer()).toString("utf8")), "utf8");
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
