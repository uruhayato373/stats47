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
  /**
   * coverPng の実寸 (既定 1600×2560)。cover.xhtml の SVG viewBox に焼くので、
   * cover.ts の W/H と必ず一致させる (ずれると表紙が引き伸ばされる)。
   */
  readonly coverSize?: { readonly width: number; readonly height: number };
  readonly chapters: readonly EpubChapterDoc[];
  readonly images: readonly EpubImage[];
  /** dc:description (任意)。 */
  readonly description?: string;
}

/** cover.ts の既定 (1600×2560 = Kindle 推奨比 1.6)。 */
const DEFAULT_COVER_SIZE = { width: 1600, height: 2560 } as const;

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
/* 見出しがページ末尾に孤立するのを防ぐ (直後の本文と必ず同じページに置く)。 */
h1,h2,h3{page-break-after:avoid;-webkit-column-break-after:avoid;}
p{margin:0.8em 0;text-align:justify;orphans:2;widows:2;}
figure{margin:1.2em 0;text-align:center;page-break-inside:avoid;}
/* 図はページ高を超えないよう高さも制限する。max-width だけだと縦長の図
   (720×720 のタイルマップ等) がページをまたいで割れる。 */
figure img{max-width:100%;max-height:88vh;height:auto;object-fit:contain;}
/* 扉: 中央寄せの独立ページ。h1 の下線は書名には不要。 */
.titlepage{text-align:center;padding-top:16%;}
.titlepage h1{border-bottom:none;font-size:1.7em;padding-bottom:0;margin-bottom:0.6em;}
.titlepage .subtitle{font-size:1.05em;color:#555;margin:0.4em 0;}
.titlepage .author{margin-top:3em;font-size:1.05em;}
/* 奥付 (本書について) は扉と同じ XHTML 内で必ず改ページして始める。 */
.colophon{page-break-before:always;}
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

/**
 * nav.xhtml (論理目次 + landmarks)。spine にも入れて「本の中の目次ページ」として読ませる。
 * landmarks が無いと Kindle が表紙・読書開始位置を識別できない (KDP 推奨)。
 */
function navDoc(
  title: string,
  chapters: readonly EpubChapterDoc[],
  hasCover: boolean,
): string {
  const items = chapters
    .map((c) => `<li><a href="${c.fileName}">${xmlEscape(c.title)}</a></li>`)
    .join("\n");
  const toc = `<nav epub:type="toc" id="toc"><h1>目次</h1><ol>\n${items}\n</ol></nav>`;
  // bodymatter = 本文の開始。扉 (chapters[0]) の次があればそこ、無ければ先頭。
  const bodyStart = chapters[1] ?? chapters[0];
  const landmarkItems = [
    hasCover ? `<li><a epub:type="cover" href="cover.xhtml">表紙</a></li>` : "",
    `<li><a epub:type="toc" href="nav.xhtml">目次</a></li>`,
    bodyStart
      ? `<li><a epub:type="bodymatter" href="${bodyStart.fileName}">本文</a></li>`
      : "",
  ].filter(Boolean);
  const landmarks = `<nav epub:type="landmarks" id="landmarks" hidden="hidden"><h1>ランドマーク</h1><ol>\n${landmarkItems.join("\n")}\n</ol></nav>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ja" xml:lang="ja">
<head><meta charset="UTF-8"/><title>${xmlEscape(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${toc}
${landmarks}</body>
</html>`;
}

/**
 * 表紙ページ。**素の `<img>` を使ってはならない** — `max-width:100%` で幅に合わせると
 * 1600×2560 の縦長画像は高さがビューポートを超え、表紙が複数ページに割れて
 * 後半 (ほぼ単色の部分) が次ページへ流出する。以降のページ境界もすべてずれる
 * (2026-08-12 に Kindle Previewer で実測: 表紙が描画されない・空白ページ・改ページ不正)。
 *
 * SVG ラッパは viewBox + preserveAspectRatio で「幅にも高さにも収める」ため 1 ページに収まる。
 * 電子書籍の全面表紙で広く使われる標準パターン。style.css はリンクしない
 * (body の margin 5% が効くと表紙が中央からずれる)。
 */
function coverDoc(input: EpubInput): string {
  const { width, height } = input.coverSize ?? DEFAULT_COVER_SIZE;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ja" xml:lang="ja">
<head>
<meta charset="UTF-8"/>
<title>${xmlEscape(input.title)}</title>
<meta name="viewport" content="width=${width}, height=${height}"/>
</head>
<body style="margin:0;padding:0;text-align:center;">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
<image width="${width}" height="${height}" xlink:href="images/cover.png"/>
</svg>
</body>
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
    // cover.xhtml は SVG ラップなので properties="svg" が必須 (無いと epubcheck error)。
    manifest.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" properties="svg"/>`);
    spine.push(`<itemref idref="cover"/>`);
  }
  // 扉 → 目次 → 本文。目次を spine に入れて「本の中の目次ページ」にする (KDP 推奨)。
  input.chapters.forEach((c, i) => {
    manifest.push(`<item id="${c.id}" href="${c.fileName}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${c.id}"/>`);
    if (i === 0) spine.push(`<itemref idref="nav"/>`);
  });
  for (const img of input.images) {
    const id = `img-${img.fileName.replace(/[^a-z0-9]/gi, "-")}`;
    manifest.push(`<item id="${id}" href="images/${img.fileName}" media-type="image/png"/>`);
  }
  const desc = input.description ? `<dc:description>${xmlEscape(input.description)}</dc:description>` : "";
  // EPUB3 の properties="cover-image" に加えて legacy meta も置く (削除条件: KDP / Kindle Previewer が
  // properties="cover-image" だけで表紙サムネイルを認識することを実機確認できたとき。期限は設けない)。
  // Kindle 系は後者を見て表紙サムネイルを決めることがある。
  const coverMeta = input.coverPng ? `<meta name="cover" content="cover-image"/>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="ja">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="pub-id">${xmlEscape(input.identifier)}</dc:identifier>
<dc:title>${xmlEscape(input.title)}</dc:title>
<dc:creator>${xmlEscape(input.author)}</dc:creator>
<dc:language>ja</dc:language>
${desc}
<meta property="dcterms:modified">${xmlEscape(input.modified)}</meta>
${coverMeta}
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
  oebps.file("nav.xhtml", navDoc(input.title, input.chapters, Boolean(input.coverPng)));
  oebps.file("content.opf", opf(input));

  if (input.coverPng) {
    oebps.file("cover.xhtml", coverDoc(input));
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
