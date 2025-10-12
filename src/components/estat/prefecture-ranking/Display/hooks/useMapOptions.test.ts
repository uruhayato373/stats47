import { renderHook } from "@testing-library/react";
import { useMapOptions } from "./useMapOptions";

describe("useMapOptions", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useMapOptions({}));

    expect(result.current.mapOptions.colorScheme).toBe("viridis");
    expect(result.current.mapOptions.divergingMidpoint).toBe("mean");
  });

  it("should initialize with provided values", () => {
    const { result } = renderHook(() =>
      useMapOptions({
        initialColorScheme: "plasma",
        initialDivergingMidpoint: "zero",
      })
    );

    expect(result.current.mapOptions.colorScheme).toBe("plasma");
    expect(result.current.mapOptions.divergingMidpoint).toBe("zero");
  });

  it("should update color scheme", () => {
    const { result } = renderHook(() => useMapOptions({}));

    result.current.setMapOptions({ colorScheme: "inferno" });

    expect(result.current.mapOptions.colorScheme).toBe("inferno");
  });

  it("should update diverging midpoint", () => {
    const { result } = renderHook(() => useMapOptions({}));

    result.current.setMapOptions({ divergingMidpoint: "median" });

    expect(result.current.mapOptions.divergingMidpoint).toBe("median");
  });

  it("should update both options at once", () => {
    const { result } = renderHook(() => useMapOptions({}));

    result.current.setMapOptions({
      colorScheme: "magma",
      divergingMidpoint: "zero",
    });

    expect(result.current.mapOptions.colorScheme).toBe("magma");
    expect(result.current.mapOptions.divergingMidpoint).toBe("zero");
  });
});
