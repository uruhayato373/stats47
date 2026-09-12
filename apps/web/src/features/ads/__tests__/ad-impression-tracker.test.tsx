import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdImpressionTracker } from "../components/AdImpressionTracker";

describe("AdImpressionTracker の連続 viewable impression", () => {
  let callback: (entries: IntersectionObserverEntry[]) => void;
  let target: Element;
  const gtag = vi.fn();
  const disconnect = vi.fn();

  function intersect(...ratios: number[]) {
    const rect = target.getBoundingClientRect();
    act(() => callback(ratios.map((ratio) => ({
      target, time: performance.now(), isIntersecting: ratio > 0,
      intersectionRatio: ratio, boundingClientRect: rect,
      intersectionRect: rect, rootBounds: rect,
    }))));
  }

  function advance(ms: number) {
    act(() => vi.advanceTimersByTime(ms));
  }

  function visibility(value: DocumentVisibilityState) {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue(value);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
  }

  function mount() {
    return render(
      <AdImpressionTracker category="travel" label="旅" position="sidebar" adId="ad-1"
        experimentId="format" variantId="banner" creativeSize="300x250">
        <a href="https://example.test">広告</a>
      </AdImpressionTracker>,
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal("gtag", gtag);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.stubGlobal("IntersectionObserver", class implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [0.5];
      constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        callback = (entries) => cb(entries, this);
        expect(options?.threshold).toBe(0.5);
      }
      observe(element: Element) { target = element; }
      unobserve() {}
      disconnect = disconnect;
      takeRecords() { return []; }
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("10%の初期交差だけでは何秒経過しても送らない", () => {
    mount();
    intersect(0.1);
    advance(7000);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("ちょうど50%を連続1秒表示したら既存パラメータで1回送る", () => {
    mount();
    intersect(0.5);
    advance(999);
    expect(gtag).not.toHaveBeenCalled();
    advance(1);
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "affiliate_impression", {
      event_category: "affiliate", event_label: "旅", affiliate_category: "travel",
      affiliate_vertical: "travel", link_position: "sidebar", ad_id: "ad-1",
      experiment_id: "format", variant_id: "banner", creative_size: "300x250",
    });
    intersect(0, 0.8);
    advance(7000);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it.each([0.49, 0.1, 0])("1秒未満で表示比率が%sになれば計時を破棄し、再表示で1秒を取り直す", (ratio) => {
    mount();
    intersect(0.6);
    advance(500);
    intersect(ratio);
    advance(2000);
    expect(gtag).not.toHaveBeenCalled();
    intersect(0.6);
    advance(999);
    expect(gtag).not.toHaveBeenCalled();
    advance(1);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("50%以上の再通知では計時を延長も重複もしない", () => {
    mount();
    intersect(0.6);
    advance(500);
    intersect(0.9);
    advance(500);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("1つのcallbackに交差と50%未満の通知がまとまっても全件を処理する", () => {
    mount();
    intersect(0.6, 0.1);
    advance(1500);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("最初から非表示のタブでは計時せず、表示後に連続1秒を数える", () => {
    visibility("hidden");
    mount();
    intersect(0.8);
    advance(5000);
    expect(gtag).not.toHaveBeenCalled();
    visibility("visible");
    advance(999);
    expect(gtag).not.toHaveBeenCalled();
    advance(1);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("計時中にタブを隠した時間を加算せず、復帰後に1秒を取り直す", () => {
    mount();
    intersect(0.8);
    advance(500);
    visibility("hidden");
    advance(5000);
    expect(gtag).not.toHaveBeenCalled();
    visibility("visible");
    advance(999);
    expect(gtag).not.toHaveBeenCalled();
    advance(1);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("gtagが遅れて準備されても表示条件が続いていれば1回送る", () => {
    vi.stubGlobal("gtag", undefined);
    mount();
    intersect(0.8);
    advance(1000);
    vi.stubGlobal("gtag", gtag);
    advance(500);
    expect(gtag).toHaveBeenCalledTimes(1);
    advance(5000);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it.each(["exit", "hidden"])("gtag待機中の%sでretryを破棄し、復帰後に新しい1秒を要求する", (kind) => {
    vi.stubGlobal("gtag", undefined);
    mount();
    intersect(0.8);
    advance(1000);
    if (kind === "exit") intersect(0); else visibility("hidden");
    vi.stubGlobal("gtag", gtag);
    advance(5000);
    expect(gtag).not.toHaveBeenCalled();
    if (kind === "exit") intersect(0.8); else visibility("visible");
    advance(999);
    expect(gtag).not.toHaveBeenCalled();
    advance(1);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("gtag retryは有限で、再表示時には再試行できる", () => {
    vi.stubGlobal("gtag", undefined);
    mount();
    intersect(0.8);
    advance(7000);
    expect(vi.getTimerCount()).toBe(0);
    vi.stubGlobal("gtag", gtag);
    advance(1000);
    expect(gtag).not.toHaveBeenCalled();
    intersect(0, 0.8);
    advance(1000);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it.each([500, 1000])("%smsでunmountしたらdwell/retryとvisibility listenerを破棄する", (ms) => {
    vi.stubGlobal("gtag", undefined);
    const view = mount();
    intersect(0.8);
    advance(ms);
    view.unmount();
    vi.stubGlobal("gtag", gtag);
    visibility("hidden");
    visibility("visible");
    advance(7000);
    expect(gtag).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
