import { describe, expect, it } from "vitest";

import { checkSeoFacts, extractSeoClaims } from "../seo-meta-facts";

/**
 * 感度 (実際の欠陥で発火) と非感度 (正しい文で発火しない) を両方向で固定する。
 * 全 PASS は「ゲートが何も見ていない」状態と区別がつかない。
 */

const TRUTH = {
  year: "2014",
  top: { areaName: "福島県", value: 25226 },
  bottom: { areaName: "東京都", value: 956 },
};

describe("extractSeoClaims", () => {
  it("括弧つきの定型を拾う (公開 1,885 件が使う形)", () => {
    const c = extractSeoClaims(
      "2014年の耕地放棄面積の都道府県別ランキング。1位福島県（25,226ｈａ）、最下位東京都（956ｈａ）で26.4倍の格差。",
    );
    expect(c.ranks).toEqual([
      { role: "top", areaName: "福島県", value: 25226, raw: "1位福島県（25,226" },
      { role: "bottom", areaName: "東京都", value: 956, raw: "最下位東京都（956" },
    ]);
    expect(c.ratio).toBe(26.4);
    expect(c.years).toEqual([2014]);
  });

  it("括弧なしの curiosity gap 型も拾う (abortion-rate の実形)", () => {
    const c = extractSeoClaims("1位宮崎県8.2‰、最下位茨城県3.1‰。2020年データで比較します。");
    expect(c.ranks.map((r) => [r.role, r.areaName, r.value])).toEqual([
      ["top", "宮崎県", 8.2],
      ["bottom", "茨城県", 3.1],
    ]);
  });

  it("値を伴わない順位主張も県名だけ拾う", () => {
    const c = extractSeoClaims("1位は北海道、最下位は沖縄県です。");
    expect(c.ranks.map((r) => [r.areaName, r.value])).toEqual([
      ["北海道", null],
      ["沖縄県", null],
    ]);
  });

  it("読点や数字を県名に食い込ませない", () => {
    const c = extractSeoClaims("1位東京都、2位大阪府");
    expect(c.ranks).toHaveLength(1);
    expect(c.ranks[0].areaName).toBe("東京都");
  });

  it("主張が無ければ空 (何も取れないことを検出扱いにしない)", () => {
    const c = extractSeoClaims("都道府県別の分布を地図で比較します。");
    expect(c.ranks).toHaveLength(0);
    expect(c.ratio).toBeNull();
  });
});

describe("checkSeoFacts — 発火しないケース", () => {
  it("正しい定型は 1 件も出さない", () => {
    const claims = extractSeoClaims(
      "2014年の耕地放棄面積ランキング。1位福島県（25,226ｈａ）、最下位東京都（956ｈａ）で26.4倍の格差。",
    );
    expect(
      checkSeoFacts({
        claims,
        truth: TRUTH,
        declaredYears: new Set([2014]),
        dataYears: new Set(["2014"]),
      }),
    ).toEqual([]);
  });

  it("丸め表記の差は許容する (相対 2%)", () => {
    const claims = extractSeoClaims("1位福島県（25,200ｈａ）");
    expect(checkSeoFacts({ claims, truth: TRUTH })).toEqual([]);
  });

  it("県名の「県」有無で誤検知しない", () => {
    const claims = extractSeoClaims("1位は北海道です");
    expect(
      checkSeoFacts({
        claims,
        truth: { year: "2020", top: { areaName: "北海道", value: 10 }, bottom: { areaName: "東京都", value: 1 } },
      }),
    ).toEqual([]);
  });

  it("最小が 0 の指標では倍率を判定しない (∞ と突き合わせない)", () => {
    const claims = extractSeoClaims("1位福島県（25,226）で26.4倍");
    const findings = checkSeoFacts({
      claims,
      truth: { ...TRUTH, bottom: { areaName: "東京都", value: 0 } },
    });
    expect(findings.filter((f) => f.kind === "ratio-mismatch")).toEqual([]);
  });

  it("観測値を渡さなければ値・県は判定しない (fail-open)", () => {
    const claims = extractSeoClaims("1位福島県（99,999ｈａ）で999倍");
    expect(checkSeoFacts({ claims, truth: null })).toEqual([]);
  });
});

