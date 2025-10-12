import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Display from "./Display";

// Mock the hooks
jest.mock("./hooks/useVisualizationSettings", () => ({
  useVisualizationSettings: () => ({
    settings: null,
    editableSettings: {},
    setEditableSettings: jest.fn(),
    loading: false,
    saving: false,
    saveSuccess: false,
    saveSettings: jest.fn(),
  }),
}));

jest.mock("./hooks/usePrefectureRankingData", () => ({
  usePrefectureRankingData: () => ({
    formattedData: {
      years: ["2020", "2021"],
    },
    filteredData: [],
    summary: null,
  }),
}));

jest.mock("./hooks/useMapOptions", () => ({
  useMapOptions: () => ({
    mapOptions: {
      colorScheme: "viridis",
      divergingMidpoint: "mean",
    },
    setMapOptions: jest.fn(),
  }),
}));

jest.mock("./hooks/useYearSelection", () => ({
  useYearSelection: () => ({
    selectedYear: "2020",
    setSelectedYear: jest.fn(),
  }),
}));

// Mock child components
jest.mock("@/components/d3/ChoroplethMap", () => {
  return function MockChoroplethMap() {
    return <div data-testid="choropleth-map">Choropleth Map</div>;
  };
});

jest.mock("@/components/estat/prefecture-ranking/DataTable", () => {
  return function MockDataTable() {
    return <div data-testid="data-table">Data Table</div>;
  };
});

jest.mock("@/components/common/YearSelector", () => {
  return function MockYearSelector() {
    return <div data-testid="year-selector">Year Selector</div>;
  };
});

jest.mock("@/components/common/ColorSchemeSelector", () => {
  return function MockColorSchemeSelector() {
    return <div data-testid="color-scheme-selector">Color Scheme Selector</div>;
  };
});

const mockProps = {
  data: [],
  loading: false,
  error: null,
  params: {
    statsDataId: "test-id",
    categoryCode: "test-category",
  },
};

describe("Display", () => {
  it("should render without crashing", () => {
    render(<Display {...mockProps} />);

    expect(screen.getByTestId("year-selector")).toBeInTheDocument();
    expect(screen.getByTestId("color-scheme-selector")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<Display {...mockProps} loading={true} />);

    expect(screen.getByText("データを読み込み中...")).toBeInTheDocument();
  });

  it("should show error state", () => {
    render(<Display {...mockProps} error="Test error" />);

    expect(
      screen.getByText("エラーが発生しました: Test error")
    ).toBeInTheDocument();
  });

  it("should show empty data message when no data", () => {
    render(<Display {...mockProps} data={[]} />);

    expect(screen.getByText("表示するデータがありません")).toBeInTheDocument();
  });

  it("should toggle settings panel", async () => {
    render(<Display {...mockProps} />);

    const settingsButton = screen.getByText("設定");
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText("可視化設定")).toBeInTheDocument();
    });
  });
});
