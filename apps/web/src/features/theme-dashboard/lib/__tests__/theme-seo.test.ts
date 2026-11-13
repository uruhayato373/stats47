// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildAreaThemeFaqItems,
  buildFaqStructuredData,
  buildThemeDescription,
  buildThemeFaqItems,
  buildThemeTitle,
  leadFactFromValues,
  themeLeadLabels,
} from "../theme-seo";

import type { RankingItem, RankingValue } from "@stats47/ranking";


/**
 * テーマの題・説明文・FAQ (2026-11-12 オーナー決定: 地域の単位に関係なく 1 か所で作る)。
 * 検索語に多い「都道府県」「ランキング」と主な指標の名前を題に入れることと、FAQ の構造化データが画面の Q&A と同じ内容になることを固定する。
 */
describe("theme-seo", () => {
  it("主な指標の短い名前から括弧の補足を落とす", () => {
    const labels = themeLeadLabels("aging-society");
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((l) => !/[（(]/.test(l))).toBe(true);
  });

  it("単位ごとに題を作り、検索語 (都道府県・ランキング・全国順位) と指標名を入れる", () => {
    const labels = ["高齢化率", "合計特殊出生率"];
    expect(buildThemeTitle({ scope: "national", themeTitle: "少子高齢化", labels })).toBe(
      "全国の少子高齢化｜高齢化率・合計特殊出生率の推移と都道府県ランキング",
    );
    expect(buildThemeTitle({ scope: "area", themeTitle: "少子高齢化", labels, areaName: "秋田県" })).toBe(
      "秋田県の少子高齢化｜高齢化率・合計特殊出生率の全国順位",
    );
    expect(buildThemeTitle({ scope: "municipalities", themeTitle: "少子高齢化", labels })).toContain("を市区町村で比較｜");
    expect(buildThemeTitle({ scope: "japan", themeTitle: "少子高齢化", labels })).toBe("日本の少子高齢化の推移｜高齢化率・合計特殊出生率");
  });

  it("題が長すぎるときは指標名を減らす", () => {
    const title = buildThemeTitle({
      scope: "national",
      themeTitle: "長いテーマ",
      labels: ["非常に長い指標の名前その一", "非常に長い指標の名前その二"],
    });
    expect(title.length).toBeLessThanOrEqual(40);
    expect(title).toContain("非常に長い指標の名前その一");
    expect(title).not.toContain("その二");
  });

  const item = { title: "高齢化率", unit: "%", latestYear: { yearCode: "2024000000", yearName: "2024年" } } as unknown as RankingItem;
  const values = [
    { areaCode: "00000", areaName: "全国", value: 29.3, rank: null },
    { areaCode: "05000", areaName: "秋田県", value: 39.5, rank: 1 },
    { areaCode: "13000", areaName: "東京都", value: 22.7, rank: 47 },
    { areaCode: "01000", areaName: "北海道", value: 33.1, rank: 10 },
  ] as unknown as RankingValue[];

  it("全国の行を除いて 1 位・最下位と倍率を出す", () => {
    const fact = leadFactFromValues(item, values);
    expect(fact?.top.areaName).toBe("秋田県");
    expect(fact?.bottom.areaName).toBe("東京都");
    expect(fact?.ratio).toBe("1.7");
  });

  it("全国のページの説明文に 1 位・最下位を入れ、ほかの単位には入れない", () => {
    const fact = leadFactFromValues(item, values);
    const national = buildThemeDescription({ scope: "national", base: "説明。", labels: ["高齢化率"], fact });
    expect(national).toContain("1位秋田県（39.5%）");
    expect(national).toContain("最下位東京都（22.7%）");
    const japan = buildThemeDescription({ scope: "japan", base: "説明。", labels: ["高齢化率"], fact });
    expect(japan).not.toContain("1位");
  });

  it("FAQ の構造化データは画面の Q&A と同じ文を持つ", () => {
    const fact = leadFactFromValues(item, values)!;
    const items = buildThemeFaqItems([fact]);
    const ld = buildFaqStructuredData(items) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(ld.mainEntity.map((q) => q.name)).toEqual(items.map((i) => i.q));
    expect(ld.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(items.map((i) => i.a));
    expect(buildFaqStructuredData([])).toBeNull();
  });

  it("県のページの Q&A はその県の全国順位を答える", () => {
    const [qa] = buildAreaThemeFaqItems("秋田県", [
      { itemName: "高齢化率", unit: "%", yearName: "2024年", value: 39.5, rank: 1, total: 47 },
    ]);
    expect(qa.q).toBe("秋田県の高齢化率は全国何位ですか？");
    expect(qa.a).toBe("2024年の秋田県の高齢化率は39.5%で、47都道府県中1位です。");
  });
});
