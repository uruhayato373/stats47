import { describe, expect, it } from "vitest";

import {
  getAdReservedMinHeight,
  getResponsiveAdFormat,
} from "../components/ad-frame";

describe("AdSense frame contract", () => {
  it("rail/display formats keep the requested responsive shape", () => {
    expect(getResponsiveAdFormat("rectangle")).toBe("rectangle");
    expect(getResponsiveAdFormat("banner")).toBe("horizontal");
    expect(getResponsiveAdFormat("skyscraper")).toBe("vertical");
  });

  it("fluid formats retain auto behavior and a reserved height", () => {
    expect(getResponsiveAdFormat("infeed")).toBe("auto");
    expect(getResponsiveAdFormat("article")).toBe("auto");
    expect(getResponsiveAdFormat("multiplex")).toBe("auto");
    expect(getAdReservedMinHeight("article")).toBeGreaterThan(0);
    expect(getAdReservedMinHeight("multiplex")).toBeGreaterThan(0);
  });

  it("reserves the heights documented in ad-frame.ts (comment and value stay in sync)", () => {
    expect(getAdReservedMinHeight("rectangle")).toBe(280);
    expect(getAdReservedMinHeight("banner")).toBe(90);
    expect(getAdReservedMinHeight("skyscraper")).toBe(600);
    expect(getAdReservedMinHeight("article")).toBe(120);
    expect(getAdReservedMinHeight("multiplex")).toBe(300);
    expect(getAdReservedMinHeight("infeed")).toBe(250);
  });
});
