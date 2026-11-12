import { readHighlyCorrelatedFromR2 } from "@stats47/correlation/server";
import { ok } from "@stats47/types";
import { describe, expect, it, vi } from "vitest";

import { CorrelationSectionContainer } from "../CorrelationSectionContainer";

vi.mock("@stats47/correlation/server", () => ({ readHighlyCorrelatedFromR2: vi.fn() }));

describe("CorrelationSectionContainer", () => {
  it("正負の一覧を保ちながら、散布図や未使用の係数をブラウザへ送らない", async () => {
    const summary = { rankingKey: "related", title: "関連指標", populationAdjustedR: 0.8 };
    const item = {
      ...summary, subtitle: null, unit: "人", pearsonR: 0.9,
      partialRPopulation: 0.8, partialRArea: null, partialRAging: null, partialRDensity: null,
      scatterData: [{ areaCode: "01000", areaName: "北海道", x: 10, y: 20 }],
    };
    vi.mocked(readHighlyCorrelatedFromR2).mockResolvedValueOnce(ok({ positive: [item], negative: [] }));
    const element = await CorrelationSectionContainer({ rankingKey: "base" });
    expect(element?.props.groups).toEqual({ positive: [summary], negative: [] });
  });
});
