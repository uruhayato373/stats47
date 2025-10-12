import { render, screen, fireEvent } from "@testing-library/react";
import SettingsPanel from "./SettingsPanel";

const mockVisualizationSettings = {
  stats_data_id: "test-id",
  cat01: "test-category",
  map_color_scheme: "viridis",
  map_diverging_midpoint: "mean",
  ranking_direction: "desc",
  unit_conversion: "none",
  chart_type: "choropleth",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockParams = {
  statsDataId: "test-id",
  categoryCode: "test-category",
  timeCode: "2020",
};

const mockProps = {
  editableSettings: {},
  visualizationSettings: mockVisualizationSettings,
  params: mockParams,
  onSettingsChange: jest.fn(),
};

describe("SettingsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<SettingsPanel {...mockProps} />);

    expect(screen.getByText("可視化設定の詳細")).toBeInTheDocument();
  });

  it("should display ranking direction section", () => {
    render(<SettingsPanel {...mockProps} />);

    expect(screen.getByText("ランキング方向")).toBeInTheDocument();
    expect(screen.getByText("降順（高い順）")).toBeInTheDocument();
    expect(screen.getByText("昇順（低い順）")).toBeInTheDocument();
  });

  it("should display unit conversion section", () => {
    render(<SettingsPanel {...mockProps} />);

    expect(screen.getByText("単位変換")).toBeInTheDocument();
    expect(screen.getByText("変換なし")).toBeInTheDocument();
    expect(screen.getByText("千単位")).toBeInTheDocument();
    expect(screen.getByText("万単位")).toBeInTheDocument();
  });

  it("should display chart type section", () => {
    render(<SettingsPanel {...mockProps} />);

    expect(screen.getByText("チャートタイプ")).toBeInTheDocument();
    expect(screen.getByText("コロプレス地図")).toBeInTheDocument();
    expect(screen.getByText("棒グラフ")).toBeInTheDocument();
  });

  it("should call onSettingsChange when ranking direction changes", () => {
    render(<SettingsPanel {...mockProps} />);

    const ascendingRadio = screen.getByLabelText("昇順（低い順）");
    fireEvent.click(ascendingRadio);

    expect(mockProps.onSettingsChange).toHaveBeenCalledWith({
      ranking_direction: "asc",
    });
  });

  it("should call onSettingsChange when unit conversion changes", () => {
    render(<SettingsPanel {...mockProps} />);

    const thousandRadio = screen.getByLabelText("千単位");
    fireEvent.click(thousandRadio);

    expect(mockProps.onSettingsChange).toHaveBeenCalledWith({
      unit_conversion: "thousand",
    });
  });

  it("should call onSettingsChange when chart type changes", () => {
    render(<SettingsPanel {...mockProps} />);

    const barChartRadio = screen.getByLabelText("棒グラフ");
    fireEvent.click(barChartRadio);

    expect(mockProps.onSettingsChange).toHaveBeenCalledWith({
      chart_type: "bar",
    });
  });

  it("should show current settings values", () => {
    render(<SettingsPanel {...mockProps} />);

    // Check if the current values are selected
    const descendingRadio = screen.getByLabelText("降順（高い順）");
    expect(descendingRadio).toBeChecked();

    const noneRadio = screen.getByLabelText("変換なし");
    expect(noneRadio).toBeChecked();

    const choroplethRadio = screen.getByLabelText("コロプレス地図");
    expect(choroplethRadio).toBeChecked();
  });

  it("should handle null visualization settings", () => {
    render(<SettingsPanel {...mockProps} visualizationSettings={null} />);

    expect(screen.getByText("可視化設定の詳細")).toBeInTheDocument();

    // Default values should be selected
    const descendingRadio = screen.getByLabelText("降順（高い順）");
    expect(descendingRadio).toBeChecked();
  });

  it("should handle null params", () => {
    render(<SettingsPanel {...mockProps} params={null} />);

    expect(screen.getByText("可視化設定の詳細")).toBeInTheDocument();
  });

  it("should display editable settings when provided", () => {
    const editableSettings = {
      ranking_direction: "asc",
      unit_conversion: "thousand",
    };

    render(
      <SettingsPanel {...mockProps} editableSettings={editableSettings} />
    );

    const ascendingRadio = screen.getByLabelText("昇順（低い順）");
    expect(ascendingRadio).toBeChecked();

    const thousandRadio = screen.getByLabelText("千単位");
    expect(thousandRadio).toBeChecked();
  });
});
