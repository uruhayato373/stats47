import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createImpressionWatcher, IMPRESSION_DWELL_MS } from "../impression-watcher";

/**
 * impression 発火条件の unit test。
 * 50% 閾値は IntersectionObserver 側 (TrackedFeaturedRankingCard が threshold 0.5 を設定) で、
 * ここでは「1 秒連続表示 / 1 回だけ / 離脱で timer 解除 / cleanup」を fake timer で検証する。
 */
describe("createImpressionWatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("1 秒連続表示で 1 回だけ発火する", () => {
    const fire = vi.fn();
    const watcher = createImpressionWatcher(fire);

    watcher.handleIntersection(true);
    expect(fire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(IMPRESSION_DWELL_MS);
    expect(fire).toHaveBeenCalledTimes(1);
    expect(watcher.hasFired()).toBe(true);

    // 以後の intersect では再発火しない (card mount につき 1 回)
    watcher.handleIntersection(false);
    watcher.handleIntersection(true);
    vi.advanceTimersByTime(IMPRESSION_DWELL_MS * 2);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("1 秒経過前に viewport 外へ出たら timer を解除する", () => {
    const fire = vi.fn();
    const watcher = createImpressionWatcher(fire);

    watcher.handleIntersection(true);
    vi.advanceTimersByTime(IMPRESSION_DWELL_MS - 1);
    watcher.handleIntersection(false); // 離脱 → 解除
    vi.advanceTimersByTime(IMPRESSION_DWELL_MS * 2);
    expect(fire).not.toHaveBeenCalled();

    // 再表示すれば改めて 1 秒カウントして発火する
    watcher.handleIntersection(true);
    vi.advanceTimersByTime(IMPRESSION_DWELL_MS);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("連続する intersect 通知で timer を延長しない", () => {
    const fire = vi.fn();
    const watcher = createImpressionWatcher(fire);

    watcher.handleIntersection(true);
    vi.advanceTimersByTime(IMPRESSION_DWELL_MS - 100);
    watcher.handleIntersection(true); // 途中の再通知
    vi.advanceTimersByTime(100);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("cleanup が pending timer を破棄する (unmount 時に発火しない)", () => {
    const fire = vi.fn();
    const watcher = createImpressionWatcher(fire);

    watcher.handleIntersection(true);
    watcher.cleanup();
    vi.advanceTimersByTime(IMPRESSION_DWELL_MS * 2);
    expect(fire).not.toHaveBeenCalled();
  });
});
