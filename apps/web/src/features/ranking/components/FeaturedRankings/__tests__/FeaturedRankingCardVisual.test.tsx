import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorialFeaturedCard } from "../FeaturedRankingCardVisual";

import type { HomeFeaturedEditorialModel } from "../../../utils/resolve-home-featured-card";

/**
 * editorial card visual の component test (仕様 doc 28 §6 / §13.3)。
 * href / hook / 実 rank / 年度・単位 / 色以外の label を検証する。
 */

const TOP = { rank: 1, areaName: "東京都", value: "1,064" };
const BOTTOM = { rank: 47, areaName: "鳥取県", value: "173" };
const TOP3 = [
  TOP,
  { rank: 2, areaName: "大阪府", value: "900" },
  { rank: 3, areaName: "愛知県", value: "800" },
];

function model(overrides: Partial<HomeFeaturedEditorialModel> = {}): HomeFeaturedEditorialModel {
  return {
    variant: "question",
    hook: "財政力が高い県と低い県",
    top: TOP,
    bottom: BOTTOM,
    topThree: TOP3,
    tileMapSvg: "<svg data-testid=\"tile\"></svg>",
    ...overrides,
  };
}

const BASE = {
  rankingKey: "fiscal-strength-index-prefecture",
  title: "財政力指数",
  year: "2022",
  unit: "指数",
};

describe("EditorialFeaturedCard", () => {
  it("card 全体が /ranking/<key> へのリンクになる", () => {
    const { getByRole } = render(<EditorialFeaturedCard {...BASE} model={model()} />);
    expect(getByRole("link").getAttribute("href")).toBe(
      "/ranking/fiscal-strength-index-prefecture",
    );
  });

  it("question: hook が第一要素で answer (値 + 1位 + 県名) と年度・単位を表示する", () => {
    const { container, getByText } = render(
      <EditorialFeaturedCard {...BASE} model={model({ variant: "question" })} />,
    );
    expect(getByText("財政力が高い県と低い県")).toBeInTheDocument();
    expect(getByText("1,064")).toBeInTheDocument();
    expect(getByText("1位")).toBeInTheDocument();
    expect(getByText("東京都")).toBeInTheDocument();
    expect(getByText("2022年・指数")).toBeInTheDocument();
    // 数値は font-mono tabular-nums (§6.1)
    expect(container.querySelector(".font-mono.tabular-nums")).not.toBeNull();
  });

  it("comparison: top と bottom を実 rank 付きで表示し ratio を出さない", () => {
    const { getByText, queryByText } = render(
      <EditorialFeaturedCard {...BASE} model={model({ variant: "comparison" })} />,
    );
    expect(getByText("1位")).toBeInTheDocument();
    expect(getByText("47位")).toBeInTheDocument();
    expect(getByText("東京都")).toBeInTheDocument();
    expect(getByText("鳥取県")).toBeInTheDocument();
    expect(getByText("173")).toBeInTheDocument();
    // ratio (倍率) は初期実装で出さない (§6.4)
    expect(queryByText(/倍/)).toBeNull();
  });

  it("comparison: bottom の rank 欠損時は固定数値でなく「最下位」と表示する", () => {
    const { getByText, queryByText } = render(
      <EditorialFeaturedCard
        {...BASE}
        model={model({
          variant: "comparison",
          bottom: { areaName: "鳥取県", value: "173" },
        })}
      />,
    );
    expect(getByText("最下位")).toBeInTheDocument();
    expect(queryByText("47位")).toBeNull();
  });

  it("territory: 地図を描画し、色だけに頼らず area/value を併記する", () => {
    const { container, getByText } = render(
      <EditorialFeaturedCard {...BASE} model={model({ variant: "territory" })} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(getByText("東京都")).toBeInTheDocument();
    expect(getByText(/1,064/)).toBeInTheDocument();
  });

  it("top-three: 表彰台でなく 3 行の順位リストを表示する", () => {
    const { container, getByText } = render(
      <EditorialFeaturedCard {...BASE} model={model({ variant: "top-three" })} />,
    );
    const items = container.querySelectorAll("ol li");
    expect(items).toHaveLength(3);
    expect(getByText("大阪府")).toBeInTheDocument();
    expect(getByText("3位")).toBeInTheDocument();
    expect(getByText("800")).toBeInTheDocument();
  });
});
