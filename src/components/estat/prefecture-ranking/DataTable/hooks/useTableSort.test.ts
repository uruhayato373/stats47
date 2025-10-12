import { renderHook } from "@testing-library/react";
import { useTableSort } from "./useTableSort";

const mockData = [
  {
    areaCode: "01",
    areaName: "北海道",
    numericValue: 1000,
    displayValue: "1,000",
    unit: "人",
    categoryCode: "A",
    timeCode: "2020",
    rank: 1,
  },
  {
    areaCode: "02",
    areaName: "青森県",
    numericValue: 500,
    displayValue: "500",
    unit: "人",
    categoryCode: "A",
    timeCode: "2020",
    rank: 2,
  },
];

describe("useTableSort", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    expect(result.current.sortField).toBe("rank");
    expect(result.current.sortDirection).toBe("asc");
    expect(result.current.sortedData).toHaveLength(2);
  });

  it("should sort by rank ascending by default", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    expect(result.current.sortedData[0].rank).toBe(1);
    expect(result.current.sortedData[1].rank).toBe(2);
  });

  it("should sort by prefecture name", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    result.current.handleSort("prefecture");

    expect(result.current.sortField).toBe("prefecture");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should sort by value", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    result.current.handleSort("value");

    expect(result.current.sortField).toBe("value");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should toggle sort direction when same field is clicked", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    // First click
    result.current.handleSort("rank");
    expect(result.current.sortDirection).toBe("asc");

    // Second click - should toggle
    result.current.handleSort("rank");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should return correct sort icon", () => {
    const { result } = renderHook(() => useTableSort(mockData));

    // Test neutral icon
    expect(result.current.getSortIcon("prefecture")).toBe("neutral");

    // Test active icon
    result.current.handleSort("rank");
    expect(result.current.getSortIcon("rank")).toBe("up");

    // Test toggle
    result.current.handleSort("rank");
    expect(result.current.getSortIcon("rank")).toBe("down");
  });

  it("should handle empty data", () => {
    const { result } = renderHook(() => useTableSort([]));

    expect(result.current.sortedData).toEqual([]);
  });

  it("should filter out invalid data", () => {
    const dataWithInvalid = [
      ...mockData,
      {
        areaCode: "03",
        areaName: "岩手県",
        numericValue: null,
        displayValue: "-",
        unit: "人",
        categoryCode: "A",
        timeCode: "2020",
      },
    ];

    const { result } = renderHook(() => useTableSort(dataWithInvalid));

    expect(result.current.sortedData).toHaveLength(2);
    expect(
      result.current.sortedData.every((item) => item.numericValue !== null)
    ).toBe(true);
  });

  it("should respect ranking direction", () => {
    const { result } = renderHook(() =>
      useTableSort(mockData, { rankingDirection: "asc" })
    );

    // With ascending ranking, smaller values should have lower ranks
    expect(result.current.sortedData[0].numericValue).toBeLessThan(
      result.current.sortedData[1].numericValue
    );
  });
});
