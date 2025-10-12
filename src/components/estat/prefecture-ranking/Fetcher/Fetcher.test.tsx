import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Fetcher from "./Fetcher";

// Mock the useStyles hook
jest.mock("@/hooks/useStyles", () => ({
  useStyles: () => ({
    input: "mock-input-class",
    button: "mock-button-class",
  }),
}));

// Mock InputField component
jest.mock("@/components/common/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, "-")}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  };
});

const mockProps = {
  onSubmit: jest.fn(),
  loading: false,
};

describe("Fetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<Fetcher {...mockProps} />);

    expect(screen.getByText("統計表ID")).toBeInTheDocument();
    expect(screen.getByText("カテゴリコード")).toBeInTheDocument();
    expect(screen.getByText("時点コード")).toBeInTheDocument();
  });

  it("should display form fields", () => {
    render(<Fetcher {...mockProps} />);

    expect(screen.getByTestId("input-統計表id")).toBeInTheDocument();
    expect(screen.getByTestId("input-カテゴリコード")).toBeInTheDocument();
    expect(screen.getByTestId("input-時点コード")).toBeInTheDocument();
  });

  it("should have submit button", () => {
    render(<Fetcher {...mockProps} />);

    const submitButton = screen.getByRole("button", { name: /検索/i });
    expect(submitButton).toBeInTheDocument();
  });

  it("should have reset button", () => {
    render(<Fetcher {...mockProps} />);

    const resetButton = screen.getByRole("button", { name: /リセット/i });
    expect(resetButton).toBeInTheDocument();
  });

  it("should update form data when inputs change", () => {
    render(<Fetcher {...mockProps} />);

    const statsDataIdInput = screen.getByTestId("input-統計表id");
    const categoryCodeInput = screen.getByTestId("input-カテゴリコード");
    const timeCodeInput = screen.getByTestId("input-時点コード");

    fireEvent.change(statsDataIdInput, { target: { value: "test-id" } });
    fireEvent.change(categoryCodeInput, { target: { value: "test-category" } });
    fireEvent.change(timeCodeInput, { target: { value: "test-time" } });

    expect(statsDataIdInput).toHaveValue("test-id");
    expect(categoryCodeInput).toHaveValue("test-category");
    expect(timeCodeInput).toHaveValue("test-time");
  });

  it("should call onSubmit when form is submitted", () => {
    render(<Fetcher {...mockProps} />);

    const statsDataIdInput = screen.getByTestId("input-統計表id");
    const categoryCodeInput = screen.getByTestId("input-カテゴリコード");
    const timeCodeInput = screen.getByTestId("input-時点コード");

    fireEvent.change(statsDataIdInput, { target: { value: "test-id" } });
    fireEvent.change(categoryCodeInput, { target: { value: "test-category" } });
    fireEvent.change(timeCodeInput, { target: { value: "test-time" } });

    const submitButton = screen.getByRole("button", { name: /検索/i });
    fireEvent.click(submitButton);

    expect(mockProps.onSubmit).toHaveBeenCalledWith({
      statsDataId: "test-id",
      categoryCode: "test-category",
      timeCode: "test-time",
    });
  });

  it("should reset form when reset button is clicked", () => {
    render(<Fetcher {...mockProps} />);

    const statsDataIdInput = screen.getByTestId("input-統計表id");
    const categoryCodeInput = screen.getByTestId("input-カテゴリコード");
    const timeCodeInput = screen.getByTestId("input-時点コード");

    // Fill form
    fireEvent.change(statsDataIdInput, { target: { value: "test-id" } });
    fireEvent.change(categoryCodeInput, { target: { value: "test-category" } });
    fireEvent.change(timeCodeInput, { target: { value: "test-time" } });

    // Reset
    const resetButton = screen.getByRole("button", { name: /リセット/i });
    fireEvent.click(resetButton);

    expect(statsDataIdInput).toHaveValue("");
    expect(categoryCodeInput).toHaveValue("");
    expect(timeCodeInput).toHaveValue("");
  });

  it("should disable submit button when loading", () => {
    render(<Fetcher {...mockProps} loading={true} />);

    const submitButton = screen.getByRole("button", { name: /検索/i });
    expect(submitButton).toBeDisabled();
  });

  it("should disable reset button when loading", () => {
    render(<Fetcher {...mockProps} loading={true} />);

    const resetButton = screen.getByRole("button", { name: /リセット/i });
    expect(resetButton).toBeDisabled();
  });

  it("should show loading state in submit button", () => {
    render(<Fetcher {...mockProps} loading={true} />);

    const submitButton = screen.getByRole("button", { name: /検索/i });
    expect(submitButton).toHaveTextContent("読み込み中...");
  });
});
