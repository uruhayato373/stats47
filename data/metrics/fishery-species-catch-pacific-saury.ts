import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fisherySpeciesCatchPacificSaury: MetricConfig = {
  "key": "fishery-species-catch-pacific-saury",
  "title": "サンマ漁獲量",
  "description": "海面漁業によるさんまの漁獲量。1956年以降の長期累年データ。北海道・宮城・岩手の道東〜三陸沿岸が主産地。 本データは海面漁業による漁獲量で、内陸県（栃木・群馬・埼玉・山梨・長野・岐阜・滋賀・奈良）は対象外（39都道府県）。1956〜2018年と2023年の値で、2019〜2022年は都道府県の値がそろって公表されていないため載せていません。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003238633",
    "cdCat01": "0420",
    "displayName": "海面漁業生産統計調査",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1956,
    "to": 2023,
  },
  "supplementalSources": [
    {
      "years": [2016],
      "source": {
        "kind": "estat",
        "statsDataId": "0003216642",
        "cdCat01": "033",
        "displayName": "海面漁業生産統計調査",
        "url": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
      },
      "reason": "累年統計 (0003238633) は2015年で終わるため、海面漁業生産統計調査の年次表「大海区都道府県振興局別統計 魚種別漁獲量」から取る。魚種名と海のない8県を除く39都道府県の範囲は同じで、全国値は2014〜2016年の12魚種すべてで累年統計・年次別全国表と一致 (2026-10-08 確認)",
    },
    {
      "years": [2017],
      "source": {
        "kind": "estat",
        "statsDataId": "0003322129",
        "cdCat01": "033",
        "displayName": "海面漁業生産統計調査",
        "url": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
      },
      "reason": "累年統計 (0003238633) は2015年で終わるため、海面漁業生産統計調査の年次表「大海区都道府県振興局別統計 魚種別漁獲量」から取る。魚種名と海のない8県を除く39都道府県の範囲は同じで、全国値は2014〜2016年の12魚種すべてで累年統計・年次別全国表と一致 (2026-10-08 確認)",
    },
    {
      "years": [2018],
      "source": {
        "kind": "estat",
        "statsDataId": "0001803958",
        "cdCat01": "033",
        "areaAxis": { "axis": "cat02", "scheme": "name", "coverage": "coastal" },
        "displayName": "海面漁業生産統計調査",
        "url": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
      },
      "reason": "累年統計 (0003238633) は2015年で終わるため、海面漁業生産統計調査の年次表「大海区都道府県振興局別統計 魚種別漁獲量」から取る。魚種名と海のない8県を除く39都道府県の範囲は同じで、全国値は2014〜2016年の12魚種すべてで累年統計・年次別全国表と一致 (2026-10-08 確認)",
    },
    {
      "years": [2023],
      "source": {
        "kind": "estat",
        "statsDataId": "0004043248",
        "cdCat02": "1033",
        "areaAxis": { "axis": "cat01", "scheme": "name", "coverage": "coastal" },
        "displayName": "海面漁業生産統計調査",
        "url": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
      },
      "reason": "累年統計 (0003238633) は2015年で終わるため、海面漁業生産統計調査の年次表「大海区都道府県振興局別統計 魚種別漁獲量」から取る。魚種名と海のない8県を除く39都道府県の範囲は同じで、全国値は2014〜2016年の12魚種すべてで累年統計・年次別全国表と一致 (2026-10-08 確認)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "fishery-species",
  "seoTitle": "サンマ漁獲量ランキング｜なぜ北海道が1位?【2023】",
  "seoDescription": "サンマの漁獲量日本一は北海道で12,585トン──記録的不漁が続く中で北海道がなぜトップなのか。漁場の北上と39都道府県の漁獲量を2023年データで読み解きます。",
  "isActive": true,
};
