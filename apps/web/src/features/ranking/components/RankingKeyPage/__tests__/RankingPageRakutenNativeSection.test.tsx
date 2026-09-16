import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/ads/server", () => ({
  RakutenItemsCard: ({ sourceText, position, layout }: { sourceText: string; position?: string; layout?: string }) => (
    <div data-testid="rakuten-items" data-position={position} data-layout={layout}>
      {sourceText}
    </div>
  ),
  FurusatoNozeiCard: ({
    areaCode, position, layout, headingPrefix,
  }: { areaCode: string; position?: string; layout?: string; headingPrefix?: string }) => (
    <div
      data-testid="furusato"
      data-area-code={areaCode}
      data-position={position}
      data-layout={layout}
      data-heading-prefix={headingPrefix}
    />
  ),
}));

import { RankingPageRakutenNativeSection } from "../RankingPageRakutenNativeSection";

const TOP1 = { areaCode: "07000", areaName: "福島県" };

describe("RankingPageRakutenNativeSection", () => {
  it("品目あり + 1位県あり: モバイルは商品軸、デスクトップは1位県の地域軸", () => {
    render(
      <RankingPageRakutenNativeSection rankingName="納豆消費支出額" top1={TOP1} hasProductKeyword />,
    );

    const rakuten = screen.getByTestId("rakuten-items");
    expect(rakuten.parentElement).toHaveClass("lg:hidden");
    expect(rakuten).toHaveAttribute("data-position", "rakuten-native");
    expect(rakuten).toHaveAttribute("data-layout", "content");

    const furusatoCards = screen.getAllByTestId("furusato");
    expect(furusatoCards).toHaveLength(1);
    expect(furusatoCards[0].parentElement).toHaveClass("hidden", "lg:block");
    expect(furusatoCards[0]).toHaveAttribute("data-position", "furusato-native");
    expect(furusatoCards[0]).toHaveAttribute("data-area-code", TOP1.areaCode);
    expect(furusatoCards[0]).toHaveAttribute("data-heading-prefix", "1位 ");
  });

  it("品目なし + 1位県あり: モバイルも地域軸カードで代替する", () => {
    render(
      <RankingPageRakutenNativeSection rankingName="高校生の平均身長" top1={TOP1} hasProductKeyword={false} />,
    );

    expect(screen.queryByTestId("rakuten-items")).not.toBeInTheDocument();
    const furusatoCards = screen.getAllByTestId("furusato");
    expect(furusatoCards).toHaveLength(2);
    expect(furusatoCards[0].parentElement).toHaveClass("lg:hidden");
    expect(furusatoCards[1].parentElement).toHaveClass("hidden", "lg:block");
  });

  it("1位県なし + 品目あり: デスクトップ枠 (hidden lg:block) を作らない", () => {
    const { container } = render(
      <RankingPageRakutenNativeSection rankingName="納豆消費支出額" top1={null} hasProductKeyword />,
    );

    expect(screen.getByTestId("rakuten-items")).toBeInTheDocument();
    expect(screen.queryByTestId("furusato")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".hidden.lg\\:block")).toHaveLength(0);
  });

  it("1位県なし + 品目なし: 何も描画しない", () => {
    const { container } = render(
      <RankingPageRakutenNativeSection rankingName="高校生の平均身長" top1={null} hasProductKeyword={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
