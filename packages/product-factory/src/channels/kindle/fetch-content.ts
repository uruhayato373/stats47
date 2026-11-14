/**
 * 章素材を R2 (公開 URL) から取得する。
 * - blog 章: `app/blog/<slug>/article.md` を取得し frontmatter を除去、参照 SVG を PNG 化して同梱する。
 * 出典メタ (title/description/tags) は frontmatter から取り出し、書籍の出典一覧に使う。
 */
import sharp from "sharp";
import type { DataSourceEntry } from "@stats47/data-configs/data-source";
import { KINDLE_SOURCE_SECTIONS, correctBookArticle } from "./editorial-corrections";
import { correctBookFigure } from "./figure-corrections";
import { fullTablesForArticle, insertBeforeSources } from "./full-tables";
import { SITE } from "@stats47/data-configs";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;

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
  /** body に入れた全県表 (full-tables.ts)。データの表なので書き下ろし比率の分母 (ブログの字数) から外す */
  readonly fullTablesMarkdown: string;
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

/** ブログ本文の旧「データ出典」見出し。判定はブログの一括移行 (md-preprocessor の migrateLegacyDataSourceSection) と同じ。 */
const LEGACY_SOURCE_HEADING = /^(#{2,4})[ \t]*データ出典[ \t]*$/;
/** 一括移行が説明を含む節に付ける見出し (md-preprocessor の LEGACY_DATA_SOURCE_NOTES_HEADING)。 */
const MIGRATED_NOTES_HEADING = "データについて";

/**
 * ブログ本文の末尾の旧「データ出典」節を、直前の空行と区切り線ごと取り出す (書籍版で持つ節の記録用)。
 * 本文 = 節より前の本文 + "\n" + 戻り値、が成り立つ。節が無ければ undefined。
 * 書籍の章に使う 64 記事では、旧節はどれも本文の最後の節だった (2026-11-14 実測)。
 */
export function extractLegacySourceSection(body: string): string | undefined {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => LEGACY_SOURCE_HEADING.test(line.trimEnd()));
  if (start < 0) return undefined;
  let head = start;
  while (head > 0 && lines[head - 1].trim() === "") head--;
  if (head > 0 && /^-{3,}\s*$/.test(lines[head - 1])) head--;
  while (head > 0 && lines[head - 1].trim() === "") head--;
  return body.slice(lines.slice(0, head).join("\n").length + 1);
}

/**
 * 書籍版で持つ「データ出典」節 (台帳 `products.kindle-editorial-corrections` の sourceSections) を章の本文へ戻す。
 * ブログ本文の手書き節は Web の出典一覧 (DataSourceList) へ移すため本文から消えるが、書籍の校正指示は
 * 校閲済みの節の文字列に当たるので、節は書籍の側で持つ。ブログ本文の状態によらず同じ章になる:
 *   - 本文がまだ節を持つ → そのまま
 *   - 一括移行で見出しが「データについて」に改名された → 見出しを戻す
 *   - 一括移行で節ごと消えた → 末尾に足す
 */
export function restoreBookSourceSection(body: string, section: string | undefined): string {
  if (!section) return body;
  if (body.split("\n").some((line) => LEGACY_SOURCE_HEADING.test(line.trimEnd()))) return body;
  const lines = section.split("\n");
  const start = lines.findIndex((line) => LEGACY_SOURCE_HEADING.test(line.trimEnd()));
  const level = start < 0 ? undefined : LEGACY_SOURCE_HEADING.exec(lines[start].trimEnd())?.[1];
  const renamed = level
    ? [...lines.slice(0, start), `${level} ${MIGRATED_NOTES_HEADING}`, ...lines.slice(start + 1)].join("\n")
    : section;
  if (renamed !== section && body.endsWith(renamed)) return `${body.slice(0, body.length - renamed.length)}${section}`;
  return `${body.replace(/\n*$/, "\n")}${section}`;
}

/** 出典 1 行の書式。`<data-source>` カードから起こした行 (「総務省 家計調査」) と同じく「組織 調査名」にする。 */
function formatSnapshotSource(entry: DataSourceEntry): string {
  const name = entry.organization ? `${entry.organization} ${entry.label}` : entry.label;
  return entry.note ? `${entry.note}: ${name}` : name;
}

/**
 * 章に「データ出典」見出しが無いとき、章末の「## データ出典」を起こす。材料の優先順:
 *   1. サイトの出典カード `<data-source label=".." year="..">` (年を持ち、校閲済みの章が使っている)
 *   2. `app/blog/all.json` の記事の `sources` (DataSourceEntry。Web の出典一覧と同じもの)
 * 見出しがある章は本文が出典を書いているので、カードは md-to-xhtml が落とす
 * (2026-09-19 K-S1-11 F00537: sports-participation-map に出典節が無かった)。
 */
