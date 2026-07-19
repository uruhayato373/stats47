import type { MetricConfig } from "../types";

export const treatmentRateAsthmaInpatient: MetricConfig = {
  "key": "treatment-rate-asthma-inpatient",
  "title": "喘息の受療率（入院）",
  "subtitle": "入院患者の受療率",
  "description": "厚生労働省「患者調査」（2023年）の傷病分類別受療率（人口10万対）。喘息の受療率（入院）のデータ。",
  "unit": "人（人口10万対）",
  "category": "socialsecurity",
  "source": {
    "kind": "external",
    "fetcherKey": "estat",
    "config": {
      "estat": {
        "statsDataId": "0004026105",
      },
      "source": {
        "name": "患者調査",
        "url": "https://www.mhlw.go.jp/toukei/saikin/hw/kanja/23/index.html",
      },
      "provenance": {
        "table": "第37表 受療率（人口10万対），入院－外来・施設の種類×傷病分類×都道府県別（e-Stat統計表ID 0004026105）",
        "dataYear": "2023",
        "accessedAt": "2026-07-19",
        "extraction": "e-Stat統計表ID 0004026105（患者調査 令和5(2023)年 都道府県編 T37）を「傷病分類」軸=喘息、「入院－外来・施設の種類」軸=入院 でフィルタして取得。cdCat 数値コードは getMetaInfo 未実施のため未確定",
        "verification": "e-Stat dbview (https://www.e-stat.go.jp/dbview?sid=0004026105) をWebFetchで確認し、当該統計表が「傷病分類」軸に喘息を含む行を持つこと、「入院－外来・施設の種類」軸で入院を区別できることを確認済み（2026-07-19）。兄弟表T39(0004026107)/T40-2(0004026109・入院)/T40-3(0004026110・外来)は傷病大分類のみで疾病別内訳を持たないため対象外と判別済み",
        "restore": "gh workflow run estat-fetch-meta.yml -f ids=0004026105 で getMetaInfo を取得し、cdCat01(傷病分類=喘息)/cdCat02(入院-外来・施設の種類=入院)の数値コードを確定した上で data-ingester がR2投入する",
      },
    },
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人（人口10万対）/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人（人口10万対）/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "喘息の受療率（入院）ランキング都道府県【2023年】｜1位新潟県（3人（人口10万対））",
  "seoDescription": "2023年の喘息の受療率（入院）の都道府県別ランキング。1位新潟県（3人（人口10万対））、最下位佐賀県（1人（人口10万対））で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
