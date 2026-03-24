import { describe, expect, it } from "vitest";
import { filterToPrefectures } from "../filter-to-prefectures";

const makeItem = (areaCode: string) => ({ areaCode, value: 1 });

describe("filterToPrefectures", () => {
  it("都道府県コードのみを保持する", () => {
    const data = [makeItem("01000"), makeItem("13000"), makeItem("47000")];
    expect(filterToPrefectures(data)).toHaveLength(3);
  });

  it("全国データ（00000）を除外する", () => {
    const data = [makeItem("00000"), makeItem("01000"), makeItem("47000")];
    const result = filterToPrefectures(data);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.areaCode)).not.toContain("00000");
  });

  it("境界値: 01（北海道）を含む", () => {
    expect(filterToPrefectures([makeItem("01000")])).toHaveLength(1);
  });

  it("境界値: 47（沖縄）を含む", () => {
    expect(filterToPrefectures([makeItem("47000")])).toHaveLength(1);
  });

  it("境界値: 48以上のコードは除外する", () => {
    const data = [makeItem("48000"), makeItem("99000")];
    expect(filterToPrefectures(data)).toHaveLength(0);
  });

  it("空配列に対して空配列を返す", () => {
    expect(filterToPrefectures([])).toEqual([]);
  });
});