export function appendDataSourceSection(body: string, sources: readonly DataSourceEntry[] = []): string {
  // 見出しの深さは記事により ##〜#### (2026-09-19 K-S1-09 G01: manufacturing-aichi-dominance は ###)。
  if (/^#{2,4}\s*(データ)?出典/m.test(body)) return body;
  const lines: string[] = [];
  for (const m of body.matchAll(/<data-source\b([^>]*)>/g)) {
    const attrs = m[1];
    const label = attrs.match(/\blabel="([^"]*)"/)?.[1]?.trim();
    if (!label) continue;
    const year = attrs.match(/\byear="([^"]*)"/)?.[1]?.trim();
    lines.push(year ? `${label}（${year}）` : label);
  }
  if (lines.length === 0) lines.push(...sources.map(formatSnapshotSource));
  const items = [...new Set(lines)].map((line) => `- ${line}`);
  if (items.length === 0) return body;
  return `${body.replace(/\s+$/, "")}\n\n## データ出典\n\n${items.join("\n")}\n`;
}

interface BlogSnapshot {
  readonly publishedSlugs: ReadonlySet<string>;
  readonly sourcesBySlug: ReadonlyMap<string, readonly DataSourceEntry[]>;
}

let blogSnapshot: Promise<BlogSnapshot> | undefined;

/** R2 `app/blog/all.json` を 1 回だけ取得して使い回す。 */
function fetchBlogSnapshot(): Promise<BlogSnapshot> {
  blogSnapshot ??= (async () => {
    const res = await fetch(`${R2_BASE}/app/blog/all.json`);
    if (!res.ok) throw new Error(`R2 fetch 失敗 (${res.status}): app/blog/all.json`);
    const json = (await res.json()) as {
      articles?: { slug: string; published?: boolean; sources?: DataSourceEntry[] }[];
    };
    const articles = json.articles ?? [];
    return {
      publishedSlugs: new Set(articles.filter((a) => a.published !== false).map((a) => a.slug)),
      sourcesBySlug: new Map(articles.map((a) => [a.slug, a.sources ?? []])),
    };
  })();
  return blogSnapshot;
}

/**
 * 公開中 (published !== false) の blog slug 集合。出典一覧に URL を出してよい記事を決める。
 * 未公開 slug は `/blog/<slug>` が 410 を返す (2026-09-19 K-S1-11 N30: sports-participation-map)。
 */
export async function fetchPublishedSlugSet(): Promise<ReadonlySet<string>> {
  return (await fetchBlogSnapshot()).publishedSlugs;
}

/** 記事ごとの出典 (Web の出典一覧と同じ `sources`)。章末の「データ出典」の材料にする。 */
export async function fetchBlogSourcesBySlug(): Promise<ReadonlyMap<string, readonly DataSourceEntry[]>> {
  return (await fetchBlogSnapshot()).sourcesBySlug;
}

/**
 * blog 記事を R2 から取得し、frontmatter 除去 + SVG→PNG 変換して返す。
 * 画像参照 `![alt](data/foo.svg)` は `![alt](images/<slug>__foo.png)` に書き換える。
 */
export async function fetchBlogArticle(
  slug: string,
  options: {
    readonly fullTables?: boolean;
    readonly seenTables?: Set<string>;
    /** all.json の記事の sources。本文に出典節も出典カードも無い章の「データ出典」の材料。 */
    readonly dataSources?: readonly DataSourceEntry[];
  } = {},
): Promise<FetchedArticle> {
  const res = await fetch(`${R2_BASE}/app/blog/${slug}/article.md`);
  if (!res.ok) throw new Error(`R2 fetch 失敗 (${res.status}): app/blog/${slug}/article.md`);
  const md = await res.text();
  const { fm, body: originalBody } = parseFrontmatter(md);
  // 書籍版で持つ出典節を先に戻す。校正指示は節を含む校閲済みの本文に当たる (restoreBookSourceSection)。
  const reviewedBody = restoreBookSourceSection(originalBody, KINDLE_SOURCE_SECTIONS[slug]);
  // 回遊行の除去は「本記事の…」を書き換える前に行う (書き換え後は行頭の語が変わり検出できない)。
  const base = rewriteWebSelfReference(stripWebNavigation(correctBookArticle(slug, reviewedBody)));
  // 全県表 (full-tables.ts) は図と同じデータから作り、出典の見出しの前に入れる。本ごとに catalog の fullTables で有効にする
  const tables = options.fullTables
    ? await fullTablesForArticle(slug, [...base.matchAll(/!\[[^\]]*\]\(data\/([a-z0-9-]+)\.svg\)/gi)].map((m) => m[1]), options.seenTables, base)
    : "";
  const body = appendDataSourceSection(insertBeforeSources(base, tables), options.dataSources);
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
    fullTablesMarkdown: tables,
  };
}
