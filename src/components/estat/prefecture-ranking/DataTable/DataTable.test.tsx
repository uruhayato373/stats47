import { render, screen, fireEvent } from "@testing-library/react";
import DataTable from "./DataTable";

const mockData = [
  {
    areaCode: "01",
    areaName: "北海道",
    numericValue: 1000,
    displayValue: "1,000",
    unit: "人",
    categoryCode: "A",
    timeCode: "2020",
  },
  {
    areaCode: "02",
    areaName: "青森県",
    numericValue: 500,
    displayValue: "500",
    unit: "人",
    categoryCode: "A",
    timeCode: "2020",
  },
];

const mockProps = {
  data: mockData,
  className: "test-class",
  rankingDirection: "desc" as const,
};

describe("DataTable", () => {
  it("should render without crashing", () => {
    render(<DataTable {...mockProps} />);

    expect(screen.getByText("都道府県ランキング表")).toBeInTheDocument();
    expect(screen.getByText("(2件)")).toBeInTheDocument();
  });

  it("should display table headers", () => {
    render(<DataTable {...mockProps} />);

    expect(screen.getByText("順位")).toBeInTheDocument();
    expect(screen.getByText("都道府県")).toBeInTheDocument();
    expect(screen.getByText("値")).toBeInTheDocument();
    expect(screen.getByText("表示値")).toBeInTheDocument();
  });

  it("should display data rows", () => {
    render(<DataTable {...mockProps} />);

    expect(screen.getByText("北海道")).toBeInTheDocument();
    expect(screen.getByText("青森県")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("should show empty state when no data", () => {
    render(<DataTable {...mockProps} data={[]} />);

    expect(screen.getByText("表示するデータがありません")).toBeInTheDocument();
  });

  it("should show empty state when data is null", () => {
    render(<DataTable {...mockProps} data={null as any} />);

    expect(screen.getByText("表示するデータがありません")).toBeInTheDocument();
  });

  it("should display statistics in footer", () => {
    render(<DataTable {...mockProps} />);

    expect(screen.getByText("データ数: 2件")).toBeInTheDocument();
    expect(screen.getByText("最大値: 1,000")).toBeInTheDocument();
    expect(screen.getByText("最小値: 500")).toBeInTheDocument();
    expect(screen.getByText("平均値: 750")).toBeInTheDocument();
  });

  it("should handle sorting when header is clicked", () => {
    render(<DataTable {...mockProps} />);

    const rankHeader = screen.getByText("順位");
    fireEvent.click(rankHeader);

    // The component should still render without errors
    expect(screen.getByText("都道府県ランキング表")).toBeInTheDocument();
  });

  it("should display rank badges", () => {
    render(<DataTable {...mockProps} />);

    // Check if rank badges are present (they should be in the table)
    const rankElements = screen.getAllByText(/^[12]$/);
    expect(rankElements).toHaveLength(2);
  });

  it("should display area codes", () => {
    render(<DataTable {...mockProps} />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("should display units", () => {
    render(<DataTable {...mockProps} />);

    expect(screen.getAllByText("人")).toHaveLength(2);
  });
});
