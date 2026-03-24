import { describe, expect, it } from "vitest";

/**
 * parseAreaCodes は page.tsx 内のプライベート関数だが、
 * ロジックをここにコピーしてバリデーションの正しさをテストする。
 * 将来的に feature 側に移動した場合は直接 import に切り替える。
 */
function parseAreaCodes(areas: string | undefined): string[] {
  if (!areas) return ["13000", "27000"];
  const codes = areas.split(",").filter(Boolean);
  const valid = codes.filter((c) => /^\d{5}$/.test(c));
  if (valid.length === 0) return ["13000", "27000"];
  return valid.slice(0, 2);
}

describe("parseAreaCodes", () => {
  it("undefined の場合はデフォルト値を返す", () => {
    expect(parseAreaCodes(undefined)).toEqual(["13000", "27000"]);
  });

  it("空文字列の場合はデフォルト値を返す", () => {
    expect(parseAreaCodes("")).toEqual(["13000", "27000"]);
  });

  it("正常な 2 地域コードをパースする", () => {
    expect(parseAreaCodes("01000,27000")).toEqual(["01000", "27000"]);
  });

  it("1 地域のみの場合はそのまま返す", () => {
    expect(parseAreaCodes("13000")).toEqual(["13000"]);
  });

  it("3 地域以上は先頭 2 件に切り詰める", () => {
    expect(parseAreaCodes("01000,13000,27000")).toEqual(["01000", "13000"]);
  });

  it("5桁数字以外の不正な値を除外する", () => {
    expect(parseAreaCodes("abc,13000,xyz")).toEqual(["13000"]);
  });

  it("全て不正な場合はデフォルト値を返す", () => {
    expect(parseAreaCodes("abc,xyz")).toEqual(["13000", "27000"]);
  });

  it("6桁以上のコードを除外する", () => {
    expect(parseAreaCodes("130001,27000")).toEqual(["27000"]);
  });

  it("4桁以下のコードを除外する", () => {
    expect(parseAreaCodes("1300,27000")).toEqual(["27000"]);
  });
});
