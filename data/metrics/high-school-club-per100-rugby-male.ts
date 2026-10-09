import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const highSchoolClubPer100RugbyMale: MetricConfig = {
  "key": "high-school-club-per100-rugby-male",
  "title": "高校男子 100人あたり ラグビー部員数",
  "subtitle": "ラグビーフットボール(男子)",
  "unit": "人",
  "category": "educationsports",
  "note": "全国高体連の加盟登録人数(男子ラグビーフットボール・令和7年10月現在・全日制+定通制)を、高等学校の男子生徒数(学校基本調査・令和7年5月1日現在・全日制+定時制の本科)で割って100人あたりに換算した値。登録人数に通信制の男子が含まれる場合は分子だけに入るため、わずかに大きく出る。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "(公財)全国高等学校体育連盟「令和7年度 加盟・登録状況【全日制＋定通制】」(令和7年10月現在)、文部科学省「学校基本調査」令和7年度",
        "url": "https://www.zen-koutairen.com/statistics/",
        "license": "[要確認] 全国高体連サイトに利用規約の明文を確認できず。加盟登録人数は事実として出典明記のうえ利用(オーナー承認 2026-10-08・問題指摘時は取り下げ)。分母の学校基本調査は政府統計(e-Stat)",
      },
      "description": "高校生の男子ラグビー部員数(全国高体連の加盟登録人数)を、都道府県別の高等学校男子生徒数100人あたりに換算した値。分子=全国高体連『令和7年度 加盟・登録状況』ラグビーフットボール男子の人数、分母=学校基本調査 令和7年度 高等学校(全日制+定時制・本科)の男子生徒数(都道府県別 学科別学年別生徒数、e-Stat 表番号 ey-168)。",
      "provenance": {
        "publicationIndexUrl": "https://www.zen-koutairen.com/statistics/",
        "pdfUrl": "https://www.zen-koutairen.com/pdf/reg-reiwa07.pdf",
        "table": "令和7年度 加盟・登録状況【全日制＋定通制】(PDF 2ページ目)。分母: 学校基本調査 高等学校 都道府県別 学科別学年別生徒数(本科) ey-168 計 全日制＋定時制 シート ey0168-1",
        "pdfPage": 2,
        "valueColumn": "ラグビーフットボール 男子 人数(分子)。分母は ey0168-1 の男(列C) https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040393253&fileKind=0",
        "dataYear": "令和7年度(分子=令和7年10月現在、分母=令和7年5月1日現在)",
        "accessedAt": "2026-10-08",
        "extraction": "PDFを取得し pdftotext -layout で2ページ目をテキスト化→47都道府県の36数値(18競技区分の校数・人数)を抽出→ラグビー男子の人数を取り出す。分母のxlsxは e-Stat から取得し男子生徒数を読み、人数÷男子生徒数×100(2桁丸め)。抽出スクリプト: .claude/scripts/data/fetch-zen-koutairen-rugby.mjs",
        "verification": "分子: 36列すべてで47県の合算がPDFの合計行と完全一致(ラグビー男子813校・17,158人)。分母: 47県で 計=男+女、男=国立+公立+私立、男=全日制男+定時制男",
        "restore": "node .claude/scripts/data/fetch-zen-koutairen-rugby.mjs でPDFとxlsxを再取得し同じ抽出・検算・換算を再現できる",
      },
    },
    "displayName": "(公財)全国高等学校体育連盟",
    "url": "https://www.zen-koutairen.com/statistics/",
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
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "surveyId": "school-basic-survey",
  "seoTitle": "高校ラグビー部員の比率、都道府県で差｜1位山梨県2.27人 vs 最下位山形県0.29人【2025年度】",
  "seoDescription": "高校男子100人あたりのラグビー部員数(全国高体連の加盟登録人数÷学校基本調査の男子生徒数)を都道府県別に比較。1位山梨県2.27人、最下位山形県0.29人で約7.8倍の差。地図とグラフで47都道府県を比較。",
  "isActive": true,
};
