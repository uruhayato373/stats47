import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getDefinitionSet } from "@/components/stat-charts/data/definitions";

import { SIDEBAR_PROMO_BANNERS } from "@/features/ads/constants/sidebar-banners";
import { RANKING_MAKING_OF_KEYS } from "@/features/ranking/components/RankingKeyPage/RankingMakingOfLink";

import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";


/**
 * コードに直書きした ranking key が配信中 (KNOWN_RANKING_KEYS) であることを固定する。
 * 2026-10-26 に stat-charts の歳入定義で、実在しない key 14 件 (`local-tax` など) が見つかった。
 * 直書きの key は改名・廃止で黙ってリンク切れ・空表示になるので、置き場ごとにここへ足す。
 */
const SRC = path.resolve(process.cwd(), "src");

function literalKeys(relPath: string, pattern: RegExp): string[] {
  const source = readFileSync(path.join(SRC, relPath), "utf8");
  return [...source.matchAll(pattern)].map((match) => match[1]!);
}

function unknown(keys: Iterable<string>): string[] {
  return [...keys].filter((key) => !KNOWN_RANKING_KEYS.has(key));
}

describe("直書きの ranking key が KNOWN_RANKING_KEYS に実在する", () => {
  it("ランキングの作り方リンクの対象", () => {
    expect(RANKING_MAKING_OF_KEYS.size).toBeGreaterThan(0);
    expect(unknown(RANKING_MAKING_OF_KEYS)).toEqual([]);
  });

  it("サイドバー広告の対象ランキング", () => {
    const keys = SIDEBAR_PROMO_BANNERS.flatMap((banner) => banner.targetRankingKeys ?? []);
    expect(keys.length).toBeGreaterThan(0);
    expect(unknown(keys)).toEqual([]);
  });

  it("人口動態の散布図の軸", () => {
    const keys = literalKeys("features/theme-dashboard/components/PopulationScatterSection.tsx", /[xy]Key: "([^"]+)"/g);
    expect(keys.length).toBeGreaterThan(0);
    expect(unknown(keys)).toEqual([]);
  });

  it("調査ハブの読者の問い (survey-editorial)", () => {
    const keys = literalKeys("features/survey/survey-editorial.ts", /rankingKey: '([^']+)'/g);
    expect(keys.length).toBeGreaterThan(300);
    expect(unknown(keys)).toEqual([]);
  });

  it("stat-charts の用語定義 (rankingKey を持つ場合)", () => {
    const keys = (getDefinitionSet("revenue")?.groups ?? []).flatMap((group) =>
      group.items.flatMap((item) => (item.rankingKey ? [item.rankingKey] : [])),
    );
    expect(unknown(keys)).toEqual([]);
  });
});
