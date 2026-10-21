import { describe, expect, it } from "vitest";

import { RANKING_TABLE_COLUMN_WIDTHS, RANKING_TABLE_FRAME_WIDTH } from "../index";

describe("RankingDataTable の列幅", () => {
  it("列幅の合計が右カラムの表の枠に収まる (超えると右端の偏差値が切れる)", () => {
    const total = Object.values(RANKING_TABLE_COLUMN_WIDTHS).reduce((sum, w) => sum + w, 0);
    expect(total).toBeLessThanOrEqual(RANKING_TABLE_FRAME_WIDTH);
  });
});
