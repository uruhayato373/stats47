import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const annualSnowDays: MetricConfig = {
  "key": "annual-snow-days",
  "title": "年間雪日数",
  "description": "量にかかわりなく、雪・しゅう雪・ふぶき・みぞれ・霧雪・細氷のうち一つ以上が観測された日の年間の日数。雪あられ・氷あられ・凍雨・ひょうは含まない。観測地点は都道府県庁所在地の気象台で、埼玉県は熊谷市、千葉県は銚子市、東京都は千代田区、滋賀県は彦根市、山口県は下関市の観測値を使う。県全体の平均ではなく、その地点の値である。出典は気象庁の「過去の気象データ」。",
  "note": "年の区切りは、2003年以前が当年1〜12月、2004年以降が前年8月〜当年7月。2019年2月に7地点、2020年2月に27地点が、目視観測通報の自動化に伴って観測方法を変えたため、前後の値は単純に比べられない。2020年に値があるのは20都道府県だけ(2019年は40都道府県)で、これは47から27、47から7を引いた数に一致する。社会・人口統計体系は2020年で収集を中止している。最新年の2020年は20都道府県だけの順位なので、ページの題と説明に県数を明記して表示する。最新年を2019年へ選び直す案は、2019年も40都道府県で47に届かず、最新の値を捨てるだけなので採らなかった。出典: e-Stat「統計項目の定義 B 自然環境」https://www.e-stat.go.jp/koumoku/koumoku_teigi/B (2026-11-14 確認)、年別の県数は e-Stat 取得可否の台帳の表 0000010102 (2026-10-07 取得)",
  "unit": "日",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      1975,
      1976,
      1977,
      1978,
      1979,
      1980,
      1981,
      1983,
      1984,
      1985,
      1986,
      1987,
      1988,
      1989,
      1990,
      1991,
      1992,
      1993,
      1994,
      1995,
      1996,
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2020,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "年間雪日数ランキング【2020年・観測方法の変更後に値のある20都道府県】｜1位北海道（118日）",
  "seoDescription": "2020年の年間雪日数の都道府県別ランキング。観測方法の変更で値があるのは20都道府県のみ。1位北海道（118日）、最下位沖縄県（0日）。観測地点は県庁所在地の気象台。",
  "isActive": true
};
