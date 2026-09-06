// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TrackedProductLink,
  TrackedProductOutboundLink,
} from "../TrackedProductLink";

describe("product links", () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { gtag: mockGtag });
    mockGtag.mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("商品一覧から詳細へのクリックを登録済みnavパラメータで送る", () => {
    render(
      <TrackedProductLink
        href="/products/data-p-04"
        label="P-04:自治体財政"
        surface="product_catalog"
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
});
