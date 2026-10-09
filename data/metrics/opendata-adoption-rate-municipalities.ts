import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const opendataAdoptionRateMunicipalities: MetricConfig = {
  "key": "opendata-adoption-rate-municipalities",
  "title": "オープンデータ取組済み市区町村の割合",
  "subtitle": "市区町村総数に占める取組済み市区町村",
  "unit": "％",
  "category": "administrativefinancial",
  "note": "令和8年(2026年)6月30日時点。市区町村のみの割合で、都道府県自身の取組は含まない。市区町村総数は既存指標「市町村数」(2024年度、東京23区を含む全国1,741)を用いた。デジタル庁へ報告のあった団体のみが取組済みとして数えられるため、未報告の取組は反映されない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "デジタル庁「オープンデータ取組済自治体資料」全団体リスト(CSV)令和8年6月30日時点",
        "url": "https://www.digital.go.jp/resources/data_local_governments",
        "license": "デジタル庁の利用規約(公共データ利用規約第1.0版・商用可・出典表示必須)https://www.digital.go.jp/copyright-policy",
      },
      "description": "オープンデータに取り組んでいる市区町村数(デジタル庁へ報告のあった、自らのホームページでオープンデータとしての利用規約を適用してデータを公開または公開先を提示している団体)を、都道府県ごとの市区町村総数で割った割合。分子=全団体リストのうち団体コード下位が都道府県でない行を団体コード上2桁で県別に集計、分母=metric municipality-count(2024年度)。出典を明記し、取組済み団体数を市区町村総数で除する加工を行った。",
      "provenance": {
        "publicationIndexUrl": "https://www.digital.go.jp/resources/data_local_governments",
        "url": "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/2b1128e2-c699-4aa0-9206-37169a6697c8/3d2142af/20260630_resources_opendata_lg_list_02.csv",
        "table": "オープンデータ取組済自治体一覧 全団体リスト(CSV)",
        "valueColumn": "団体コード(6桁)。上2桁=都道府県、3〜5桁が000の行=都道府県自身、それ以外=市区町村。県別の市区町村行数÷市区町村総数×100",
        "dataYear": "令和8年(2026年)6月30日時点",
        "accessedAt": "2026-10-08",
        "extraction": "ランディングページから全団体リストCSV(UTF-8 BOM付き)の直リンクを解決して取得→団体コード上2桁で県別に市区町村行を計数→既存metric municipality-count(R2 app/stats、2024年度)で除して%換算(小数第1位)。抽出スクリプト: .claude/scripts/data/fetch-opendata-adoption-rate.mjs",
        "verification": "全団体行数1,617がデジタル庁公表資料(PPTX)の取組数1,617と一致/都道府県行47件/県+市区町村の合計が1,617/分母の全国計1,741に47を足すと公表分母1,788と一致/全県で取組済み<=総数",
        "restore": "node .claude/scripts/data/fetch-opendata-adoption-rate.mjs でCSVを再取得し同じ集計・検算・換算を再現できる",
      },
    },
    "displayName": "デジタル庁",
    "url": "https://www.digital.go.jp/resources/data_local_governments",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2026,
    "to": 2026,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "デジタル庁へ報告のあった自治体の取組状況リストを県別に数えた行政台帳由来の値で、統計調査を原典としないため",
  "seoTitle": "オープンデータに取り組む市区町村の割合、都道府県で差｜最下位山形県48.6% 【2026年】",
  "seoDescription": "オープンデータに取り組む市区町村の割合を都道府県別に比較。22県が100%に対し、山形県48.6%・佐賀県50.0%・鹿児島県53.5%など約2倍の差。令和8年6月30日時点、デジタル庁の取組済自治体リストから算出。",
  "isActive": true,
};
