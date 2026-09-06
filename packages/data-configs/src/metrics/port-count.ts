import type { MetricConfig } from "../types";

export const portCount: MetricConfig = {
  key: "port-count",
  title: "港湾調査の対象港数",
  subtitle: "甲種・乙種港湾",
  description:
    "港湾調査規則の2025年1月1日施行版別表に指定された甲種163港・乙種501港を県別に集計した対象港数。全国の全港湾・漁港・船着場の総数ではない。",
  note: "基準日：2025年1月1日（規則施行日）。境港は法令上「鳥取・島根」の共同港。本集計では国土交通省「みなと一覧」の県別掲載区分に従い鳥取県へ1港計上し、二重計上しない。指定のない7県は0、滋賀県の湖港は含む。旧マスター699港・2024年の値とは接続しない。加工：stats47。",
  unit: "港",
  category: "infrastructure",
  source: {
    kind: "external",
    fetcherKey: "manual",
    config: {
      source: {
        name: "港湾調査規則 別表（2025年1月1日施行版）／e-Gov法令検索",
        url: "https://laws.e-gov.go.jp/api/2/law_data/326M50000800013_20250101_506M60000800108",
        license: "PDL1.0（商用利用可・出典と加工者の表示）",
        termsUrl: "https://www.e-gov.go.jp/terms",
      },
      sourceSha256:
        "ba8c4cef4c2ab30f408d99bb570714723c4199109dd690800a4b8186f6dfbb05",
      dataDate: "2025-01-01",
      nationalTotal: 664,
      provenance: {
        url: "https://laws.e-gov.go.jp/api/2/law_data/326M50000800013_20250101_506M60000800108",
        publicationIndexUrl: "https://www.mlit.go.jp/k-toukei/kouwan_01.html",
        table: "別表（第三条関係）",
        valueColumn: "都道府県欄別の甲種港湾・乙種港湾の指定港名数",
        dataYear: "2025年1月1日施行版",
        accessedAt: "2026-09-06",
        extraction:
          "固定施行版JSONの別表を決定的に抽出。県名と港名の組で重複を拒否。同名の他県港は別港、甲乙のコードunionや統計有値行数は使わない。",
        verification:
          "甲種163・乙種501・全国664・47県合計の保存則、指定なし7県の0、共同港1件を検証。境港は国交省みなと一覧の鳥取県欄への掲載を別途照合して1港計上。",
        attributionUrl: "https://www.mlit.go.jp/kowan/kowan_tk3_000002.html",
        attributionSha256:
          "1c9f30760a5e57b0838402a8d83ecec60ca84ff5395b310e7e6a13601b1db43c",
        attributionTermsUrl: "https://www.mlit.go.jp/link.html",
        restore:
          "npx tsx packages/gis/src/official-counts/generate-designated-ports.ts --out <新規stagingディレクトリ>",
      },
    },
    displayName: "港湾調査規則（e-Gov）・国土交通省／加工：stats47",
    url: "https://laws.e-gov.go.jp/api/2/law_data/326M50000800013_20250101_506M60000800108",
  },
  surveyId: "port-statistics",
  entities: ["prefecture"],
  years: {
    from: 2025,
    to: 2025,
  },
  yearFormat: "plain",
  calculation: {
    normalizationOptions: [
      {
        type: "per_population",
        label: "人口10万人あたり",
        unit: "港/10万人",
        scaleFactor: 100000,
        decimalPlaces: 1,
      },
      {
        type: "per_area",
        label: "面積100km²あたり",
        unit: "港/100km²",
        scaleFactor: 100,
        decimalPlaces: 2,
      },
    ],
    isCalculated: false,
  },
  seoTitle: "港湾調査の対象港数ランキング【2025年】｜甲種・乙種港湾",
  seoDescription:
    "2025年1月1日施行の港湾調査規則別表から、甲種・乙種の対象664港を都道府県別に集計。全国の全港湾数ではなく調査対象港数を47県で比較します。",
  isActive: true,
};
