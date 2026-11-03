/**
 * 入稿版 EPUB を読み、章ごとの本文と数字 (文字数・図・全県表・リンク) を返す純関数。
 * 管理画面の本文画面 (`apps/admin/lib/server/kindle-epub.ts`) と品質の検査 (`quality-cli.ts`) が同じものを使う
 * (数え方を 2 つ持たない)。EPUB は ZIP なので依存を増やさず node:zlib で読む。KINDLE-QUALITY-LOOP-01。
 */
import path from "node:path";
import { inflateRawSync } from "node:zlib";

/** ZIP の中央ディレクトリを読み、名前 → 中身の読み出し関数を返す (無圧縮と deflate だけ)。 */
export function readZip(buffer: Buffer): Map<string, () => Buffer> {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 0xffff); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("zip: end of central directory not found");
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map<string, () => Buffer>();
  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("zip: bad central directory entry");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;
    entries.set(name, () => {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`zip: bad local header: ${name}`);
      const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
      const data = buffer.subarray(start, start + compressedSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`zip: unsupported compression method ${method}: ${name}`);
    });
  }
  return entries;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function textOf(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, "");
}

/** 全県表とみなす行数 (見出し 1 行 + 47 県)。 */
export const FULL_TABLE_ROWS = 48;

/**
 * 図の出どころ。`<slug>__<name>.png` はブログの図 (R2 の SVG を PNG 化。ブログの共通の型を通る)、
 * `rk-<key>.png` はランキング章の上位・下位の図 (`ranking-databook.ts` が svg-builder で直接描く)。
 */
export type FigureSource = "blog" | "ranking-databook" | "other";

export function figureSource(src: string): FigureSource {
  const file = src.split("/").pop() ?? "";
  if (file.startsWith("rk-")) return "ranking-databook";
  if (file.includes("__")) return "blog";
  return "other";
}

/** 章 1 つ分の数字。図の直後の要素が段落でなければ「説明なし」と数える。 */
export function chapterMetrics(body: string) {
  const figures = [...body.matchAll(/<figure\b[\s\S]*?<\/figure>\s*(<[a-z0-9]+)?/gi)];
  const sources = [...body.matchAll(/<figure\b[\s\S]*?<img\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => figureSource(m[1]));
  const tables = [...body.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => (m[0].match(/<tr\b/gi) ?? []).length);
  const links = [...body.matchAll(/<a\b[^>]*\bhref="(https?:\/\/(?:www\.)?stats47\.jp[^"]*)"/gi)].map((m) => decodeEntities(m[1]));
  return {
    chars: textOf(body).length,
    figures: figures.length,
    figuresWithoutText: figures.filter((m) => m[1]?.toLowerCase() !== "<p").length,
    rankingDatabookFigures: sources.filter((source) => source === "ranking-databook").length,
    tables: tables.length,
    // 全県表は 12 行ずつに分けて載せる (full-tables.ts) ので、「全47都道府県の値」の見出しの数でも数える
    fullTables: Math.max(
      tables.filter((rows) => rows >= FULL_TABLE_ROWS).length,
      (body.match(/<h[2-4]\b[^>]*>全47都道府県の値/g) ?? []).length,
    ),
    siteLinks: links.length,
    siteLinksWithUtm: links.filter((href) => /[?&]utm_source=/.test(href)).length,
  };
}

export type ChapterMetrics = ReturnType<typeof chapterMetrics>;

export interface EpubChapter extends ChapterMetrics {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  /** body の中身 (加工前) */
  readonly body: string;
}

function attr(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
}

/** OPF のあるディレクトリ (EPUB 内の相対パスの基点)。 */
export function epubBase(zip: Map<string, () => Buffer>): string {
  const container = zip.get("META-INF/container.xml")?.().toString("utf8") ?? "";
  const opfPath = attr(container.match(/<rootfile\b[^>]*>/)?.[0] ?? "", "full-path");
  if (!opfPath) throw new Error("epub: rootfile not found");
  return opfPath;
}

/** EPUB の spine の順に、本文の章 (表紙・目次を除く) を読む。 */
export function parseEpub(buffer: Buffer) {
  const zip = readZip(buffer);
  const read = (name: string) => {
    const entry = zip.get(name);
    if (!entry) throw new Error(`epub: missing ${name}`);
    return entry().toString("utf8");
  };
  const opfPath = epubBase(zip);
  const base = path.posix.dirname(opfPath);
  const opf = read(opfPath);
  const manifest = new Map<string, { href: string; properties: string }>();
  for (const [tag] of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = attr(tag, "id");
    const href = attr(tag, "href");
    if (id && href) manifest.set(id, { href, properties: attr(tag, "properties") ?? "" });
  }
  const chapters: EpubChapter[] = [];
  for (const [tag] of opf.matchAll(/<itemref\b[^>]*>/g)) {
    const id = attr(tag, "idref");
    const item = id ? manifest.get(id) : undefined;
    if (!id || !item || /\b(?:nav|svg)\b/.test(item.properties)) continue;
    const xhtml = read(path.posix.join(base, item.href));
    const body = xhtml.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
    const heading = xhtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
    const title = decodeEntities(heading.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() || item.href;
    chapters.push({ id, href: item.href, title, body, ...chapterMetrics(body) });
  }
  return {
    title: decodeEntities(opf.match(/<dc:title>([\s\S]*?)<\/dc:title>/)?.[1] ?? ""),
    modified: opf.match(/<meta property="dcterms:modified">([^<]+)<\/meta>/)?.[1] ?? null,
    chapters,
  };
}
