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
  it("リンク・hook・1位・年度・単位・地理地図を表示し、地図は固定サイズの枠に置く", () => {
    const { container, getByRole, getByText } = render(
      <FeaturedRankingCard {...PROPS} />,
    );
    const card = getByRole("link");

    expect(card).toHaveAttribute(
      "href",
      "/ranking/annual-sunshine-duration",
    );
    // 高さは中身で決める (固定比率を持たない)。余白はテンプレートの p-4
    expect(card.className).not.toMatch(/aspect-/);
    expect(card).toHaveClass("p-4");
    expect(getByText("日照時間が最も長い県は？")).toHaveClass(
      "text-sm",
      "font-semibold",
      "line-clamp-2",
    );
    expect(getByText("1位")).toBeInTheDocument();
    expect(getByText("高知県")).toBeInTheDocument();
    expect(getByText(/2,309/)).toBeInTheDocument();
    expect(getByText("2024年")).toBeInTheDocument();
    const map = container.querySelector("svg");
    expect(map).toHaveAttribute("data-map-rotation", "clockwise-32");
    // 桁の多い値でも地図が潰れないよう固定サイズの枠、値は省略できる列に置く
    expect(map?.parentElement).toHaveClass("size-16", "shrink-0");
    expect(getByText(/2,309/)).toHaveClass("truncate", "tabular-nums");
  });

  it("比較・top3・装飾用question分岐を持たない", () => {
    const source = FeaturedRankingCard.toString();
    expect(source).not.toContain("QuestionCard");
    expect(source).not.toContain("ComparisonCard");
    expect(source).not.toContain("TopThreeCard");
  });
});
