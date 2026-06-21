import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadFinanceCards,
  parseCityFinanceCards,
  parseFinanceCards,
  type YearRecord,
} from "../load-finance-cards";

const yearRecord: YearRecord = {
  revenue: 100,
  expenditure: 90,
  realBalance: 5,
  standardScale: 80,
  fiscalIndex: 0.5,
  currentBalanceRatio: 90.1,
  debtServiceRatio: 10.2,
  futureBurdenRatio: 30.3,
  fundAdjust: 20,
  fundRedemption: 10,
  fundOther: 8,
  localDebt: 70,
};

describe("parseFinanceCards", () => {
  it("valid finance-cards data を parse できる", () => {
    const result = parseFinanceCards({
      "13": {
        name: "東京都",
        years: {
          "2024": yearRecord,
        },
      },
    });

    expect(result["13"]?.name).toBe("東京都");
    expect(result["13"]?.years["2024"]?.revenue).toBe(100);
  });

  it("都道府県コードが2桁でない場合は拒否する", () => {
    expect(() =>
      parseFinanceCards({
        "13000": {
          name: "東京都",
          years: { "2024": yearRecord },
        },
      }),
    ).toThrow("finance-cards contains invalid prefecture code: 13000");
  });

  it("年度キーが4桁でない場合は拒否する", () => {
    expect(() =>
      parseFinanceCards({
        "13": {
          name: "東京都",
          years: { latest: yearRecord },
        },
      }),
    ).toThrow("finance-cards.13.years contains invalid year: latest");
  });

  it("指標値が finite number でない場合は拒否する", () => {
    expect(() =>
      parseFinanceCards({
        "13": {
          name: "東京都",
          years: {
            "2024": { ...yearRecord, revenue: Number.NaN },
          },
        },
      }),
    ).toThrow("finance-cards.13.years.2024.revenue must be a finite number");
  });
});

describe("parseCityFinanceCards", () => {
  it("valid city finance-cards data を parse できる", () => {
    const result = parseCityFinanceCards({
      千代田区: {
        type: "特別区",
        years: {
          "2024": yearRecord,
        },
        flow: {
          revenue: [{ name: "地方税", value: 100 }],
          expenditure: [{ name: "民生費", value: 90 }],
          totals: { revenue: 100, expenditure: 90 },
        },
      },
    });

    expect(result["千代田区"]?.type).toBe("特別区");
    expect(result["千代田区"]?.flow?.revenue[0]?.name).toBe("地方税");
  });

  it("市区町村名が空の場合は拒否する", () => {
    expect(() =>
      parseCityFinanceCards({
        "": {
          years: { "2024": yearRecord },
        },
      }),
    ).toThrow("finance-cards.cities contains empty city name");
  });

  it("flow node の値が finite number でない場合は拒否する", () => {
    expect(() =>
      parseCityFinanceCards({
        千代田区: {
          years: { "2024": yearRecord },
          flow: {
            revenue: [{ name: "地方税", value: Number.POSITIVE_INFINITY }],
            expenditure: [{ name: "民生費", value: 90 }],
            totals: { revenue: 100, expenditure: 90 },
          },
        },
      }),
    ).toThrow("finance-cards.cities.千代田区.flow.revenue.0.value must be a finite number");
  });
});

describe("city finance-cards snapshot", () => {
  it("public/finance-cards/cities の全JSONを parse できる", () => {
    const dir = resolve(process.cwd(), "public/finance-cards/cities");
    const files = readdirSync(dir).filter((file) => file.endsWith(".json")).sort();

    expect(files).toHaveLength(47);

    for (const file of files) {
      const body = JSON.parse(readFileSync(resolve(dir, file), "utf8")) as unknown;
      const result = parseCityFinanceCards(body, `finance-cards.cities.${file}`);

      expect(Object.keys(result).length, file).toBeGreaterThan(0);
    }
  });
});

describe("loadFinanceCards", () => {
  it("static finance-cards data から年度一覧と最新年度を計算できる", () => {
    const result = loadFinanceCards();

    expect(Object.keys(result.cards)).toHaveLength(47);
    expect(result.years.length).toBeGreaterThan(0);
    expect(result.latestYear).toBe(result.years.at(-1));
  });
});
