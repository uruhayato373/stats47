import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const highSchoolAdvancementRate: MetricConfig = {
  "key": "high-school-advancement-rate",
  "title": "高等学校卒業者の進学率",
  "description": "当年3月の高等学校卒業者（新規）のうち進学者の占める割合。進学者には大学の学部と短期大学の本科への進学者を含み、専修学校・各種学校への入学者は含まない。分母は新規の高等学校卒業者で、浪人などの既卒者は入らない。出典は文部科学省の学校基本調査（社会・人口統計体系の E4701）。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E09402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
    "to": 2023,
  },
  "yearFormat": "fiscal",
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
  "seoTitle": "高等学校卒業者の進学率ランキング都道府県【2023年】｜1位東京都（74.1％）",
  "seoDescription": "2023年の高等学校卒業者の進学率の都道府県別ランキング。1位東京都（74.1％）、最下位沖縄県（46.7％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
