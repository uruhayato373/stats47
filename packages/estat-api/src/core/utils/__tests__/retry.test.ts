import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EstatApiError } from "../../errors/index";
import { executeWithRetry } from "../retry";

vi.mock("@stats47/logger", () => ({ logger: { warn: vi.fn(), debug: vi.fn(), error: vi.fn() } }));

// e-Stat は一時的な障害 (通信断・5xx) では同じ要求をやり直せば通るが、要求そのものの誤り (4xx・引数の誤り) は
// やり直しても通らず、利用枠だけを減らす。やり直す条件と待ち時間を固定する。
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

/** 待機中の timer を 1 つずつ進め、それぞれの待ち時間 (ミリ秒) を返す */
async function settle<T>(promise: Promise<T>): Promise<{ delays: number[]; result: PromiseSettledResult<T> }> {
  const delays: number[] = [];
  let result: PromiseSettledResult<T> | undefined;
  promise.then(
    (value) => { result = { status: "fulfilled", value }; },
    (reason) => { result = { status: "rejected", reason }; },
  );
  for (let step = 0; step < 50; step += 1) {
    await vi.advanceTimersByTimeAsync(0);
    if (result) break;
    const before = Date.now();
    await vi.advanceTimersToNextTimerAsync();
    delays.push(Date.now() - before);
  }
  if (!result) throw new Error("promise did not settle");
  return { delays, result };
}

describe("executeWithRetry", () => {
  it("returns the first successful result without waiting", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const { delays, result } = await settle(executeWithRetry(fn));
    expect(result).toEqual({ status: "fulfilled", value: "ok" });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(delays).toEqual([]);
  });

  it("retries a transport failure with doubling waits and returns the later success", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new Error("Request timeout after 60000ms"))
      .mockResolvedValue("ok");
    const { delays, result } = await settle(executeWithRetry(fn, { maxRetries: 3, initialDelay: 2000 }));
    expect(result).toEqual({ status: "fulfilled", value: "ok" });
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([2000, 4000]);
  });

  it("retries a 5xx response from e-Stat", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new EstatApiError("HTTP error! status: 503", "API_ERROR", undefined, 503))
      .mockResolvedValue("ok");
    const { delays, result } = await settle(executeWithRetry(fn, { initialDelay: 100 }));
    expect(result).toEqual({ status: "fulfilled", value: "ok" });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(delays).toEqual([100]);
  });

  it("does not retry a 4xx response or a request error, so a wrong request does not spend the quota", async () => {
    const notFound = new EstatApiError("HTTP error! status: 404", "API_ERROR", undefined, 404);
    const first = vi.fn().mockRejectedValue(notFound);
    const rejected = await settle(executeWithRetry(first));
    expect(rejected.result).toEqual({ status: "rejected", reason: notFound });
    expect(first).toHaveBeenCalledTimes(1);
    expect(rejected.delays).toEqual([]);

    const invalid = new Error("statsDataId is required");
    const second = vi.fn().mockRejectedValue(invalid);
    const thrown = await settle(executeWithRetry(second));
    expect(thrown.result).toEqual({ status: "rejected", reason: invalid });
    expect(second).toHaveBeenCalledTimes(1);

    const third = vi.fn().mockRejectedValue("not an Error object");
    await settle(executeWithRetry(third));
    expect(third).toHaveBeenCalledTimes(1);
  });

  it("stops after maxRetries and throws the last failure", async () => {
    const failures = [0, 1, 2].map((index) => new TypeError(`fetch failed ${index}`));
    const fn = vi.fn()
      .mockRejectedValueOnce(failures[0])
      .mockRejectedValueOnce(failures[1])
      .mockRejectedValueOnce(failures[2]);
    const { delays, result } = await settle(executeWithRetry(fn, { maxRetries: 2, initialDelay: 1000 }));
    expect(result).toEqual({ status: "rejected", reason: failures[2] });
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([1000, 2000]);
  });

  it("caps each wait at maxDelay", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("network down"));
    const { delays } = await settle(
      executeWithRetry(fn, { maxRetries: 4, initialDelay: 3000, backoffMultiplier: 3, maxDelay: 10000 }),
    );
    expect(delays).toEqual([3000, 9000, 10000, 10000]);
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("uses the default limits from ESTAT_API_CONFIG (3 retries, 2 seconds first)", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const { delays } = await settle(executeWithRetry(fn));
    expect(delays).toEqual([2000, 4000, 8000]);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("lets the caller decide what is retryable", async () => {
    const quota = new EstatApiError("HTTP error! status: 429", "API_ERROR", undefined, 429);
    const fn = vi.fn().mockRejectedValueOnce(quota).mockResolvedValue("ok");
    const isRetryable = vi.fn((error: unknown) => error instanceof EstatApiError && error.statusCode === 429);
    const { result } = await settle(executeWithRetry(fn, { initialDelay: 10, isRetryable }));
    expect(result).toEqual({ status: "fulfilled", value: "ok" });
    expect(isRetryable).toHaveBeenCalledWith(quota);
    expect(fn).toHaveBeenCalledTimes(2);

    const transport = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await settle(executeWithRetry(transport, { isRetryable: () => false }));
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
