import type { ReactNode } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  price: 3000, image: "https://thumbnail.image.rakuten.co.jp/item.jpg", reviewCount: 0, reviewAverage: 0,
};
const furusatoItem = { ...item, name: "【ふるさと納税】納豆セット", shopName: "北海道登別市" };

describe("楽天カードの成果クリックと表示の結合キー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID", "test-affiliate");
    vi.mocked(readRakutenItemsFromR2).mockResolvedValue([item]);
    vi.mocked(readRakutenFurusatoFromR2).mockResolvedValue([furusatoItem]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["rakuten-sidebar", "ranking-sidebar", "blog-sidebar", "blog-rakuten-content"])(
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

  it.each(["sidebar", "area-furusato-content", "city-furusato-content", "blog-furusato-content"])("%s: 返礼品クリックもカード表示と同じad_id・positionを送る", async (position) => {
    render(await FurusatoNozeiCard({ areaCode: "01000", position }));
    const impression = screen.getByTestId("impression");
    fireEvent.click(screen.getByRole("link", { name: furusatoItem.name }));
    expect(trackAffiliateClick).toHaveBeenCalledWith(expect.objectContaining({
      adId: impression.dataset.adId, position: impression.dataset.position,
    }));
    expect(impression.dataset.position).toBe(position);
    expect(screen.getAllByTestId("impression")).toHaveLength(1);
  });

  it("市区町村コードを県コードに正規化して返礼品を読む", async () => {
    await FurusatoNozeiCard({ areaCode: "13101" });
    expect(readRakutenFurusatoFromR2).toHaveBeenCalledWith("13000");
  });

  it.each(["00000", "99000", "13", "13bad", "130000"])("%s には返礼品を誤配置しない", async (areaCode) => {
    expect(await FurusatoNozeiCard({ areaCode })).toBeNull();
    expect(readRakutenFurusatoFromR2).not.toHaveBeenCalled();
  });

  it("在庫がなくても同じ県の一覧に計測付きで案内する", async () => {
    vi.mocked(readRakutenFurusatoFromR2).mockResolvedValue([]);
    render(await FurusatoNozeiCard({ areaCode: "47000", position: "area-furusato-content" }));
    const link = screen.getByRole("link", { name: "沖縄県のふるさと納税" });
    expect(link.getAttribute("href")).toContain(encodeURIComponent("https://event.rakuten.co.jp/furusato/area/okinawa/"));
    fireEvent.click(link);
    expect(trackAffiliateClick).toHaveBeenCalledWith(expect.objectContaining({
      adId: "furusato-okinawa", position: "area-furusato-content",
    }));
  });

  it("ID未設定の通常リンクをアフィリエイトとして数えない", async () => {
    vi.stubEnv("NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID", "");
    expect(await FurusatoNozeiCard({ areaCode: "01000" })).toBeNull();
    expect(readRakutenFurusatoFromR2).not.toHaveBeenCalled();
  });

  it("本文用カードはモバイル2列・広い画面4列、寄附額を明記する", async () => {
    render(await FurusatoNozeiCard({ areaCode: "01000", layout: "content" }));
    expect(screen.getByRole("link", { name: furusatoItem.name }).parentElement).toHaveClass("grid-cols-2", "sm:grid-cols-4");
    expect(screen.getByText("寄附額 3,000円")).toBeInTheDocument();
  });

  it("品目のない統計には商品カードも表示イベントも作らない", async () => {
    expect(await RakutenItemsCard({ sourceText: "高校生の平均身長" })).toBeNull();
    expect(readRakutenItemsFromR2).not.toHaveBeenCalled();
  });

  it("R2在庫が空の品目には空広告を出さない", async () => {
    vi.mocked(readRakutenItemsFromR2).mockResolvedValue([]);
    expect(await RakutenItemsCard({ sourceText: "納豆消費量ランキング" })).toBeNull();
  });

  it("通常URLや返礼品を通販の成果商品として混ぜない", async () => {
    vi.mocked(readRakutenItemsFromR2).mockResolvedValue([
      { ...item, url: "https://item.rakuten.co.jp/shop/item" },
      { ...item, name: "【ふるさと納税】納豆" },
      { ...item, url: "https://hb.afl.rakuten.co.jp.invalid/item" },
    ]);
    expect(await RakutenItemsCard({ sourceText: "納豆消費量ランキング" })).toBeNull();
  });

  it("古い返礼品snapshotに混入した通常商品を寄附額付きで表示しない", async () => {
    vi.mocked(readRakutenFurusatoFromR2).mockResolvedValue([item]);
    render(await FurusatoNozeiCard({ areaCode: "05000" }));
    expect(screen.queryByText("寄附額 3,000円")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "秋田県のふるさと納税" })).toBeInTheDocument();
  });

  it("旧さんまsnapshotの下着・パンツを除き、一致する商品だけを描画する", async () => {
    vi.mocked(readRakutenItemsFromR2).mockResolvedValue([
      { ...item, name: "ナイトブラ 育乳" },
      { ...item, name: "さんま 干物", url: item.url + "/fish" },
      { ...item, name: "テーパードパンツ レディース", url: item.url + "/pants" },
    ]);
    render(await RakutenItemsCard({ sourceText: "さんま消費量" }));
    expect(screen.getByRole("link", { name: "さんま 干物" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ナイトブラ|テーパードパンツ/ })).not.toBeInTheDocument();
  });

  it("県不明の古い返礼品は同じ県の一覧へ戻す", async () => {
    vi.mocked(readRakutenFurusatoFromR2).mockResolvedValue([{ ...furusatoItem, shopName: undefined }]);
    render(await FurusatoNozeiCard({ areaCode: "01000" }));
    expect(screen.queryByText("寄附額 3,000円")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "北海道のふるさと納税" })).toBeInTheDocument();
  });

  it("県が商品名で確認できる旧品は維持し、食文化枠だけ券を除く", async () => {
    const voucher = { ...item, name: "【ふるさと納税】北海道 食事券" };
    vi.mocked(readRakutenFurusatoFromR2).mockResolvedValue([voucher]);
    const { unmount } = render(await FurusatoNozeiCard({ areaCode: "01000" }));
    expect(screen.getByRole("link", { name: voucher.name })).toBeInTheDocument();
    unmount();
    render(await FurusatoNozeiCard({ areaCode: "01000", position: "blog-furusato-content" }));
    expect(screen.queryByRole("link", { name: voucher.name })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "北海道のふるさと納税" })).toBeInTheDocument();
  });
});
