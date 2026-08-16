/**
 * 「県 + 値」照合の対照テスト。
 *
 * ★値だけの照合が誤一致することは実測で確認済み (2026-08-12):
 *   545,000 → 静岡県 552,182 / 176,000 → 東京都の**家賃** 175,694 に当たってしまう。
 * 県を伴う照合ならこれらは mismatch になる。その差をここで固定する。
 */
import { describe, expect, it } from "vitest";
import {
  extractFactClaims,
  normalizePrefName,
  unitScale,
  verifyClaim,
  type TruthSeries,
} from "../fact-claims";

const series = (
  metric: string,
  year: string,
  values: Record<string, number>,
  ranks: Record<string, number> = {},
): TruthSeries => ({
  metric,
  year,
  byPref: new Map(Object.entries(values)),
  rankByPref: new Map(Object.entries(ranks)),
});

/** 書籍が実際に扱う 2 指標の 2024 年 (実データ)。 */
const TRUTH: TruthSeries[] = [
  series(
    "disposable-income-after-rent",
    "2024",
    { 東京: 623_317, 山形: 564_741, 沖縄: 402_541, 静岡: 552_182 },
    { 東京: 1, 山形: 9, 沖縄: 47, 静岡: 12 },
  ),
  series("private-rent-consumption-expenditure", "2024", {
    東京: 175_694,
    山形: 21_311,
    沖縄: 256_598,
  }),
];

describe("normalizePrefName", () => {
  it("接尾辞を落として正規化する", () => {
    expect(normalizePrefName("東京都")).toBe("東京");
    expect(normalizePrefName("北海道")).toBe("北海道");
    expect(normalizePrefName("大阪府")).toBe("大阪");
    expect(normalizePrefName("山形県")).toBe("山形");
  });

  it("県名でなければ null", () => {
    expect(normalizePrefName("関東")).toBeNull();
    expect(normalizePrefName("")).toBeNull();
  });
});

describe("extractFactClaims — 県の直後の数値だけを採る", () => {
  it("県 + 値を取り出す", () => {
    const c = extractFactClaims("東京都は623,317円で全国1位、山形県は564,741円です。");
    expect(c.map((x) => [x.pref, x.value, x.unit])).toEqual([
      ["東京", 623_317, "円"],
      ["東京", 1, "位"],
      ["山形", 564_741, "円"],
    ]);
  });

  it("県名が無い行からは何も採らない", () => {
    expect(extractFactClaims("全国平均は500,000円です。")).toEqual([]);
  });

  it("★県名から離れすぎた数値は採らない (係り受けが不明なため)", () => {
    const far = "東京都について長々と説明する文がここに続き、さらに別の話題へ移ったあとで 999,999円";
    expect(extractFactClaims(far)).toEqual([]);
  });

  it("直前の県に紐づける (複数県が並ぶ行)", () => {
    const c = extractFactClaims("東京都は623,317円、沖縄県は402,541円。");
    expect(c.map((x) => x.pref)).toEqual(["東京", "沖縄"]);
  });
});

describe("verifyClaim — 県つき照合", () => {
  it("正しい主張は match", () => {
    const [c] = extractFactClaims("東京都は623,317円です。");
    expect(verifyClaim(c, TRUTH).kind).toBe("match");
  });

  it("順位も突合する", () => {
    const c = extractFactClaims("東京都は1位です。").find((x) => x.unit === "位")!;
    expect(verifyClaim(c, TRUTH).kind).toBe("match");
  });

  it("★誤った順位は mismatch (山形が1位という旧主張)", () => {
    const c = extractFactClaims("山形県は1位に立ち").find((x) => x.unit === "位")!;
    const v = verifyClaim(c, TRUTH);
    expect(v.kind).toBe("mismatch");
    if (v.kind === "mismatch") expect(v.nearest?.actual).toBe(9);
  });

  it("★値だけなら誤一致する数字が、県つきなら mismatch になる", () => {
    // 545,000 は静岡 552,182 に 2% 以内 → 値だけの照合なら通ってしまう
    const [c] = extractFactClaims("山形県は月額545,000円で");
    const v = verifyClaim(c, TRUTH);
    expect(v.kind).toBe("mismatch");
    if (v.kind === "mismatch") expect(v.nearest?.actual).toBe(564_741);
  });

  it("★家賃と可処分所得の取り違えも県つきなら防げる", () => {
    // 176,000 は東京の家賃 175,694 と一致するので、家賃の話なら match
    const [c] = extractFactClaims("東京都の家賃は月176,000円と");
    expect(verifyClaim(c, TRUTH).kind).toBe("match");
  });

  it("丸め (相対 2% 以内) は許容する", () => {
    const [c] = extractFactClaims("東京都は623,000円です。");
    expect(verifyClaim(c, TRUTH).kind).toBe("match");
  });

  it("SSOT に無い県は unknown-pref (誤検出にしない)", () => {
    const [c] = extractFactClaims("青森県は100,000円です。");
    expect(verifyClaim(c, TRUTH).kind).toBe("unknown-pref");
  });

  it("mismatch には最も近い実測値を添える (是正に使う)", () => {
    const [c] = extractFactClaims("沖縄県は300,000円です。");
    const v = verifyClaim(c, TRUTH);
    expect(v.kind).toBe("mismatch");
    if (v.kind === "mismatch") {
      expect(v.nearest?.actual).toBe(256_598);
      expect(v.nearest?.metric).toBe("private-rent-consumption-expenditure");
    }
  });
});

