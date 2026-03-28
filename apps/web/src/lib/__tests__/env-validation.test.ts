import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { validateRequiredEnvVars } from "../env-validation";

describe("validateRequiredEnvVars", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("全ての必須環境変数が設定されている場合にエラーをスローしない", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://stats47.jp";
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";

    expect(() => validateRequiredEnvVars()).not.toThrow();
  });

  it("NEXT_PUBLIC_BASE_URL が未設定の場合にエラーをスローする", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";

    expect(() => validateRequiredEnvVars()).toThrow("必須環境変数が不足しています");
  });

  it("NEXT_PUBLIC_ESTAT_APP_ID が未設定の場合にエラーをスローする", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://stats47.jp";
    delete process.env.NEXT_PUBLIC_ESTAT_APP_ID;

    expect(() => validateRequiredEnvVars()).toThrow("必須環境変数が不足しています");
  });

  it("環境変数が空文字列の場合にエラーをスローする", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "   ";
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";

    expect(() => validateRequiredEnvVars()).toThrow("空文字列");
  });

  it("CI 環境でのエラーメッセージに GitHub Actions の案内を含む", () => {
    process.env.CI = "true";
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_ESTAT_APP_ID;

    try {
      validateRequiredEnvVars();
    } catch (e) {
      expect((e as Error).message).toContain("GitHub");
    }
  });

  it("非 CI 環境でのエラーメッセージに .env.local の案内を含む", () => {
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_ESTAT_APP_ID;

    try {
      validateRequiredEnvVars();
    } catch (e) {
      expect((e as Error).message).toContain(".env.local");
    }
  });

  it("AdSense 有効時に CLIENT_ID が未設定ならエラーに含む", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://stats47.jp";
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;

    expect(() => validateRequiredEnvVars()).toThrow("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID");
  });

  it("AdSense 無効時に CLIENT_ID が未設定でもエラーにならない", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://stats47.jp";
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED = "false";

    expect(() => validateRequiredEnvVars()).not.toThrow();
  });
});
