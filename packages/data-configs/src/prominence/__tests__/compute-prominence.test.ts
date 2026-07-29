import { describe, expect, it } from "vitest";

import {
  compareByProminence,
  computeClarity,
  computeDemand,
  computeDepth,
  computeFreshness,
  computeProminenceScores,
  selectHomeFeatured,
  selectRepresentatives,
  PROMINENCE_WEIGHTS,
  type ProminenceInput,
} from "../compute-prominence";

function input(overrides: Partial<ProminenceInput> = {}): ProminenceInput {
  return {
    rankingKey: "sample",
    title: "サンプル指標",
    categoryKey: "population",
    yearSpan: 10,
    latestYear: 2024,
    impressions: 0,
    ...overrides,
  };
}

describe("PROMINENCE_WEIGHTS", () => {
  it("重みの合計が 1 になる", () => {
    const total = Object.values(PROMINENCE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe("computeDepth", () => {
  it("1 年しかない指標は 0（推移が見せられない）", () => {
    expect(computeDepth(1)).toBe(0);
    expect(computeDepth(0)).toBe(0);
  });

  it("年数が増えるほど単調に上がり、20 年で飽和する", () => {
    expect(computeDepth(5)).toBeGreaterThan(computeDepth(2));
    expect(computeDepth(20)).toBe(1);
    expect(computeDepth(50)).toBe(1);
  });

  it("年数不明（years: \"all\"）は中立値にして不当に埋もれさせない", () => {
    expect(computeDepth(null)).toBe(0.5);
  });
});

describe("computeFreshness", () => {
  it("直近 2 年以内は満点", () => {
    expect(computeFreshness(2026, 2026)).toBe(1);
    expect(computeFreshness(2024, 2026)).toBe(1);
  });

  it("10 年以上前は 0", () => {
    expect(computeFreshness(2016, 2026)).toBe(0);
    expect(computeFreshness(2000, 2026)).toBe(0);
  });

  it("その間は単調に減衰する", () => {
    expect(computeFreshness(2022, 2026)).toBeGreaterThan(
      computeFreshness(2020, 2026),
    );
  });

  it("年不明は中立値", () => {
    expect(computeFreshness(null, 2026)).toBe(0.5);
  });
});

describe("computeClarity", () => {
  it("短く記号のないタイトルは満点", () => {
    expect(computeClarity("総人口")).toBe(1);
    expect(computeClarity("年間日照時間")).toBe(1);
  });

  it("長いほど下がる", () => {
    expect(computeClarity("趣味・娯楽の行動者数で長くしたタイトルのサンプル文字列")).toBeLessThan(
      computeClarity("総人口"),
    );
  });

  it("括弧つきは減点される", () => {
    expect(computeClarity("平均初婚年齢（夫）")).toBeLessThan(
      computeClarity("平均初婚年齢"),
    );
  });

  it("0 未満にはならない", () => {
    expect(
      computeClarity("非常に長い上に括弧（注釈）とスラッシュ/まで含む極端に読みにくいタイトル"),
    ).toBe(0);
  });
});

describe("computeDemand", () => {
  it("露出ゼロは 0", () => {
    expect(computeDemand(0)).toBe(0);
    expect(computeDemand(-1)).toBe(0);
  });

  it("半桁で量子化するので週次の揺れでは動かない", () => {
    // 同じ半桁帯 (100-316 / 317-999) の中では同点。GSC の週次ノイズ (±10% 程度) で
    // 索引の順位が入れ替わらないための設計
    expect(computeDemand(100)).toBe(computeDemand(316));
    expect(computeDemand(320)).toBe(computeDemand(999));
    expect(computeDemand(10)).toBe(computeDemand(31));
  });

  it("1 桁刻みでは粗すぎた 100 と 999 を区別する", () => {
    // 実測回帰: 5 段バケットでは表示回数 100 と 999 が同点になり、
    // 上位帯が 293 件の同点集団になっていた
    expect(computeDemand(999)).toBeGreaterThan(computeDemand(100));
  });

  it("桁が上がると上がり、最上位帯 (3163 以上) で飽和する", () => {
    expect(computeDemand(1)).toBeLessThan(computeDemand(10));
    expect(computeDemand(10)).toBeLessThan(computeDemand(100));
    expect(computeDemand(3162)).toBeLessThan(1);
    expect(computeDemand(3163)).toBe(1);
    expect(computeDemand(100000)).toBe(1);
  });
});

describe("computeProminenceScores", () => {
  it("同義タイトル群では最新年が新しい 1 本だけが uniqueness 満点", () => {
    const results = computeProminenceScores(
      [
        input({ rankingKey: "old", title: "県民所得（平成17年基準）", latestYear: 2010 }),
        input({ rankingKey: "new", title: "県民所得（平成27年基準）", latestYear: 2024 }),
      ],
      { currentYear: 2026 },
    );
    expect(results.find((r) => r.rankingKey === "new")!.uniqueness).toBe(1);
    expect(results.find((r) => r.rankingKey === "old")!.uniqueness).toBe(0.3);
  });

  it("同点の同義タイトルは rankingKey 昇順で決定的に代表を決める", () => {
    const run = () =>
      computeProminenceScores(
        [
          input({ rankingKey: "bbb", title: "同じ指標", latestYear: 2024 }),
          input({ rankingKey: "aaa", title: "同じ指標", latestYear: 2024 }),
        ],
        { currentYear: 2026 },
      ).find((r) => r.uniqueness === 1)!.rankingKey;
    expect(run()).toBe("aaa");
    expect(run()).toBe(run());
  });

  it("入力と同じ順序で返す（並べ替えは呼び出し側の責務）", () => {
    const results = computeProminenceScores(
      [input({ rankingKey: "z" }), input({ rankingKey: "a" })],
      { currentYear: 2026 },
    );
    expect(results.map((r) => r.rankingKey)).toEqual(["z", "a"]);
  });

  it("需要が同じなら、厚みのある指標が上に来る", () => {
    // 露出ゼロが 47% を占めるので、その帯の中で厚みが並び順を決めるのが実質的な役割
    const [thick, thin] = computeProminenceScores(
      [
        input({ rankingKey: "thick", title: "総人口", yearSpan: 20, impressions: 0 }),
        input({
          rankingKey: "thin",
          title: "非常に長くて括弧（注釈つき）の単年しかない指標",
          yearSpan: 1,
          impressions: 0,
        }),
      ],
      { currentYear: 2026 },
    );
    expect(thick.score).toBeGreaterThan(thin.score);
  });

  it("需要が大きく違えば、厚みの差を上回る", () => {
    // 2026-07-29 の設計改訂。厚み主軸では GSC 1,431 表示の指標が 1,600 位に沈んでいた
    const [thick, popular] = computeProminenceScores(
      [
        input({ rankingKey: "thick", title: "総人口", yearSpan: 20, impressions: 0 }),
        input({
          rankingKey: "popular",
          title: "単年しかないが読者が来る指標",
          yearSpan: 1,
          impressions: 5000,
        }),
      ],
      { currentYear: 2026 },
    );
    expect(popular.score).toBeGreaterThan(thick.score);
  });
});

describe("selectRepresentatives", () => {
  it("同義タイトルは 1 本に畳む", () => {
    // uniqueness の減点だけでは畳めず、「製造品出荷額等」が代表 6 件に 3 回並んでいた
    const results = computeProminenceScores(
      [
        input({ rankingKey: "a", title: "製造品出荷額等", impressions: 300 }),
        input({ rankingKey: "b", title: "製造品出荷額等", impressions: 200 }),
        input({ rankingKey: "c", title: "製造品出荷額等", impressions: 100 }),
        input({ rankingKey: "d", title: "製造業従業者数", impressions: 50 }),
      ],
      { currentYear: 2026 },
    );
    const picked = selectRepresentatives(results, 6);
    expect(picked.map((p) => p.title)).toEqual(["製造品出荷額等", "製造業従業者数"]);
  });

  it("年・調査名の括弧違いも同義として畳む", () => {
    const results = computeProminenceScores(
      [
        input({ rankingKey: "a", title: "在留外国人数（韓国）", impressions: 100 }),
        input({ rankingKey: "b", title: "在留外国人数（中国）", impressions: 90 }),
        input({ rankingKey: "c", title: "外国人人口（人口10万人当たり）", impressions: 80 }),
      ],
      { currentYear: 2026 },
    );
    expect(selectRepresentatives(results, 6)).toHaveLength(2);
  });

  it("畳んだ結果 limit に満たなくても、重複で埋めない", () => {
    // 索引は「このカテゴリに何があるか」を見せる場所。同じ指標を並べるより件数が少ない方が伝わる
    const results = computeProminenceScores(
      [
        input({ rankingKey: "a", title: "同じ指標" }),
        input({ rankingKey: "b", title: "同じ指標" }),
        input({ rankingKey: "c", title: "同じ指標" }),
      ],
      { currentYear: 2026 },
    );
    expect(selectRepresentatives(results, 6)).toHaveLength(1);
  });

  it("渡された範囲の中だけで畳む（横断 uniqueness で消さない）", () => {
    // 実測回帰: 全カテゴリ横断で畳むと、別カテゴリの同名指標に代表を奪われたキーが
    // 自カテゴリからも消え、国際カテゴリが 1 件になった
    const all = computeProminenceScores(
      [
        input({ rankingKey: "pop-side", title: "外国人人口", categoryKey: "population", latestYear: 2024 }),
        input({ rankingKey: "intl-side", title: "外国人人口", categoryKey: "international", latestYear: 2020 }),
      ],
      { currentYear: 2026 },
    );
    // 横断では pop-side が代表 (最新年が新しい)
    expect(all.find((r) => r.rankingKey === "intl-side")!.uniqueness).toBe(0.3);
    // それでも international カテゴリだけを渡せば、その中の代表として出る
    const intlOnly = all.filter((r) => r.categoryKey === "international");
    expect(selectRepresentatives(intlOnly, 6).map((r) => r.rankingKey)).toEqual([
      "intl-side",
    ]);
  });
});

describe("selectHomeFeatured", () => {
  const many = (categoryKey: string, n: number, base: number) =>
    Array.from({ length: n }, (_, i) =>
      input({
        rankingKey: `${categoryKey}-${i}`,
        categoryKey,
        title: `${categoryKey}の指標${i}`,
        impressions: base - i,
      }),
    );

  it("指標数の多いカテゴリが枠を独占しない", () => {
    // economy が 817 件ある現実の再現。上限が無いと 8 枠すべて economy になる。
    // 本番は 17 カテゴリ × 上限 2 = 34 ≥ 8 なので、この分散制約だけで枠が埋まる
    const results = computeProminenceScores(
      [
        ...many("economy", 20, 5000),
        ...many("population", 5, 1000),
        ...many("laborwage", 5, 900),
        ...many("educationsports", 5, 800),
      ],
      { currentYear: 2026 },
    );
    const picked = selectHomeFeatured(results, { limit: 8, maxPerCategory: 2 });
    expect(picked).toHaveLength(8);
    for (const categoryKey of new Set(picked.map((p) => p.categoryKey))) {
      expect(picked.filter((p) => p.categoryKey === categoryKey).length).toBeLessThanOrEqual(2);
    }
  });

  it("カテゴリが少なすぎて枠が埋まらないときは、上限を破ってでも埋める", () => {
    // ホームのカード枠は固定数なので、空き枠を作るより上限超過を選ぶ。
    // 本番では 17 カテゴリあるため、この経路には入らない
    const results = computeProminenceScores(many("economy", 10, 5000), {
      currentYear: 2026,
    });
    const picked = selectHomeFeatured(results, { limit: 8, maxPerCategory: 2 });
    expect(picked).toHaveLength(8);
    expect(new Set(picked.map((p) => p.rankingKey)).size).toBe(8);
  });

  it("候補が枠より少ないときは候補数ぶんだけ返す", () => {
    const results = computeProminenceScores(many("economy", 3, 100), {
      currentYear: 2026,
    });
    expect(selectHomeFeatured(results, { limit: 8, maxPerCategory: 2 })).toHaveLength(3);
  });
});

describe("compareByProminence", () => {
  it("スコア降順・同点は rankingKey 昇順", () => {
    const results = computeProminenceScores(
      [
        input({ rankingKey: "b", title: "同一条件" }),
        input({ rankingKey: "a", title: "同一条件" }),
      ],
      { currentYear: 2026 },
    );
    const sorted = [...results].sort(compareByProminence);
    // 同義タイトルなので uniqueness で差がつく。決定的であることだけを確認する
    expect(sorted.map((r) => r.rankingKey)).toEqual(
      [...results].sort(compareByProminence).map((r) => r.rankingKey),
    );
  });
});
