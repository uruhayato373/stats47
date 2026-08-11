/**
 * EPUB 構造の不変量テスト。
 *
 * 2026-08-12 に Kindle Previewer で「表紙が描画されない / 途中ページが表示されない /
 * 改ページが不適切」の 3 症状が出た。原因は表紙が素の `<img>` で 1600×2560 を置いており、
 * 幅 100% 合わせで高さがページを超え、表紙が複数ページに割れて以降の境界を汚していたこと。
 * epubcheck は 0 error のまま通っていた (構文は妥当だがレイアウトが壊れる) ので、
 * ここで構造の不変量を機械的に固定する。
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildEpub, type EpubInput } from "../epub";

const CHAPTERS = [
  { id: "front", fileName: "chap-000.xhtml", title: "扉", bodyXhtml: "<h1>書名</h1>" },
  { id: "chap001", fileName: "chap001.xhtml", title: "はじめに", bodyXhtml: "<h1>はじめに</h1><p>本文</p>" },
  { id: "chap002", fileName: "chap002.xhtml", title: "第1章", bodyXhtml: "<h1>第1章</h1><p>本文</p>" },
];

function baseInput(overrides: Partial<EpubInput> = {}): EpubInput {
  return {
    identifier: "urn:stats47:kindle:TEST",
    title: "テスト書籍",
    author: "stats47",
    modified: "2026-08-12T00:00:00Z",
    chapters: CHAPTERS,
    images: [],
    ...overrides,
  };
}

/** buildEpub を temp に書き出して zip として読み直す。 */
async function build(input: EpubInput): Promise<{ zip: JSZip; raw: Buffer }> {
  const dir = mkdtempSync(join(tmpdir(), "epub-test-"));
  const out = join(dir, "book.epub");
  try {
    await buildEpub(input, out);
    const raw = readFileSync(out);
    return { zip: await JSZip.loadAsync(raw), raw };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** OEBPS 配下のファイルを読む (章・OPF・nav・CSS はすべてここ)。 */
const text = async (zip: JSZip, path: string): Promise<string> => {
  const full = `OEBPS/${path}`;
  const f = zip.file(full);
  if (!f) throw new Error(`${full} が EPUB に無い`);
  return f.async("string");
};

/** OCF ルート直下 (container.xml 等)。 */
const rootText = async (zip: JSZip, path: string): Promise<string> => {
  const f = zip.file(path);
  if (!f) throw new Error(`${path} が EPUB に無い`);
  return f.async("string");
};

/** OEBPS 配下の存在確認。 */
const has = (zip: JSZip, path: string): boolean => zip.file(`OEBPS/${path}`) !== null;

describe("buildEpub — OCF の基本要件", () => {
  it("mimetype が先頭エントリかつ無圧縮で入る", async () => {
    const { raw } = await build(baseInput());
    // 先頭が STORE の mimetype なら、ローカルヘッダ直後 (offset 38) に生の文字列が出る。
    expect(raw.subarray(30, 38).toString("ascii")).toBe("mimetype");
    expect(raw.subarray(38, 58).toString("ascii")).toBe("application/epub+zip");
  });

  it("container.xml が OPF を指す", async () => {
    const { zip } = await build(baseInput());
    expect(await rootText(zip, "META-INF/container.xml")).toContain("OEBPS/content.opf");
  });
});

describe("buildEpub — 表紙 (3 症状の再発防止)", () => {
  const withCover = () => baseInput({ coverPng: Buffer.from("fake-png") });

  it("cover.xhtml は SVG ラップで、素の <img> を使わない", async () => {
    const { zip } = await build(withCover());
    const cover = await text(zip, "cover.xhtml");
    expect(cover).toContain("<svg");
    expect(cover).toContain("preserveAspectRatio=\"xMidYMid meet\"");
    expect(cover).toContain("xlink:href=\"images/cover.png\"");
    // 素の <img> は高さがページを超えて表紙が割れるので許さない。
    expect(cover).not.toMatch(/<img\b/);
  });

  it("cover.xhtml は style.css をリンクしない (body margin で中央がずれる)", async () => {
    const { zip } = await build(withCover());
    expect(await text(zip, "cover.xhtml")).not.toContain("style.css");
  });

  it("viewBox は coverSize と一致する (既定 1600×2560)", async () => {
    const { zip } = await build(withCover());
    expect(await text(zip, "cover.xhtml")).toContain("viewBox=\"0 0 1600 2560\"");

    const { zip: z2 } = await build(
      baseInput({ coverPng: Buffer.from("x"), coverSize: { width: 1000, height: 1600 } }),
    );
    expect(await text(z2, "cover.xhtml")).toContain("viewBox=\"0 0 1000 1600\"");
  });

  it("cover item に properties=\"svg\" が付く (無いと epubcheck error)", async () => {
    const { zip } = await build(withCover());
    const opf = await text(zip, "content.opf");
    expect(opf).toMatch(/id="cover"[^>]*properties="svg"/);
    expect(opf).toMatch(/id="cover-image"[^>]*properties="cover-image"/);
  });

  it("legacy の cover meta も置く (Kindle のサムネイル識別)", async () => {
    const { zip } = await build(withCover());
    expect(await text(zip, "content.opf")).toContain('<meta name="cover" content="cover-image"/>');
  });

  it("表紙が無い本には cover 関連を一切出さない", async () => {
    const { zip } = await build(baseInput());
    expect(has(zip, "cover.xhtml")).toBe(false);
    expect(has(zip, "images/cover.png")).toBe(false);
    const opf = await text(zip, "content.opf");
    expect(opf).not.toContain("cover-image");
    expect(opf).not.toContain('<meta name="cover"');
    // landmarks の表紙エントリも消える。
    expect(await text(zip, "nav.xhtml")).not.toContain('epub:type="cover"');
  });
});

describe("buildEpub — ナビゲーションと読む順", () => {
  it("spine が 表紙 → 扉 → 目次 → 本文 の順になる", async () => {
    const { zip } = await build(baseInput({ coverPng: Buffer.from("x") }));
    const opf = await text(zip, "content.opf");
    const order = [...opf.matchAll(/<itemref idref="([^"]+)"\/>/g)].map((m) => m[1]);
    expect(order).toEqual(["cover", "front", "nav", "chap001", "chap002"]);
  });

  it("nav.xhtml に landmarks (表紙・目次・本文) がある", async () => {
    const { zip } = await build(baseInput({ coverPng: Buffer.from("x") }));
    const nav = await text(zip, "nav.xhtml");
    expect(nav).toContain('epub:type="landmarks"');
    expect(nav).toContain('epub:type="cover" href="cover.xhtml"');
    expect(nav).toContain('epub:type="toc" href="nav.xhtml"');
    // bodymatter は扉の次の章 (= 実際の本文開始)。
    expect(nav).toContain('epub:type="bodymatter" href="chap001.xhtml"');
  });

  it("章が扉 1 つしか無くても bodymatter を落とさない", async () => {
    const only = [CHAPTERS[0]];
    const { zip } = await build(baseInput({ chapters: only }));
    expect(await text(zip, "nav.xhtml")).toContain('epub:type="bodymatter" href="chap-000.xhtml"');
  });

  it("目次に全章が並ぶ", async () => {
    const { zip } = await build(baseInput());
    const nav = await text(zip, "nav.xhtml");
    for (const c of CHAPTERS) expect(nav).toContain(`href="${c.fileName}"`);
  });
});

describe("buildEpub — 組版 CSS", () => {
  it("見出しの孤立と図のページ跨ぎを止める", async () => {
    const { zip } = await build(baseInput());
    const css = await text(zip, "style.css");
    expect(css).toMatch(/h1,h2,h3\{[^}]*page-break-after:avoid/);
    expect(css).toMatch(/figure\{[^}]*page-break-inside:avoid/);
    // 図が縦にページを超えないよう高さも制限する。
    expect(css).toMatch(/figure img\{[^}]*max-height:/);
    expect(css).toMatch(/p\{[^}]*orphans:2;widows:2/);
  });

  it("扉と奥付のクラスがある (奥付は改ページで始まる)", async () => {
    const { zip } = await build(baseInput());
    const css = await text(zip, "style.css");
    expect(css).toContain(".titlepage");
    expect(css).toMatch(/\.colophon\{[^}]*page-break-before:always/);
  });
});
