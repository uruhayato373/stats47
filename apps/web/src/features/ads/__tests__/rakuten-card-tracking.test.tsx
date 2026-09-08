import type { ReactNode } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackAffiliateClick } from "@/lib/analytics/events";

import { FurusatoNozeiCard } from "../components/FurusatoNozeiCard";
import { RakutenItemsCard } from "../components/RakutenItemsCard";
import { readRakutenFurusatoFromR2, readRakutenItemsFromR2 } from "../repositories/rakuten-snapshot";

vi.mock("@/lib/analytics/events", () => ({ trackAffiliateClick: vi.fn() }));
vi.mock("../repositories/rakuten-snapshot", () => ({
  readRakutenItemsFromR2: vi.fn(),
  readRakutenFurusatoFromR2: vi.fn(),
}));
vi.mock("../components/AdImpressionTracker", () => ({
  AdImpressionTracker: ({ children, position, adId }: {
    children: ReactNode; position: string; adId: string;
  }) => <div data-testid="impression" data-position={position} data-ad-id={adId}>{children}</div>,
}));

const item = {
  name: "納豆セット", url: "https://hb.afl.rakuten.co.jp/example",
  price: 3000, image: null, reviewCount: 0, reviewAverage: 0,
};

describe("楽天カードの成果クリックと表示の結合キー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readRakutenItemsFromR2).mockResolvedValue([item]);
    vi.mocked(readRakutenFurusatoFromR2).mockResolvedValue([item]);
  });

  it.each(["rakuten-sidebar", "ranking-sidebar", "blog-sidebar"])(
    "%s: 商品クリックはカード表示と同じad_id・positionを送る", async (position) => {
      render(await RakutenItemsCard({ sourceText: "納豆消費量ランキング", position }));
      const impression = screen.getByTestId("impression");
      fireEvent.click(screen.getByRole("link", { name: item.name }));
      expect(trackAffiliateClick).toHaveBeenCalledWith(expect.objectContaining({
        adId: impression.dataset.adId, position: impression.dataset.position,
      }));
      expect(screen.getAllByTestId("impression")).toHaveLength(1);
      expect(screen.getByRole("link", { name: item.name })).toHaveAttribute("rel", "noopener noreferrer sponsored");
    },
  );

  it("未発行の楽天検索URLを成果クリックとして記録しない", async () => {
    render(await RakutenItemsCard({ sourceText: "納豆消費量ランキング" }));
    fireEvent.click(screen.getByRole("link", { name: "納豆を楽天市場で探す" }));
    expect(trackAffiliateClick).not.toHaveBeenCalled();
  });

  it("返礼品クリックもカード表示と同じad_id・positionを送る", async () => {
    render(await FurusatoNozeiCard({ areaCode: "01000" }));
    const impression = screen.getByTestId("impression");
    fireEvent.click(screen.getByRole("link", { name: item.name }));
    expect(trackAffiliateClick).toHaveBeenCalledWith(expect.objectContaining({
      adId: impression.dataset.adId, position: impression.dataset.position,
    }));
  });

  it("品目のない統計には商品カードも表示イベントも作らない", async () => {
    expect(await RakutenItemsCard({ sourceText: "高校生の平均身長" })).toBeNull();
    expect(readRakutenItemsFromR2).not.toHaveBeenCalled();
  });

  it("R2在庫が空の品目には空広告を出さない", async () => {
    vi.mocked(readRakutenItemsFromR2).mockResolvedValue([]);
    expect(await RakutenItemsCard({ sourceText: "納豆消費量ランキング" })).toBeNull();
  });
});
