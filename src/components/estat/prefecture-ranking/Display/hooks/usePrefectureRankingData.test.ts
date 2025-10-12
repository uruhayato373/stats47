import { renderHook } from "@testing-library/react";
import { usePrefectureRankingData } from "./usePrefectureRankingData";

const mockData = [
  {
    areaCode: "01",
    areaName: "北海道",
    categoryCode: "A",
    timeCode: "2020",
    value: "1000",
    unit: "人",
  },
  {
    areaCode: "02",
    areaName: "青森県",
    categoryCode: "A",
    timeCode: "2020",
    value: "500",
    unit: "人",
  },
];

describe("usePrefectureRankingData", () => {
  it("should format data correctly", () => {
    const { result } = renderHook(() =>
      usePrefectureRankingData({
        data: mockData,
        selectedYear: "2020",
        categoryCode: "A",
        settings: {},
      })
    );

    expect(result.current.formattedData).toBeDefined();
    expect(result.current.formattedData?.years).toContain("2020");
    expect(result.current.filteredData).toHaveLength(2);
  });

  it("should filter data by selected year", () => {
    const { result } = renderHook(() =>
      usePrefectureRankingData({
        data: mockData,
        selectedYear: "2020",
        categoryCode: "A",
        settings: {},
      })
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData[0].timeCode).toBe("2020");
  });

  it("should calculate summary statistics", () => {
    const { result } = renderHook(() =>
      usePrefectureRankingData({
        data: mockData,
        selectedYear: "2020",
        categoryCode: "A",
        settings: {},
      })
    );

    expect(result.current.summary).toBeDefined();
    expect(result.current.summary?.count).toBe(2);
    expect(result.current.summary?.max).toBe(1000);
    expect(result.current.summary?.min).toBe(500);
    expect(result.current.summary?.average).toBe(750);
  });

  it("should handle empty data", () => {
    const { result } = renderHook(() =>
      usePrefectureRankingData({
        data: [],
        selectedYear: "2020",
        categoryCode: "A",
        settings: {},
      })
    );

    expect(result.current.formattedData).toBeNull();
    expect(result.current.filteredData).toEqual([]);
    expect(result.current.summary).toBeNull();
  });

  it("should apply unit conversion when settings provided", () => {
    const settings = {
      unit_conversion: "thousand",
    };

    const { result } = renderHook(() =>
      usePrefectureRankingData({
        data: mockData,
        selectedYear: "2020",
        categoryCode: "A",
        settings,
      })
    );

    expect(result.current.filteredData[0].numericValue).toBe(1); // 1000 / 1000
    expect(result.current.filteredData[1].numericValue).toBe(0.5); // 500 / 1000
  });
});
