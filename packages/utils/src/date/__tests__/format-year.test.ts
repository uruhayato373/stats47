import { describe, expect, it } from "vitest";

import { formatYear } from "../format-year";

describe("formatYear", () => {
  it("10桁コードで5桁目が1の場合「年度」を返す", () => {
    expect(formatYear("2024100000")).toBe("2024年度");
  });

  it("10桁コードで5桁目が0の場合「年」を返す", () => {
    expect(formatYear("2024000000")).toBe("2024年");
  });

  it("4桁コードは「年」を付与する", () => {
    expect(formatYear("2023")).toBe("2023年");
  });

  it("既にフォーマット済みの文字列はそのまま返す", () => {
    expect(formatYear("2022年度")).toBe("2022年度");
    expect(formatYear("2021年")).toBe("2021年");
  });

  it("空文字列はそのまま返す", () => {
    expect(formatYear("")).toBe("");
  });

  it("不正な形式はそのまま返す", () => {
    expect(formatYear("abc")).toBe("abc");
    expect(formatYear("12345")).toBe("12345");
  });
});
