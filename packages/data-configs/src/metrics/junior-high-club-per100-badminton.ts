import type { MetricConfig } from "../types";

export const juniorHighClubPer100Badminton: MetricConfig = {
  "key": "junior-high-club-per100-badminton",
  "title": "中学部活動 100人あたり部員数",
  "subtitle": "バドミントン部",
  "unit": "人",
  "category": "educationsports",
  "note": "運動部の加盟生徒数(男女計)を中学校生徒数100人あたりに換算した値。中体連加盟(令和7年度・令和7年6月1日現在)のバドミントン部生徒数を用いた。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "(公財)日本中学校体育連盟「加盟校・加盟生徒数調査集計表」令和7年度",
        "url": "https://nippon-chutairen.or.jp/data/result/",
        "license": "[要確認] 中体連サイトに利用規約の明文なし。加盟生徒数は事実として出典明記のうえ利用(オーナー承認済み・問題時取り下げ)",
      },
      "description": "中学校の運動部活動のうちバドミントン部の加盟生徒数(男女計)を、都道府県別の中学校生徒数100人あたりに換算した値。分子=中体連「加盟生徒数(バドミントン部・男子+女子)」(加盟生徒数(男子)/(女子)ページ)、分母=学校基本調査 中学校生徒数(2024年度、metric: junior-high-school-students-count)。",
      "provenance": {
        "publicationIndexUrl": "https://nippon-chutairen.or.jp/data/result/",
        "pdfUrl": "https://nippon-chutairen.or.jp/cms/wp-content/themes/nippon-chutairen/file/kameikou/%E4%BB%A4%E5%92%8C%EF%BC%97%E5%B9%B4%E5%BA%A6%E5%8A%A0%E7%9B%9F%E6%A0%A1%E8%AA%BF%E6%9F%BB%E9%9B%86%E8%A8%88%EF%BC%88%E7%A2%BA%E5%AE%9A%E5%80%A4%EF%BC%89.pdf",
        "table": "加盟生徒数(男子)/加盟生徒数(女子) のバドミントン列",
        "pdfPage": 5,
        "valueColumn": "バドミントン(男子ページ5・女子ページ6の該当列を合算)",
        "dataYear": "令和7年度(令和7年6月1日現在)",
        "accessedAt": "2026-07-20",
        "extraction": "PDFを取得しpdftotext -layoutで5ページ(男子)・6ページ(女子)をテキスト化→都道府県別に19競技の列を抽出→男女合算→中学校生徒数(2024年度)で100人あたりに換算。抽出スクリプト: .claude/scripts/data/fetch-chutairen-club-membership.mjs",
        "verification": "各都道府県行内の19競技合計が「男子合計」「女子合計」列と一致し、47都道府県の競技別合算がPDF巻末「総合計」行の公表全国値(男子合計981,623・女子合計703,450・男女合計1,685,073等)と完全一致(検算パス)",
        "restore": "node .claude/scripts/data/fetch-chutairen-club-membership.mjs で中体連PDFを再取得し同じ抽出・検算・換算を再現できる",
      },
    },
    "displayName": "(公財)日本中学校体育連盟",
    "url": "https://nippon-chutairen.or.jp/data/result/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "中学バドミントン部の加入率、都道府県で差｜1位富山県8.63人 vs 最下位島根県0.43人【2025年】",
  "seoDescription": "中学校のバドミントン部(運動部活動)の加盟部員数を中学生100人あたりに換算し都道府県別に比較。1位富山県(8.63人)、最下位島根県(0.43人)で最大20.1倍の差。地図とグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
