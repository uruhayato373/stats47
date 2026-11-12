import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@stats47/logger";
import { executeHttpRequest } from "../http-client";

vi.mock("@stats47/logger", () => ({ logger: { debug: vi.fn(), error: vi.fn() } }));
vi.mock("../../utils/index", () => ({ estatRateLimiter: { acquire: vi.fn().mockResolvedValue(undefined) } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("HTTPS_PROXY", "");
  vi.stubEnv("HTTP_PROXY", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("e-Stat HTTP errors", () => {
  it("keeps the table and HTTP failure visible without logging query credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(executeHttpRequest("https://api.e-stat.go.jp/rest/3.0", "/app/json/getStatsData", {
      appId: "private-app-id", access_token: "private-token", statsDataId: "0000020201",
    })).rejects.toThrow("HTTP error! status: 503");
    const log = JSON.stringify(vi.mocked(logger.error).mock.calls);
    expect(log).toContain("0000020201");
    expect(log).toContain("503");
    expect(log).not.toContain("private-app-id");
    expect(log).not.toContain("private-token");
  });

  it("redacts encoded or raw secrets from transport errors before logging or rethrowing", async () => {
    const secret = "a-secret/with+symbols";
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      throw new TypeError(`fetch failed: ${url}; credential=${secret}`);
    }));
    let caught: unknown;
    try {
      await executeHttpRequest("https://api.e-stat.go.jp/rest/3.0", "/app/json/getStatsData", {
        appId: secret, statsDataId: "0000020201",
      });
    } catch (error) { caught = error; }
    const log = JSON.stringify(vi.mocked(logger.error).mock.calls);
    expect(log).not.toContain(secret);
    expect(log).not.toContain(encodeURIComponent(secret));
    expect(String(caught)).toContain("fetch failed");
    expect(String(caught)).not.toContain(secret);
    expect(String(caught)).not.toContain(encodeURIComponent(secret));
  });
});
