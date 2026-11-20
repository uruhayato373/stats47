import { describe, expect, it } from "vitest";

import { decideJapanRefresh } from "../refresh-japan-series";

/**
 * data-refresh が作り直す全国の系列を、R2 に既にある公式の系列だけに絞ることを固定する。
 * 系列の無い指標に新しく作ると、全国の値を出すかの判断 (WP0 台帳) を飛ばすことになる。
 */
describe("decideJapanRefresh", () => {
  it("R2 に公式の系列があれば作り直す", () => {
    expect(decideJapanRefresh({ sourceMode: "official", rows: [] })).toBe("regenerate");
  });

  it("系列が無い指標には新しく作らない", () => {
    expect(decideJapanRefresh(null)).toBe("skip-missing");
  });

  it("県の観測値から足し上げた系列は触らない", () => {
    expect(decideJapanRefresh({ sourceMode: "derived-additive", rows: [] })).toBe("skip-non-official");
  });
});
