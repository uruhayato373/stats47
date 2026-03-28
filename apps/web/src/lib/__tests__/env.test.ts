import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getRequiredBaseUrl } from "../env";

describe("getRequiredBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("NEXT_PUBLIC_BASE_URL が設定されている場合にその値を返す", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://custom.example.com";
    expect(getRequiredBaseUrl()).toBe("https://custom.example.com");
  });

  it("NEXT_PUBLIC_BASE_URL が未設定で production 環境の場合にデフォルト URL を返す", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_ENV = "production";
    expect(getRequiredBaseUrl()).toBe("https://stats47.jp");
  });

  it("NEXT_PUBLIC_BASE_URL が未設定で development 環境の場合にデフォルト URL を返す", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_ENV;
    expect(getRequiredBaseUrl()).toBe("http://localhost:3000");
  });
});
