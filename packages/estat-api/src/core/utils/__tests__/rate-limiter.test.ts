import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimiter } from "../rate-limiter";

vi.mock("@stats47/logger", () => ({ logger: { warn: vi.fn(), debug: vi.fn(), error: vi.fn() } }));

// e-Stat は短時間に要求を重ねると一時的に遮断する。1 分あたりの本数を超える要求は、枠が戻るまで待たせる。
// 枠を使い切る前の要求を待たせない (取り込みを遅くしない) ことと、休んだ後に枠が上限を超えて溜まらないことを固定する。
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

/** acquire() が解決したかを、時計を進めずに確かめる */
async function isSettled(promise: Promise<void>): Promise<boolean> {
  let settled = false;
  promise.then(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(0);
  return settled;
}

async function acquireMany(limiter: RateLimiter, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    expect(await isSettled(limiter.acquire())).toBe(true);
  }
}

describe("RateLimiter", () => {
  it("lets the first maxPerMinute requests through without any wait", async () => {
    const limiter = new RateLimiter(60);
    await acquireMany(limiter, 60);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("holds the next request until one token has been refilled", async () => {
    const limiter = new RateLimiter(60);
    await acquireMany(limiter, 60);

    const next = limiter.acquire();
    expect(await isSettled(next)).toBe(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(await isSettled(next)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await isSettled(next)).toBe(true);
  });

  it("waits in proportion to the configured rate", async () => {
    const limiter = new RateLimiter(2);
    await acquireMany(limiter, 2);

    const next = limiter.acquire();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(await isSettled(next)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await isSettled(next)).toBe(true);
  });

  it("refills by elapsed time", async () => {
    const limiter = new RateLimiter(60);
    await acquireMany(limiter, 60);

    await vi.advanceTimersByTimeAsync(30_000);
    await acquireMany(limiter, 30);
    expect(await isSettled(limiter.acquire())).toBe(false);
  });

  it("never stores more than maxPerMinute tokens after a long idle", async () => {
    const limiter = new RateLimiter(5);
    await vi.advanceTimersByTimeAsync(10 * 60_000);

    await acquireMany(limiter, 5);
    expect(await isSettled(limiter.acquire())).toBe(false);
  });
});
