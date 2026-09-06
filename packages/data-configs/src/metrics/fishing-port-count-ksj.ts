import type { MetricConfig } from "../types";

export const fishingPortCountKsj: MetricConfig = {
  key: "fishing-port-count-ksj",
  title: "漁港数",
  subtitle: "指定漁港総数",
  description:
    "水産庁の都道府県別漁港管理者別漁港数一覧に掲載された指定漁港の総数。第1種から第4種までを含み、特定第3種を重ねて加算しない。",
  note: "2026年4月1日現在。滋賀県の湖沼漁港を含む。公表表にない7県は、全国合計と40県の合計の一致を検証して0とした。旧2006年の国土数値情報とは系列を接続しない。",
  unit: "港",
  category: "agriculture",
  source: {
    kind: "external",
    fetcherKey: "manual",
    config: {
      source: {
        name: "水産庁「都道府県別漁港管理者別漁港数一覧」",
        url: "https://www.jfa.maff.go.jp/j/gyoko_gyozyo/g_zyoho_bako/gyoko_itiran/sub81.html",
        license: "PDL1.0（商用利用可・出典と加工者の表示）",
        termsUrl: "https://www.maff.go.jp/j/use/link.html",
      },
      sourceSha256:
        "617d0a78458614bfb8f895d31fe31856c938e9eb01f721ec9c24cf8229c1af20",
      dataDate: "2026-04-01",
      nationalTotal: 2768,
      provenance: {
        publicationIndexUrl:
          "https://www.jfa.maff.go.jp/j/gyoko_gyozyo/g_zyoho_bako/gyoko_itiran/sub81.html",
        pdfUrl:
          "https://www.jfa.maff.go.jp/j/gyoko_gyozyo/g_zyoho_bako/gyoko_itiran/attach/pdf/sub81-257.pdf",
        table: "都道府県別漁港管理者別漁港数一覧",
        pdfPage: 1,
        valueColumn: "総計・漁港数（県名の後の15数値列中13列目）",
        dataYear: "2026年4月1日現在",
        accessedAt: "2026-09-05",
        extraction:
          "版SHA固定PDFをpdftotext -layoutで抽出。40県15列と全国合計を検証し、未掲載7県（栃木・群馬・埼玉・山梨・長野・岐阜・奈良）のみ0補完。",
        verification:
          "PDF画像で版日付・列見出し・滋賀20港・全国2768港を確認。各種別の管理者内訳、4種別の和、総計管理者内訳、全国15列合計をすべて照合。",
        restore:
          "npx tsx packages/gis/src/official-counts/generate.ts --out <新規stagingディレクトリ>",
      },
    },
    displayName: "水産庁「漁港一覧」／加工：stats47",
    url: "https://www.jfa.maff.go.jp/j/gyoko_gyozyo/g_zyoho_bako/gyoko_itiran/sub81.html",
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
  seoTitle: "漁港数ランキング都道府県【2026年】",
  seoDescription:
    "水産庁の2026年4月1日現在の指定漁港数を47都道府県で比較。第1種から第4種までの総数を、湖沼漁港も含めて表示します。",
  isActive: true,
};
