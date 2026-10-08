import type { MetricConfig } from "../types";

export const nationalAssessmentElementaryTutoringRate: MetricConfig = {
  "key": "national-assessment-elementary-tutoring-rate",
  "title": "学習塾・家庭教師で教わっている小学生の割合",
  "subtitle": "全国学力・学習状況調査(公立・小6)",
  "note": "公立の小学校6年生の児童の回答が対象で、国立・私立は含まない。質問紙の回答であり、実際の行動を直接測った値ではない。質問「学習塾の先生や家庭教師の先生に教わっていますか(オンライン授業の場合も含む)」で『教わっていない』以外を選んだ割合。通塾に限らず、家庭教師・オンライン授業も含む。",
  "seoTitle": "学習塾・家庭教師で教わる小学生の割合｜1位東京都57.9% vs 最下位秋田県22.8%【2025年度】",
  "seoDescription": "全国学力・学習状況調査(令和7年度・公立小6)で学習塾や家庭教師に教わっていると回答した児童の割合を都道府県別に比較。1位東京都57.9%、最下位秋田県22.8%で約2.5倍の差。地図とグラフで47都道府県を比較。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "文部科学省・国立教育政策研究所「令和7年度 全国学力・学習状況調査 調査結果資料【都道府県別】」回答結果集計[児童質問調査](公立)",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "license": "[要確認] 国立教育政策研究所の利用条件は未確認。調査結果の公表値を出典明記のうえ利用(オーナー承認 2026-10-08・問題指摘時は取り下げ)",
      },
      "description": "全国学力・学習状況調査(令和7年度)の児童質問『学習塾の先生や家庭教師の先生に教わっていますか(オンライン授業の場合も含む)』で、『教わっていない』以外(学校の勉強より進んだ内容・分からなかった内容などを教わっている)を選んだ公立小学校6年生の割合(%)。",
      "provenance": {
        "publicationIndexUrl": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/01_hokkaido/01p_25a.xlsx",
        "table": "回答結果集計[児童質問調査] <都道府県>-児童(公立)【表】(各県 NN_<slug>/NNp_25a.xlsx、47ファイル)",
        "valueColumn": "質問(20)『学習塾の先生や家庭教師の先生に教わっていますか』の選択肢2〜5の児童数(選択肢1『教わっていない』を除く)",
        "dataYear": "令和7年度(2025年度・調査日 令和7年4月)",
        "accessedAt": "2026-10-08",
        "extraction": "都道府県ページ一覧から47県の NNp_25a.xlsx を取得→シート『児童質問 回答結果集計表』の質問行(件数行)から該当選択肢の児童数を読み、質問番号(1)〜(71)の集計対象児童数で割って%換算(小数第1位)。抽出スクリプト: .claude/scripts/data/fetch-national-assessment-questionnaire.mjs",
        "verification": "各県の割合が公表の選択肢別%の合計と±0.15ptで一致/47県の児童数を合算した全国(公立)割合が各ファイルが載せる全国(公立)の公表割合と±0.15ptで一致/質問文を県ごとに照合",
        "restore": "node .claude/scripts/data/fetch-national-assessment-questionnaire.mjs で47ファイルを再取得し同じ抽出・検算を再現できる",
      },
    },
    "displayName": "国立教育政策研究所「全国学力・学習状況調査」",
    "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "surveyId": "academic-achievement-survey",
  "isActive": true,
};
