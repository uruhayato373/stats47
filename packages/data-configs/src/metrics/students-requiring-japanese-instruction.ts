import type { MetricConfig } from "../types";

export const studentsRequiringJapaneseInstruction: MetricConfig = {
  key: "students-requiring-japanese-instruction",
  title: "日本語指導が必要な児童生徒数",
  subtitle: "外国籍・日本国籍の合計（公立学校）",
  description:
    "公立学校に在籍し、日本語で日常会話が十分にできない、または学年相当の学習言語能力が不足して学習活動への参加に支障がある児童生徒の人数。",
  note: "2025年5月1日現在。外国籍と日本国籍の公表値を都道府県ごとに合算。",
  unit: "人",
  category: "educationsports",
  source: {
    kind: "external",
    fetcherKey: "manual",
    config: {
      source: {
        name: "文部科学省「日本語指導が必要な児童生徒の受入状況等に関する調査」令和7年度",
        url: "https://www.mext.go.jp/b_menu/houdou/31/09/1421569_00007.htm",
        license: "政府標準利用規約に基づき、出典を表示して利用",
      },
      description:
        "令和7年度の都道府県別集計について、外国籍と日本国籍の「合計」列を都道府県ごとに合算した公立学校在籍者数。",
      provenance: {
        publicationIndexUrl: "https://www.mext.go.jp/b_menu/houdou/31/09/1421569_00007.htm",
        pdfUrl: "https://www.mext.go.jp/content/20260525-mxt_kyokoku-000049811_03.pdf",
        table:
          "都道府県別 日本語指導が必要な外国籍の児童生徒の在籍人数 / 日本国籍の児童生徒の在籍人数（公立）",
        pdfPage: 10,
        valueColumn: "令和7年度 合計（外国籍と日本国籍を合算）",
        dataYear: "令和7年度（2025年5月1日現在）",
        accessedAt: "2026-08-29",
        extraction:
          "PDF物理ページ10・15をpdftotext -layoutで抽出し、都道府県行の令和7年度合計列を読み、外国籍と日本国籍を合算。抽出スクリプト: .claude/scripts/data/fetch-japanese-instruction-students.mjs",
        verification:
          "両表を各47都道府県抽出。外国籍全国計73,313人、日本国籍全国計11,446人、合算84,759人が公表合計と一致。PDF SHA-256 c94028f6385bfa735095d796c70adf85804a7e342b64d1d57e1aa84e06f4bedc。",
        restore:
          "node .claude/scripts/data/fetch-japanese-instruction-students.mjs --check でPDFのhash、47都道府県、全国計を再検証。--write-localで.local/r2へ生成。",
      },
    },
    displayName: "文部科学省",
    url: "https://www.mext.go.jp/b_menu/houdou/31/09/1421569_00007.htm",
  },
  entities: ["prefecture"],
  years: { years: [2025] },
  yearFormat: "fiscal",
  visualization: {
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",
    minValueType: "zero",
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  calculation: { isCalculated: false },
  surveyId: "japanese-language-instruction-survey",
  isActive: false,
};
