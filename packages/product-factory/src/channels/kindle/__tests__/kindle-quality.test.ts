import { describe, expect, it } from "vitest";

import { chapterMetrics, figureSource, type EpubChapter } from "../epub-inspect";
import { bookQuality, chapterFlags, qualitySummary } from "../kindle-quality";

function chapter(id: string, body: string): EpubChapter {
  return { id, href: `${id}.xhtml`, title: id, body, ...chapterMetrics(body) };
}

const LONG_TEXT = `<p>${"あ".repeat(1200)}</p>`;
const FIGURE = '<figure><img src="images/crab__map.png" alt="地図"/></figure>';
const FULL_TABLE = `<table>${"<tr><td>県</td></tr>".repeat(48)}</table>`;

describe("kindle-quality (KINDLE-QUALITY-LOOP-01 の機械の検査)", () => {
  it("図の出どころを、ブログの図とランキング章の直接描画で分ける", () => {
    expect(figureSource("images/crab-expenditure-ranking__crab-map.png")).toBe("blog");
    expect(figureSource("images/rk-total-population.png")).toBe("ranking-databook");
    expect(figureSource("images/cover.png")).toBe("other");
  });

  it("長いのに図の無い章・説明の無い図・全県表の無い図の章・共通の型を通らない図に印を付ける", () => {
    const flags = chapterFlags(chapter("c1", `${LONG_TEXT}${FIGURE}<h2>次</h2><figure><img src="images/rk-x.png"/></figure><p>説明</p>`));
    expect(flags.map((flag) => flag.code).sort()).toEqual([
      "data-chapter-without-full-table",
      "figure-outside-shared-template",
      "figure-without-text",
    ]);
    expect(chapterFlags(chapter("c2", LONG_TEXT)).map((flag) => flag.code)).toEqual(["long-chapter-without-figure"]);
    expect(chapterFlags(chapter("c3", `${FIGURE}<p>説明</p>${FULL_TABLE}`))).toEqual([]);
    // 短い章 (序・あとがき) は図が無くても印を付けない
    expect(chapterFlags(chapter("c4", "<p>短い</p>"))).toEqual([]);
  });

  it("サイトへのリンクが無い本・UTM の無いリンクがある本に印を付ける", () => {
    const none = bookQuality({ id: "K-S1-01", epubPath: "x.epub", epubSha256: "a", parsed: { title: "t", modified: null, chapters: [chapter("c", "<p>x</p>")] } });
    expect(none.flags.map((flag) => flag.code)).toEqual(["no-site-link"]);
    const plain = bookQuality({
      id: "K-S1-02", epubPath: "x.epub", epubSha256: "a",
      parsed: { title: "t", modified: null, chapters: [chapter("c", '<p><a href="https://stats47.jp/">x</a></p>')] },
    });
    expect(plain.flags).toEqual([{ code: "site-link-without-utm", value: 1 }]);
  });

  it("EPUB の無い本は 0 で埋めず epub-missing にし、まとめに名前を出す", () => {
    const missing = bookQuality({ id: "K-S1-03", epubPath: null, epubSha256: null, parsed: null });
    expect(missing).toMatchObject({ status: "epub-missing", chars: null, figures: null, flags: [] });
    const measured = bookQuality({ id: "K-S1-02", epubPath: "x.epub", epubSha256: "a", parsed: { title: "t", modified: null, chapters: [chapter("c", `${LONG_TEXT}${FIGURE}<p>説明</p>`)] } });
    expect(measured.figuresPer10kChars).toBe(8.3);
    expect(qualitySummary([missing, measured], "K-S1-02")).toMatchObject({
      books: 2,
      measured: 1,
      epubMissing: ["K-S1-03"],
      baseline: { id: "K-S1-02", figuresWithoutText: 0 },
    });
  });
});
