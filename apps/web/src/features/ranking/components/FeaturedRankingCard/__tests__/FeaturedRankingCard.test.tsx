import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturedRankingCard } from "..";

const PROPS = {
  rankingKey: "annual-sunshine-duration",
  year: "2024",
  model: {
    hook: "日照時間が最も長い県は？",
    top: {
      unit: "時間",
      rows: [
        { rank: 1, areaName: "高知県", value: "2,309" },
        { rank: 2, areaName: "山梨県", value: "2,290" },
        { rank: 3, areaName: "宮崎県", value: "2,201" },
      ],
    },
    mapSvg: '<svg data-map-rotation="clockwise-32" data-okinawa="excluded"></svg>',
  },
};

describe("FeaturedRankingCard", () => {
  it("画像 (40:21 の地図 + 左上の上位の行) → 問い → 年の順に描き、問いを省略しない", () => {
    const { container, getByRole, getByText } = render(<FeaturedRankingCard {...PROPS} />);
    const card = getByRole("link");

    expect(card).toHaveAttribute("href", "/ranking/annual-sunshine-duration");
    // カード全体は固定比率を持たない。余白はテンプレートの p-4
    expect(card.className).not.toMatch(/aspect-/);
    expect(card).toHaveClass("p-4");
    // 画像の枠がカードの最初の子で、ブログのサムネイルと同じ 40:21
    const frame = card.firstElementChild as HTMLElement;
    expect(frame).toHaveClass("aspect-40/21", "w-full");
    expect(frame.querySelector("svg")).toHaveAttribute("data-map-rotation", "clockwise-32");
    // 上位の行は画像の枠の中 (左上) に重ねる
    const list = frame.querySelector("ol");
    expect(list).toHaveClass("absolute", "top-2", "left-2");
    expect([...container.querySelectorAll("ol > li")].map((row) => row.textContent)).toEqual([
      "1高知県2,309時間",
      "2山梨県2,290時間",
      "3宮崎県2,201時間",
    ]);
    const hook = getByText("日照時間が最も長い県は？");
    expect(hook).toHaveClass("text-sm", "font-semibold", "text-pretty");
    expect(hook.className).not.toMatch(/line-clamp|truncate/);
    expect(getByText("2024年")).toBeInTheDocument();
  });

  it("上位の行は正本の関数が書いた文字をそのまま出し、整形し直さない (同率・末尾の 0)", () => {
    const { container } = render(
      <FeaturedRankingCard
        {...PROPS}
        model={{
          ...PROPS.model,
          top: {
            unit: "cm",
            rows: [
              { rank: 1, areaName: "新潟県", value: "171.0" },
              { rank: 1, areaName: "福井県", value: "171.0" },
              { rank: 3, areaName: "青森県", value: "170.9" },
            ],
          },
        }}
      />,
    );
    expect([...container.querySelectorAll("ol > li")].map((row) => row.textContent)).toEqual([
      "1新潟県171.0cm",
      "1福井県171.0cm",
      "3青森県170.9cm",
    ]);
  });
});
