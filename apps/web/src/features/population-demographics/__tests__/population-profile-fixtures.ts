import type {
  MigrationDemographicsProfile,
  SingleHouseholdsProfile,
  FiveYearResidenceProfile,
  PopulationPartitionArea,
} from "@stats47/data-configs/theme-catalog";

/** Synthetic test allocations, never source observations or publishable artifacts.
 * National totals satisfy the fixed parser contract; prefecture cells are invented.
 * No API, filesystem, credentials, or local R2 dependency.
 */
const PREF_NAMES =
  "北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県".split(
    " ",
  );
const PREFS = PREF_NAMES.map((areaName, index) => ({
  areaCode: String(index + 1).padStart(2, "0") + "000",
  areaName,
}));
const NATIONAL_MIGRATION = 2_515_731;
const NATIONAL_HOUSEHOLDS = 21_151_042;
const NATIONAL_UNKNOWN_AGE = 2_402_603;
const NATIONAL_RESIDENCE = 118_698_179;
const GENERATED_AT = "2026-09-10T00:00:00.000Z";
const common = {
  schemaVersion: 1 as const,
  generatedAt: GENERATED_AT,
  notes: ["SYNTHETIC TEST FIXTURE: 県別配分は架空。公開禁止。"],
};
const queries: Record<string, Record<string, string>> = {
  "0003419946": {
    statsDataId: "0003419946",
    cdTime: "2025000000",
    cdCat01: PREFS.map((p) => p.areaCode).join(","),
    cdCat03: "1,2",
    cdCat04: "60000",
    lvArea: "1-2",
    limit: "100000",
  },
  "0003419944": {
    statsDataId: "0003419944",
    cdTime: "2025000000",
    cdTab: "02,03,04",
    cdCat03: "60000",
    lvArea: "1-2",
    limit: "100000",
  },
  "0003445081": {
    statsDataId: "0003445081",
    cdTime: "2020000000",
    cdCat02: "0",
    cdCat04: "3",
    lvArea: "1-2",
    limit: "100000",
  },
  "0003447398": {
    statsDataId: "0003447398",
    cdTime: "2020000000",
    cdCat02: "R1",
    lvArea: "1-2",
    limit: "100000",
  },
};
function source(tableId: string) {
  return {
    tableId,
    url: "https://www.e-stat.go.jp/dbview?sid=" + tableId,
    parameters: { ...queries[tableId] },
    rawSha256: "0".repeat(64),
    statisticalDataSha256: "1".repeat(64),
    bytes: 1,
    fetchedAt: GENERATED_AT,
  };
}
const zeros = (length: number) => Array<number>(length).fill(0);
const matrix = () => [zeros(21), zeros(21)];
const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);
function addInto(target: number[][], values: number[][]) {
  values.forEach((row, sex) =>
    row.forEach((value, age) => {
      target[sex][age] += value;
    }),
  );
}

export function migrationFixture(): MigrationDemographicsProfile {
  const areas = PREFS.map((pref) => ({
    ...pref,
    inbound: matrix(),
    outbound: matrix(),
    withinPrefecture: matrix(),
  }));
  const flows = PREFS.flatMap((origin) =>
    PREFS.filter((destination) => destination.areaCode !== origin.areaCode).map(
      (destination) => ({
        originAreaCode: origin.areaCode,
        destinationAreaCode: destination.areaCode,
        counts: matrix(),
      }),
    ),
  );
  const put = (
    origin: string,
    destination: string,
    sex: number,
    ageIndex: number,
    value: number,
  ) => {
    const flow = flows.find(
      (f) =>
        f.originAreaCode === origin && f.destinationAreaCode === destination,
    )!;
    flow.counts[sex][ageIndex] = value;
  };
  put("01000", "13000", 0, 5, 13);
  put("01000", "13000", 1, 5, 17);
  put("13000", "01000", 0, 5, 5);
  put("13000", "01000", 1, 5, 7);
  put("13000", "47000", 0, 4, 11);
  put("13000", "47000", 1, 6, 19);
  put("47000", "13000", 0, 5, 23);
  put("47000", "13000", 1, 7, 29);
  put("02000", "13000", 0, 20, 1);
  put("13000", "23000", 1, 20, 1);
  const assigned = sum(
    flows.flatMap((f) => f.counts.map((row) => sum(row.slice(1)))),
  );
  put("01000", "02000", 0, 1, NATIONAL_MIGRATION - assigned);
  const national = {
    areaCode: "00000",
    areaName: "全国",
    inbound: matrix(),
    outbound: matrix(),
  };
  for (const flow of flows) {
    flow.counts.forEach((row) => {
      row[0] = sum(row.slice(1));
    });
    addInto(
      areas.find((a) => a.areaCode === flow.destinationAreaCode)!.inbound,
      flow.counts,
    );
    addInto(
      areas.find((a) => a.areaCode === flow.originAreaCode)!.outbound,
      flow.counts,
    );
    addInto(national.inbound, flow.counts);
    addInto(national.outbound, flow.counts);
  }
  const tokyo = areas.find((a) => a.areaCode === "13000")!;
  tokyo.withinPrefecture[0][5] = 3;
  tokyo.withinPrefecture[0][0] = 3;
  const okinawa = areas.find((a) => a.areaCode === "47000")!;
  okinawa.withinPrefecture[1][20] = 2;
  okinawa.withinPrefecture[1][0] = 2;
  const ages = [
    { code: "000", label: "総数" },
    ...Array.from({ length: 18 }, (_, index) => ({
      code: String(index + 201),
      label: `${index * 5}～${index * 5 + 4}歳`,
    })),
    { code: "402", label: "90歳以上" },
    { code: "unallocated", label: "総数と年齢計の差" },
  ];
  return {
    ...common,
    kind: "interprefecture-migration-demographics",
    period: "2025",
    unit: "人",
    population: "移動者（外国人を含む）、国内の住所移動、男女別",
    sources: [source("0003419946"), source("0003419944")],
    sexes: ["1", "2"],
    ages,
    areas,
    national,
    flows,
  };
}

