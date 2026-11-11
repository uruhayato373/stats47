import { fireEvent, render, screen } from "@testing-library/react";
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
            latestYear: "2024",
            unit: "時間",
          },
        ]}
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "年間日照時間" }),
    ).toBeInTheDocument();
  });

  it("家計調査の一覧は品目名で絞り込める", () => {
    const base = {
      areaType: "prefecture",
      latestYear: "2025",
      unit: "円",
      topicLabel: "食料 — 野菜・海藻",
    };
    render(
      <CategoryRankingTable
        items={[
          { ...base, rankingKey: "natto-consumption-expenditure", title: "納豆消費支出額" },
          { ...base, rankingKey: "rice-consumption-expenditure", title: "米消費支出額" },
        ]}
        topicOptions={[{ value: "食料 — 野菜・海藻", label: "食料 — 野菜・海藻" }]}
        trackingSurface="survey_ranking"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("ランキング名で探す"), {
      target: { value: "納豆" },
    });
    expect(screen.getByRole("link", { name: "納豆消費支出額" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "米消費支出額" })).not.toBeInTheDocument();
    expect(screen.getByText("フィルター結果: 1件 / 全2件")).toBeInTheDocument();
  });

  it("後ろのページで検索しても結果の先頭ページを表示する", () => {
    const items = Array.from({ length: 21 }, (_, index) => ({
      rankingKey: `item-${index}`,
      areaType: "prefecture",
      title: index === 0 ? "納豆消費支出額" : `品目${index}`,
      latestYear: "2025",
      unit: "円",
      topicLabel: "食料 — 野菜・海藻",
    }));
    render(
      <CategoryRankingTable
        items={items}
        topicOptions={[{ value: "食料 — 野菜・海藻", label: "食料 — 野菜・海藻" }]}
      />,
    );
    fireEvent.click(screen.getByText(">", { exact: true }));
    expect(screen.queryByRole("link", { name: "納豆消費支出額" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("ランキング名で探す"), {
      target: { value: "納豆" },
    });
    expect(screen.getByRole("link", { name: "納豆消費支出額" })).toBeInTheDocument();
    expect(screen.getByText("ページ 1 / 1")).toBeInTheDocument();
  });
});
