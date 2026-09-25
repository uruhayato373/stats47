/**
 * 縦軸の省略表記 (2026-09-25)。常に小数 1 桁だった旧実装は「1400.0万」と長くなり、
 * 狭いグラフで先頭の桁が切れて「400.0万」と読めた。整数は「.0」を付けず、3 桁で区切る。
 */
import { describe, expect, it } from "vitest";

import { compactAxisFormat } from "../chart-styles";

describe("compactAxisFormat", () => {
  it("整数の万は .0 を付けず 3 桁で区切る", () => {
    expect(compactAxisFormat(14_000_000)).toBe("1,400万");
    expect(compactAxisFormat(2_000_000)).toBe("200万");
  });

  it("端数は小数 1 桁まで残す", () => {
    expect(compactAxisFormat(25_000)).toBe("2.5万");
    expect(compactAxisFormat(150_000_000)).toBe("1.5億");
  });

  it("千と 1,000 未満の表記", () => {
    expect(compactAxisFormat(3_000)).toBe("3千");
    expect(compactAxisFormat(500)).toBe("500");
    expect(compactAxisFormat(0.25)).toBe("0.3");
  });
});
