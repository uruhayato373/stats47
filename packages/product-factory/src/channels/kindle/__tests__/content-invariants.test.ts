/**
 * verify-epub 第 ③ 層 (本文不変量) の固定。
 * 2026-09-19 の全冊監査で見つかった 4 欠陥を、正常本文では 0 件・混入本文では検出、の両側で固定する。
 */
import { describe, expect, it } from "vitest";

import { chapterTextFromXhtml, checkBookContent, checkCrossBookDuplicates } from "../content-invariants";

const rankingXhtml = (title: string, lead: string) =>
  `<html><body><h1>${title}</h1><figure><img src="images/x.png" alt="${title}"/></figure><p>${lead}</p><table><tr><td>1</td></tr></table></body></html>`;

describe("chapterTextFromXhtml", () => {
  it("h1 をタイトルに、図 1 枚 + 表をランキング章として識別する", () => {
    const ch = chapterTextFromXhtml("chap005.xhtml", rankingXhtml("合計特殊出生率", "合計特殊出生率（2023年）の1位は沖縄県で1.6（人）です。"));
    expect(ch.title).toBe("合計特殊出生率");
    expect(ch.isRanking).toBe(true);
    expect(ch.text).toContain("1位は沖縄県で1.6（人）");
  });
});

describe("checkBookContent", () => {
  it("欠陥の無い章は 0 件", () => {
    const ok = chapterTextFromXhtml("chap003.xhtml", "<html><body><h1>県民所得を読む</h1><p>この章では2023年の値を使います。</p></body></html>");
    expect(checkBookContent([ok])).toEqual([]);
  });

  it("Web 記事の名残は error", () => {
    const ch = chapterTextFromXhtml("chap003.xhtml", "<html><body><h1>x</h1><p>この記事のデータは意外に映ります。本記事では年額を12で割ります。</p></body></html>");
    const f = checkBookContent([ch]);
    expect(f.map((x) => x.code)).toEqual(["web-self-reference"]);
    expect(f[0].level).toBe("error");
    expect(f[0].msg).toContain("× 2");
  });

  it("同じ年の「年」と「年度」の混在は warn", () => {
    const ch = chapterTextFromXhtml("chap005.xhtml", "<html><body><h1>x</h1><p>合計特殊出生率（2023年）の値。</p><p>2023年度に最も低かったのは東京都です。</p></body></html>");
    expect(checkBookContent([ch]).map((x) => x.code)).toEqual(["year-nendo-mix"]);
  });

  it("率系の指標に個数単位が付いたら error、金額指標の円は通す", () => {
    const bad = chapterTextFromXhtml("chap005.xhtml", rankingXhtml("合計特殊出生率", "合計特殊出生率（2023年）の1位は沖縄県で1.6（人）、最下位は東京都で0.99（人）です。"));
    const good = chapterTextFromXhtml("chap006.xhtml", rankingXhtml("紅茶消費支出額", "紅茶消費支出額（2024年）の1位は神奈川県で1,234（円）です。"));
    expect(checkBookContent([bad]).map((x) => x.code)).toEqual(["rate-with-count-unit"]);
    expect(checkBookContent([good])).toEqual([]);
  });

  it("括弧違いだけの同じ指標が 2 章あれば warn", () => {
    const a = chapterTextFromXhtml("chap010.xhtml", rankingXhtml("昼夜間人口比率", "昼夜間人口比率（2020年）の1位は東京都で119.2（%）です。"));
    const b = chapterTextFromXhtml("chap011.xhtml", rankingXhtml("昼夜間人口比率（国勢調査）", "昼夜間人口比率（国勢調査）（2020年）の1位は東京都で119.2（%）です。"));
    expect(checkBookContent([a, b]).map((x) => x.code)).toEqual(["same-indicator-twice"]);
  });
});

describe("checkCrossBookDuplicates", () => {
  const para = "この段落は六十字以上あるので冊間重複の対象になります。同じ文がもう一冊にもそのまま入っている状態を作り、検査器がそれを数えることを固定します。";
  const lead = "祭具・墓石消費支出額（2024年）の1位は島根県で15,531（円）です。";
  it("1 冊だけなら空", () => {
    const a = [chapterTextFromXhtml("chap005.xhtml", rankingXhtml("祭具・墓石消費支出額", `${lead}</p><p>${para}`))];
    expect(checkCrossBookDuplicates(new Map([["K-S3-01", a]]))).toEqual([]);
  });
  it("同一指標のランキング章と同一段落を冊間で数える", () => {
    const a = [chapterTextFromXhtml("chap005.xhtml", rankingXhtml("祭具・墓石消費支出額", `${lead}</p><p>${para}`))];
    const b = [chapterTextFromXhtml("chap009.xhtml", rankingXhtml("祭具・墓石消費支出額", `${lead}</p><p>${para}`))];
    const c = [chapterTextFromXhtml("chap002.xhtml", rankingXhtml("国立公園面積", "国立公園面積（2023年）の1位は北海道で1,000（ha）です。"))];
    const f = checkCrossBookDuplicates(new Map([["K-S3-01", a], ["K-S4-01", b], ["K-S2-07", c]]));
    expect(f.map((x) => x.code)).toEqual(["cross-book-ranking-chapter", "cross-book-paragraph"]);
    expect(f[0].msg).toContain("ランキング章 3 のうち 2");
    expect(f[1].msg).toContain("1 件");
  });
});
