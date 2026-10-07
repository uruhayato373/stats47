import type { MetricConfig } from "../types";

export const elementarySchoolStudentsPerTeacher: MetricConfig = {
  "key": "elementary-school-students-per-teacher",
  "title": "小学校児童数",
  "subtitle": "教員1人当たり",
  "description": "小学校児童数を小学校教員数で除した、教員1人当たりの児童数です。1学級の人数や教員の配置不足を直接示す指標ではありません。",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0510301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1980,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
    "isCalculated": false
  },
  "groupKey": "elementary-school-children-count",
  "seoTitle": "教員1人当たり小学校児童数｜都道府県比較",
  "seoDescription": "教員1人当たり小学校児童数を都道府県別に比較。指標の対象地域・分母・単位・年次を確認し、表とグラフで地域差を把握できます。",
  "isActive": true,
};
