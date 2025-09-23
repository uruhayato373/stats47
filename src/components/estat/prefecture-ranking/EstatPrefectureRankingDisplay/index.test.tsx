import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EstatPrefectureRankingDisplay from "./index";
import { VisualizationSettingsService } from "@/lib/ranking/visualization-settings";

// モック設定
jest.mock("@/lib/ranking/visualization-settings", () => ({
  VisualizationSettingsService: {
    fetchSettings: jest.fn(),
    saveSettings: jest.fn(),
    getDefaultSettings: jest.fn(),
    applyConversion: jest.fn((value) => value),
  },
}));

describe("EstatPrefectureRankingDisplay", () => {
  const mockData = {
    GET_STATS_DATA: {
      STATISTICAL_DATA: {
        DATA_INF: {
          VALUE: [
            {
              "@time": "2020000000",
              "@cat01": "A",
              "@area": "13000",
              $: "100",
            },
            {
              "@time": "2020000000",
              "@cat01": "A",
              "@area": "14000",
              $: "200",
            },
          ],
        },
      },
    },
  };

  const defaultProps = {
    data: mockData,
    loading: false,
    error: null,
    params: {
      statsDataId: "test-id",
      categoryCode: "A",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (VisualizationSettingsService.fetchSettings as jest.Mock).mockResolvedValue(
      {
        success: true,
        settings: {
          id: 1,
          stats_data_id: "test-id",
          cat01: "A",
          map_color_scheme: "interpolateBlues",
          map_diverging_midpoint: "zero",
          ranking_direction: "desc",
          conversion_factor: 1,
          decimal_places: 0,
        },
      }
    );
  });

  it("renders loading state", () => {
    render(<EstatPrefectureRankingDisplay {...defaultProps} loading={true} />);
    expect(screen.getByText("データを取得中...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <EstatPrefectureRankingDisplay
        {...defaultProps}
        error="エラーが発生しました"
      />
    );
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<EstatPrefectureRankingDisplay {...defaultProps} data={null} />);
    expect(
      screen.getByText(
        "上のフォームから統計表IDを入力してデータを取得してください"
      )
    ).toBeInTheDocument();
  });

  it("loads and displays data correctly", async () => {
    render(<EstatPrefectureRankingDisplay {...defaultProps} />);

    // 設定が読み込まれることを確認
    await waitFor(() => {
      expect(VisualizationSettingsService.fetchSettings).toHaveBeenCalledWith(
        "test-id",
        "A"
      );
    });

    // 年次セレクターが表示されることを確認
    expect(screen.getByText("2020年")).toBeInTheDocument();
  });

  it("toggles settings panel", () => {
    render(<EstatPrefectureRankingDisplay {...defaultProps} />);

    const settingsButton = screen.getByText("詳細設定");
    fireEvent.click(settingsButton);

    expect(screen.getByText("可視化設定の詳細")).toBeInTheDocument();
  });

  it("saves settings successfully", async () => {
    (VisualizationSettingsService.saveSettings as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(<EstatPrefectureRankingDisplay {...defaultProps} />);

    const saveButton = screen.getByText("設定を保存");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("保存完了")).toBeInTheDocument();
    });
  });

  it("handles save error", async () => {
    const mockError = "保存に失敗しました";
    (VisualizationSettingsService.saveSettings as jest.Mock).mockResolvedValue({
      success: false,
      error: mockError,
    });

    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<EstatPrefectureRankingDisplay {...defaultProps} />);

    const saveButton = screen.getByText("設定を保存");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        `設定の保存に失敗しました: ${mockError}`
      );
    });

    alertMock.mockRestore();
  });
});
