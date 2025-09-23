import { render, screen, fireEvent } from "@testing-library/react";
import EstatPrefectureDataTable from "./index";

describe("EstatPrefectureDataTable", () => {
  const mockData = [
    {
      areaCode: "13000",
      areaName: "東京都",
      categoryCode: "A",
      timeCode: "2020000000",
      numericValue: 1000000,
      displayValue: "1,000,000",
      unit: "人",
    },
    {
      areaCode: "14000",
      areaName: "神奈川県",
      categoryCode: "A",
      timeCode: "2020000000",
      numericValue: 800000,
      displayValue: "800,000",
      unit: "人",
    },
    {
      areaCode: "27000",
      areaName: "大阪府",
      categoryCode: "A",
      timeCode: "2020000000",
      numericValue: 700000,
      displayValue: "700,000",
      unit: "人",
    },
  ];

  it("renders table with data", () => {
    render(<EstatPrefectureDataTable data={mockData} />);

    expect(screen.getByText("都道府県ランキング表")).toBeInTheDocument();
    expect(screen.getByText("東京都")).toBeInTheDocument();
    expect(screen.getByText("神奈川県")).toBeInTheDocument();
    expect(screen.getByText("大阪府")).toBeInTheDocument();
  });

  it("displays empty state when no data", () => {
    render(<EstatPrefectureDataTable data={[]} />);
    expect(screen.getByText("表示するデータがありません")).toBeInTheDocument();
  });

  it("sorts data by rank correctly", () => {
    render(<EstatPrefectureDataTable data={mockData} />);

    const rankHeader = screen.getByText("順位");
    fireEvent.click(rankHeader);

    const rows = screen.getAllByRole("row");
    const firstRank = rows[1].querySelector("span");
    expect(firstRank).toHaveTextContent("1");
  });

  it("sorts data by prefecture name correctly", () => {
    render(<EstatPrefectureDataTable data={mockData} />);

    const prefectureHeader = screen.getByText("都道府県");
    fireEvent.click(prefectureHeader);

    const rows = screen.getAllByRole("row");
    const firstPrefecture = rows[1].querySelectorAll("td")[1];
    expect(firstPrefecture).toHaveTextContent("神奈川県");
  });

  it("sorts data by value correctly", () => {
    render(<EstatPrefectureDataTable data={mockData} />);

    const valueHeader = screen.getByText("値");
    fireEvent.click(valueHeader);

    const rows = screen.getAllByRole("row");
    const firstValue = rows[1].querySelectorAll("td")[2];
    expect(firstValue).toHaveTextContent("1,000,000");
  });

  it("toggles sort direction on header click", () => {
    render(<EstatPrefectureDataTable data={mockData} />);

    const valueHeader = screen.getByText("値");
    fireEvent.click(valueHeader); // 降順
    fireEvent.click(valueHeader); // 昇順

    const rows = screen.getAllByRole("row");
    const firstValue = rows[1].querySelectorAll("td")[2];
    expect(firstValue).toHaveTextContent("700,000");
  });

  it("displays statistics in footer", () => {
    render(<EstatPrefectureDataTable data={mockData} />);

    expect(screen.getByText("データ数: 3件")).toBeInTheDocument();
    expect(screen.getByText(/最大値: 1,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/最小値: 700,000/)).toBeInTheDocument();
    expect(screen.getByText(/平均値: 833,333/)).toBeInTheDocument();
  });

  it("respects rankingDirection prop", () => {
    render(<EstatPrefectureDataTable data={mockData} rankingDirection="asc" />);

    const rows = screen.getAllByRole("row");
    const firstRank = rows[1].querySelector("span");
    expect(firstRank).toHaveTextContent("1");

    const firstValue = rows[1].querySelectorAll("td")[2];
    expect(firstValue).toHaveTextContent("700,000");
  });
});
