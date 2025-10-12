import { render, screen } from "@testing-library/react";
import SavedList from "./SavedList";

const mockData = [
  {
    id: "1",
    statsDataId: "stats-001",
    title: "Test Title 1",
    statName: "Test Stat 1",
    govOrg: "Test Org 1",
    surveyDate: "2023年",
    savedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    statsDataId: "stats-002",
    title: "Test Title 2",
    statName: "Test Stat 2",
    govOrg: "Test Org 2",
    surveyDate: "2023年",
    savedAt: "2023-01-02T00:00:00Z",
  },
];

const mockProps = {
  data: mockData,
  loading: false,
  onView: jest.fn(),
  onDelete: jest.fn(),
};

describe("SavedList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<SavedList {...mockProps} />);

    expect(screen.getByText("stats-001")).toBeInTheDocument();
    expect(screen.getByText("stats-002")).toBeInTheDocument();
  });

  it("should display all items", () => {
    render(<SavedList {...mockProps} />);

    expect(screen.getByText("stats-001")).toBeInTheDocument();
    expect(screen.getByText("stats-002")).toBeInTheDocument();
  });

  it("should sort items by statsDataId", () => {
    const unsortedData = [
      mockData[1], // stats-002
      mockData[0], // stats-001
    ];

    render(<SavedList {...mockProps} data={unsortedData} />);

    const items = screen.getAllByText(/stats-/);
    expect(items[0]).toHaveTextContent("stats-001");
    expect(items[1]).toHaveTextContent("stats-002");
  });

  it("should show loading state", () => {
    render(<SavedList {...mockProps} loading={true} />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("should show empty state when no data", () => {
    render(<SavedList {...mockProps} data={[]} />);

    expect(screen.getByText("保存済みデータがありません")).toBeInTheDocument();
    expect(
      screen.getByText("メタ情報ページでデータを保存すると、ここに表示されます")
    ).toBeInTheDocument();
  });

  it("should render map icon in empty state", () => {
    render(<SavedList {...mockProps} data={[]} />);

    // The Map icon should be present (it's rendered as an SVG)
    const mapIcon = screen.getByRole("img", { hidden: true });
    expect(mapIcon).toBeInTheDocument();
  });

  it("should handle single item", () => {
    render(<SavedList {...mockProps} data={[mockData[0]]} />);

    expect(screen.getByText("stats-001")).toBeInTheDocument();
    expect(screen.queryByText("stats-002")).not.toBeInTheDocument();
  });

  it("should pass correct props to SavedListItem", () => {
    render(<SavedList {...mockProps} />);

    // Items should be rendered (we can't directly test props passed to child components)
    expect(screen.getByText("stats-001")).toBeInTheDocument();
    expect(screen.getByText("stats-002")).toBeInTheDocument();
  });
});
