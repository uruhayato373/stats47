import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMetaInfoFromApi } from "../../../repositories/api/fetch-from-api";
import { mockErrorResponse, mockMetaInfoResponse } from "../../fixtures/mock-responses";

// モジュールのモック
const executeWithRetryMock = vi.fn();
const executeHttpRequestMock = vi.fn();

vi.mock("../../../../core", () => ({
  ESTAT_API: { BASE_URL: "http://example.com" },
  ESTAT_ENDPOINTS: { GET_META_INFO: "/getMetaInfo" },
  ESTAT_APP_ID: "test-id",
  executeWithRetry: (fn: any) => executeWithRetryMock(fn),
  executeHttpRequest: (...args: any[]) => executeHttpRequestMock(...args),
}));

// apiディレクトリ内の依存モジュールは実際のものを使うかモックするか
// ここでは統合的にテストしたいが、validateResponseなどがエラーを吐くか確認するため
// 実装を使う形にする（mockしない）。ただし、外部通信部分はcoreのモックで制御。

describe("fetchFromApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常にデータを取得できること", async () => {
    // executeWithRetryはコールバックを実行してその結果を返す
    executeWithRetryMock.mockImplementation(async (fn) => fn());
    executeHttpRequestMock.mockResolvedValue(mockMetaInfoResponse);

    const result = await fetchMetaInfoFromApi("0000010101");

    expect(result).toBe(mockMetaInfoResponse);
    expect(executeWithRetryMock).toHaveBeenCalled();
    expect(executeHttpRequestMock).toHaveBeenCalledWith(
      "http://example.com",
      "/getMetaInfo",
      expect.objectContaining({ statsDataId: "0000010101" }),
      30000
    );
  });

  it("APIエラー時に例外を伝播させること", async () => {
    executeWithRetryMock.mockImplementation(async (fn) => fn());
    // validateResponseがエラーを投げるようなレスポンスを返す
    executeHttpRequestMock.mockResolvedValue(mockErrorResponse);

    await expect(fetchMetaInfoFromApi("invalid")).rejects.toThrow(/e-STAT APIエラー/);
  });
});
