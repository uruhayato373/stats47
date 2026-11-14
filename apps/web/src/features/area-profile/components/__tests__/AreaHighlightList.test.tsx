import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AreaHighlightList } from "../AreaHighlightList";
import { toHighlightListItem } from "../AreaRelatedRankingsCard";

import type { AreaHighlight } from "@stats47/area-profile";

const highlight = (over: Partial<AreaHighlight>): AreaHighlight =>
  ({
    rankingKey: "test-metric",
    label: "県内総生産額",
    rank: 1,
    value: 113_685_917,
    unit: "百万円",
    year: "2021年度",
    tone: "neutral",
    isKakei: false,
    ...over,
  }) as AreaHighlight;

// 2026-09-25 UI 全面点検: 県のページの「特徴」の表が「113,685,917百万円」と書いていた (UNIT-NOTATION-FORMAT-01)
describe("県の特徴の表の値", () => {
  it("桁の多い金額はランキングのページと同じ表示単位に寄せる", () => {
    const html = renderToStaticMarkup(
      <AreaHighlightList items={[toHighlightListItem(highlight({}))]} rankScope="全国順位" />,
    );
    expect(html).toContain("113.7");
    expect(html).toContain("兆円");
    expect(html).not.toContain("百万円");
  });

  it("割合や小さい値は観測値の桁のまま書き、単位の表記だけ半角にする", () => {
    const html = renderToStaticMarkup(
      <AreaHighlightList items={[toHighlightListItem(highlight({ label: "高齢化率", value: 29.12, unit: "％" }))]} rankScope="全国順位" />,
    );
    expect(html).toContain("29.12");
    expect(html).toContain("%");
    expect(html).not.toContain("％");
  });

  it("表示単位を渡さない行 (市区町村の値) は元の単位のまま書く", () => {
    const html = renderToStaticMarkup(
      <AreaHighlightList
        items={[{ rankingKey: "k", label: "人口", rank: 3, value: 1_234_567, unit: "人", year: "2020年", tone: "neutral" }]}
        rankScope="県内順位"
      />,
    );
    expect(html).toContain("1,234,567");
  });
});
