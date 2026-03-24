/**
 * estat-api/stats-data/index のテスト
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as statsData from "../index";

describe("統計データモジュールのインデックス (estat-api/stats-data/index)", () => {
  it("すべてのモジュールをエクスポートする", () => {
    expect(statsData).toBeDefined();
  });
});

