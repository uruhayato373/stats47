import { render, screen, waitFor } from "@testing-library/react";
import { EstatDataFetcher } from "./EstatDataFetcher";

// fetch APIをモック
global.fetch = jest.fn();

// 環境変数をモック
const originalEnv = process.env;

describe("EstatDataFetcher Component", () => {
  const mockOnDataUpdate = jest.fn();
  const mockOnLoadingChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("初期状態でローディングが表示される", () => {
    render(
      <EstatDataFetcher
        regionCode="13"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    expect(screen.getByText("データを取得中...")).toBeInTheDocument();
    expect(mockOnLoadingChange).toHaveBeenCalledWith(true);
  });

  test("e-Stat APIキーがない場合の警告が表示される", () => {
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = undefined;

    render(
      <EstatDataFetcher
        regionCode="13"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    expect(
      screen.getByText(
        "⚠️ e-Stat APIキーが設定されていません。サンプルデータを表示します。"
      )
    ).toBeInTheDocument();
  });

  test("e-Stat APIキーがある場合の処理", async () => {
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-api-key";

    const mockApiResponse = {
      json: () =>
        Promise.resolve({
          GET_STATS_DATA: {
            DATA_INF: {
              VALUE: [
                { "@area": "13100", "@time": "2020", $: "14047594" },
                { "@area": "13100", "@time": "2021", $: "14047594" },
              ],
            },
          },
        }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockApiResponse);

    render(
      <EstatDataFetcher
        regionCode="13"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    await waitFor(() => {
      expect(mockOnDataUpdate).toHaveBeenCalled();
      expect(mockOnLoadingChange).toHaveBeenCalledWith(false);
    });
  });

  test("APIエラー時の処理", async () => {
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-api-key";

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    render(
      <EstatDataFetcher
        regionCode="13"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "❌ データの取得に失敗しました。サンプルデータを表示します。"
        )
      ).toBeInTheDocument();
      expect(mockOnLoadingChange).toHaveBeenCalledWith(false);
    });
  });

  test("地域コードが変更された時の処理", async () => {
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-api-key";

    const mockApiResponse = {
      json: () =>
        Promise.resolve({
          GET_STATS_DATA: {
            DATA_INF: {
              VALUE: [
                { "@area": "27100", "@time": "2020", $: "8837685" },
                { "@area": "27100", "@time": "2021", $: "8837685" },
              ],
            },
          },
        }),
    };

    (fetch as jest.Mock).mockResolvedValue(mockApiResponse);

    const { rerender } = render(
      <EstatDataFetcher
        regionCode="13"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    // 地域コードを変更
    rerender(
      <EstatDataFetcher
        regionCode="27"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test("コールバック関数が正しく呼ばれる", async () => {
    process.env.NEXT_PUBLIC_ESTAT_APP_ID = "test-api-key";

    const mockApiResponse = {
      json: () =>
        Promise.resolve({
          GET_STATS_DATA: {
            DATA_INF: {
              VALUE: [],
            },
          },
        }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce(mockApiResponse);

    render(
      <EstatDataFetcher
        regionCode="13"
        onDataUpdate={mockOnDataUpdate}
        onLoadingChange={mockOnLoadingChange}
      />
    );

    await waitFor(() => {
      expect(mockOnLoadingChange).toHaveBeenCalledWith(true);
      expect(mockOnLoadingChange).toHaveBeenCalledWith(false);
      expect(mockOnDataUpdate).toHaveBeenCalled();
    });
  });
});
