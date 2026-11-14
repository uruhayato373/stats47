import { describe, expect, it } from "vitest";

import { chapterMetrics, figureSource, fullTableIndicator, type EpubChapter } from "../epub-inspect";
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

  it("全県表の見出しから指標・年・単位を読み、家計調査の県庁所在市の注記の有無を本ごとに出す", () => {
    // 指標名に括弧があっても、最後の括弧だけを年と単位として読む
    expect(fullTableIndicator("全47都道府県の値：小学校教育費（児童1人当たり）（2022年度・円）")).toEqual({
      label: "小学校教育費（児童1人当たり）", period: "2022年度", unit: "円",
    });
    expect(fullTableIndicator("全47都道府県の値：大学収容力指数（2024年）")).toEqual({ label: "大学収容力指数", period: "2024年", unit: "" });
    expect(fullTableIndicator("表1 家賃・通勤・気温")).toBeNull();
    const table = (heading: string, note = "") => `<h3>${heading}</h3>${FULL_TABLE}<p>順位は値の大きい順です。${note}</p>`;
    const book = bookQuality({
      id: "K-S1-02", epubPath: "x.epub", epubSha256: "a",
      parsed: {
        title: "t", modified: null,
        chapters: [
          chapter("c1", table("全47都道府県の値：米の購入数量（2024年・kg）", "家計調査の値は、各県の県庁所在市（東京都は区部）の二人以上の世帯のものです。")),
          chapter("c2", table("全47都道府県の値：外食費の割合（2023年度・％）")),
        ],
      },
    });
    expect(book.fullTableIndicators).toEqual([
      { label: "米の購入数量", period: "2024年", unit: "kg" },
      { label: "外食費の割合", period: "2023年度", unit: "％" },
    ]);
    expect(book.householdCityValues).toBe(true);
    expect(bookQuality({ id: "K-S1-03", epubPath: "x.epub", epubSha256: "a", parsed: { title: "t", modified: null, chapters: [chapter("c", table("表1 家賃"))] } }))
      .toMatchObject({ fullTableIndicators: [], householdCityValues: false, fullTables: 1 });
    // EPUB の無い本は空の一覧にせず null (欠測を「指標なし」にしない)
    expect(bookQuality({ id: "K-S1-04", epubPath: null, epubSha256: null, parsed: null })).toMatchObject({ fullTableIndicators: null, householdCityValues: null });
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
