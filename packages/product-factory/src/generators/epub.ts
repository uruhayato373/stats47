/**
 * EPUB3 (リフロー型) ジェネレータ。jszip で mimetype + container + OPF + nav + 章 XHTML + 画像を組む。
 * 図表は章内ブロック画像 (PNG) として同梱する。フォントは埋め込まない (端末フォント= リフローの原則)。
 *
 * KDP 電子書籍は EPUB を受け付ける。epubcheck / Kindle Previewer での最終検証は人間工程。
 */
import JSZip from "jszip";
import { writeFileSync } from "node:fs";

export interface EpubChapterDoc {
  /** manifest/spine の id (英数)。 */
  readonly id: string;
  /** OEBPS 内のファイル名 (例 chap-001.xhtml)。 */
  readonly fileName: string;
  /** 目次に出る章タイトル。 */
  readonly title: string;
  /** 章本文の XHTML 断片 (body の中身)。 */
  readonly bodyXhtml: string;
}

export interface EpubImage {
  /** images/<fileName>。 */
  readonly fileName: string;
  readonly png: Buffer;
}

export interface EpubInput {
  /** 一意識別子 (例 urn:stats47:kindle:K-S1-01)。 */
  readonly identifier: string;
  readonly title: string;
  readonly author: string;
  /** ISO 日時 (dcterms:modified)。 */
  readonly modified: string;
  readonly coverPng?: Buffer;
  readonly chapters: readonly EpubChapterDoc[];
  readonly images: readonly EpubImage[];
  /** dc:description (任意)。 */
  readonly description?: string;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CSS = `body{font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;line-height:1.8;margin:0 5%;}
h1{font-size:1.5em;margin:1.4em 0 0.8em;line-height:1.4;border-bottom:2px solid #333;padding-bottom:0.3em;}
h2{font-size:1.25em;margin:1.6em 0 0.6em;line-height:1.5;}
h3{font-size:1.1em;margin:1.2em 0 0.5em;}
p{margin:0.8em 0;text-align:justify;}
figure{margin:1.2em 0;text-align:center;page-break-inside:avoid;}
figure img{max-width:100%;height:auto;}
ul{margin:0.8em 0;padding-left:1.4em;}
li{margin:0.3em 0;}
aside.callout{border:1px solid #bbb;background:#f6f6f6;border-radius:4px;padding:0.6em 1em;margin:1.2em 0;}
aside.callout .callout-label{font-weight:bold;margin:0 0 0.3em;font-size:0.9em;color:#444;}
aside.callout p{margin:0.3em 0;font-size:0.95em;}
.sources h2{font-size:1.1em;}
.sources p{font-size:0.85em;color:#444;margin:0.4em 0;}`;

/** 単一 XHTML ドキュメントを組む。 */
function xhtmlDoc(title: string, bodyInner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ja" xml:lang="ja">
<head>
<meta charset="UTF-8"/>
<title>${xmlEscape(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${bodyInner}
</body>
</html>`;
}

function navDoc(title: string, chapters: readonly EpubChapterDoc[]): string {
  const items = chapters
    .map((c) => `<li><a href="${c.fileName}">${xmlEscape(c.title)}</a></li>`)
    .join("\n");
  const inner = `<nav epub:type="toc" id="toc"><h1>目次</h1><ol>\n${items}\n</ol></nav>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ja" xml:lang="ja">
<head><meta charset="UTF-8"/><title>${xmlEscape(title)}</title></head>
<body>${inner}</body>
</html>`;
}

function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`;
}

function opf(input: EpubInput): string {
  const manifest: string[] = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
  ];
  const spine: string[] = [];
  if (input.coverPng) {
    manifest.push(`<item id="cover-image" href="images/cover.png" media-type="image/png" properties="cover-image"/>`);
    manifest.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="cover"/>`);
  }
  for (const c of input.chapters) {
    manifest.push(`<item id="${c.id}" href="${c.fileName}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${c.id}"/>`);
  }
  for (const img of input.images) {
    const id = `img-${img.fileName.replace(/[^a-z0-9]/gi, "-")}`;
    manifest.push(`<item id="${id}" href="images/${img.fileName}" media-type="image/png"/>`);
  }
  const desc = input.description ? `<dc:description>${xmlEscape(input.description)}</dc:description>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="ja">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="pub-id">${xmlEscape(input.identifier)}</dc:identifier>
<dc:title>${xmlEscape(input.title)}</dc:title>
<dc:creator>${xmlEscape(input.author)}</dc:creator>
<dc:language>ja</dc:language>
${desc}
<meta property="dcterms:modified">${xmlEscape(input.modified)}</meta>
</metadata>
<manifest>
${manifest.join("\n")}
</manifest>
<spine>
${spine.join("\n")}
</spine>
</package>`;
}

/** EPUB を組んで outPath に書き出す。 */
export async function buildEpub(input: EpubInput, outPath: string): Promise<void> {
  const zip = new JSZip();
  // mimetype は最初・無圧縮 (EPUB OCF 要件)。
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", containerXml());

  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("zip folder 生成失敗");
  oebps.file("style.css", CSS);
  oebps.file("nav.xhtml", navDoc(input.title, input.chapters));
  oebps.file("content.opf", opf(input));

  if (input.coverPng) {
    oebps.file(
      "cover.xhtml",
      xhtmlDoc(
        input.title,
        `<figure style="margin:0;text-align:center;"><img src="images/cover.png" alt="${xmlEscape(input.title)}"/></figure>`,
      ),
    );
    oebps.file("images/cover.png", input.coverPng);
  }
  for (const c of input.chapters) {
    oebps.file(c.fileName, xhtmlDoc(c.title, c.bodyXhtml));
  }
  for (const img of input.images) {
    oebps.file(`images/${img.fileName}`, img.png);
  }

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", mimeType: "application/epub+zip" });
  writeFileSync(outPath, buf);
}
