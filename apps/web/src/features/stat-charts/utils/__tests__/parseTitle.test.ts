import { describe, it, expect } from "vitest";

import { parseTitle } from "../parseTitle";

describe("parseTitle", () => {
  it("全角括弧を分離する", () => {
    expect(parseTitle("図書館数（人口100万人当たり）")).toEqual({
      main: "図書館数",
      sub: "人口100万人当たり",
    });
  });

  it("半角括弧を分離する", () => {
    expect(parseTitle("大学数(人口10万人当たり)")).toEqual({
      main: "大学数",
      sub: "人口10万人当たり",
    });
  });

  it("括弧がない場合は sub が null", () => {
    expect(parseTitle("大学進学率")).toEqual({
      main: "大学進学率",
      sub: null,
    });
  });

  it("空文字列の場合", () => {
    expect(parseTitle("")).toEqual({
      main: "",
      sub: null,
    });
  });
});
