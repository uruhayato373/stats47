import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "./Sidebar";

// Mock the hooks
jest.mock("./hooks/useSavedMetadata", () => ({
  useSavedMetadata: () => ({
    data: [
      {
        id: 1,
        stats_data_id: "test-id",
        stat_name: "Test Stat",
        title: "Test Title",
        updated_at: "2023-01-01",
        created_at: "2023-01-01",
      },
    ],
    loading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock("./hooks/useItemNames", () => ({
  useItemNames: () => ({
    itemNames: ["項目1", "項目2"],
    loading: false,
    fetchItemNames: jest.fn(),
    reset: jest.fn(),
  }),
}));

const mockProps = {
  className: "test-class",
  onDataSelect: jest.fn(),
};

describe("Sidebar", () => {
  it("should render without crashing", () => {
    render(<Sidebar {...mockProps} />);

    expect(screen.getByText("保存済みデータ")).toBeInTheDocument();
    expect(screen.getByText("統計表を選択")).toBeInTheDocument();
  });

  it("should display saved data in select", () => {
    render(<Sidebar {...mockProps} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Check if the option is present
    expect(screen.getByText("test-id - Test Title")).toBeInTheDocument();
  });

  it("should call onDataSelect when item is selected", () => {
    render(<Sidebar {...mockProps} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "test-id" } });

    expect(mockProps.onDataSelect).toHaveBeenCalledWith({
      id: 1,
      stats_data_id: "test-id",
      stat_name: "Test Stat",
      title: "Test Title",
      updated_at: "2023-01-01",
      created_at: "2023-01-01",
    });
  });

  it("should show selected item details", () => {
    render(<Sidebar {...mockProps} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "test-id" } });

    expect(screen.getByText("選択中の統計表")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should show item names when item is selected", () => {
    render(<Sidebar {...mockProps} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "test-id" } });

    expect(screen.getByText("項目名一覧")).toBeInTheDocument();
    expect(screen.getByText("項目1")).toBeInTheDocument();
    expect(screen.getByText("項目2")).toBeInTheDocument();
  });

  it("should show refresh button", () => {
    render(<Sidebar {...mockProps} />);

    const refreshButton = screen.getByTitle("更新");
    expect(refreshButton).toBeInTheDocument();
  });
});
