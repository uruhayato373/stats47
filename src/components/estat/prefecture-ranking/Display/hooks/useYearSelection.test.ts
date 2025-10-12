import { renderHook } from "@testing-library/react";
import { useYearSelection } from "./useYearSelection";

describe("useYearSelection", () => {
  it("should initialize with empty selectedYear when no years provided", () => {
    const { result } = renderHook(() => useYearSelection({ years: [] }));

    expect(result.current.selectedYear).toBe("");
  });

  it("should initialize with first year when years provided", () => {
    const { result } = renderHook(() =>
      useYearSelection({ years: ["2020", "2021", "2022"] })
    );

    expect(result.current.selectedYear).toBe("2020");
  });

  it("should update selected year", () => {
    const { result } = renderHook(() =>
      useYearSelection({ years: ["2020", "2021", "2022"] })
    );

    result.current.setSelectedYear("2021");

    expect(result.current.selectedYear).toBe("2021");
  });

  it("should handle empty years array", () => {
    const { result } = renderHook(() => useYearSelection({ years: [] }));

    expect(result.current.selectedYear).toBe("");

    result.current.setSelectedYear("2020");
    expect(result.current.selectedYear).toBe("2020");
  });

  it("should handle single year", () => {
    const { result } = renderHook(() => useYearSelection({ years: ["2020"] }));

    expect(result.current.selectedYear).toBe("2020");
  });
});
