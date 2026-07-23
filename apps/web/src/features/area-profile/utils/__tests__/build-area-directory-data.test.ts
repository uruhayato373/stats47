import { fetchPrefectures, REGIONS } from "@stats47/area";
import { describe, it, expect } from "vitest";


import { buildAreaDirectoryData } from "../build-area-directory-data";

const PREFS = fetchPrefectures();
const data = buildAreaDirectoryData(PREFS);

describe("buildAreaDirectoryData", () => {
  it("タイルは47件・prefCodeは一意・5桁末尾000", () => {
    expect(data.tiles).toHaveLength(47);
    const codes = data.tiles.map((t) => t.prefCode);
    expect(new Set(codes).size).toBe(47);
    for (const c of codes) expect(c).toMatch(/^\d{2}000$/);
  });

  it("URL は /areas/{5桁code} 形式になる", () => {
    for (const t of data.tiles) {
      expect(`/areas/${t.prefCode}`).toMatch(/^\/areas\/\d{5}$/);
    }
  });

  it("グリッドは14列×16行", () => {
    expect(data.gridCols).toBe(14);
    expect(data.gridRows).toBe(16);
  });

  it("各タイルに地方コードとフルネーム (短縮名でない) が付く", () => {
    for (const t of data.tiles) {
      expect(t.regionCode).not.toBe("");
      const pref = PREFS.find((p) => p.prefCode === t.prefCode);
      expect(pref).toBeDefined();
      expect(t.prefName).toBe(pref!.prefName);
    }
    // 東京は短縮名「東京」ではなくフルネーム「東京都」
    const tokyo = data.tiles.find((t) => t.prefCode === "13000");
    expect(tokyo?.prefName).toBe("東京都");
    expect(tokyo?.shortName).toBe("東京");
  });

  it("regionGroups が全47県を過不足なく含む", () => {
    const grouped = data.regionGroups.flatMap((g) =>
      g.prefectures.map((p) => p.prefCode),
    );
    expect(grouped).toHaveLength(47);
    expect(new Set(grouped)).toEqual(new Set(PREFS.map((p) => p.prefCode)));
  });

  it("REGIONS の全 prefCode が fetchPrefectures に存在する (SSOT 整合)", () => {
    const prefCodes = new Set(PREFS.map((p) => p.prefCode));
    for (const region of REGIONS) {
      for (const code of region.prefectures) {
        expect(prefCodes.has(code)).toBe(true);
      }
    }
  });

  it("地図 (tiles) と一覧 (regionGroups) が同じ47コード集合を指す", () => {
    const tileCodes = new Set(data.tiles.map((t) => t.prefCode));
    const groupCodes = new Set(
      data.regionGroups.flatMap((g) => g.prefectures.map((p) => p.prefCode)),
    );
    expect(tileCodes).toEqual(groupCodes);
  });
});
