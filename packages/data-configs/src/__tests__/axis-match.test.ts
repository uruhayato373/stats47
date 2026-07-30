import { describe, expect, it } from "vitest";

import {
  isTotalName,
  matchCodeByTitle,
  normalizeCodeName,
  tabProvidesRate,
  type AxisCode,
} from "../axis-match";

/** 社会生活基本調査「趣味・娯楽の種類」(0003456573 の cat03) の実データ */
const HOBBY_CODES: AxisCode[] = [
  { code: "00", name: "00_総数" },
  { code: "01", name: "01_スポーツ観覧・観戦(テレビ・スマートフォン・パソコンなどは除く)" },
  { code: "02", name: "02_美術鑑賞(テレビ・スマートフォン・パソコンなどは除く)" },
  { code: "03", name: "03_演芸・演劇・舞踊鑑賞(テレビ・スマートフォン・パソコンなどは除く)" },
  { code: "04", name: "04_映画館での映画鑑賞" },
  { code: "06", name: "06_コンサートなどによるクラシック音楽鑑賞" },
  { code: "07", name: "07_コンサートなどによるポピュラー音楽・歌謡曲鑑賞" },
];

/** 住宅・土地統計調査「建物の構造」(0004015760 の cat03) の実データ */
const STRUCTURE_CODES: AxisCode[] = [
  { code: "0", name: "総数" },
  { code: "1", name: "木造" },
  { code: "2", name: "非木造" },
  { code: "201", name: "鉄筋・鉄骨コンクリート造" },
];

describe("normalizeCodeName", () => {
  it("先頭連番と括弧書きを落とす", () => {
    expect(normalizeCodeName("02_美術鑑賞(テレビ・スマートフォン・パソコンなどは除く)")).toBe(
      "美術鑑賞",
    );
  });
});

describe("isTotalName", () => {
  it.each(["総数", "00_総数", "全体", "合計"])("%s を総数と判定する", (n) => {
    expect(isTotalName(n)).toBe(true);
  });

  it("メンバー名は総数ではない", () => {
    expect(isTotalName("木造")).toBe(false);
  });
});

describe("matchCodeByTitle — ★総数に落とさないための回帰", () => {
  it("美術鑑賞の行動者率 → 02 (総数ではない)", () => {
    const m = matchCodeByTitle("美術鑑賞の行動者率", HOBBY_CODES);
    expect(m).toMatchObject({ code: "02" });
  });

  it("★コード名が title より詳しくても一致する (クラシック音楽鑑賞 → 06)", () => {
    // 包含判定では「コンサートなどによるクラシック音楽鑑賞」⊄「クラシック音楽鑑賞の行動者率」
    // となり一致しない。これを総数に落とすと全趣味の合計を配信してしまう。
    const m = matchCodeByTitle("クラシック音楽鑑賞の行動者率", HOBBY_CODES);
    expect(m).toMatchObject({ code: "06" });
  });

  it("似た系列を取り違えない (ポピュラー音楽鑑賞 → 07)", () => {
    const m = matchCodeByTitle("ポピュラー音楽鑑賞の行動者率", HOBBY_CODES);
    expect(m).toMatchObject({ code: "07" });
  });

  it("スポーツ観覧の行動者率 → 01", () => {
    expect(matchCodeByTitle("スポーツ観覧の行動者率", HOBBY_CODES)).toMatchObject({ code: "01" });
  });

  it("総数コードは候補に入れない", () => {
    const m = matchCodeByTitle("趣味・娯楽の総数", HOBBY_CODES);
    expect(m === null || m === "ambiguous" || m.code !== "00").toBe(true);
  });

  it("一致がなければ null (勝手に総数を返さない)", () => {
    expect(matchCodeByTitle("完全に無関係な指標名", HOBBY_CODES)).toBeNull();
  });

  it("最大が並んだら ambiguous (自動提案しない)", () => {
    const codes: AxisCode[] = [
      { code: "1", name: "小学校教員数" },
      { code: "2", name: "中学校教員数" },
    ];
    expect(matchCodeByTitle("学校教員数", codes)).toBe("ambiguous");
  });

  it("2 文字の部分語では一致させない (木造 / 非木造 の取り違え防止)", () => {
    // 「木造」は 2 文字なので MATCH_MIN_CHARS 未満。非木造との判別がつかないまま
    // 提案するより、一致なしとして人に判断させる。
    expect(matchCodeByTitle("木造住宅率", STRUCTURE_CODES)).toBeNull();
  });
});

describe("tabProvidesRate", () => {
  it("tab が 1 つで単位が ％ なら率の表", () => {
    expect(tabProvidesRate([{ code: "x", name: "行動者率", unit: "％" }])).toBe(true);
  });

  it("pin 済み tab の単位で判定する", () => {
    const codes: AxisCode[] = [
      { code: "01", name: "実数", unit: "人" },
      { code: "02", name: "割合", unit: "%" },
    ];
    expect(tabProvidesRate(codes, "02")).toBe(true);
    expect(tabProvidesRate(codes, "01")).toBe(false);
  });

  it("tab が未指定で複数あるなら判定しない (tab 自体が絞り忘れ)", () => {
    const codes: AxisCode[] = [
      { code: "01", name: "実数", unit: "人" },
      { code: "02", name: "割合", unit: "%" },
    ];
    expect(tabProvidesRate(codes)).toBe(false);
  });

  it("単位が無ければ率ではない", () => {
    expect(tabProvidesRate([{ code: "x", name: "数値", unit: null }])).toBe(false);
  });
});
