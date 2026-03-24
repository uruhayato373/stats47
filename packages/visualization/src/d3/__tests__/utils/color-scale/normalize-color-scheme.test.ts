import { describe, it, expect, vi, afterEach } from "vitest";
import { normalizeColorScheme } from "../../../utils/color-scale/normalize-color-scheme";

describe("normalizeColorScheme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return the scheme unchanged when it already starts with 'interpolate'", () => {
    expect(normalizeColorScheme("interpolateBlues")).toBe("interpolateBlues");
    expect(normalizeColorScheme("interpolateRdBu")).toBe("interpolateRdBu");
    expect(normalizeColorScheme("interpolateViridis")).toBe("interpolateViridis");
  });

  it("should convert known aliases to their 'interpolate' form", () => {
    expect(normalizeColorScheme("Blues")).toBe("interpolateBlues");
    expect(normalizeColorScheme("Reds")).toBe("interpolateReds");
    expect(normalizeColorScheme("RdBu")).toBe("interpolateRdBu");
    expect(normalizeColorScheme("Viridis")).toBe("interpolateViridis");
    expect(normalizeColorScheme("Spectral")).toBe("interpolateSpectral");
  });

  it("should return 'interpolateBlues' as default for unknown scheme names", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeColorScheme("unknownScheme")).toBe("interpolateBlues");
    expect(normalizeColorScheme("")).toBe("interpolateBlues");
  });

  it("should warn when encountering an unknown scheme", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    normalizeColorScheme("nonExistentScheme");
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});
