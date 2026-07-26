import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryRankingTable } from "../CategoryRankingListClient";

describe("CategoryRankingTable", () => {
  it("ヘッダー検索と重複する絞り込み欄を表示しない", () => {
    render(
      <CategoryRankingTable
        items={[
          {
            rankingKey: "annual-sunshine-duration",
            areaType: "prefecture",
            title: "年間日照時間",
            subtitle: null,
            latestYear: "2024",
            unit: "時間",
            description: null,
            demographicAttr: null,
            normalizationBasis: null,
          },
        ]}
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "年間日照時間" }),
    ).toBeInTheDocument();
  });
});
