/**
 * カバーのタイポグラフィ・インク決定の不変量テスト。
 *
 * Kindle ストアの表紙は PC で 150×240px、スマホではさらに小さい。この寸法で読めるかは
 * 「主題を 1 行で最大級に置けているか」「背景画像と文字面を競合させないか」で決まる。
 * 2026-08-30 の売れ筋実画面と既存32冊を比較し、上58%を明るい文字面、下42%を画像面に
 * 分けた。どちらも見た目にしか出ないので、幅とピクセル位置をここで固定する。
 */
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { buildCoverPng, mainTitleSize, splitTitle } from "../cover";

/** 表紙の実寸 (cover.ts と同じ)。テスト内の期待値もこれを基準にする。 */
const W = 1600;
const PADDING_X = 110;
const USABLE_W = W - PADDING_X * 2; // 1380
const TRACKING_EM = 0.02;

/** 主題を 1 行で描いたときの実測幅 (日本語 1 文字 = 1em + 字間)。 */
function renderedWidth(main: string, fontSize: number): number {
  return main.length * fontSize * (1 + TRACKING_EM);
}

/** 単色の JPEG を作る (文字面と画像面の分離テスト用)。 */
async function solidJpeg(hex: string): Promise<Buffer> {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return sharp({
    create: { width: W, height: 2560, channels: 3, background: { r, g, b } },
  })
    .jpeg()
    .toBuffer();
}

describe("splitTitle — 書名を主題と続きに割る", () => {
  it("em ダッシュで割る", () => {
    expect(splitTitle("実質手取りの地図 — 住む県で変わる、暮らしのお金")).toEqual({
      main: "実質手取りの地図",
      rest: "住む県で変わる、暮らしのお金",
    });
  });

  it("en ダッシュ・全角コロン・半角コロンでも割る", () => {
    expect(splitTitle("主題 – 続き").rest).toBe("続き");
    expect(splitTitle("主題：続き").rest).toBe("続き");
    expect(splitTitle("主題: 続き").rest).toBe("続き");
  });

  it("区切りが無ければ全体が主題 (続きは付けない)", () => {
    const r = splitTitle("消費量日本一の食卓");
    expect(r.main).toBe("消費量日本一の食卓");
    expect(r.rest).toBeUndefined();
  });

  it("区切りが複数あっても最初で割る (主題を短く保つ)", () => {
    expect(splitTitle("A — B — C")).toEqual({ main: "A", rest: "B — C" });
  });

  it("★明示の区切りが無い長い書名は空白で割る (21 文字の塊を作らない)", () => {
    expect(splitTitle("データで見る47都道府県 教育・子育て")).toEqual({
      main: "データで見る47都道府県",
      rest: "教育・子育て",
    });
  });

  it("短い書名は空白があっても割らない (主題を大きく保てるため)", () => {
    expect(splitTitle("東京 対 大阪").rest).toBeUndefined();
  });

  it("明示の区切りが空白より優先される", () => {
    expect(splitTitle("データで見る47都道府県 — 教育編")).toEqual({
      main: "データで見る47都道府県",
      rest: "教育編",
    });
  });
});

describe("mainTitleSize — 主題が 1 行に収まる", () => {
  const CASES = ["実質手取りの地図", "消費量日本一の食卓", "人口減少と世帯の地図", "短い", "データで見る47都道府県"];

  it("★字間込みで横幅を超えない (超えると 2 行に割れる)", () => {
    for (const main of CASES) {
      const size = mainTitleSize(main);
      expect(renderedWidth(main, size)).toBeLessThanOrEqual(USABLE_W);
    }
  });

  it("★実在する全書籍の主題が 1 行に収まる (カタログとの結線)", async () => {
    const { KINDLE_BOOKS } = await import("../book-catalog");
    const wrapped = KINDLE_BOOKS.filter((b) => {
      const { main } = splitTitle(b.title);
      return renderedWidth(main, mainTitleSize(main)) > USABLE_W;
    });
    expect(wrapped.map((b) => b.id)).toEqual([]);
  });

  it("★字間を無視した旧計算は 8 文字で溢れる (回帰の証拠)", () => {
    const main = "実質手取りの地図"; // 8 文字
    const naive = Math.floor(USABLE_W / main.length); // 旧: 字間を数えない
    expect(renderedWidth(main, naive)).toBeGreaterThan(USABLE_W);
    // 現行は収まる
    expect(renderedWidth(main, mainTitleSize(main))).toBeLessThanOrEqual(USABLE_W);
  });

  it("短い主題でも上限 220px を超えない (1 行の見た目の上限)", () => {
    expect(mainTitleSize("短い")).toBeLessThanOrEqual(220);
  });

  it("長い主題でも下限 96px を下回らない (サムネイルで読める最小)", () => {
    // 下限に当たる長さでは 1 行に収まらず折り返す。可読性の床を優先する意図的な挙動。
    expect(mainTitleSize("非常に長い書名をここに入れて折り返しを試す")).toBe(96);
  });

  it("主題が長いほど小さくなる (単調)", () => {
    expect(mainTitleSize("あああ")).toBeGreaterThanOrEqual(mainTitleSize("あああああああああ"));
  });
});

describe("buildCoverPng — 明るい文字面と画像面を分離する", () => {
  it("上58%は明るい文字面、下42%は背景画像を維持する", async () => {
    const cover = await buildCoverPng({
      title: "実質手取りの地図 — 住む県で変わる、暮らしのお金",
      subtitle: "年収ランキングでは見えない47都道府県の家計",
      series: "S1-issues",
      author: "stats47",
      backgroundJpeg: await solidJpeg("#040a14"),
    });
    const image = sharp(cover);
    const top = await image.clone().extract({ left: 20, top: 20, width: 1, height: 1 }).raw().toBuffer();
    const bottom = await image.clone().extract({ left: 20, top: 2500, width: 1, height: 1 }).raw().toBuffer();

    expect([...top.slice(0, 3)]).toEqual([242, 246, 250]);
    expect(bottom[0]).toBeLessThan(15);
    expect(bottom[1]).toBeLessThan(20);
    expect(bottom[2]).toBeLessThan(30);
  });
});
