import {
  HOME_FEATURED_RANKINGS,
  METRICS_REGISTRY,
  validateHomeFeaturedRankings,
  type HomeFeaturedRankingDefinition,
} from "@stats47/data-configs";
import { describe, expect, it } from "vitest";

/**
 * HOME_FEATURED_RANKINGS (git TS SSOT) の決定的 validation (仕様 doc 28 §4.2 / §13.1)。
 * 実 config × 実 registry の検査と、違反パターンの拒否を両方確認する。
 */

const REGISTRY_FIXTURE = {
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      `valid-key-${i + 1}`,
      { isActive: true, entities: ["prefecture"], title: `有効指標${i + 1}` },
    ]),
  ),
  "inactive-key": { isActive: false, entities: ["prefecture"], title: "無効指標" },
  "city-only-key": { isActive: true, entities: ["city"], title: "市区町村のみ" },
} as const;

function defs(overrides: Partial<HomeFeaturedRankingDefinition>[]): HomeFeaturedRankingDefinition[] {
  return overrides.map((o, i) => ({
    rankingKey: `valid-key-${i + 1}`,
    order: i + 1,
    hook: "有効なフックのコピーです？",
    ...o,
  }));
}

/** 8 件の妥当な fixture (単体違反を 1 箇所だけ混ぜて検査する土台) */
function eightValid(): HomeFeaturedRankingDefinition[] {
  return defs(Array.from({ length: 8 }, () => ({})));
}

describe("validateHomeFeaturedRankings (fixture)", () => {
  it("妥当な 8 件を受理する", () => {
    expect(validateHomeFeaturedRankings(eightValid(), REGISTRY_FIXTURE)).toEqual([]);
  });

  it("8 件以外を拒否する", () => {
    const errors = validateHomeFeaturedRankings(eightValid().slice(0, 7), REGISTRY_FIXTURE);
    expect(errors.join()).toContain("8 件");
  });

  it("rankingKey / order の重複を拒否する", () => {
    const base = eightValid();
    base[1] = { ...base[1], order: 1, rankingKey: "valid-key-1" };
    const errors = validateHomeFeaturedRankings(base, REGISTRY_FIXTURE);
    expect(errors.join()).toContain("order 重複");
    expect(errors.join()).toContain("rankingKey 重複");
  });

  it("registry 非実在 key を拒否する", () => {
    const base = eightValid();
    base[0] = { ...base[0], rankingKey: "no-such-key" };
    expect(
      validateHomeFeaturedRankings(base, REGISTRY_FIXTURE).join(),
    ).toContain("METRICS_REGISTRY に不在: no-such-key");
  });

  it("inactive / prefecture 非対応を拒否する", () => {
    const base = eightValid();
    base[0] = { ...base[0], rankingKey: "inactive-key" };
    base[1] = { ...base[1], rankingKey: "city-only-key" };
    const joined = validateHomeFeaturedRankings(base, REGISTRY_FIXTURE).join();
    expect(joined).toContain("isActive でない: inactive-key");
    expect(joined).toContain("prefecture が無い: city-only-key");
  });

  it("hook の改行・長さ違反 (8 未満 / 28 超) を拒否する", () => {
    const base = eightValid();
    base[0] = { ...base[0], hook: "短い？" };
    base[1] = { ...base[1], hook: "長".repeat(29) };
    base[2] = { ...base[2], hook: "改行が\n入っている問いです？" };
    const joined = validateHomeFeaturedRankings(base, REGISTRY_FIXTURE).join();
    expect(joined).toContain("hook 長 3");
    expect(joined).toContain("hook 長 29");
    expect(joined).toContain("hook に改行");
  });

  it("hook への観測値・データ年度の固定埋め込みを拒否する", () => {
    const base = eightValid();
    base[0] = { ...base[0], hook: "1位は1,347,800でした？" };
    base[1] = { ...base[1], hook: "退職手当は2,200万円？" };
    base[2] = { ...base[2], hook: "2024年の日照1位はどこ？" };
    const joined = validateHomeFeaturedRankings(base, REGISTRY_FIXTURE).join();
    expect(joined).toContain("観測値らしき数値");
    expect(joined).toContain("データ年度らしき年");
  });

  it("順位表現 (1位・上位3県) と指標定義由来の年は許容する", () => {
    const registry = {
      ...REGISTRY_FIXTURE,
      "future-population-change-rate-2050": {
        isActive: true,
        entities: ["prefecture"],
        title: "将来人口増減率",
      },
    };
    const base = eightValid();
    base[0] = { ...base[0], hook: "快晴日数1位は沖縄？" };
    base[1] = { ...base[1], hook: "人口上位3県は？" };
    base[2] = {
      ...base[2],
      rankingKey: "future-population-change-rate-2050",
      hook: "2050年、人口が増える県は？",
    };
    expect(validateHomeFeaturedRankings(base, registry)).toEqual([]);
  });

  it("order が 1 始まりの連番でないと拒否する", () => {
    const base = eightValid().map((d, i) => ({ ...d, order: i + 2 }));
    expect(
      validateHomeFeaturedRankings(base, REGISTRY_FIXTURE).join(),
    ).toContain("1 始まりの連番でない");
  });
});

describe("HOME_FEATURED_RANKINGS (実 config × 実 registry)", () => {
  it("現行 8 件が全 validation を通る", () => {
    expect(validateHomeFeaturedRankings(HOME_FEATURED_RANKINGS, METRICS_REGISTRY)).toEqual([]);
  });

  it("order順に8件を返す", () => {
    const orders = HOME_FEATURED_RANKINGS.map((d) => d.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
