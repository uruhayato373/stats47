import { describe, expect, it } from "vitest";

import { buildArticleMaterials, regionBreakdown, topBottomRatio } from "../blog-article-materials";
import { buildBlogArticlePrompt, MATERIALS_HEADING, type GroundTruthMetric } from "../prompts/blog-article-prompt";

const NAMES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県",
  "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県",
  "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

function metric(overrides: Partial<GroundTruthMetric> = {}): GroundTruthMetric {
  return {
    rankingKey: "m",
    label: "指標",
    readerLabel: "読者向けの指標",
    unit: "円",
    year: "2024",
    source: "調査",
    rows: NAMES.map((areaName, i) => ({ rank: i + 1, areaName, value: 470 - i * 10 })),
    ...overrides,
  };
}

describe("buildArticleMaterials", () => {
  it("書き手が数え間違える値を機械計算して渡す", () => {
    const text = buildArticleMaterials([metric()]);
    expect(text).toContain("1位は最下位の 47.00 倍");
    expect(text).toContain("1位と最下位の差: 460円");
    expect(text).toContain("中央値: 240円");
    expect(text).toContain("1位と2位の差: 10円");
  });

  it("上位 10 県の地方の内訳が packages/area の 7 区分に沿う (新潟は中部で東北に入らない)", () => {
    const text = buildArticleMaterials([metric()]);
    expect(text).toContain("上位10県の地方の内訳: 北海道・東北 7県 (北海道、青森県、岩手県、宮城県、秋田県、山形県、福島県) / 関東 3県");
    expect(text).toMatch(/- 中部: 新潟県 15位/);
  });

  it("最小が 0 以下なら倍率を出さない (比が意味を持たない)", () => {
    const rows = [
      { rank: 1, areaName: "東京都", value: 3 },
      { rank: 2, areaName: "大阪府", value: 0 },
    ];
    expect(topBottomRatio(rows)).toBeNull();
    expect(buildArticleMaterials([metric({ rows })])).not.toContain("倍");
  });

  it("同順位の県を明示する (次の順位が飛ぶことを critic が誤りと読まないように)", () => {
    const rows = [
      { rank: 1, areaName: "東京都", value: 3 },
      { rank: 2, areaName: "大阪府", value: 2 },
      { rank: 2, areaName: "京都府", value: 2 },
      { rank: 4, areaName: "奈良県", value: 1 },
    ];
    expect(buildArticleMaterials([metric({ rows })])).toContain("同順位: 2位 大阪府、京都府");
  });

  it("小数の差を浮動小数の誤差のまま出さない", () => {
    const rows = [
      { rank: 1, areaName: "東京都", value: 0.3 },
      { rank: 2, areaName: "大阪府", value: 0.1 },
    ];
    expect(buildArticleMaterials([metric({ rows })])).toContain("1位と最下位の差: 0.2円");
  });

  it("2 指標なら両方の上位に入る県と順位の開きを足す", () => {
    const second = metric({
      readerLabel: "第2指標",
      rows: NAMES.map((areaName, i) => ({ rank: i === 0 ? 47 : i, areaName, value: 100 - i })),
    });
    const text = buildArticleMaterials([metric(), second]);
    expect(text).toContain("## 2 つの指標の重なり");
    expect(text).toContain("北海道 読者向けの指標 1位・第2指標 47位");
  });
});

describe("regionBreakdown", () => {
  it("県の数が多い地方から並べる", () => {
    const rows = ["大阪府", "京都府", "東京都"].map((areaName, i) => ({ rank: i + 1, areaName, value: 1 }));
    expect(regionBreakdown(rows)).toBe("近畿 2県 (大阪府、京都府) / 関東 1県 (東京都)");
  });
});

describe("buildBlogArticlePrompt の materials", () => {
  const base = {
    slug: "s",
    archetype: "A" as const,
    suggestedTitle: "題",
    metrics: [metric()],
    figures: [],
    sourceLinkHref: "/ranking/m",
    sourceLinkLabel: "もっと見る",
    allowedLinks: [],
  };

  it("materials を渡すと実データの後の節に入る", () => {
    const prompt = buildBlogArticlePrompt({ ...base, materials: buildArticleMaterials([metric()]) });
    expect(prompt.indexOf(MATERIALS_HEADING)).toBeGreaterThan(prompt.indexOf("# 実データ"));
    expect(prompt).toContain("地方別の順位");
  });

  it("materials が無ければ節を出さない", () => {
    expect(buildBlogArticlePrompt(base)).not.toContain(MATERIALS_HEADING);
  });
});
