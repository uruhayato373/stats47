import { describe, expect, it } from "vitest";
import { filterToNational } from "../filter-to-national";

const makeItem = (areaCode: string) => ({ areaCode, value: 1 });

describe("filterToNational", () => {
  it("全国データ（00000）のみを保持する", () => {
    const data = [makeItem("00000"), makeItem("01000"), makeItem("47000")];
    expect(filterToNational(data)).toEqual([makeItem("00000")]);
  });

  it("都道府県コードを除外する", () => {
    const data = [makeItem("01000"), makeItem("13000"), makeItem("47000")];
    expect(filterToNational(data)).toHaveLength(0);
  });

  it("全国データがない場合は空配列を返す", () => {
    expect(filterToNational([makeItem("01000")])).toEqual([]);
  });

  it("空配列に対して空配列を返す", () => {
    expect(filterToNational([])).toEqual([]);
  });

  it("前方一致（00001等）は除外する", () => {
    const data = [makeItem("00000"), makeItem("00001"), makeItem("00100")];
    expect(filterToNational(data)).toEqual([makeItem("00000")]);
  });
});
