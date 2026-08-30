import { describe, expect, it } from "vitest";

import { parseLimit } from "@/lib/contracts/schemas";

describe("parseLimit", () => {
  it("null / 空文字 → null (指定なし)", () => {
    expect(parseLimit(null)).toBeNull();
    expect(parseLimit("")).toBeNull();
  });

  it("0 と正整数を許容", () => {
    expect(parseLimit("0")).toBe(0);
    expect(parseLimit("25")).toBe(25);
  });

  it("負数を 'invalid'", () => {
    expect(parseLimit("-1")).toBe("invalid");
  });

  it("NaN (非数値文字列) を 'invalid'", () => {
    expect(parseLimit("abc")).toBe("invalid");
  });

  it("Infinity を 'invalid'", () => {
    expect(parseLimit("Infinity")).toBe("invalid");
  });

  it("小数を 'invalid'", () => {
    expect(parseLimit("1.5")).toBe("invalid");
  });
});
