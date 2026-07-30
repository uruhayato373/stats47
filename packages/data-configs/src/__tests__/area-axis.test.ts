import { describe, expect, it } from "vitest";

import {
  isAggregateAreaName,
  lookupPrefectureCode,
  normalizeAreaName,
  PREFECTURES,
  resolveAreaAxis,
  surveyYearFromDate,
  type AreaAxisMember,
} from "../area-axis";

/** 患者調査 0004026104 の cat03 (実データ・抜粋) */
const PATIENT_CAT03: AreaAxisMember[] = [
  { code: "1", name: "全国" },
  { code: "2", name: "北海道" },
  { code: "3", name: "青森" },
  { code: "4", name: "岩手" },
  { code: "14", name: "東京" },
  { code: "27", name: "京都" },
  { code: "28", name: "大阪" },
  { code: "48", name: "沖縄" },
];

/** 畜産統計 0004047181 の cat01 (実データ・抜粋) */
const DAIRY_CAT01: AreaAxisMember[] = [
  { code: "1001", name: "全国" },
  { code: "1002", name: "全国農業地域_北海道" },
  { code: "1003", name: "全国農業地域_都府県" },
  { code: "1013", name: "都道府県_北海道" },
  { code: "1014", name: "都道府県_青森" },
  { code: "1025", name: "都道府県_東京" },
  { code: "1059", name: "都道府県_沖縄" },
  { code: "1060", name: "関東農政局" },
];

describe("PREFECTURES", () => {
  it("47 県ぴったり", () => {
    expect(PREFECTURES).toHaveLength(47);
  });

  it("コードは 01000〜47000 の昇順", () => {
    expect(PREFECTURES[0].code).toBe("01000");
    expect(PREFECTURES[46].code).toBe("47000");
    const codes = PREFECTURES.map((p) => p.code);
    expect([...codes].sort()).toEqual(codes);
  });
});

describe("normalizeAreaName", () => {
  it.each([
    ["都道府県_北海道", "北海道"],
    ["都道府県_神奈川", "神奈川"],
    ["全国農業地域_九州", "九州"],
  ])("%s → %s", (input, want) => {
    expect(normalizeAreaName(input)).toBe(want);
  });

  it("★北海道の「道」は接尾辞として落とさない", () => {
    expect(normalizeAreaName("北海道")).toBe("北海道");
  });

  it("★接尾辞はここで落とさない (京都 → 京 を作らない)", () => {
    expect(normalizeAreaName("京都府")).toBe("京都府");
    expect(normalizeAreaName("京都")).toBe("京都");
    expect(normalizeAreaName("青森県")).toBe("青森県");
  });

  it("★京都は短縮形・完全形どちらでも 26000 に解決する", () => {
    expect(lookupPrefectureCode("京都")).toBe("26000");
    expect(lookupPrefectureCode("京都府")).toBe("26000");
    // 「京」に潰れていたら解決できない
    expect(lookupPrefectureCode("京")).toBeNull();
  });
});

describe("isAggregateAreaName", () => {
  it.each(["全国", "全国農業地域_九州", "関東農政局", "都府県", "合計"])(
    "%s は集計行",
    (n) => expect(isAggregateAreaName(n)).toBe(true),
  );

  it.each(["北海道", "青森", "都道府県_東京"])("%s は県", (n) =>
    expect(isAggregateAreaName(n)).toBe(false),
  );
});

