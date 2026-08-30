import { describe, expect, test } from "vitest";

import { mesh1000BoundsFromCode } from "../geo-analysis-core";

describe("mesh1000BoundsFromCode", () => {
  test("離島を含む8桁メッシュコードから幅と高さのある境界を復元する", () => {
    const bounds = mesh1000BoundsFromCode("36533758");
    expect(bounds?.[0]).toBeCloseTo(153.975, 8);
    expect(bounds?.[1]).toBeCloseTo(24.2916666667, 8);
    expect((bounds?.[2] ?? 0) - (bounds?.[0] ?? 0)).toBeCloseTo(0.0125, 8);
    expect((bounds?.[3] ?? 0) - (bounds?.[1] ?? 0)).toBeCloseTo(1 / 120, 8);
  });

  test("8桁でないコードを拒否する", () => {
    expect(mesh1000BoundsFromCode("3653375")).toBeNull();
  });
});
