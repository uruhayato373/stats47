import { describe, expect, it, vi } from "vitest";

import { checkPresence } from "../r2-presence";

/**
 * KNOWN / SITEMAP 生成器の存在確認テスト (KNOWN-KEYS-TRANSIENT-DELETE-01)。
 *
 * ★両方向を固定する。一時障害を absent に倒す実装 (2026-08-17 に本番 404 を作った旧実装) が
 *   落ちること、正常系で誤って undetermined にしないことの両方を assert する。
 *   前者だけ入れると「常に undetermined」が通り、後者だけ入れると旧実装が通ってしまう。
 */

const noSleep = () => Promise.resolve();
const res = (status: number) =>
  ({ ok: status >= 200 && status < 300, status }) as Response;

describe("checkPresence", () => {
  it("200 なら present (1 回で確定・リトライしない)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep })).toBe("present");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("404 は答えなので即 absent (リトライしない)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(404));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep })).toBe("absent");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("HEAD が HEAD メソッドで呼ばれる", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200));
    await checkPresence("https://example.test/x.json", { fetchImpl, sleep: noSleep });
    expect(fetchImpl).toHaveBeenCalledWith("https://example.test/x.json", {
      method: "HEAD",
    });
  });

  it("★一時的な 5xx のあと 200 なら present (旧実装はここで absent に倒し本番 404 を作った)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res(503))
      .mockResolvedValueOnce(res(200));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep })).toBe("present");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("★ネットワーク例外のあと 200 なら present", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(res(200));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep })).toBe("present");
  });

  it("★リトライを使い切っても 404 でないなら undetermined (absent にしない)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(503));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep, attempts: 3 })).toBe(
      "undetermined",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("★例外が続いても undetermined (absent にしない)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ENOTFOUND"));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep })).toBe("undetermined");
  });

  it("429 もリトライ対象 (レート制限を「無い」と読まない)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(res(429))
      .mockResolvedValueOnce(res(200));
    expect(await checkPresence("u", { fetchImpl, sleep: noSleep })).toBe("present");
  });

  it("リトライ間隔は試行ごとに伸び、最後の失敗のあとは待たない", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi.fn().mockResolvedValue(res(500));
    await checkPresence("u", { fetchImpl, sleep, attempts: 3 });
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([300, 600]);
  });
});
