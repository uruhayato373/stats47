import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TrackedFeaturedRankingCard } from "../TrackedFeaturedRankingCard";

/**
 * 計測ラッパーの component test (仕様 doc 28 §9.1-9.2 / §13.4)。
 * IntersectionObserver を mock し threshold 0.5 の設定と発火経路を検証する。
 */

const mockGtag = vi.fn();

let observerCallback: (entries: { isIntersecting: boolean }[]) => void = () => {};
let observerOptions: IntersectionObserverInit | undefined;
const disconnect = vi.fn();

class MockIntersectionObserver {
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void, options?: IntersectionObserverInit) {
    observerCallback = cb;
    observerOptions = options;
  }
  observe = vi.fn();
  disconnect = disconnect;
  unobserve = vi.fn();
}

const PARAMS = {
  rankingKey: "annual-sunshine-duration",
  cardVariant: "question",
  slot: 1,
  experimentId: "home-featured-v1",
  experimentVariant: "editorial",
} as const;

describe("TrackedFeaturedRankingCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    window.gtag = mockGtag as unknown as typeof window.gtag;
    mockGtag.mockClear();
    disconnect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (window as { gtag?: unknown }).gtag;
  });

  it("IntersectionObserver に threshold 0.5 を設定する", () => {
    render(
      <TrackedFeaturedRankingCard {...PARAMS}>
        <a href="/ranking/annual-sunshine-duration">card</a>
      </TrackedFeaturedRankingCard>,
    );
    expect(observerOptions).toEqual({ threshold: 0.5 });
  });

  it("50% 表示 1 秒で impression を 1 回だけ送る", () => {
    render(
      <TrackedFeaturedRankingCard {...PARAMS}>
        <a href="/ranking/annual-sunshine-duration">card</a>
      </TrackedFeaturedRankingCard>,
    );

    observerCallback([{ isIntersecting: true }]);
    vi.advanceTimersByTime(1000);

    expect(mockGtag).toHaveBeenCalledTimes(1);
    expect(mockGtag).toHaveBeenCalledWith("event", "home_featured_impression", {
      ranking_key: "annual-sunshine-duration",
      card_variant: "question",
      slot: 1,
      experiment_id: "home-featured-v1",
      experiment_variant: "editorial",
      link_position: "home_featured",
    });

    // 再表示しても 2 回目は送らない
    observerCallback([{ isIntersecting: false }]);
    observerCallback([{ isIntersecting: true }]);
    vi.advanceTimersByTime(2000);
    expect(mockGtag).toHaveBeenCalledTimes(1);
  });

  it("1 秒前に離脱したら impression を送らない", () => {
    render(
      <TrackedFeaturedRankingCard {...PARAMS}>
        <a href="/ranking/annual-sunshine-duration">card</a>
      </TrackedFeaturedRankingCard>,
    );
    observerCallback([{ isIntersecting: true }]);
    vi.advanceTimersByTime(999);
    observerCallback([{ isIntersecting: false }]);
    vi.advanceTimersByTime(2000);
    expect(mockGtag).not.toHaveBeenCalled();
  });

  it("unmount で observer を disconnect し pending timer を破棄する", () => {
    const { unmount } = render(
      <TrackedFeaturedRankingCard {...PARAMS}>
        <a href="/ranking/annual-sunshine-duration">card</a>
      </TrackedFeaturedRankingCard>,
    );
    observerCallback([{ isIntersecting: true }]);
    unmount();
    vi.advanceTimersByTime(2000);
    expect(disconnect).toHaveBeenCalled();
    expect(mockGtag).not.toHaveBeenCalled();
  });

  it("card リンクの click を capture して home_featured_click を送る", () => {
    const { getByRole } = render(
      <TrackedFeaturedRankingCard {...PARAMS} cardVariant="map" experimentVariant="control">
        <a href="/ranking/annual-sunshine-duration">card</a>
      </TrackedFeaturedRankingCard>,
    );
    fireEvent.click(getByRole("link"));

    expect(mockGtag).toHaveBeenCalledWith("event", "home_featured_click", {
      ranking_key: "annual-sunshine-duration",
      card_variant: "map",
      slot: 1,
      experiment_id: "home-featured-v1",
      experiment_variant: "control",
      link_position: "home_featured",
    });
  });
});
