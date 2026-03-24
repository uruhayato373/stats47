import { describe, expect, it, vi } from "vitest";
import { buildRequestParams } from "../../../repositories/api/build-request-params";

// coreモジュールのモック
vi.mock("../../../../core", () => ({
  ESTAT_APP_ID: "test-app-id",
  ESTAT_API: {
    DEFAULT_LANG: "J",
    DATA_FORMAT: "J",
  },
}));

describe("buildRequestParams", () => {
  it("必要なパラメータが全て含まれていること", () => {
    const params = buildRequestParams({ statsDataId: "12345" });
    
    expect(params).toEqual({
      appId: "test-app-id",
      lang: "J",
      dataFormat: "J",
      statsDataId: "12345",
    });
  });

  it("追加のパラメータが正しくマージされること", () => {
    const params = buildRequestParams({ 
      statsDataId: "12345",
      startPosition: 1,
      limit: 100
    });
    
    expect(params).toMatchObject({
      statsDataId: "12345",
      startPosition: 1,
      limit: 100
    });
  });
});
