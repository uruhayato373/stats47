import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturedRankingCard } from "..";

const PROPS = {
  rankingKey: "annual-sunshine-duration",
  year: "2024",
  unit: "時間",
  model: {
    hook: "日照時間が最も長い県は？",
    tops: [
      { rank: 1, areaName: "高知県", value: "2,309" },
      { rank: 2, areaName: "山梨県", value: "2,290" },
      { rank: 3, areaName: "宮崎県", value: "2,201" },
    ],
    mapSvg:
      '<svg data-map-rotation="clockwise-32" data-okinawa="excluded"></svg>',
  },
};

describe("FeaturedRankingCard", () => {
  it("地図が上 (ブログのサムネイルと同じ 40:21)・問い・上位 3 県・年の順に描き、問いと値を省略しない", () => {
    const { container, getByRole, getByText } = render(
      <FeaturedRankingCard {...PROPS} />,
    );
    const card = getByRole("link");

    expect(card).toHaveAttribute("href", "/ranking/annual-sunshine-duration");
    // カード全体は固定比率を持たない。余白はテンプレートの p-4
    expect(card.className).not.toMatch(/aspect-/);
    expect(card).toHaveClass("p-4");
    const map = container.querySelector("svg");
    expect(map).toHaveAttribute("data-map-rotation", "clockwise-32");
    expect(map?.parentElement).toHaveClass("aspect-40/21", "w-full");
    // 地図がカードの最初の子 (画像が上・題名が下)
    expect(card.firstElementChild).toBe(map?.parentElement);
    const hook = getByText("日照時間が最も長い県は？");
    expect(hook).toHaveClass("text-sm", "font-semibold", "text-pretty");
    expect(hook.className).not.toMatch(/line-clamp|truncate/);
    const rows = container.querySelectorAll("ol > li");
    expect([...rows].map((row) => row.textContent)).toEqual([
      "1位高知県2,309時間",
      "2位山梨県2,290時間",
      "3位宮崎県2,201時間",
    ]);
    expect(getByText("2024年")).toBeInTheDocument();
  });

  it("同率 1 位は同じ順位で並べ (片方の県だけを書かない)、小数の桁をそろえる", () => {
    const { container } = render(
      <FeaturedRankingCard
        {...PROPS}
        unit="cm"
        model={{
          ...PROPS.model,
          tops: [
            { rank: 1, areaName: "新潟県", value: "171" },
            { rank: 1, areaName: "福井県", value: "171" },
            { rank: 3, areaName: "青森県", value: "170.9" },
          ],
        }}
      />,
    );
    expect([...container.querySelectorAll("ol > li")].map((row) => row.textContent)).toEqual([
      "1位新潟県171.0cm",
      "1位福井県171.0cm",
      "3位青森県170.9cm",
    ]);
  });

  // 2026-11-14 までは「58,021,789百万円」と 13 文字で書いていた (UNIT-NOTATION-FORMAT-01)
  it("桁の多い金額はランキングのページと同じ表示単位に寄せて書く", () => {
    const { getByText } = render(
      <FeaturedRankingCard
        {...PROPS}
        unit="百万円"
        model={{ ...PROPS.model, tops: [{ rank: 1, areaName: "愛知県", value: "58,021,789" }] }}
      />,
    );
    expect(getByText(/58\.0/)).toHaveTextContent("58.0兆円");
  });

  it("定義が表示単位を書いた指標は、その単位と小数桁で書く", () => {
    const { getByText } = render(
      <FeaturedRankingCard
        {...PROPS}
        unit="円"
        valueDisplay={{ conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万円" }}
        model={{ ...PROPS.model, tops: [{ rank: 1, areaName: "埼玉県", value: "639,356" }] }}
      />,
    );
    expect(getByText(/63\.9/)).toHaveTextContent("63.9万円");
  });

  it("値と単位は折り返さない 1 塊で、省略しない", () => {
    const { getByText } = render(
      <FeaturedRankingCard
        {...PROPS}
        unit="人/日"
        model={{ ...PROPS.model, tops: [{ rank: 1, areaName: "東京都", value: "58,021,789" }] }}
      />,
    );
    const value = getByText(/58,021,789/);
    expect(value).toHaveTextContent("58,021,789人/日");
    expect(value).toHaveClass("whitespace-nowrap", "tabular-nums");
    expect(value.className).not.toMatch(/truncate/);
  });
});