describe("extractFactClaims — 実データで見つかった誤検出の再発防止", () => {
  it("★「N位は<県>」の語順で後方の県に紐づける (最も多い言い回し)", () => {
    const c = extractFactClaims("1位は大分県の308.8GJ、2位は山口県の276.9GJ、3位は岡山県です。");
    const ranks = c.filter((x) => x.unit === "位");
    expect(ranks.map((x) => [x.value, x.pref])).toEqual([
      [1, "大分"],
      [2, "山口"],
      [3, "岡山"],
    ]);
  });

  it("★倍率は県の値ではないので採らない (比較の表現)", () => {
    const c = extractFactClaims("1位の千葉県とはおよそ330倍もの開きがあります。");
    expect(c.filter((x) => x.unit === "倍")).toEqual([]);
  });

  it("★負値を落とさない (地価変動率など)", () => {
    const c = extractFactClaims("最も低いのは徳島県(-1.4%)で");
    expect(c[0]?.value).toBe(-1.4);
  });

  it("前後どちらにも県がある場合は後方 (助詞で直結する方) を優先する", () => {
    const c = extractFactClaims("沖縄県は低い。1位は大分県です。");
    const rank = c.find((x) => x.unit === "位");
    expect(rank?.pref).toBe("大分");
  });
});

describe("unitScale — SSOT と本文の単位を揃える", () => {
  it("★千円で持つ SSOT を円の主張と比べられる (揃えないと 1000 倍ずれる)", () => {
    const truth: TruthSeries[] = [
      { metric: "per-capita-prefectural-income-h27", year: "2020",
        byPref: new Map([["東京", 5204]]), rankByPref: new Map([["東京", 1]]), unit: "千円" },
    ];
    const [c] = extractFactClaims("東京都は5,214,000円で");
    expect(verifyClaim(c, truth).kind).toBe("match");
  });

  it("百万円・万円・億円も揃える", () => {
    expect(unitScale("百万円", "円")).toBe(1_000_000);
    expect(unitScale("万円", "円")).toBe(10_000);
    expect(unitScale("億円", "円")).toBe(100_000_000);
  });

  it("％ の全角半角ゆれを吸収する", () => {
    expect(unitScale("%", "％")).toBe(1);
    expect(unitScale("％", "%")).toBe(1);
  });

  it("★揃えられない単位の組は比較しない (人 と 円 を突き合わせない)", () => {
    expect(unitScale("人", "円")).toBeNull();
    const truth: TruthSeries[] = [
      { metric: "population", year: "2024", byPref: new Map([["東京", 14000000]]),
        rankByPref: new Map(), unit: "人" },
    ];
    const [c] = extractFactClaims("東京都は14,000,000円で");
    expect(verifyClaim(c, truth).kind).toBe("unknown-pref");
  });
});

describe("extractFactClaims — ★分母つき単位・符号・語彙的用法 (2026-08-12 実測の誤検出)", () => {
  // 36 件の「不一致」がすべて監査側の誤検出だった。原稿は正しかった。
  const UNITS = ["人口千対", "人泊", "千円", "‰", "人"];

  it("分母が数値の後ろに付く形を切り詰めない", () => {
    const [c] = extractFactClaims("秋田県は通院者率が496人口千対で全国1位です。", UNITS);
    expect(c.unit).toBe("人口千対");
    expect(c.value).toBe(496);
  });

  it("「人泊」を「人」に切り詰めない", () => {
    // 先頭の主張は「1位」なので、値で目的の主張を選ぶ
    const c = extractFactClaims("1位の東京都は47,432,720人泊です。", UNITS).find((x) => x.value === 47432720);
    expect(c?.unit).toBe("人泊");
  });

  it("分母が数値の前にある語順は**候補として足す** (単位は置き換えない)", () => {
    // ★置き換えてはならない。分母をタイトル側に持つ指標
    //   (「歯科技工士率（人口10万対）」/ unit="人") と単位が揃わなくなる (2026-08-12 実測)。
    const [c] = extractFactClaims("東京都が人口千人あたり5.36人です。", UNITS);
    expect(c.unit).toBe("人");
    expect(c.altUnits).toContain("人口千対");
  });

  it("同じ文の前半にある分母を候補として引き継ぐ", () => {
    const cs = extractFactClaims("沖縄県が人口千人あたり8.55人、秋田県は3.95人です。", UNITS);
    const akita = cs.find((c) => c.pref === "秋田");
    expect(akita?.altUnits).toContain("人口千対");
  });

  it("「マイナス18.7‰」を負値として読む", () => {
    const [c] = extractFactClaims("秋田県はマイナス18.7‰です。", UNITS);
    expect(c.value).toBe(-18.7);
  });

  it("「4,687人の転出超過」は負値の候補を持つ", () => {
    const [c] = extractFactClaims("福島県は4,687人の転出超過となっています。", UNITS);
    expect(c.altValues).toContain(-4687);
  });

  it("★全国平均は県の主張として拾わない", () => {
    // 「…沖縄の県が下位に並びます。全国平均は328千円で」の 328 が沖縄県の値にされていた
    const cs = extractFactClaims("東北・九州・沖縄の県が下位です。全国平均は328千円で。", UNITS);
    expect(cs.some((c) => c.value === 328)).toBe(false);
  });

  it("★概数・語彙的用法は数値の主張として拾わない", () => {
    expect(extractFactClaims("秋田県は支える側1人あたり1人近くを支えています。", UNITS)).toEqual([]);
  });

  it("★通常の主張は従来どおり拾う (緩めすぎていないこと)", () => {
    const [c] = extractFactClaims("東京都は623,317円です。", UNITS);
    expect(c).toMatchObject({ pref: "東京", value: 623317, unit: "円" });
  });
});
