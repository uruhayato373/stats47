import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeHttpRequest } from "../../../../core/client/http-client";
import { executeWithRetry } from "../../../../core/utils/retry";
import { buildRequestParams } from "../../../repositories/api/build-request-params";
import { fetchStatsDataFromApi } from "../../../repositories/api/fetch-from-api";
import { validateResponse } from "../../../repositories/api/validate-response";
import { EstatStatsDataResponse } from "../../../types/stats-data-response";

// モックデータ
const mockEstatResponse: EstatStatsDataResponse = {
  GET_STATS_DATA: {
    RESULT: { STATUS: 0, ERROR_MSG: "" },
    PARAMETER: { LANG: "ja", STATS_DATA_ID: "testId" },
    STATISTICAL_DATA: {
      TABLE_INF: {} as any,
      CLASS_INF: {} as any,
      DATA_INF: { VALUE: [] },
    },
  },
};

// 依存モジュールのモック
vi.mock("../../../repositories/api/build-request-params", () => ({
  buildRequestParams: vi.fn((params) => new URLSearchParams(params as any)),
}));

vi.mock("../../../repositories/api/validate-response", () => ({
  validateResponse: vi.fn(),
}));

vi.mock("../../../../core/client/http-client", () => ({
  executeHttpRequest: vi.fn(() => Promise.resolve(mockEstatResponse)),
}));

vi.mock("../../../../core/utils/retry", () => ({
  executeWithRetry: vi.fn((fn) => fn()), // リトライせずに直接実行
}));

describe("APIからの統計データ取得 (fetchFromApi)", () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  it("e-Stat APIからデータを正常に取得する", async () => {
    const statsDataId = "testId";
    const options = { categoryFilter: "cat01" };

    const result = await fetchStatsDataFromApi({ statsDataId, ...options });

    expect(buildRequestParams).toHaveBeenCalledWith(
      expect.objectContaining({ statsDataId, categoryFilter: "cat01" })
    );
    expect(executeWithRetry).toHaveBeenCalled();
    expect(executeHttpRequest).toHaveBeenCalled();
    expect(validateResponse).toHaveBeenCalledWith(result, expect.any(String));
    expect(result).toEqual(mockEstatResponse);
  });

  it("API呼び出しが失敗した場合、エラーをスローする", async () => {
    vi.mocked(executeHttpRequest).mockImplementationOnce(() => {
      throw new Error("APIエラーが発生しました");
    });

    await expect(fetchStatsDataFromApi({ statsDataId: "testId" })).rejects.toThrow("APIエラーが発生しました");
  });

  it("レスポンスバリデーションが失敗した場合、エラーをスローする", async () => {
    // executeHttpRequest はデフォルトで成功するはず
    vi.mocked(validateResponse).mockImplementationOnce(() => {
      throw new Error("バリデーションエラーが発生しました");
    });

    await expect(fetchStatsDataFromApi({ statsDataId: "testId" })).rejects.toThrow("バリデーションエラーが発生しました");
  });
});
