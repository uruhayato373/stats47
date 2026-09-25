import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createActionBatcher, MAX_BATCH_SIZE } from "../action-batcher";

/**
 * サーバーアクションを束ねる仕組み (2026-09-25)。ブラウザはサーバーアクションを 1 件ずつ順番に処理するため、
 * テーマページの 48 件が一列に並び、最後のカードまで約 19 秒かかっていた。
 */
describe("createActionBatcher", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = () => {
    const runBatch = vi.fn(async (requests: string[]) => requests.map((r) => `result:${r}`));
    const call = createActionBatcher(runBatch, (r: string) => r);
    return { runBatch, call };
  };

  it("同じタイミングの要求を 1 回のアクションにまとめ、各要求へ自分の結果を返す", async () => {
    const { runBatch, call } = setup();
    const pending = [call("a"), call("b"), call("c")];
    await vi.runAllTimersAsync();
    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(runBatch).toHaveBeenCalledWith(["a", "b", "c"]);
    expect(await Promise.all(pending)).toEqual(["result:a", "result:b", "result:c"]);
  });

  it("同じ引数の要求は 1 回だけ送り、あとの描画でも結果を使い回す", async () => {
    const { runBatch, call } = setup();
    const first = call("a");
    const duplicate = call("a");
    await vi.runAllTimersAsync();
    expect(runBatch).toHaveBeenCalledWith(["a"]);
    expect(await duplicate).toBe(await first);
    const later = call("a");
    await vi.runAllTimersAsync();
    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(await later).toBe("result:a");
  });

  it("上限を超える要求は複数回に分ける", async () => {
    const { runBatch, call } = setup();
    const pending = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) => call(`k${i}`));
    await vi.runAllTimersAsync();
    await Promise.all(pending);
    expect(runBatch.mock.calls.map(([requests]) => requests.length)).toEqual([MAX_BATCH_SIZE, 1]);
  });

  it("失敗したら同じ回の要求をすべて失敗にし、次の呼び出しでは取り直す", async () => {
    const runBatch = vi
      .fn<(requests: string[]) => Promise<string[]>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockImplementation(async (requests) => requests.map((r) => `ok:${r}`));
    const call = createActionBatcher(runBatch, (r: string) => r);
    const failed = [call("a"), call("b")];
    const settled = Promise.allSettled(failed);
    await vi.runAllTimersAsync();
    expect((await settled).every((s) => s.status === "rejected")).toBe(true);
    const retried = call("a");
    await vi.runAllTimersAsync();
    expect(await retried).toBe("ok:a");
  });
});
