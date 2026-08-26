import type { MetricConfig } from "../types";

export const educationExpenditureRatioPrefFinance: MetricConfig = {
  "key": "education-expenditure-ratio-pref-finance",
  "title": "教育費割合",
  "subtitle": "都道府県財政",
  "description": "都道府県財政の教育総務、学校、社会教育、保健体育などに係る教育費を、歳出決算総額で割り、100倍した割合。",
  "note": "都道府県財政だけの目的別歳出構成比で、市町村の教育費は含まない。児童・生徒1人当たり教育費や教育成果を示す指標ではない。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0311501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1978,
      1979,
      1980,
      1981,
      1982,
      1983,
      1984,
      1985,
      1986,
      1987,
      1988,
      2022,
    ],
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
  "seoTitle": "教育費割合ランキング都道府県【2022年】｜1位滋賀県（21.95％）",
  "seoDescription": "2022年の教育費割合の都道府県別ランキング。1位滋賀県（21.95％）、最下位東京都（12.23％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
