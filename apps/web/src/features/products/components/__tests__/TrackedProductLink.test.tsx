// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TrackedProductLink,
  TrackedProductOutboundLink,
} from "../TrackedProductLink";

const FISCAL_NOTE = { slug: "data-p-04", externalUrl: "https://note.com/stats47/n/n1234abcd" };
const FISCAL_KINDLE = { slug: "kindle-k-s1-06", externalUrl: "https://www.amazon.co.jp/dp/B0HF1XFXBY" };

describe("product links", () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { gtag: mockGtag });
    mockGtag.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

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
          href="https://coconala.com/services/4323722"
          productId="P-01"
          productSlug="data-p-01"
          productTitle="人口・世帯データ集"
          channel="coconala"
        >
          ココナラ
        </TrackedProductOutboundLink>
      </>,
    );
    vi.unstubAllEnvs();

    const amazon = screen.getByRole("link", { name: "Amazon" });
    expect(amazon.getAttribute("href")).toBe("https://www.amazon.co.jp/dp/B0HF1XFXBY?tag=stats47-22");
    expect(amazon.getAttribute("rel")).toContain("sponsored");
    const coconala = screen.getByRole("link", { name: "ココナラ" });
    expect(coconala.getAttribute("href")).toBe("https://coconala.com/services/4323722");
    expect(coconala.getAttribute("rel")).not.toContain("sponsored");
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
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
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

    act(() => notify([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(1000));
    act(() => notify([{ isIntersecting: false }]));
    act(() => notify([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(1000));
    vi.useRealTimers();

    const impressions = mockGtag.mock.calls.filter(([, name]) => name === "product_impression");
    expect(impressions).toEqual([
      ["event", "product_impression", { product_destination: "note", product_id: "n1234abcd", link_position: "ranking_csv_product" }],
    ]);
  });
});
