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

    // toThrow(substring) で「throw すること」と「メッセージ内容」を同時に検証する
    // (try/catch + catch 内 expect だと throw しないとき素通り＝偽陽性になるため)。
    expect(() => validateRequiredEnvVars()).toThrow("GitHub");
  });

  it("非 CI 環境でのエラーメッセージに .env.local の案内を含む", () => {
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_ESTAT_APP_ID;

    expect(() => validateRequiredEnvVars()).toThrow(".env.local");
  });

  // パブリッシャー ID はサイト識別子の正本 (@stats47/types の SITE) にあり、環境変数を要求しない
  it("AdSense 有効時もパブリッシャー ID の環境変数を要求しない", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://stats47.jp";
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-app-id";
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED = "true";

    expect(() => validateRequiredEnvVars()).not.toThrow();
  });
});
