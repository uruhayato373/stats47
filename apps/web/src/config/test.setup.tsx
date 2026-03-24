import * as React from "react";
import { act as reactAct } from "react";

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { act as reactDomAct } from "react-dom/test-utils";
import { afterEach, expect, vi } from "vitest";

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// React.act の polyfill
// @testing-library/react が使用する React.act を正しく設定
if (typeof global.React === "undefined") {
  global.React = React as unknown as typeof React;
}
if (typeof (global.React as unknown as typeof React).act === "undefined") {
  (global.React as unknown as { act: typeof reactAct }).act = reactAct;
}

// react-dom/test-utils の act も設定
if (
  typeof (global as unknown as { act?: typeof reactDomAct }).act === "undefined"
) {
  (global as unknown as { act: typeof reactDomAct }).act = reactDomAct;
}

// @testing-library/react が使用する act をグローバルに設定
// React 19 と @testing-library/react 16 の互換性のため
if (typeof (global as unknown as { act?: typeof reactAct }).act === "undefined") {
  (global as unknown as { act: typeof reactAct }).act = reactAct;
}

// ResizeObserver のモック（Radix UI等で使用）
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
} as typeof ResizeObserver;

// Radix UI Select 等で使用される DOM メソッドのモック
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();

// Next.js Router のモック
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// テスト環境ではプリウォーム処理を無効化（パフォーマンス向上）
// GeoShapeLoaderのプリウォーム処理が都道府県ごとに実行されるのを防ぐ
if (typeof process !== "undefined") {
  process.env.VITEST = "true";
}

// 共通データベースモックをグローバルに設定
vi.mock("@/features/database", async () => {
  const mock = await import("@stats47/database/testing");
  return mock;
});

// 共通R2ストレージモックをグローバルに設定
// vi.mock("@/features/r2-storage/lib/r2-adapter", async () => {
//   const mock = await import("@/features/r2-storage/__mocks__");
//   return mock;
// });
