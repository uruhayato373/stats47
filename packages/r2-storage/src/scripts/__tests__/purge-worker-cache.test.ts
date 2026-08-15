import { describe, expect, it, vi } from "vitest";

import { purgeWorkerCache } from "../purge-worker-cache";

function successfulResponse(tags = 1): Response {
  return Response.json({ success: true, purgedTags: tags });
}

describe("purgeWorkerCache", () => {
  it("URL指定を認証付きAPI requestへ変換する", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse(2));

    await purgeWorkerCache({
      urls: ["https://stats47.jp/blog/example"],
      secret: "test-secret",
      endpoint: "https://example.test/purge",
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://example.test/purge");
    expect(init?.headers).toEqual({
      Authorization: "Bearer test-secret",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      urls: ["https://stats47.jp/blog/example"],
    });
  });

  it("全ページpurgeを明示的なpayloadで送る", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse(2));

    await purgeWorkerCache({ purgeAll: true, secret: "test-secret", fetcher });

    const [, init] = fetcher.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ purgeAll: true });
  });

  it("dataだけのpurgeを明示的なpayloadで送る", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse());

    await purgeWorkerCache({ purgeData: true, secret: "test-secret", fetcher });

    const [, init] = fetcher.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ purgeData: true });
  });

  it("100 URLごとに分割する", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => successfulResponse());
    const urls = Array.from({ length: 201 }, (_, index) => `https://stats47.jp/ranking/item-${index}`);

    await purgeWorkerCache({ urls, secret: "test-secret", fetcher });

    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("secretが無ければ外部requestを送らない", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(purgeWorkerCache({ urls: ["https://stats47.jp/"], secret: "", fetcher }))
      .rejects.toThrow("WORKER_CACHE_PURGE_SECRET must be set");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("複数のpurge方式を同時指定できない", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(purgeWorkerCache({ purgeAll: true, purgeData: true, secret: "test-secret", fetcher }))
      .rejects.toThrow("Specify exactly one");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("API失敗を成功扱いしない", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ success: false, error: "purge failed" }, { status: 502 }),
    );

    await expect(purgeWorkerCache({ purgeAll: true, secret: "test-secret", fetcher }))
      .rejects.toThrow("Workers Cache purge failed (502)");
  });
});
