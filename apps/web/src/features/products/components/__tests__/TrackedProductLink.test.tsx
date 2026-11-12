// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductPurchase } from "../ProductPurchase";
import {
  TrackedProductLink,
  TrackedProductOutboundLink,
} from "../TrackedProductLink";

const FISCAL_NOTE = { slug: "data-p-04", externalUrl: "https://note.com/stats47/n/n1234abcd" };
const FISCAL_KINDLE = { slug: "kindle-k-s1-06", externalUrl: "https://www.amazon.co.jp/dp/B0HF1XFXBY" };

describe("product links", () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("gtag", mockGtag);
    mockGtag.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("商品一覧から詳細へのクリックを登録済みnavパラメータで送る", () => {
    render(
      <TrackedProductLink
        href="/products/data-p-04"
        label="P-04:自治体財政"
        surface="product_catalog"
        product={FISCAL_NOTE}
      >
        詳細
      </TrackedProductLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "詳細" }));
    expect(mockGtag).toHaveBeenCalledWith("event", "nav_click", {
      event_category: "navigation",
      event_label: "P-04:自治体財政",
      nav_label: "P-04:自治体財政",
      nav_href: "/products/data-p-04",
      nav_surface: "product_catalog",
    });
  });

  it("販売先クリックを商品ページpathとlink_positionで集計できる", () => {
    render(
      <TrackedProductOutboundLink
        href="https://www.amazon.co.jp/dp/B0HF1XFXBY"
        productId="K-S1-06"
        productSlug="kindle-k-s1-06"
        productTitle="自治体財政の地図"
        channel="kindle"
      >
        Amazonで確認
      </TrackedProductOutboundLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Amazonで確認" }));
    expect(mockGtag).toHaveBeenCalledWith("event", "cta_click", {
      event_category: "cta",
      event_label: "自治体財政の地図",
      cta_id: "product_kindle_k-s1-06",
      link_position: "product_kindle",
    });
  });

  it("Kindle の販売先リンクにだけ Amazon アソシエイトのタグと sponsored を付ける", () => {
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "stats47-22");
    render(
      <>
        <TrackedProductOutboundLink
          href="https://www.amazon.co.jp/dp/B0HF1XFXBY"
          productId="K-S1-06"
          productSlug="kindle-k-s1-06"
          productTitle="自治体財政の地図"
          channel="kindle"
        >
          Amazon
        </TrackedProductOutboundLink>
        <TrackedProductOutboundLink
          href="https://note.com/stats47/n/ne47eb45f8a15"
          productId="P-01"
          productSlug="data-p-01"
          productTitle="人口・世帯データ集"
          channel="note"
        >
          note
        </TrackedProductOutboundLink>
      </>,
    );
    vi.unstubAllEnvs();

    const amazon = screen.getByRole("link", { name: "Amazon" });
    expect(amazon.getAttribute("href")).toBe("https://www.amazon.co.jp/dp/B0HF1XFXBY?tag=stats47-22");
    expect(amazon.getAttribute("rel")).toContain("sponsored");
    const note = screen.getByRole("link", { name: "note" });
    expect(note.getAttribute("href")).toBe("https://note.com/stats47/n/ne47eb45f8a15");
    expect(note.getAttribute("rel")).not.toContain("sponsored");
  });
  it("販売先クリックを product_click (キーイベント) で送り、詳細へ来る前の案内の置き場所を link_position に入れる", () => {
    render(
      <>
        <TrackedProductLink href="/products/kindle-k-s1-06" label="K-S1-06" surface="blog_product" product={FISCAL_KINDLE}>
          詳細へ
        </TrackedProductLink>
        <TrackedProductOutboundLink
          href={FISCAL_KINDLE.externalUrl}
          productId="K-S1-06"
          productSlug="kindle-k-s1-06"
          productTitle="自治体財政の地図"
          channel="kindle"
        >
          Amazonへ
        </TrackedProductOutboundLink>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "詳細へ" }));
    fireEvent.click(screen.getByRole("link", { name: "Amazonへ" }));
    expect(mockGtag).toHaveBeenCalledWith("event", "product_click", {
      product_destination: "amazon",
      product_id: "B0HF1XFXBY",
      link_position: "blog_product",
    });
  });

  it("案内を通らずに詳細から出た販売先クリックは product_detail として数える", () => {
    render(
      <TrackedProductOutboundLink
        href="https://note.com/stats47/n/n1234abcd"
        productId="P-04"
        productSlug="data-p-04"
        productTitle="自治体財政"
        channel="note"
      >
        noteへ
      </TrackedProductOutboundLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "noteへ" }));
    expect(mockGtag).toHaveBeenCalledWith("event", "product_click", {
      product_destination: "note",
      product_id: "n1234abcd",
      link_position: "product_detail",
    });
  });

  it("商品案内が半分以上・1 秒見えたら product_impression を 1 回だけ送る", () => {
    vi.useFakeTimers();
    let notify: (entries: { isIntersecting: boolean; intersectionRatio: number }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(
      <TrackedProductLink href="/products/data-p-04" label="P-04" surface="ranking_product" placement="ranking_csv_product" product={FISCAL_NOTE}>
        案内
      </TrackedProductLink>,
    );

    // 画面に少し入っただけでは数えず、途中で半分未満になれば連続時間をリセットする。
    act(() => notify([{ isIntersecting: true, intersectionRatio: 0.1 }]));
    act(() => vi.advanceTimersByTime(1000));
    expect(mockGtag).not.toHaveBeenCalled();
    act(() => notify([{ isIntersecting: true, intersectionRatio: 0.5 }]));
    act(() => vi.advanceTimersByTime(600));
    act(() => notify([{ isIntersecting: true, intersectionRatio: 0.4 }]));
    act(() => vi.advanceTimersByTime(1000));
    expect(mockGtag).not.toHaveBeenCalled();
    act(() => notify([{ isIntersecting: true, intersectionRatio: 0.5 }]));
    act(() => vi.advanceTimersByTime(1000));
    act(() => notify([{ isIntersecting: false, intersectionRatio: 0 }]));
    act(() => notify([{ isIntersecting: true, intersectionRatio: 1 }]));
    act(() => vi.advanceTimersByTime(1000));
    vi.useRealTimers();

    const impressions = mockGtag.mock.calls.filter(([, name]) => name === "product_impression");
    expect(impressions).toEqual([
      ["event", "product_impression", { product_destination: "note", product_id: "n1234abcd", link_position: "ranking_csv_product" }],
    ]);
  });

  it("上部と表紙付きの末尾を各1回計測し、画像・ボタンのクリックも流入元を保って区別する", () => {
    vi.useFakeTimers();
    sessionStorage.setItem("stats47:product-placement", JSON.stringify({ [FISCAL_NOTE.slug]: "blog_product" }));
    const observers: { notify: (entries: { isIntersecting: boolean; intersectionRatio: number }[]) => void; element?: Element }[] = [];
    vi.stubGlobal("IntersectionObserver", class {
      record: (typeof observers)[number];
      constructor(notify: (typeof observers)[number]["notify"]) {
        this.record = { notify };
        observers.push(this.record);
      }
      observe(element: Element) { this.record.element = element; }
      disconnect() {}
    });
    const product = {
      ...FISCAL_NOTE, id: "P-04", title: "自治体財政", channel: "note" as const, channelLabel: "note",
      priceYen: 1980, description: "財政を比較するデータ", included: ["CSV"], audience: [], sourceBlogSlugs: [],
      coverImageUrl: "https://assets.st-note.com/cover.png",
    };
    const view = render(<>
      <ProductPurchase product={product} placement="product_detail_top" />
      <ProductPurchase product={product} placement="product_detail_bottom" />
    </>);
    // 3つのリンク（上ボタン・下画像・下ボタン）を別々の表示として水増ししない。
    expect(observers).toHaveLength(2);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    for (const { notify } of observers) {
      act(() => notify([{ isIntersecting: true, intersectionRatio: 1 }]));
    }
    act(() => vi.advanceTimersByTime(1000));
    for (const { notify } of observers) {
      act(() => notify([{ isIntersecting: false, intersectionRatio: 0 }]));
      act(() => notify([{ isIntersecting: true, intersectionRatio: 1 }]));
    }
    act(() => vi.advanceTimersByTime(1000));
    const payload = { product_destination: "note", product_id: "n1234abcd", link_position: "blog_product" };
    expect(mockGtag.mock.calls.filter(([, name]) => name === "product_impression")).toEqual([
      ["event", "product_impression", { ...payload, cta_id: "product_detail_top" }],
      ["event", "product_impression", { ...payload, cta_id: "product_detail_bottom" }],
    ]);
    for (const link of screen.getAllByRole("link")) fireEvent.click(link);
    expect(mockGtag.mock.calls.filter(([, name]) => name === "product_click")).toEqual([
      ["event", "product_click", { ...payload, cta_id: "product_detail_top" }],
      ["event", "product_click", { ...payload, cta_id: "product_detail_bottom" }],
      ["event", "product_click", { ...payload, cta_id: "product_detail_bottom" }],
    ]);
    view.unmount();
  });
});
