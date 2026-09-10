import {
  parsePopulationCoreProfile,
  type MigrationDemographicsProfile,
  type SingleHouseholdsProfile,
  type FiveYearResidenceProfile,
} from "@stats47/data-configs/theme-catalog";
import { describe, expect, it } from "vitest";

import {
  migrationFixture,
  householdsFixture,
  residenceFixture,
} from "./population-profile-fixtures";

// These guard the public profile boundary. Official raw-source ingestion tests are separate.
for (const factory of [migrationFixture, householdsFixture, residenceFixture]) {
  describe(factory.name + " の出典と版", () => {
    it("synthetic fixture は厳格な本番parserを通る", () => {
      expect(parsePopulationCoreProfile(factory())).toEqual(factory());
    });
    it("schema version を固定する", () => {
      expect(() =>
        parsePopulationCoreProfile({ ...factory(), schemaVersion: 2 }),
      ).toThrow();
    });
    it("期間を固定する", () => {
      expect(() =>
        parsePopulationCoreProfile({ ...factory(), period: "2026" }),
      ).toThrow();
    });
    it("母集団を総数で置き換えない", () => {
      expect(() =>
        parsePopulationCoreProfile({ ...factory(), population: "全人口" }),
      ).toThrow();
    });
    it("県を重複させない", () => {
      const p = factory();
      p.areas[1].areaCode = p.areas[0].areaCode;
      expect(() => parsePopulationCoreProfile(p)).toThrow();
    });
    it("SHAを省略しない", () => {
      const p = factory();
      p.sources[0].rawSha256 = "";
      expect(() => parsePopulationCoreProfile(p)).toThrow();
    });
    it("API credential を含めない", () => {
      const p = factory();
      p.sources[0].parameters.appId = "synthetic-test-only";
      expect(() => parsePopulationCoreProfile(p)).toThrow();
    });
    it("原典URLを別サイトへ変えない", () => {
      const p = factory();
      p.sources[0].url = "https://example.invalid/source";
      expect(() => parsePopulationCoreProfile(p)).toThrow();
    });
    it("公開profileにmesh/geometryを漏らさない", () => {
      expect(() =>
        parsePopulationCoreProfile({ ...factory(), geometry: [] }),
      ).toThrow();
    });
  });
}
const migrationFailures: [
  string,
  (profile: MigrationDemographicsProfile) => unknown,
][] = [
  [
    "1県欠落",
    (p) => {
      p.areas.pop();
      return p;
    },
  ],
  [
    "1組のOD欠落",
    (p) => {
      p.flows.pop();
      return p;
    },
  ],
  [
    "ODの重複",
    (p) => {
      p.flows[1] = p.flows[0];
      return p;
    },
  ],
  [
    "県内移動を県間へ混入",
    (p) => {
      p.flows[0].destinationAreaCode = p.flows[0].originAreaCode;
      return p;
    },
  ],
  [
    "外国人を除く母集団へ変更",
    (p) => {
      p.sources[0].parameters.cdCat04 = "10000";
      return p;
    },
  ],
  [
    "年齢階級の取り違え",
    (p) => {
      p.ages[5].code = "206";
      return p;
    },
  ],
  ["男女の逆転", (p) => ({ ...p, sexes: ["2", "1"] })],
  [
    "残差を落として総数を維持",
    (p) => {
      const f = p.flows.find(
        (f) =>
          f.originAreaCode === "02000" && f.destinationAreaCode === "13000",
      )!;
      f.counts[0][20] = 0;
      return p;
    },
  ],
  [
    "流入先の県別集計を変更",
    (p) => {
      p.areas[12].inbound[0][0]++;
      p.areas[12].inbound[0][5]++;
      return p;
    },
  ],
  [
    "負数",
    (p) => {
      p.flows[0].counts[0][0] = -1;
      return p;
    },
  ],
  [
    "有限でない人数",
    (p) => {
      p.flows[0].counts[0][0] = Infinity;
      return p;
    },
  ],
];
it.each(migrationFailures)("県間移動: %sを拒否", (_label, mutate) => {
  expect(() =>
    parsePopulationCoreProfile(mutate(migrationFixture())),
  ).toThrow();
});
const householdFailures: [
  string,
  (profile: SingleHouseholdsProfile) => unknown,
][] = [
  [
    "年齢不詳を除外",
    (p) => {
      p.ages.pop();
      return p;
    },
  ],
  [
    "男女の総数を二重計上",
    (p) => {
      p.areas[12].bySex[0].total *= 2;
      return p;
    },
  ],
  [
    "世帯数へ小数を混入",
    (p) => {
      p.areas[12].bySex[1].counts[11] = 0.5;
      return p;
    },
  ],
  [
    "全国集計を変更",
    (p) => {
      p.national.bySex[0].counts[0]++;
      p.national.bySex[0].total++;
      return p;
    },
  ],
];
it.each(householdFailures)("単独世帯: %sを拒否", (_label, mutate) => {
  expect(() =>
    parsePopulationCoreProfile(mutate(householdsFixture())),
  ).toThrow();
});
const residenceFailures: [
  string,
  (profile: FiveYearResidenceProfile) => unknown,
][] = [
  [
    "重複する居住地区分",
    (p) => {
      p.classes[1].code = p.classes[0].code;
      return p;
    },
  ],
  [
    "移動状況不詳を除外",
    (p) => {
      p.classes.pop();
      return p;
    },
  ],
  ["異なる比較日", (p) => ({ ...p, comparisonDate: "2014-10-01" })],
  [
    "5歳以上から全員に分母変更",
    (p) => {
      p.sources[0].parameters.cdCat02 = "000";
      return p;
    },
  ],
];
it.each(residenceFailures)("5年前居住地: %sを拒否", (_label, mutate) => {
  expect(() =>
    parsePopulationCoreProfile(mutate(residenceFixture())),
  ).toThrow();
});
