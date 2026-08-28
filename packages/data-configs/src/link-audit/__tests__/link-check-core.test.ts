import { describe, expect, it, vi } from "vitest";

import {
  classifyLinkStatus,
  isAlertVerdict,
  isVerificationStale,
  probeLinkWithRetry,
  type LinkProbeTarget,
} from "../link-check-core";

const target: LinkProbeTarget = {
  targetId: "source:test",
  label: "homepage",
  url: "https://example.test/",
  verifiedAt: "2026-08-01",
  alertOwner: "open-data-curator",
};

function response(status: number): Response {
  return new Response(null, { status });
}

describe("link audit retry and stale contract", () => {
  it("HTTP statusを決定的に分類する", () => {
    expect(classifyLinkStatus(200)).toBe("ok");
    expect(classifyLinkStatus(302)).toBe("ok");
    expect(classifyLinkStatus(403)).toBe("bot-block");
    expect(classifyLinkStatus(404)).toBe("gone");
    expect(classifyLinkStatus(410)).toBe("gone");
    expect(classifyLinkStatus(429)).toBe("gone");
    expect(classifyLinkStatus(503)).toBe("server-err");
  });

  it("5xxを再試行して回復時のattempt数を返す", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await probeLinkWithRetry(target, {
      fetchFn,
      sleep,
      now: new Date("2026-08-27T00:00:00Z"),
    });
    expect(result).toMatchObject({ verdict: "ok", attempts: 2 });
    expect(sleep).toHaveBeenCalledWith(250);
  });

  it("timeoutを上限まで再試行しalertにする", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("timeout"));
    const result = await probeLinkWithRetry(target, {
      fetchFn,
      sleep: async () => undefined,
      maxAttempts: 3,
    });
    expect(result).toMatchObject({ verdict: "timeout", attempts: 3 });
    expect(isAlertVerdict(result.verdict)).toBe(true);
  });

  it("404と403は再試行しない", async () => {
    for (const [status, verdict] of [[404, "gone"], [403, "bot-block"]] as const) {
      const fetchFn = vi.fn().mockResolvedValue(response(status));
      const result = await probeLinkWithRetry(target, { fetchFn });
      expect(result).toMatchObject({ verdict, attempts: 1 });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    }
  });

  it("検証日が閾値超過または不正ならstaleにする", async () => {
    expect(isVerificationStale("2026-04-01", new Date("2026-08-27T00:00:00Z"))).toBe(true);
    expect(isVerificationStale("invalid", new Date("2026-08-27T00:00:00Z"))).toBe(true);
    const result = await probeLinkWithRetry(
      { ...target, verifiedAt: "2026-04-01" },
      { fetchFn: vi.fn().mockResolvedValue(response(200)), now: new Date("2026-08-27T00:00:00Z") },
    );
    expect(result.verdict).toBe("stale");
  });

  it("maxAttempts 0をfail-closedにする", async () => {
    await expect(probeLinkWithRetry(target, { maxAttempts: 0 })).rejects.toThrow("maxAttempts");
  });
});
