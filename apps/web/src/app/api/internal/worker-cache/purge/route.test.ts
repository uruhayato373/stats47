import { getCloudflareContext, type CloudflareEnv } from "@opennextjs/cloudflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(),
}));

const mockGetCloudflareContext = vi.mocked(getCloudflareContext);
const purge = vi.fn().mockResolvedValue({ success: true, errors: [] });

function purgeRequest(body: unknown, token = "test-secret"): Request {
  return new Request("https://stats47.jp/api/internal/worker-cache/purge", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/internal/worker-cache/purge", () => {
  beforeEach(() => {
    process.env.WORKER_CACHE_PURGE_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_BASE_URL = "https://stats47.jp";
    purge.mockClear();
    mockGetCloudflareContext.mockResolvedValue({
      env: {} as CloudflareEnv,
      cf: undefined,
      ctx: { cache: { purge } },
    });
  });

  afterEach(() => {
    delete process.env.WORKER_CACHE_PURGE_SECRET;
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  it("secret未設定ではpurgeを実行しない", async () => {
    delete process.env.WORKER_CACHE_PURGE_SECRET;

    const response = await POST(purgeRequest({ purgeAll: true }));

    expect(response.status).toBe(503);
    expect(purge).not.toHaveBeenCalled();
  });

  it("不正なBearer tokenを拒否する", async () => {
    const response = await POST(purgeRequest({ purgeAll: true }, "wrong-secret"));

    expect(response.status).toBe(401);
    expect(purge).not.toHaveBeenCalled();
  });

  it("許可origin以外のURLを拒否する", async () => {
    const response = await POST(purgeRequest({ urls: ["https://example.com/"] }));

    expect(response.status).toBe(400);
    expect(purge).not.toHaveBeenCalled();
  });

  it("page URLをpathname Cache-Tagとしてpurgeする", async () => {
    const response = await POST(purgeRequest({
      urls: [
        "https://stats47.jp/blog/example?utm_source=test",
        "https://stats47.jp/blog/example",
      ],
    }));

    expect(response.status).toBe(200);
    expect(purge).toHaveBeenCalledWith({ tags: ["stats47-path:%2Fblog%2Fexample"] });
  });

  it("全cacheをentrypoint単位でpurgeする", async () => {
    const response = await POST(purgeRequest({ purgeAll: true }));

    expect(response.status).toBe(200);
    expect(purge).toHaveBeenCalledWith({ purgeEverything: true });
  });

  it("data cacheだけを共通tagでpurgeする", async () => {
    const response = await POST(purgeRequest({ purgeData: true }));

    expect(response.status).toBe(200);
    expect(purge).toHaveBeenCalledWith({ tags: ["stats47-data"] });
  });

  it("複数のpurge方式を同時指定できない", async () => {
    const response = await POST(purgeRequest({ purgeAll: true, purgeData: true }));

    expect(response.status).toBe(400);
    expect(purge).not.toHaveBeenCalled();
  });

  it("Workers Cache runtimeが無ければ503でfail closedする", async () => {
    mockGetCloudflareContext.mockResolvedValue({
      env: {} as CloudflareEnv,
      cf: undefined,
      ctx: {},
    });

    const response = await POST(purgeRequest({ purgeAll: true }));

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("purge APIの例外を成功扱いしない", async () => {
    purge.mockRejectedValueOnce(new Error("runtime failure"));

    const response = await POST(purgeRequest({ purgeAll: true }));

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