describe("resolveAreaAxis — seq-pref (患者調査)", () => {
  it("コード n → 県番号 n-1 に写す", () => {
    const r = resolveAreaAxis(PATIENT_CAT03, "seq-pref");
    expect(r.byCode.get("2")).toBe("01000"); // 北海道
    expect(r.byCode.get("3")).toBe("02000"); // 青森
    expect(r.byCode.get("14")).toBe("13000"); // 東京
    expect(r.byCode.get("48")).toBe("47000"); // 沖縄
  });

  it("全国 (コード 1) は落とす", () => {
    const r = resolveAreaAxis(PATIENT_CAT03, "seq-pref");
    expect(r.byCode.has("1")).toBe(false);
    expect(r.unresolved.map((m) => m.code)).not.toContain("1");
  });

  it("★連番が名前と食い違えば採用しない (県ごと入れ替わるのを防ぐ)", () => {
    // コード 3 は本来 青森 だが 岩手 と名乗っている = 表の並びが想定と違う
    const broken: AreaAxisMember[] = [
      { code: "2", name: "北海道" },
      { code: "3", name: "岩手" },
    ];
    const r = resolveAreaAxis(broken, "seq-pref");
    expect(r.byCode.get("2")).toBe("01000");
    expect(r.byCode.has("3")).toBe(false);
    expect(r.unresolved).toEqual([{ code: "3", name: "岩手" }]);
  });

  it("47 県そろわなければ missingPrefectures に出る", () => {
    const r = resolveAreaAxis(PATIENT_CAT03, "seq-pref");
    expect(r.missingPrefectures.length).toBe(47 - 7); // fixture は 7 県分だけ
    expect(r.missingPrefectures).toContain("岐阜県");
  });

  it("全 48 コードを与えれば 47 県ちょうど解決して欠落ゼロ", () => {
    const all: AreaAxisMember[] = [
      { code: "1", name: "全国" },
      ...PREFECTURES.map((p, i) => ({ code: String(i + 2), name: p.short })),
    ];
    const r = resolveAreaAxis(all, "seq-pref");
    expect(r.byCode.size).toBe(47);
    expect(r.unresolved).toEqual([]);
    expect(r.missingPrefectures).toEqual([]);
  });
});

describe("resolveAreaAxis — name (畜産統計)", () => {
  it("都道府県_<名前> を解決する", () => {
    const r = resolveAreaAxis(DAIRY_CAT01, "name");
    expect(r.byCode.get("1013")).toBe("01000"); // 北海道
    expect(r.byCode.get("1014")).toBe("02000"); // 青森
    expect(r.byCode.get("1025")).toBe("13000"); // 東京
    expect(r.byCode.get("1059")).toBe("47000"); // 沖縄
  });

  it("★全国・農業地域・農政局は落とす (北海道の重複を作らない)", () => {
    const r = resolveAreaAxis(DAIRY_CAT01, "name");
    // 1002 = 全国農業地域_北海道 も「北海道」に見えるが集計行なので落ちる
    expect(r.byCode.has("1002")).toBe(false);
    expect(r.byCode.has("1001")).toBe(false);
    expect(r.byCode.has("1060")).toBe(false);
    // 北海道に写るのは 1013 だけ
    expect([...r.byCode.entries()].filter(([, v]) => v === "01000")).toEqual([["1013", "01000"]]);
  });

  it("未知の名前は unresolved に積む (黙って捨てない)", () => {
    const r = resolveAreaAxis([{ code: "9", name: "都道府県_架空" }], "name");
    expect(r.byCode.size).toBe(0);
    expect(r.unresolved).toEqual([{ code: "9", name: "都道府県_架空" }]);
  });

  it("47 県そろう入力なら欠落ゼロ", () => {
    const all = PREFECTURES.map((p, i) => ({
      code: String(1013 + i),
      name: `都道府県_${p.short}`,
    }));
    const r = resolveAreaAxis(all, "name");
    expect(r.byCode.size).toBe(47);
    expect(r.missingPrefectures).toEqual([]);
  });
});

describe("surveyYearFromDate — time 軸を持たない表の年", () => {
  it.each([
    ["202301-202312", "2023"], // 患者調査 (実データ)
    ["202501-202512", "2025"], // 畜産統計 (実データ)
    ["202502", "2025"],
    ["2023", "2023"],
    [20230101, "2023"],
  ])("%s → %s", (input, want) => {
    expect(surveyYearFromDate(input)).toBe(want);
  });

  it.each([undefined, null, "", "abc", "0000", "9999-01", {}])(
    "★決められないものは null (推測しない): %s",
    (input) => {
      expect(surveyYearFromDate(input)).toBeNull();
    },
  );
});
