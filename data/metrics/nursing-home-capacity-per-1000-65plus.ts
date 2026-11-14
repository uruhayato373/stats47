import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nursingHomeCapacityPer100065plus: MetricConfig = {
  "key": "nursing-home-capacity-per-1000-65plus",
  "title": "老人ホーム定員数（65歳以上人口千人当たり）",
  "description": "65歳以上人口千人当たりの老人ホーム定員数です。定員は社会福祉施設等調査・介護サービス施設・事業所調査(詳細票)の、養護老人ホーム、介護老人福祉施設(特別養護老人ホームのうち入所定員30人以上で介護保険の指定を受けたもの)、軽費老人ホーム、有料老人ホーム(サービス付き高齢者向け住宅以外)の4種の合計で、算式は (J230112+J230124+J230132+J230222)/A1303 です。サービス付き高齢者向け住宅と老人福祉センターは含みません。定員の絶対数や入所希望者の充足率ではありません。すでに人口で除した指標のため、追加の人口・面積正規化は行いません。",
  "note": "2009年と2012年に調査の方法が変わり、2018年以降は詳細票が全数調査から標本調査に移って推計値になるため、年をまたぐ比較には留意が必要。定員は予算上の定員や措置定員ではなく、認可等を受けた定員。出典: e-Stat「統計項目の定義 J 福祉・社会保障」https://www.e-stat.go.jp/koumoku/koumoku_teigi/J、算式は社会・人口統計体系の指標 #J042011 の定義 (2026-11-14 確認)",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J042011",
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
    "isCalculated": false
  },
  "seoTitle": "老人ホーム定員数（65歳以上人口千人当たり）｜都道府県比較",
  "seoDescription": "老人ホーム定員数（65歳以上人口千人当たり）を都道府県別に比較。指標の対象地域・分母・単位・年次を確認し、表とグラフで地域差を把握できます。",
  "isActive": true,
};