describe("checkSeoFacts — 発火するケース (すべて実際に見つかった欠陥)", () => {
  it("1 位の県を取り違えている (judo-therapist-rate の実形)", () => {
    const claims = extractSeoClaims("1位大阪府");
    const f = checkSeoFacts({
      claims,
      truth: { year: "2020", top: { areaName: "東京都", value: 123 }, bottom: { areaName: "鳥取県", value: 1 } },
    });
    expect(f).toHaveLength(1);
    expect(f[0].kind).toBe("rank-area-mismatch");
    expect(f[0].detail).toContain("東京都");
  });

  it("値が桁違い (department-supermarket-sales の実形)", () => {
    const claims = extractSeoClaims("1位東京都（298,102百万円）");
    const f = checkSeoFacts({
      claims,
      truth: { year: "2025", top: { areaName: "東京都", value: 137051 }, bottom: { areaName: "鳥取県", value: 4139 } },
    });
    expect(f.map((x) => x.kind)).toEqual(["rank-value-mismatch"]);
  });

  it("倍率が実データと合わない (high-school-...-job-opening-ratio の実形)", () => {
    const claims = extractSeoClaims("13.63倍の格差");
    const f = checkSeoFacts({
      claims,
      truth: { year: "2023", top: { areaName: "東京都", value: 6.6 }, bottom: { areaName: "沖縄県", value: 1 } },
    });
    expect(f.map((x) => x.kind)).toEqual(["ratio-mismatch"]);
  });

  it("宣言範囲外の年 (convenience-store-count-commercial の実形)", () => {
    const claims = extractSeoClaims("【2025年】");
    const f = checkSeoFacts({ claims, truth: null, declaredYears: new Set([2022, 2023, 2024]) });
    expect(f.map((x) => x.kind)).toEqual(["year-out-of-declared-range"]);
  });

  it("宣言範囲内だが観測値が無い年 (cook-annual-income の実形)", () => {
    const claims = extractSeoClaims("2023年の飲食物調理従事者の平均年収");
    const f = checkSeoFacts({
      claims,
      truth: null,
      declaredYears: new Set([2020, 2021, 2022, 2023]),
      dataYears: new Set(["2020", "2021", "2022"]),
    });
    expect(f.map((x) => x.kind)).toEqual(["year-not-in-data"]);
  });

  it("宣言範囲外の年を二重に報告しない", () => {
    const claims = extractSeoClaims("【2025年】");
    const f = checkSeoFacts({
      claims,
      truth: null,
      declaredYears: new Set([2024]),
      dataYears: new Set(["2024"]),
    });
    expect(f).toHaveLength(1);
  });

  it("県が違えば値は報告しない (1 つの誤りを 2 件に増やさない)", () => {
    const claims = extractSeoClaims("1位大阪府（999）");
    const f = checkSeoFacts({
      claims,
      truth: { year: "2020", top: { areaName: "東京都", value: 1 }, bottom: { areaName: "鳥取県", value: 1 } },
    });
    expect(f.map((x) => x.kind)).toEqual(["rank-area-mismatch"]);
  });
});

/**
 * 桁の接頭辞 (億 / 万 / 千) — `valueScale` で 円 に直した金額が巨大になり、
 * SEO 文字列に「5,090億円」と書けないと <title> が読めなくなるため 2026-08-17 に追加。
 * スケール表は自前で持たず `unit/unit-semantics.ts` の正典を呼ぶ。
 */
describe("桁の接頭辞", () => {
  const MONEY = {
    year: "2006",
    top: { areaName: "東京都", value: 509_046_000_000 },
    bottom: { areaName: "鳥取県", value: 8_960_000_000 },
  };

  it("億 を倍率として読む (書籍・雑誌小売業の実文面)", () => {
    const c = extractSeoClaims(
      "1位東京都（5,090億円）、最下位鳥取県（89.6億円）で56.8倍の格差。",
      "円",
    );
    expect(c.ranks.map((r) => r.value)).toEqual([509_000_000_000, 8_960_000_000]);
    expect(checkSeoFacts({ claims: c, truth: MONEY })).toEqual([]);
  });

  it("万 を倍率として読む (災害被害額の最下位)", () => {
    const c = extractSeoClaims("最下位東京都（2,800万円）", "円");
    expect(c.ranks[0].value).toBe(28_000_000);
  });

  it("接頭辞が付いていても誤った値なら発火する (感度)", () => {
    const c = extractSeoClaims("1位東京都（4,000億円）", "円");
    expect(checkSeoFacts({ claims: c, truth: MONEY }).map((f) => f.kind)).toEqual([
      "rank-value-mismatch",
    ]);
  });

  it("unit が 千円 なら「千」を単位の一部として扱い ×1000 しない", () => {
    // 2026-08-12 に地図照合が「13,326千円」を ×1000 して全県不一致にした事故と同型
    const c = extractSeoClaims("1位東京都（13,326千円）", "千円");
    expect(c.ranks[0].value).toBe(13_326);
  });

  it("unit が 円 なら「千」はスケール接頭辞として ×1000 する", () => {
    const c = extractSeoClaims("1位東京都（13,326千円）", "円");
    expect(c.ranks[0].value).toBe(13_326_000);
  });

  it("接頭辞が無い従来の文面は挙動が変わらない", () => {
    const c = extractSeoClaims("1位福島県（25,226ｈａ）、最下位東京都（956ｈａ）", "ha");
    expect(c.ranks.map((r) => r.value)).toEqual([25226, 956]);
    expect(checkSeoFacts({ claims: c, truth: TRUTH })).toEqual([]);
  });

  it("倍率には接頭辞を読まない (無次元量)", () => {
    expect(extractSeoClaims("56.8倍の格差", "円").ratio).toBe(56.8);
  });
});
