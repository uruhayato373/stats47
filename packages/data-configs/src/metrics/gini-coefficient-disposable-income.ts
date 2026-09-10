import type { MetricConfig } from '../types';

export const giniCoefficientDisposableIncome: MetricConfig = {
  "key": "gini-coefficient-disposable-income",
  "title": "等価可処分所得ジニ係数",
  "subtitle": "総世帯・OECD新基準準拠",
  "description": "全国家計構造調査の所得資産集計体系による、県内の等価可処分所得の分布の不均等度です。世帯の所得を世帯人員の平方根で調整し、世帯員ベースで計算しています。",
  "note": "2018年11月〜2019年10月の年間可処分所得。資産の系列とは有効集計世帯が異なるため、同一回答世帯における差ではありません。県の係数の平均を全国値とはしません。",
  "source": {
    "kind": "estat",
    "statsDataId": "0003440743",
    "cdTab": "25-2019",
    "cdCat01": "1",
    "displayName": "2019年全国家計構造調査（年間収入・資産分布等、第7-6表）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003440743"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2019,
    "to": 2019
  },
  "yearFormat": "calendar",
  "unit": "指数",
  "category": "economy",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 3
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};
