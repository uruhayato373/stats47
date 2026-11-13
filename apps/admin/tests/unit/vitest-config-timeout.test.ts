import { describe, expect, it } from "vitest";

import config from "../../vitest.config.mts";

/**
 * 高負荷 (tsc・dev サーバーと並行) では初回 import の変換に数秒かかり、
 * 既定 5 秒の testTimeout で lib/server 系のテストが落ちた (2026-10-27 実測)。
 * 120 秒で 311 件が通ったため、既定より十分長いタイムアウトを設定で固定する。
 */
describe("apps/admin vitest 設定のタイムアウト", () => {
  it("testTimeout が既定の 5 秒より十分長い (高負荷時の初回 import 対策)", () => {
    expect(config.test?.testTimeout ?? 5000).toBeGreaterThanOrEqual(60_000);
  });

  it("hookTimeout も同様に既定 10 秒より長い", () => {
    expect(config.test?.hookTimeout ?? 10_000).toBeGreaterThanOrEqual(60_000);
  });
});
