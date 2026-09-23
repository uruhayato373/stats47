import { describe, expect, it } from "vitest";

import { getContrastRatio, MIN_CONTRAST_LARGE_TEXT, MIN_CONTRAST_SMALL_TEXT } from "../contrast";
import { IG_CARD, IG_SERIES, IG_SERIES_IDS } from "../tokens";

describe("getContrastRatio", () => {
  it("白黒は最大コントラスト 21:1 になる", () => {
    expect(getContrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 0);
  });

  it("同色は 1:1 になる", () => {
    expect(getContrastRatio("#FFD21F", "#FFD21F")).toBeCloseTo(1, 5);
  });

  it("前景・背景の順序を入れ替えても同じ値になる", () => {
    expect(getContrastRatio("#2F5BFF", "#FFFFFF")).toBeCloseTo(
      getContrastRatio("#FFFFFF", "#2F5BFF"),
      10,
    );
  });
});

describe("IG_SERIES パレットのコントラスト（32px 未満 >=4.5:1 / 32px 以上 >=3:1）", () => {
  for (const id of IG_SERIES_IDS) {
    const palette = IG_SERIES[id];

    it(`${id}: ink（地色に直接載る見出し等・32px以上）は地色との contrast >= ${MIN_CONTRAST_LARGE_TEXT}:1`, () => {
      expect(getContrastRatio(palette.bg, palette.ink)).toBeGreaterThanOrEqual(
        MIN_CONTRAST_LARGE_TEXT,
      );
    });

    it(`${id}: inkSmall（地色に直接載るフッター等・32px未満）は地色との contrast >= ${MIN_CONTRAST_SMALL_TEXT}:1`, () => {
      expect(getContrastRatio(palette.bg, palette.inkSmall)).toBeGreaterThanOrEqual(
        MIN_CONTRAST_SMALL_TEXT,
      );
    });

    it(`${id}: accent（白カード上の強調色）は白背景との contrast >= ${MIN_CONTRAST_SMALL_TEXT}:1`, () => {
      expect(getContrastRatio(IG_CARD.background, palette.accent)).toBeGreaterThanOrEqual(
        MIN_CONTRAST_SMALL_TEXT,
      );
    });
  }

  it("カードの地色 (#111 on white) は最小要件を大きく上回る（回帰確認）", () => {
    expect(getContrastRatio(IG_CARD.background, IG_CARD.ink)).toBeGreaterThanOrEqual(
      MIN_CONTRAST_SMALL_TEXT,
    );
  });

  it("低コントラストな値を入れると検知できる（このテスト自体がガードであることの確認）", () => {
    // 例: 黄地に白文字（quiz.bg に対して #FFFFFF）は 4.5:1 は疎か 3:1 も満たさない
    expect(getContrastRatio(IG_SERIES.quiz.bg, "#FFFFFF")).toBeLessThan(MIN_CONTRAST_LARGE_TEXT);
  });
});
