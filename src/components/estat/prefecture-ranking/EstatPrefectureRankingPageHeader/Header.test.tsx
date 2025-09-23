import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    mockOnRefresh.mockClear();
  });

  it("renders title and description", () => {
    render(
      <Header
        loading={false}
        currentStatsId="0003425774"
        onRefresh={mockOnRefresh}
      />
    );

    expect(
      screen.getByText("都道府県ランキング・コロプレス地図")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "e-STAT統計データを都道府県別に地図上で可視化し、ランキング形式で表示"
      )
    ).toBeInTheDocument();
  });

  it("shows refresh button when statsId is provided", () => {
    render(
      <Header
        loading={false}
        currentStatsId="0003425774"
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText("更新");
    expect(refreshButton).toBeInTheDocument();
    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it("hides refresh button when statsId is empty", () => {
    render(
      <Header loading={false} currentStatsId="" onRefresh={mockOnRefresh} />
    );

    expect(screen.queryByText("更新")).not.toBeInTheDocument();
  });

  it("disables refresh button and shows loading state when loading", () => {
    render(
      <Header
        loading={true}
        currentStatsId="0003425774"
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText("更新中...");
    expect(refreshButton).toBeDisabled();
  });

  it("renders e-STAT API link", () => {
    render(
      <Header
        loading={false}
        currentStatsId="0003425774"
        onRefresh={mockOnRefresh}
      />
    );

    const link = screen.getByText("e-STAT API");
    expect(link).toHaveAttribute("href", "https://www.e-stat.go.jp/api/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
