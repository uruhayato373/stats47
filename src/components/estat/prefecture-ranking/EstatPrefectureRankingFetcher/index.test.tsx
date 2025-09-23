import { render, screen, fireEvent } from "@testing-library/react";
import EstatPrefectureRankingFetcher from "./index";

describe("EstatPrefectureRankingFetcher", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders form fields correctly", () => {
    render(
      <EstatPrefectureRankingFetcher onSubmit={mockOnSubmit} loading={false} />
    );

    expect(screen.getByLabelText(/統計表ID/)).toBeInTheDocument();
    expect(screen.getByLabelText(/カテゴリコード/)).toBeInTheDocument();
  });

  it("handles form submission with valid data", () => {
    render(
      <EstatPrefectureRankingFetcher onSubmit={mockOnSubmit} loading={false} />
    );

    const statsDataIdInput = screen.getByLabelText(/統計表ID/);
    const categoryCodeInput = screen.getByLabelText(/カテゴリコード/);
    const submitButton = screen.getByTitle("データ取得・地図表示");

    fireEvent.change(statsDataIdInput, { target: { value: "0003448368" } });
    fireEvent.change(categoryCodeInput, { target: { value: "01" } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      statsDataId: "0003448368",
      categoryCode: "01",
    });
  });

  it("disables submit button when loading", () => {
    render(
      <EstatPrefectureRankingFetcher onSubmit={mockOnSubmit} loading={true} />
    );

    const submitButton = screen.getByTitle("取得中...");
    expect(submitButton).toBeDisabled();
  });

  it("disables submit button when statsDataId is empty", () => {
    render(
      <EstatPrefectureRankingFetcher onSubmit={mockOnSubmit} loading={false} />
    );

    const submitButton = screen.getByTitle("データ取得・地図表示");
    expect(submitButton).toBeDisabled();
  });

  it("handles form reset", () => {
    render(
      <EstatPrefectureRankingFetcher onSubmit={mockOnSubmit} loading={false} />
    );

    const statsDataIdInput = screen.getByLabelText(/統計表ID/);
    const categoryCodeInput = screen.getByLabelText(/カテゴリコード/);
    const resetButton = screen.getByTitle("リセット");

    fireEvent.change(statsDataIdInput, { target: { value: "0003448368" } });
    fireEvent.change(categoryCodeInput, { target: { value: "01" } });
    fireEvent.click(resetButton);

    expect(statsDataIdInput).toHaveValue("");
    expect(categoryCodeInput).toHaveValue("");
  });

  it("disables reset button when loading", () => {
    render(
      <EstatPrefectureRankingFetcher onSubmit={mockOnSubmit} loading={true} />
    );

    const resetButton = screen.getByTitle("リセット");
    expect(resetButton).toBeDisabled();
  });
});
