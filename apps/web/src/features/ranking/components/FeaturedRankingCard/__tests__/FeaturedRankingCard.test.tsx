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
  it("リンク・hook・1位・年度・単位・地理地図を表示し、問いと値を省略しない", () => {
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
    // 問いは行数で切らず、文節で折り返す (語の途中で切らない)
    const hook = getByText("日照時間が最も長い県は？");
    expect(hook).toHaveClass("text-sm", "font-semibold", "text-pretty");
    expect(hook.className).not.toMatch(/line-clamp|truncate/);
    expect(getByText("1位")).toBeInTheDocument();
    expect(getByText("高知県")).toBeInTheDocument();
    expect(getByText(/2,309/)).toBeInTheDocument();
    expect(getByText("2024年")).toBeInTheDocument();
    const map = container.querySelector("svg");
    expect(map).toHaveAttribute("data-map-rotation", "clockwise-32");
    // 地図はセルの下に読める高さ (96px) の全幅の枠で置く
    expect(map?.parentElement).toHaveClass("h-24", "w-full");
    // 値と単位は折り返さない 1 塊で、省略しない
    const value = getByText(/2,309/);
    expect(value).toHaveClass("whitespace-nowrap", "tabular-nums");
    expect(value.className).not.toMatch(/truncate/);
    expect(value).toHaveTextContent("2,309時間");
  });

  it("桁の多い値は省略せず、文字を段階で小さくして単位まで出す", () => {
    const { getByText } = render(
      <FeaturedRankingCard
        {...PROPS}
        unit="百万円"
        model={{ ...PROPS.model, top: { rank: 1, areaName: "愛知県", value: "58,021,789" } }}
      />,
    );
    const value = getByText(/58,021,789/);
    expect(value).toHaveTextContent("58,021,789百万円");
    expect(value).toHaveClass("text-base");
    expect(value.className).not.toMatch(/truncate/);
  });

  it("比較・top3・装飾用question分岐を持たない", () => {
    const source = FeaturedRankingCard.toString();
    expect(source).not.toContain("QuestionCard");
    expect(source).not.toContain("ComparisonCard");
    expect(source).not.toContain("TopThreeCard");
  });
});
