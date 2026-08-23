import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturedRankingCard } from "..";

const PROPS = {
  rankingKey: "annual-sunshine-duration",
  year: "2024",
  unit: "時間",
  model: {
    hook: "日照時間が最も長い県は？",
    top: { rank: 1, areaName: "高知県", value: "2,309" },
    mapSvg:
      '<svg data-map-rotation="clockwise-32" data-okinawa="excluded"></svg>',
  },
};

describe("FeaturedRankingCard", () => {
  it("共通比率・リンク・hook・1位・年度・単位・地理地図を表示する", () => {
    const { container, getByRole, getByText } = render(
      <FeaturedRankingCard {...PROPS} />,
    );
    const card = getByRole("link");

    expect(card).toHaveAttribute(
      "href",
      "/ranking/annual-sunshine-duration",
    );
    expect(card).toHaveClass("aspect-[1.47/1]");
    expect(card).toHaveClass("p-3");
    expect(getByText("日照時間が最も長い県は？")).toHaveClass(
      "text-sm",
      "font-semibold",
      "line-clamp-2",
    );
    expect(getByText("1位")).toBeInTheDocument();
    expect(getByText("高知県")).toBeInTheDocument();
    expect(getByText(/2,309/)).toBeInTheDocument();
    expect(getByText("2024年")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "data-map-rotation",
      "clockwise-32",
    );
  });

  it("比較・top3・装飾用question分岐を持たない", () => {
    const source = FeaturedRankingCard.toString();
    expect(source).not.toContain("QuestionCard");
    expect(source).not.toContain("ComparisonCard");
    expect(source).not.toContain("TopThreeCard");
  });
});
