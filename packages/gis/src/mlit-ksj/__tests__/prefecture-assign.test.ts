import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PREF_CODES,
  PREF_NAME_BY_CODE,
  createPrefectureLocator,
  prefCodeFromAddress,
  prefCodeFromNumericCode,
  prefCodeFromPrefName,
  prefCodeFromSource,
  resolvePrefecture,
} from "../prefecture-assign";

/**
 * 本番で実際に起きた取り違えを固定する。
 *
 * 旧実装 (`findNearestPref`) は最近傍の県庁所在地で県を決めていたため、
 * 2026-08-17 時点の本番配信データは次の状態だった。ここに並ぶ住所は
 * すべて KSJ P03-13 の実データ (`P03_0003`)。
 */
const REAL_WORLD_MISASSIGNMENTS = [
  // 高浜・大飯は京都府境に近く、京都市の方が福井市より近い → 京都府へ流れていた
  { address: "福井県大飯郡高浜町田ノ浦1", expected: "18", wrongly: "26" },
  { address: "福井県大飯郡おおい町大島1字吉見1-1", expected: "18", wrongly: "26" },
  { address: "福井県三方郡美浜町丹生66号川坂山5番地3", expected: "18" },
  { address: "福井県敦賀市神明町", expected: "18" },
  // 離島は本土の県庁所在地に吸われる
  { address: "東京都八丈町中之郷2872", expected: "13", wrongly: "14" },
  // 0 件になっていた県
  { address: "秋田県鹿角市八幡平", expected: "05" },
  { address: "秋田県湯沢市高松字高松沢", expected: "05" },
  { address: "福島県河沼郡柳津町大字黒沢", expected: "07" },
  { address: "山口県熊毛郡上関町大字長島", expected: "35" },
] as const;

describe("prefecture-assign / 県テーブル", () => {
  it("47 都道府県を @stats47/area から導出する", () => {
    expect(PREF_CODES).toHaveLength(47);
    expect(PREF_CODES[0]).toBe("01");
    expect(PREF_CODES.at(-1)).toBe("47");
    expect(PREF_NAME_BY_CODE["01"]).toBe("北海道");
    expect(PREF_NAME_BY_CODE["26"]).toBe("京都府");
    expect(PREF_NAME_BY_CODE["47"]).toBe("沖縄県");
  });
});

describe("prefCodeFromAddress", () => {
  it.each(REAL_WORLD_MISASSIGNMENTS)(
    "$address → $expected",
    ({ address, expected }) => {
      expect(prefCodeFromAddress(address)).toBe(expected);
    },
  );

  it("旧実装が付けていた誤った県には決してならない", () => {
    for (const c of REAL_WORLD_MISASSIGNMENTS) {
      if (!("wrongly" in c)) continue;
      expect(prefCodeFromAddress(c.address)).not.toBe(c.wrongly);
    }
  });

  it("事業者名は住所として採用しない (北海道は接尾辞を持たないので特に危ない)", () => {
    expect(prefCodeFromAddress("北海道電力株式会社")).toBeNull();
    expect(prefCodeFromAddress("東京電力株式会社")).toBeNull();
    expect(prefCodeFromAddress("中国電力株式会社")).toBeNull();
  });

  it("県名だけで市区町村を伴わない文字列は採用しない", () => {
    expect(prefCodeFromAddress("北海道")).toBeNull();
    expect(prefCodeFromAddress("福井県")).toBeNull();
  });

  it("空・非文字列・県名を含まない文字列は null", () => {
    expect(prefCodeFromAddress("")).toBeNull();
    expect(prefCodeFromAddress("   ")).toBeNull();
    expect(prefCodeFromAddress(null)).toBeNull();
    expect(prefCodeFromAddress(undefined)).toBeNull();
    expect(prefCodeFromAddress({})).toBeNull();
    expect(prefCodeFromAddress("千代田区丸の内1-1")).toBeNull();
  });
});

describe("prefCodeFromPrefName", () => {
  it("県名の完全一致だけを受け付ける", () => {
    expect(prefCodeFromPrefName("北海道")).toBe("01");
    expect(prefCodeFromPrefName("京都府")).toBe("26");
    expect(prefCodeFromPrefName(" 沖縄県 ")).toBe("47");
    expect(prefCodeFromPrefName("京都")).toBeNull();
    expect(prefCodeFromPrefName("北海道電力")).toBeNull();
  });
});