function partitions(length: number) {
  return PREFS.map((pref) => ({
    ...pref,
    bySex: ["0", "1", "2"].map((sex) => ({
      sex,
      total: 0,
      counts: zeros(length),
    })),
  }));
}
function completePartitions(areas: PopulationPartitionArea[], total: number) {
  const assigned = sum(
    areas.flatMap((a) => a.bySex.slice(1).map((s) => sum(s.counts))),
  );
  areas[0].bySex[1].counts[0] += total - assigned;
  const national = {
    areaCode: "00000",
    areaName: "全国",
    bySex: ["0", "1", "2"].map((sex) => ({
      sex,
      total: 0,
      counts: zeros(areas[0].bySex[0].counts.length),
    })),
  };
  for (const area of areas) {
    area.bySex[0].counts = area.bySex[1].counts.map(
      (value, index) => value + area.bySex[2].counts[index],
    );
    area.bySex.forEach((sex, index) => {
      sex.total = sum(sex.counts);
      national.bySex[index].total += sex.total;
      sex.counts.forEach((value, cls) => {
        national.bySex[index].counts[cls] += value;
      });
    });
  }
  return national;
}
export function householdsFixture(): SingleHouseholdsProfile {
  const areas = partitions(17);
  const tokyo = areas.find((a) => a.areaCode === "13000")!;
  [10, 20, 30, 40, 50].forEach((value, index) => {
    tokyo.bySex[1].counts[index + 11] = value;
  });
  [20, 30, 40, 50, 60].forEach((value, index) => {
    tokyo.bySex[2].counts[index + 11] = value;
  });
  tokyo.bySex[1].counts[1] = 3;
  tokyo.bySex[2].counts[2] = 4;
  const okinawa = areas.find((a) => a.areaCode === "47000")!;
  okinawa.bySex[1].counts[11] = 7;
  okinawa.bySex[2].counts[15] = 9;
  areas[0].bySex[1].counts[16] = 1_000_000;
  areas[0].bySex[2].counts[16] = NATIONAL_UNKNOWN_AGE - 1_000_000;
  const national = completePartitions(areas, NATIONAL_HOUSEHOLDS);
  const ages = Array.from({ length: 17 }, (_, index) => ({
    code: String(index + 1).padStart(2, "0"),
    label:
      index === 0
        ? "15歳未満"
        : index === 15
          ? "85歳以上"
          : index === 16
            ? "年齢不詳"
            : `${10 + index * 5}～${14 + index * 5}歳`,
  }));
  return {
    ...common,
    kind: "single-households-demographics",
    period: "2020-10-01",
    unit: "世帯",
    population: "単独世帯・一般世帯・国籍と配偶関係総数・世帯主の男女と年齢",
    sources: [source("0003445081")],
    ages,
    areas,
    national,
  };
}
export function residenceFixture(): FiveYearResidenceProfile {
  const areas = partitions(7);
  const tokyo = areas.find((a) => a.areaCode === "13000")!;
  tokyo.bySex[1].counts = [100, 20, 30, 40, 50, 60, 70];
  tokyo.bySex[2].counts = [11, 12, 13, 14, 15, 16, 17];
  const okinawa = areas.find((a) => a.areaCode === "47000")!;
  okinawa.bySex[1].counts = [1, 2, 3, 4, 5, 6, 7];
  okinawa.bySex[2].counts = [8, 9, 10, 11, 12, 13, 14];
  const national = completePartitions(areas, NATIONAL_RESIDENCE);
  const classes = ["001", "00211", "00212", "00213", "0022", "003", "004"].map(
    (code) => ({ code, label: code }),
  );
  return {
    ...common,
    kind: "five-year-residence",
    period: "2020-10-01",
    comparisonDate: "2015-10-01",
    unit: "人",
    population:
      "2020年10月1日現在の5歳以上常住者・男女別・国籍総数（年齢不詳を含まない）",
    sources: [source("0003447398")],
    classes,
    areas,
    national,
  };
}
