/**
 * 統計分野コード定数のテスト
 * e-Stat API公式の統計分野コード定義との整合性を検証
 */

import { STATS_FIELD_OPTIONS } from "../search-options";
import { STATS_FIELDS } from "@/features/estat-api/stats-list/types/stats-list-response";

describe("STATS_FIELD_OPTIONS", () => {
  // e-Stat API公式の分野コード定義
  const officialCodes = {
    "01": "国土・気象",
    "02": "人口・世帯",
    "03": "労働・賃金",
    "04": "農林水産業",
    "05": "鉱工業",
    "06": "商業・サービス業",
    "07": "企業・家計・経済",
    "08": "住宅・土地・建設",
    "09": "エネルギー・水",
    "10": "運輸・観光",
    "11": "情報通信・科学技術",
    "12": "教育・文化・スポーツ・生活",
    "13": "行財政",
    "14": "司法・安全・環境",
    "15": "社会保障・衛生",
    "16": "国際",
  };

  it("should match e-Stat API statsField codes", () => {
    STATS_FIELD_OPTIONS.filter((opt) => opt.value !== "").forEach((option) => {
      expect(officialCodes[option.value as keyof typeof officialCodes]).toBe(
        option.label
      );
    });
  });

  it("should not include code 17", () => {
    const hasCode17 = STATS_FIELD_OPTIONS.some((opt) => opt.value === "17");
    expect(hasCode17).toBe(false);
  });

  it("should not include code 04 with label '事業所'", () => {
    const wrongOption = STATS_FIELD_OPTIONS.find(
      (opt) => opt.value === "04" && opt.label === "事業所"
    );
    expect(wrongOption).toBeUndefined();
  });

  it("should have all codes from 01 to 16", () => {
    const codes = STATS_FIELD_OPTIONS.filter((opt) => opt.value !== "").map(
      (opt) => opt.value
    );
    for (let i = 1; i <= 16; i++) {
      const code = i.toString().padStart(2, "0");
      expect(codes).toContain(code);
    }
  });
});

describe("STATS_FIELDS", () => {
  // e-Stat API公式の分野コード定義
  const officialCodes = {
    "01": "国土・気象",
    "02": "人口・世帯",
    "03": "労働・賃金",
    "04": "農林水産業",
    "05": "鉱工業",
    "06": "商業・サービス業",
    "07": "企業・家計・経済",
    "08": "住宅・土地・建設",
    "09": "エネルギー・水",
    "10": "運輸・観光",
    "11": "情報通信・科学技術",
    "12": "教育・文化・スポーツ・生活",
    "13": "行財政",
    "14": "司法・安全・環境",
    "15": "社会保障・衛生",
    "16": "国際",
  };

  it("should match e-Stat API statsField codes", () => {
    Object.entries(STATS_FIELDS).forEach(([code, field]) => {
      expect(officialCodes[code as keyof typeof officialCodes]).toBe(
        field.name
      );
    });
  });

  it("should not include code 17", () => {
    expect(STATS_FIELDS).not.toHaveProperty("17");
  });

  it("should not have code 04 with name '事業所'", () => {
    expect(STATS_FIELDS["04"]?.name).not.toBe("事業所");
    expect(STATS_FIELDS["04"]?.name).toBe("農林水産業");
  });

  it("should have all codes from 01 to 16", () => {
    for (let i = 1; i <= 16; i++) {
      const code = i.toString().padStart(2, "0");
      expect(STATS_FIELDS).toHaveProperty(code);
    }
  });
});

describe("STATS_FIELD_OPTIONS and STATS_FIELDS consistency", () => {
  it("should have the same codes", () => {
    const optionsCodes = STATS_FIELD_OPTIONS.filter(
      (opt) => opt.value !== ""
    ).map((opt) => opt.value);
    const fieldsCodes = Object.keys(STATS_FIELDS);

    expect(optionsCodes.sort()).toEqual(fieldsCodes.sort());
  });

  it("should have matching names for each code", () => {
    STATS_FIELD_OPTIONS.filter((opt) => opt.value !== "").forEach((option) => {
      const field = STATS_FIELDS[option.value as keyof typeof STATS_FIELDS];
      expect(field).toBeDefined();
      expect(field.name).toBe(option.label);
    });
  });
});

