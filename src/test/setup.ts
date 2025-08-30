import { vi } from "vitest";

// グローバルモックの設定
global.console = {
  ...console,
  // テスト中のログ出力を抑制（必要に応じて）
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// fetchのモック（必要に応じて）
global.fetch = vi.fn();

// 環境変数のモック
process.env.NODE_ENV = "test";
process.env.CLOUDFLARE_API_TOKEN = "test_token";
process.env.CLOUDFLARE_ACCOUNT_ID = "test_account";
process.env.CLOUDFLARE_D1_DATABASE_ID = "test_database";