describe("prefCodeFromNumericCode", () => {
  it("2 桁を県コードとして読む", () => {
    expect(prefCodeFromNumericCode("01", "prefCode")).toBe("01");
    expect(prefCodeFromNumericCode(1, "prefCode")).toBe("01");
    expect(prefCodeFromNumericCode("47", "prefCode")).toBe("47");
  });

  it("5 桁を市区町村コードとして読む", () => {
    expect(prefCodeFromNumericCode("01222", "muniCode")).toBe("01");
    expect(prefCodeFromNumericCode(1222, "muniCode")).toBe("01");
    expect(prefCodeFromNumericCode("26100", "muniCode")).toBe("26");
  });

  it("桁数が違うものは受け付けない (別の意味の ID を誤読しないため)", () => {
    // C09 漁港の C09_001 は 7 桁の漁港番号
    expect(prefCodeFromNumericCode("1114170", "muniCode")).toBeNull();
    expect(prefCodeFromNumericCode("010112", "muniCode")).toBeNull();
    expect(prefCodeFromNumericCode("48", "prefCode")).toBeNull();
    expect(prefCodeFromNumericCode("00", "prefCode")).toBeNull();
  });
});

describe("prefCodeFromSource", () => {
  it("宣言されたフィールドだけを見る", () => {
    const props = {
      P03_0001: "関西電力株式会社",
      P03_0002: "高浜原子力発電所",
      P03_0003: "福井県大飯郡高浜町田ノ浦1",
    };
    expect(
      prefCodeFromSource(props, { kind: "address", field: "P03_0003" }),
    ).toBe("18");
    // 事業者名フィールドを指定しても住所として通らない
    expect(
      prefCodeFromSource(props, { kind: "address", field: "P03_0001" }),
    ).toBeNull();
    expect(
      prefCodeFromSource(props, { kind: "address", field: "missing" }),
    ).toBeNull();
    expect(
      prefCodeFromSource(null, { kind: "address", field: "P03_0003" }),
    ).toBeNull();
  });

  it("全プロパティ走査はしない — P12 観光資源の資源 ID を県コードに化けさせない", () => {
    // P12_001 は資源 ID (10022)。市区町村コードとして読むと群馬県(10)に化けるが、
    // 実際の県は P12_003 の "01" (北海道)。宣言されたフィールド以外は見ないので
    // この罠を踏まない。
    const props = { P12_001: 10022, P12_003: "01", P12_004: "01458" };
    expect(
      prefCodeFromSource(props, { kind: "prefCode", field: "P12_003" }),
    ).toBe("01");
    expect(
      prefCodeFromSource(props, { kind: "muniCode", field: "P12_004" }),
    ).toBe("01");
  });
});

describe("createPrefectureLocator (空間結合)", () => {
  const topology = JSON.parse(
    readFileSync(
      resolve(__dirname, "../../../data/geoshape/prefecture.topojson"),
      "utf-8",
    ),
  );
  const locator = createPrefectureLocator(topology);

  // 座標は KSJ P03-13 の実データ (topojson を GeoJSON 化して取り出したもの)
  it.each([
    { name: "高浜原子力発電所", lon: 135.50691487887042, lat: 35.52244787168591, expected: "18" },
    { name: "大飯原子力発電所", lon: 135.65416722616808, lat: 35.54027312328321, expected: "18" },
    { name: "八丈島地熱発電所", lon: 139.8129605865511, lat: 33.07528685256605, expected: "13" },
    { name: "澄川地熱発電所", lon: 140.79352325612, lat: 39.98811224855474, expected: "05" },
    { name: "柳津西山地熱発電所", lon: 139.68869380884806, lat: 37.420052465133665, expected: "07" },
  ])("$name は $expected に入る", ({ lon, lat, expected }) => {
    expect(locator.locate(lon, lat)).toBe(expected);
  });

  it("陸地の外は null を返す (最寄りの県に寄せない)", () => {
    // 日本海の沖合
    expect(locator.locate(134.0, 38.0)).toBeNull();
    // 日本の外
    expect(locator.locate(0, 0)).toBeNull();
    expect(locator.locate(Number.NaN, 35)).toBeNull();
  });
});

describe("resolvePrefecture", () => {
  const stubLocator = {
    locate: (lon: number) => (lon === 135 ? "26" : null),
  };

  it("属性が決まればそれを使う (空間結合より優先)", () => {
    const got = resolvePrefecture({
      properties: { addr: "福井県大飯郡高浜町田ノ浦1" },
      source: { kind: "address", field: "addr" },
      coord: [135, 35],
      locator: stubLocator,
    });
    expect(got).toEqual({ prefCode: "18", method: "attribute" });
  });

  it("属性が無ければ空間結合へ落ちる", () => {
    const got = resolvePrefecture({
      properties: { addr: "" },
      source: { kind: "address", field: "addr" },
      coord: [135, 35],
      locator: stubLocator,
    });
    expect(got).toEqual({ prefCode: "26", method: "polygon" });
  });

  it("どちらでも決まらなければ null を返す (推測しない)", () => {
    expect(
      resolvePrefecture({
        properties: { addr: "" },
        source: { kind: "address", field: "addr" },
        coord: [999, 999],
        locator: stubLocator,
      }),
    ).toBeNull();
    expect(resolvePrefecture({})).toBeNull();
  });
});
