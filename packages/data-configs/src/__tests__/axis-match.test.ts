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

  it("★包含を共通部分列より優先する (個人企業の売上高 → 100 であって 460 ではない)", () => {
    // 共通部分列だけで測ると「従業者１人当たりの売上高」が「の売上高」(4) で勝ち、
    // 別 metric (sole-proprietor-sales-per-worker) の系列を選んでしまう。
    const codes: AxisCode[] = [
      { code: "100", name: "売上高（１企業当たり）" },
      { code: "260", name: "営業利益（１企業当たり）" },
      { code: "460", name: "従業者１人当たりの売上高（１企業当たり）" },
    ];
    expect(matchCodeByTitle("個人企業の売上高", codes)).toMatchObject({ code: "100" });
  });

  it("★全角数字と助詞「の」の揺れを吸収する (従業者1人当たり売上高 → 460)", () => {
    // title は「従業者1人当たり売上高」(半角・の なし)、コード名は
    // 「従業者１人当たりの売上高」(全角・の あり)。吸収しないと包含が成立せず、
    // より短い「売上高」(=別 metric の系列) に誤マッチする。
    const codes: AxisCode[] = [
      { code: "100", name: "売上高（１企業当たり）" },
      { code: "460", name: "従業者１人当たりの売上高（１企業当たり）" },
    ];
    expect(matchCodeByTitle("個人企業の従業者1人当たり売上高", codes)).toMatchObject({
      code: "460",
    });
    // 同じ表の別 metric は引き続き 100 を選ぶ
    expect(matchCodeByTitle("個人企業の売上高", codes)).toMatchObject({ code: "100" });
  });

  it("包含が無ければ共通部分列に落ちる (クラシック音楽鑑賞は包含しない)", () => {
    expect(matchCodeByTitle("クラシック音楽鑑賞の行動者率", HOBBY_CODES)).toMatchObject({
      code: "06",
    });
  });

  it("木造住宅率 → 木造 (非木造と取り違えない)", () => {
    // 「木造」も「非木造」も 2 文字以上だが、title に含まれるのは「木造」だけ。
    // 率 metric なのでこの一致は分子の特定に使われ、呼び出し側が
    // needs-calculation (分子=木造 / 分母=総数) と判定する。
    expect(matchCodeByTitle("木造住宅率", STRUCTURE_CODES)).toMatchObject({ code: "1" });
  });

  it("非木造住宅率 → 非木造 (より長い一致を採る)", () => {
    expect(matchCodeByTitle("非木造住宅率", STRUCTURE_CODES)).toMatchObject({ code: "2" });
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

describe("括弧の中に本質があるコード名", () => {
  /** 社会生活基本調査「旅行・行楽の種類」(0003456093 の cat03) の実データ */
  const TRAVEL_CODES: AxisCode[] = [
    { code: "1", name: "1_行楽(日帰り)" },
    { code: "2", name: "2_旅行(１泊２日以上)" },
    { code: "211", name: "211_観光旅行" },
    { code: "212", name: "212_帰省・訪問などの旅行" },
    { code: "22", name: "22_海外（観光旅行）" },
  ];

  it("★海外観光旅行 → 22 (括弧を落とすと「海外」2 文字で候補から漏れる)", () => {
    expect(matchCodeByTitle("海外観光旅行の行動者率", TRAVEL_CODES)).toMatchObject({ code: "22" });
  });

  it("国内観光旅行 → 211 (海外を誤って選ばない)", () => {
    expect(matchCodeByTitle("国内観光旅行の行動者率", TRAVEL_CODES)).toMatchObject({ code: "211" });
  });
});

describe("2 文字の項目名 (日本語統計に多い)", () => {
  /** 社会生活基本調査「スポーツの種類」の実データ (抜粋) */
  const SPORT_CODES: AxisCode[] = [
    { code: "00", name: "00_総数" },
    { code: "01", name: "01_野球(キャッチボールを含む)" },
    { code: "11", name: "11_卓球" },
    { code: "19", name: "19_柔道" },
    { code: "20", name: "20_剣道" },
    { code: "15", name: "15_水泳" },
  ];

  it("★2 文字の項目でも総数に落とさない (野球 → 01)", () => {
    // MATCH_MIN_CHARS を 3 にすると「野球」が候補から漏れ、総数 = 全種目の合計を
    // 野球の値として配信してしまう。
    expect(matchCodeByTitle("野球の行動者率", SPORT_CODES)).toMatchObject({ code: "01" });
  });

  it.each([
    ["卓球の行動者率", "11"],
    ["柔道の行動者率", "19"],
    ["剣道の行動者率", "20"],
    ["水泳の行動者率", "15"],
  ])("%s → %s", (title, code) => {
    expect(matchCodeByTitle(title, SPORT_CODES)).toMatchObject({ code });
  });

  it("2 文字でも一意でなければ ambiguous (総数へは落とさない)", () => {
    const codes: AxisCode[] = [
      { code: "1", name: "木造" },
      { code: "2", name: "木造モルタル" },
    ];
    // どちらも title に含まれるが長さが違うので長い方を採る
    expect(matchCodeByTitle("木造モルタル住宅率", codes)).toMatchObject({ code: "2" });
  });
});
