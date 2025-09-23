import { render, screen, fireEvent } from "@testing-library/react";
import VisualizationSettingsPanel from "./VisualizationSettingsPanel";
import { VisualizationSettings } from "@/lib/ranking/visualization-settings";

describe("VisualizationSettingsPanel", () => {
  const mockOnSettingsChange = jest.fn();
  const defaultProps = {
    editableSettings: {
      ranking_direction: "desc" as const,
      conversion_factor: 1,
      decimal_places: 0,
    },
    visualizationSettings: {
      id: 1,
      stats_data_id: "test-id",
      cat01: "test-cat",
      map_color_scheme: "interpolateBlues",
      map_diverging_midpoint: "zero" as const,
      ranking_direction: "desc" as const,
      conversion_factor: 1,
      decimal_places: 0,
      created_at: "2025-09-23T00:00:00.000Z",
      updated_at: "2025-09-23T00:00:00.000Z",
    } as VisualizationSettings,
    params: {
      statsDataId: "test-id",
      categoryCode: "test-cat",
    },
    onSettingsChange: mockOnSettingsChange,
  };

  beforeEach(() => {
    mockOnSettingsChange.mockClear();
  });

  it("renders all form fields correctly", () => {
    render(<VisualizationSettingsPanel {...defaultProps} />);

    // ランキング方向
    expect(screen.getByLabelText("ランキング方向")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("desc");

    // 変換係数
    expect(screen.getByLabelText("変換係数")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("1")).toHaveValue(1);

    // 小数点以下桁数
    expect(screen.getByLabelText("小数点以下桁数")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0")).toHaveValue(0);

    // 統計表ID
    expect(screen.getByLabelText("統計表ID")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test-id")).toBeDisabled();

    // カテゴリコード
    expect(screen.getByLabelText("カテゴリコード")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test-cat")).toBeDisabled();
  });

  it("calls onSettingsChange when ranking direction is changed", () => {
    render(<VisualizationSettingsPanel {...defaultProps} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "asc" } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...defaultProps.editableSettings,
      ranking_direction: "asc",
    });
  });

  it("calls onSettingsChange when conversion factor is changed", () => {
    render(<VisualizationSettingsPanel {...defaultProps} />);

    const input = screen.getByPlaceholderText("1");
    fireEvent.change(input, { target: { value: "0.001" } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...defaultProps.editableSettings,
      conversion_factor: 0.001,
    });
  });

  it("calls onSettingsChange when decimal places is changed", () => {
    render(<VisualizationSettingsPanel {...defaultProps} />);

    const input = screen.getByPlaceholderText("0");
    fireEvent.change(input, { target: { value: "2" } });

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...defaultProps.editableSettings,
      decimal_places: 2,
    });
  });

  it("displays settings information when visualizationSettings is provided", () => {
    render(<VisualizationSettingsPanel {...defaultProps} />);

    expect(screen.getByText("設定ID: 1")).toBeInTheDocument();
    expect(screen.getByText(/作成日時: 2025\/9\/23/)).toBeInTheDocument();
    expect(screen.getByText(/更新日時: 2025\/9\/23/)).toBeInTheDocument();
  });

  it("does not display settings information when visualizationSettings is null", () => {
    const propsWithoutSettings = {
      ...defaultProps,
      visualizationSettings: null,
    };

    render(<VisualizationSettingsPanel {...propsWithoutSettings} />);

    expect(screen.queryByText("設定ID:")).not.toBeInTheDocument();
    expect(screen.queryByText(/作成日時:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/更新日時:/)).not.toBeInTheDocument();
  });
});
