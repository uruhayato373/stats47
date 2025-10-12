import { render, screen, fireEvent } from "@testing-library/react";
import SavedListItem from "./SavedListItem";

const mockItem = {
  id: "test-id",
  statsDataId: "stats-001",
  title: "Test Title",
  statName: "Test Stat",
  govOrg: "Test Org",
  surveyDate: "2023年",
  savedAt: "2023-01-01T00:00:00Z",
};

const mockProps = {
  item: mockItem,
  onView: jest.fn(),
  onDelete: jest.fn(),
};

describe("SavedListItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<SavedListItem {...mockProps} />);

    expect(screen.getByText("stats-001")).toBeInTheDocument();
  });

  it("should display stats data ID", () => {
    render(<SavedListItem {...mockProps} />);

    expect(screen.getByText("stats-001")).toBeInTheDocument();
  });

  it("should expand when chevron is clicked", () => {
    render(<SavedListItem {...mockProps} />);

    const chevronButton = screen.getByTitle("詳細を表示");
    fireEvent.click(chevronButton);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Stat")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  it("should collapse when chevron is clicked again", () => {
    render(<SavedListItem {...mockProps} />);

    const chevronButton = screen.getByTitle("詳細を表示");
    fireEvent.click(chevronButton);

    // Should be expanded
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(chevronButton);

    // Details should not be visible
    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  it("should call onView when view button is clicked", () => {
    render(<SavedListItem {...mockProps} />);

    // Expand first
    const chevronButton = screen.getByTitle("詳細を表示");
    fireEvent.click(chevronButton);

    const viewButton = screen.getByText("ランキング表示");
    fireEvent.click(viewButton);

    expect(mockProps.onView).toHaveBeenCalledWith(mockItem);
  });

  it("should call onDelete when delete button is clicked", () => {
    render(<SavedListItem {...mockProps} />);

    // Expand first
    const chevronButton = screen.getByTitle("詳細を表示");
    fireEvent.click(chevronButton);

    const deleteButton = screen.getByText("削除");
    fireEvent.click(deleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith("test-id");
  });

  it("should display all item details when expanded", () => {
    render(<SavedListItem {...mockProps} />);

    // Expand
    const chevronButton = screen.getByTitle("詳細を表示");
    fireEvent.click(chevronButton);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Stat")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
    expect(screen.getByText("2023年")).toBeInTheDocument();
    expect(screen.getByText("2023/1/1")).toBeInTheDocument(); // formatted date
  });

  it("should format date correctly", () => {
    render(<SavedListItem {...mockProps} />);

    // Expand
    const chevronButton = screen.getByTitle("詳細を表示");
    fireEvent.click(chevronButton);

    expect(screen.getByText("2023/1/1")).toBeInTheDocument();
  });

  it("should show correct tooltips", () => {
    render(<SavedListItem {...mockProps} />);

    const chevronButton = screen.getByTitle("詳細を表示");
    expect(chevronButton).toBeInTheDocument();

    // Expand
    fireEvent.click(chevronButton);

    const viewButton = screen.getByTitle("ランキング表示");
    const deleteButton = screen.getByTitle("削除");

    expect(viewButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
});
