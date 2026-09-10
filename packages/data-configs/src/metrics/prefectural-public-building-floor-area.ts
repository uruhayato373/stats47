import type { MetricConfig } from "../types";

export const prefecturalPublicBuildingFloorArea: MetricConfig = {
  key: "prefectural-public-building-floor-area",
  title: "都道府県有建物の延面積",
  subtitle: "行政財産・普通財産の合計／年度末",
  description:
    "都道府県が報告する公有建物の延面積を、行政財産と普通財産の合計で比較する。",
  note: "2024年度末（2025年3月31日現在）の公共施設状況調査。普通会計を原則とする都道府県の公有財産について、行政財産と普通財産の建物延面積を合計。市町村の建物、基金、道路・橋りょう・河川・海岸・港湾・漁港は含まない。建物数や老朽化率ではない。維持補修費・普通建設事業費は建物以外を含むため、これらの支出を延面積で割って建物更新単価と解釈しない。年度増減には前年度報告の訂正も含まれる。",
  unit: "㎡",
  category: "administrativefinancial",
  source: {
    kind: "external",
    fetcherKey: "manual",
    displayName: "公共施設状況調査",
    url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
    config: {
      source: {
        name: "公共施設状況調査",
        url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
      },
      provenance: {
        url: "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442089&fileKind=1",
        sourceSha256:
          "77ed19c13137c0893bba71aa05b24623913d70b95c6343e9272f05d84bd8c4d8",
        publicationIndexUrl:
          "https://www.e-stat.go.jp/stat-search/files?layout=datalist&toukei=00200252&tstat=000001151626&tclass1=000001151629&tclass2=000001151630&cycle=7&year=20250&month=0",
        table: "令和6年度都道府県公共施設状況調査 10表 公有財産・基金",
        valueColumn:
          "行11 行政財産計＋行16 普通財産計、006:建物（延面積 ㎡）・令和6年度末現在高",
        dataYear: "2024年度末（2025年3月31日現在）",
        accessedAt: "2026-09-10",
        extraction:
          "CP932 CSVの26区分中、公有財産16区分を検査。団体コードの上5桁が都道府県コードと一致する県47行を使用し、政令市20行は加算しない。行政財産と普通財産の建物延面積を合計。",
        verification:
          "47県の行政財産計166907556㎡＋普通財産計8935926㎡＝175843482㎡。各県内訳・前年度末＋年度増減＝当年度末、全国合計を検査。CSVとXLSXの1794行16列を全セル照合。",
        restore:
          "node --import tsx .claude/scripts/themes/ingest-prefectural-buildings.mjs --write-local",
        sourceUnit: "㎡",
        geography:
          "都道府県が報告する公有財産。所在地県の全所有者建物ではない。",
        periodEnd: "2025-03-31",
        timeScope: "fiscal-year-2024-end",
        population:
          "prefectural-public-property-administrative-plus-ordinary-property",
        accountScope: "ordinary-account-principle-per-official-instructions",
        definitionUrl:
          "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040442079&fileKind=2",
        definitionSha256:
          "538dd47d05b829f278ac63f2e100d268ebc9c16b5bf901acb37e5ab02182d385",
        exclusions:
          "市町村所有分、基金、道路・橋りょう・河川・海岸・港湾・漁港を除く。",
        counting: "building-floor-area-stock-not-facility-count",
        denominator: "none",
      },
    },
  },
  entities: ["prefecture"],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: "fiscal",
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
