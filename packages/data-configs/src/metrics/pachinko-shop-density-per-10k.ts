import type { MetricConfig } from "../types";

export const pachinkoShopDensityPer10k: MetricConfig = {
  "key": "pachinko-shop-density-per-10k",
  "title": "パチンコ店舗数",
  "subtitle": "人口1万人あたり",
  "unit": "軒",
  "category": "commercial",
  "note": "麻雀店・ゲームセンター等は含まずぱちんこ営業所のみ。原典は警察庁保安課、全日遊連が集計・公表",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "全日本遊技事業協同組合連合会「全国遊技場店舗数及び機械台数(警察庁発表)」2025年報告",
        "url": "https://www.zennichiyuren.or.jp/material/report/8.html",
        "license": "[要確認] 出典元は「All rights Reserved」を明記しライセンス明文未確定。原典は警察庁保安課の公表統計であり、事実(数値)として出典明記の上で利用。問題提起があれば速やかに取り下げる",
      },
      "description": "都道府県別ぱちんこ営業所数(2025年12月31日現在、全日遊連公表)を、都道府県人口(2024年10月1日推計、japanese-population metric)1万人あたりに換算した値",
      "provenance": {
        "publicationIndexUrl": "https://www.zennichiyuren.or.jp/material/report/",
        "url": "https://www.zennichiyuren.or.jp/material/report/8.html",
        "table": "遊技場店舗数、機械台数一覧表",
        "valueColumn": "店舗数",
        "dataYear": "2025年12月31日現在(店舗数)。人口は2024年10月1日推計(japanese-population metric・年次不一致は最新入手可能値のため)",
        "accessedAt": "2026-07-20",
        "extraction": "HTML表(都道府県ごとの<td>県名</td><td>店舗数</td>行、北海道は道本部+旭川+釧路+北見+函館5方面計、東京は単独行)から店舗数を抽出し、japanese-population(R2 app/stats/japanese-population/values.json)の2024年値で人口1万人あたりに換算(店舗数÷(人口÷10000)、小数点1位)",
        "verification": "都道府県別店舗数の合計6,464軒が表内の全国合計「店舗数は6,464軒」と完全一致(地方ブロック計・全国計とも突合済み)。1位鹿児島県が全国的に報道される「パチンコ店密度日本一」の通説と整合",
        "restore": "node .claude/scripts/data/fetch-pachinko-shop-density.mjs (HTML再取得→47件抽出→ブロック計/全国計6,464軒と自動突合→japanese-populationの2024年値で換算→.local/r2に書き出し)",
      },
    },
    "displayName": "全日本遊技事業協同組合連合会",
    "url": "https://www.zennichiyuren.or.jp/material/report/8.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "calendar",
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
  "seoTitle": "パチンコ店密度ランキング都道府県【2025年】｜1位鹿児島県は本当か? 人口1万人あたりで比較",
  "seoDescription": "都道府県別ぱちんこ店舗数を人口1万人あたりで比較。全日遊連公表の2025年データで鹿児島県が全国1位、東京都・神奈川県・奈良県が最下位クラス。地図とグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
