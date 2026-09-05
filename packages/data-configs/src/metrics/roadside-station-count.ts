import type { MetricConfig } from "../types";

export const roadsideStationCount: MetricConfig = {
  key: "roadside-station-count",
  title: "道の駅数",
  unit: "か所",
  category: "tourism",
  description:
    "国土交通省に登録されている道の駅を所在地の都道府県別に数えた登録駅数。",
  note: "2026年9月4日現在。営業中の施設数ではなく登録駅数。2018年版の国土数値情報から一次資料を切り替え、旧年の観測値とは接続しない。",
  source: {
    kind: "external",
    fetcherKey: "manual",
    config: {
      source: {
        name: "国土交通省「道の駅」登録一覧",
        url: "https://www.mlit.go.jp/road/Michi-no-Eki/list.html",
        license: "PDL1.0（商用利用可・出典と加工者の表示）",
        termsUrl: "https://www.mlit.go.jp/link.html",
      },
      sourceSha256:
        "20a0f50794942de07327e7a9561d4a98390032b7a2147e1903db19dcb6d52486",
      dataDate: "2026-09-04",
      nationalTotal: 1234,
      provenance: {
        publicationIndexUrl:
          "https://www.mlit.go.jp/road/Michi-no-Eki/list.html",
        url: "https://www.mlit.go.jp/road/Michi-no-Eki/file/list.xlsx",
        table: "List",
        valueColumn:
          "県名(A列)ごとの登録駅行数。駅名(B列)・登録回(C列)・登録年月(D列)・所在地(E列)で行を検証",
        dataYear: "2026年9月4日現在",
        accessedAt: "2026-09-05",
        extraction:
          "版SHAを固定したXLSXのListシートを読み、県名と駅名と所在地の重複を拒否して47県別に集計。",
        verification:
          "公式一覧の1234駅と行数・47県合計が一致。47県に登録がありゼロ県なし。公表ページの2026年9月4日・1234駅も照合。",
        restore:
          "npx tsx packages/gis/src/official-counts/generate.ts --out <新規stagingディレクトリ>",
      },
    },
    displayName: "国土交通省「道の駅」登録一覧／加工：stats47",
    url: "https://www.mlit.go.jp/road/Michi-no-Eki/list.html",
  },
  entities: ["prefecture"],
  years: {
    from: 2026,
    to: 2026,
  },
  yearFormat: "calendar",
  calculation: {
    normalizationOptions: [
      {
        type: "per_population",
        label: "人口10万人あたり",
        unit: "か所/10万人",
        scaleFactor: 100000,
        decimalPlaces: 1,
      },
      {
        type: "per_area",
        label: "面積100km²あたり",
        unit: "か所/100km²",
        scaleFactor: 100,
        decimalPlaces: 2,
      },
    ],
    isCalculated: false,
  },
  seoTitle: "道の駅数ランキング都道府県【2026年】",
  seoDescription:
    "国土交通省の2026年9月4日現在の登録一覧を集計した道の駅数。47都道府県の登録駅数を地図やグラフで比較します。",
  isActive: true,
};
