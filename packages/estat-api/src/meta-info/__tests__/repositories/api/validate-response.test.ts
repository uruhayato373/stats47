import { describe, expect, it, vi } from "vitest";
import { validateResponse } from "../../../repositories/api/validate-response";

// loggerのモック
vi.mock("@stats47/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe("validateResponse", () => {
  it("STATUS=0の正常レスポンスで例外を投げないこと", () => {
    const validData = {
      GET_META_INFO: {
        RESULT: { STATUS: 0, ERROR_MSG: "" }
      }
    };
    expect(() => validateResponse(validData)).not.toThrow();
  });

  it("STATUS=1の警告レスポンスで例外を投げないこと(ログ出力のみ)", () => {
    const warningData = {
      GET_META_INFO: {
        RESULT: { STATUS: 1, ERROR_MSG: "警告" }
      }
    };
    expect(() => validateResponse(warningData)).not.toThrow();
  });

  it("STATUS>=100のエラーレスポンスで例外を投げること", () => {
    const errorData = {
      GET_META_INFO: {
        RESULT: { STATUS: 100, ERROR_MSG: "エラー" }
      }
    };
    expect(() => validateResponse(errorData)).toThrow(/e-STAT APIエラー/);
  });

  it("不正な形式のレスポンスで例外を投げること", () => {
    expect(() => validateResponse(null)).toThrow("不正なレスポンス形式です");
    expect(() => validateResponse({})).toThrow("不正なレスポンス形式です"); // GET_META_INFOがない
  });
});
