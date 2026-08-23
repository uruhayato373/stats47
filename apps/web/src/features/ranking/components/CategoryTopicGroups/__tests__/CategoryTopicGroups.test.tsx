import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CategoryTopicGroups } from "../CategoryTopicGroups";

import type { CategoryTopicListItem } from "../types";

/**
 * カテゴリ内グループ一覧の契約。
 *
 * 平坦な 110 行テーブルの置き換えなので、(1) どの行も落とさない
 * (2) 同名タイトルを畳んで区別できるようにする、の 2 点が本質。
 */

const item = (
  rankingKey: string,
  title: string,
  topicKey: string | null,
  subtitle: string | null = null,
  top1: { areaName: string; value: string | null } | null = null,
  readerLabel?: string,
): CategoryTopicListItem => ({
  rankingKey,
  title,
  readerLabel,
  subtitle,
  unit: "％",
  topicKey,
  top1,
});

const TOPICS = [
  { key: "income", label: "職業別の平均年収" },
  { key: "time", label: "生活時間" },
  { key: "other", label: "その他" },
];

function markup(items: CategoryTopicListItem[], topics = TOPICS) {
  return renderToStaticMarkup(
    <CategoryTopicGroups topics={topics} items={items} />,
  );
}

function linkCount(html: string, key: string): number {
  return [...html.matchAll(new RegExp(`href="/ranking/${key}"`, "g"))].length;
}

describe("CategoryTopicGroups", () => {
  it("マニフェスト順にカードを並べる", () => {
    const html = markup([
      item("a", "デザイナーの平均年収", "income"),
      item("b", "睡眠の平均時間", "time"),
      item("c", "労働費", "other"),
    ]);
    const order = ["職業別の平均年収", "生活時間", "その他"].map((label) =>
      html.indexOf(label),
    );
    expect(order).toEqual([...order].sort((x, y) => x - y));
    expect(order[0]).toBeGreaterThan(-1);
  });

  it("同名タイトルを 1 行に畳み、subtitle を並列リンクで出す", () => {
    const html = markup([
      item("t1", "趣味・娯楽の平均時間", "time", "男性・有業者"),
      item("t2", "趣味・娯楽の平均時間", "time", "女性・有業者"),
      item("t3", "趣味・娯楽の平均時間", "time", "男性・非有業者"),
      item("t4", "趣味・娯楽の平均時間", "time", "女性・非有業者"),
    ]);
    // タイトルは 1 回だけ、内訳は 4 リンクすべて残る
    expect([...html.matchAll(/趣味・娯楽の平均時間/g)]).toHaveLength(1);
    for (const key of ["t1", "t2", "t3", "t4"]) {
      expect(linkCount(html, key), key).toBe(1);
    }
    expect(html).toContain("男性・有業者");
    expect(html).toContain("女性・非有業者");
    // 畳んだ行の件数バッジは畳み後の 1
    expect(html).toContain(">1<");
  });

  it("正準名で同名判定しつつ、表示には読者向けラベルを使う", () => {
    const html = markup([
      item(
        "diy",
        "日曜大工の行動者率",
        "other",
        null,
        null,
        "日曜大工をした人の割合",
      ),
    ]);
    expect(html).toContain("日曜大工をした人の割合");
    expect(html).not.toContain("日曜大工の行動者率");
  });

  it("subtitle が無い畳み行は「総数」と表示する", () => {
    const html = markup([
      item("x1", "同名指標", "time", null),
      item("x2", "同名指標", "time", "男性"),
    ]);
    expect(html).toContain("総数");
  });

  it("6 件以上は details に入れるが、リンクは 1 件も落とさない", () => {
    const items = Array.from({ length: 9 }, (_, i) =>
      item(`k${i}`, `指標 ${i}`, "income"),
    );
    const html = markup(items);
    expect(html).toContain("<details");
    expect(html).toContain("すべて見る（残り 4 件）");
    for (let i = 0; i < 9; i++) {
      expect(linkCount(html, `k${i}`), `k${i}`).toBe(1);
    }
  });

  it("検索 input を作らない (CategoryRankingListClient の契約と揃える)", () => {
    const html = markup([item("a", "指標", "income")]);
    expect(html).not.toContain("<input");
  });

  it("該当 0 件の topic はカードを作らない", () => {
    const html = markup([item("a", "指標", "income")]);
    expect(html).toContain("職業別の平均年収");
    expect(html).not.toContain("生活時間");
  });

  it("topicKey を持たない item は描かない (旧 snapshot 混在時)", () => {
    const html = markup([item("a", "分類済み", "income"), item("b", "未分類", null)]);
    expect(html).toContain("分類済み");
    expect(linkCount(html, "b")).toBe(0);
  });

  it("1 件も描けなければ null を返す (呼び元がフォールバックできる)", () => {
    expect(markup([item("a", "指標", null)])).toBe("");
    expect(markup([], [])).toBe("");
  });

  it("1 位が無い行でも落とさない", () => {
    const html = markup([item("a", "指標", "income", null, null)]);
    expect(linkCount(html, "a")).toBe(1);
  });

  it("1 位があれば県名と値+単位を出す", () => {
    const html = markup([
      item("a", "指標", "income", null, { areaName: "福井県", value: "1.94" }),
    ]);
    expect(html).toContain("福井県");
    expect(html).toContain("1.94");
  });
});
