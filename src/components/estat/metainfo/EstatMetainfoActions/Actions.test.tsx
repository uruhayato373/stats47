import { render, screen, fireEvent } from "@testing-library/react";
import Actions from "./Actions";

describe("Actions", () => {
  const mockOnRefresh = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRefresh.mockClear();
    mockOnRetry.mockClear();
  });

  it("renders refresh button", () => {
    render(<Actions onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByTitle("更新");
    expect(refreshButton).toBeInTheDocument();
  });

  it("calls onRefresh when refresh button is clicked", () => {
    render(<Actions onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByTitle("更新");
    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button when hasError is false", () => {
    render(
      <Actions
        onRefresh={mockOnRefresh}
        onRetry={mockOnRetry}
        hasError={false}
      />
    );

    expect(screen.queryByText("再試行")).not.toBeInTheDocument();
  });

  it("renders retry button when hasError is true and onRetry is provided", () => {
    render(
      <Actions
        onRefresh={mockOnRefresh}
        onRetry={mockOnRetry}
        hasError={true}
      />
    );

    const retryButton = screen.getByText("再試行");
    expect(retryButton).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    render(
      <Actions
        onRefresh={mockOnRefresh}
        onRetry={mockOnRetry}
        hasError={true}
      />
    );

    const retryButton = screen.getByText("再試行");
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button when hasError is true but onRetry is not provided", () => {
    render(<Actions onRefresh={mockOnRefresh} hasError={true} />);

    expect(screen.queryByText("再試行")).not.toBeInTheDocument();
  });
});
