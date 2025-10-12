import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";

const mockProps = {
  loading: false,
  currentStatsId: "test-stats-id",
  onRefresh: jest.fn(),
};

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<Header {...mockProps} />);

    expect(
      screen.getByText("都道府県ランキング・コロプレス地図")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "e-STAT統計データを都道府県別に地図上で可視化し、ランキング形式で表示"
      )
    ).toBeInTheDocument();
  });

  it("should display current stats ID", () => {
    render(<Header {...mockProps} />);

    expect(screen.getByText("test-stats-id")).toBeInTheDocument();
  });

  it("should show refresh button", () => {
    render(<Header {...mockProps} />);

    const refreshButton = screen.getByTitle("更新");
    expect(refreshButton).toBeInTheDocument();
  });

  it("should call onRefresh when refresh button is clicked", () => {
    render(<Header {...mockProps} />);

    const refreshButton = screen.getByTitle("更新");
    fireEvent.click(refreshButton);

    expect(mockProps.onRefresh).toHaveBeenCalled();
  });

  it("should show loading state in refresh button", () => {
    render(<Header {...mockProps} loading={true} />);

    const refreshButton = screen.getByTitle("更新");
    expect(refreshButton).toBeInTheDocument();

    // Check if the button has spinning animation class
    const icon = refreshButton.querySelector("svg");
    expect(icon).toHaveClass("animate-spin");
  });

  it("should show external link button", () => {
    render(<Header {...mockProps} />);

    const externalLinkButton = screen.getByTitle("e-STATで開く");
    expect(externalLinkButton).toBeInTheDocument();
  });

  it("should have correct external link URL", () => {
    render(<Header {...mockProps} />);

    const externalLinkButton = screen.getByTitle("e-STATで開く");
    expect(externalLinkButton).toHaveAttribute(
      "href",
      "https://www.e-stat.go.jp/dbview?sid=test-stats-id"
    );
    expect(externalLinkButton).toHaveAttribute("target", "_blank");
    expect(externalLinkButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should handle empty stats ID", () => {
    render(<Header {...mockProps} currentStatsId="" />);

    expect(
      screen.getByText("都道府県ランキング・コロプレス地図")
    ).toBeInTheDocument();

    // External link should not be visible or should be disabled
    const externalLinkButton = screen.queryByTitle("e-STATで開く");
    expect(externalLinkButton).not.toBeInTheDocument();
  });

  it("should display map icon", () => {
    render(<Header {...mockProps} />);

    // The Map icon should be present
    const mapIcon = screen.getByRole("img", { hidden: true });
    expect(mapIcon).toBeInTheDocument();
  });

  it("should have proper styling classes", () => {
    render(<Header {...mockProps} />);

    const header = screen.getByRole("heading", { level: 1 });
    expect(header).toHaveClass("font-medium", "text-lg");
  });
});
