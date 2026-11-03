import { deflateRawSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { chapterMetrics, parseEpub, readZip, sanitizeChapterHtml } from "@/lib/server/kindle-epub";

/** テスト用の最小 ZIP (local header + central directory + EOCD)。deflate を true にした項目は圧縮する。 */
function zip(files: readonly { name: string; text: string; deflate?: boolean }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const raw = Buffer.from(file.text, "utf8");
    const data = file.deflate ? deflateRawSync(raw) : raw;
    const name = Buffer.from(file.name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(file.deflate ? 8 : 0, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(file.deflate ? 8 : 0, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, data);
    centrals.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, eocd]);
}

const CHAPTER = `<html><head><title>第1章</title></head><body><h1>第1章 かに</h1><p>本文です。</p>
<figure><img src="images/crab.png" alt="かに"/></figure><p>図の読み方。</p>
<figure><img src="images/crab-map.png" alt="地図"/></figure><h2>次の節</h2>
<p><a href="https://stats47.jp/blog/crab?utm_source=kindle&amp;utm_medium=ebook">https://stats47.jp/blog/crab</a>
<a href="https://stats47.jp/">https://stats47.jp/</a></p><script>alert(1)</script></body></html>`;

function sampleEpub(): Buffer {
  return zip([
    { name: "mimetype", text: "application/epub+zip" },
    { name: "META-INF/container.xml", text: '<container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>' },
    {
      name: "OEBPS/content.opf",
      deflate: true,
      text: `<package><metadata><dc:title>食卓の本</dc:title><meta property="dcterms:modified">2026-09-19T15:00:59Z</meta></metadata>
<manifest><item id="nav" href="nav.xhtml" properties="nav"/><item id="cover" href="cover.xhtml" properties="svg"/>
<item id="chap001" href="chap001.xhtml"/></manifest>
<spine><itemref idref="cover"/><itemref idref="nav"/><itemref idref="chap001"/></spine></package>`,
    },
    { name: "OEBPS/nav.xhtml", text: "<html><body><h1>目次</h1></body></html>" },
    { name: "OEBPS/cover.xhtml", text: "<html><body></body></html>" },
    { name: "OEBPS/chap001.xhtml", text: CHAPTER, deflate: true },
  ]);
}

describe("kindle-epub", () => {
  it("無圧縮と deflate の両方の項目を読める", () => {
    const entries = readZip(sampleEpub());
    expect(entries.get("mimetype")?.().toString()).toBe("application/epub+zip");
    expect(entries.get("OEBPS/chap001.xhtml")?.().toString()).toContain("第1章 かに");
  });

  it("spine の順に本文の章だけを読み、表紙と目次は除く", () => {
    const book = parseEpub(sampleEpub(), "K-S1-02");
    expect(book.title).toBe("食卓の本");
    expect(book.modified).toBe("2026-09-19T15:00:59Z");
    expect(book.chapters.map((chapter) => chapter.title)).toEqual(["第1章 かに"]);
  });

  it("図の数・直後に説明の無い図・サイトへのリンクと UTM の有無を数える", () => {
    expect(chapterMetrics(CHAPTER)).toMatchObject({ figures: 2, figuresWithoutText: 1, siteLinks: 2, siteLinksWithUtm: 1 });
  });

  it("script を落とし、図は管理画面のルートへ向け直し、許していない場所の画像は表示しない", () => {
    const html = sanitizeChapterHtml(`${CHAPTER}<img src="../secret.png"/><p onclick="x()">x</p>`, "K-S1-02");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).toContain('src="/kindle-book/K-S1-02/images/crab.png"');
    expect(html).not.toContain("secret.png");
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
  });
});
