/**
 * カバーのタイポグラフィ・インク決定の不変量テスト。
 *
 * Kindle ストアの表紙は PC で 150×240px、スマホではさらに小さい。この寸法で読めるかは
 * 「主題を 1 行で最大級に置けているか」で決まる。2026-08-12 の実測では
 * ①字間を幅計算に入れておらず 8 文字で 3% 溢れて 2 行に割れた
 * ②白固定インクだったため明るい背景で主題がほぼ読めなかった
 * の 2 つが起きた。どちらも見た目にしか出ないので、ここで数値として固定する。
 */
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { mainTitleSize, resolveInk, splitTitle } from "../cover";

/** 表紙の実寸 (cover.ts と同じ)。テスト内の期待値もこれを基準にする。 */
const W = 1600;
const PADDING_X = 110;
const USABLE_W = W - PADDING_X * 2; // 1380
const TRACKING_EM = 0.02;

/** 主題を 1 行で描いたときの実測幅 (日本語 1 文字 = 1em + 字間)。 */
function renderedWidth(main: string, fontSize: number): number {
  return main.length * fontSize * (1 + TRACKING_EM);
}

/** 単色の JPEG を作る (resolveInk の入力用)。 */
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

describe("resolveInk — 背景の明るさでインクを決める", () => {
  it("★明るい背景では濃いインクにする (白固定だと主題が消える)", async () => {
    const ink = await resolveInk(await solidJpeg("#f3ece0"), "#7fc4ff");
    expect(ink.main).toBe("#0d1f3c");
    expect(ink.main).not.toBe("#ffffff");
  });

  it("暗い背景では白インクにする", async () => {
    const ink = await resolveInk(await solidJpeg("#040a14"), "#7fc4ff");
    expect(ink.main).toBe("#ffffff");
  });

  it("背景が無ければ白インク (シリーズ基調色の無地)", async () => {
    const ink = await resolveInk(undefined, "#7fc4ff");
    expect(ink.main).toBe("#ffffff");
    expect(ink.sub).toBe("#7fc4ff");
  });

  it("壊れた画像でも落ちず暗背景の既定にフォールバックする", async () => {
    const ink = await resolveInk(Buffer.from("not-an-image"), "#7fc4ff");
    expect(ink.main).toBe("#ffffff");
  });

  it("判定は上部だけを見る (タイトルはそこにしか置かない)", async () => {
    // 上 45% が明るく、下が真っ黒な背景 → 明るい判定になるべき
    const top = await sharp({
      create: { width: W, height: Math.round(2560 * 0.45), channels: 3, background: "#f5f0e6" },
    })
      .png()
      .toBuffer();
    const bg = await sharp({
      create: { width: W, height: 2560, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .composite([{ input: top, top: 0, left: 0 }])
      .jpeg()
      .toBuffer();
    const ink = await resolveInk(bg, "#7fc4ff");
    expect(ink.main).toBe("#0d1f3c");
  });
});
