import type { MetricConfig } from '../types';

export const giniCoefficientFinancialAssets: MetricConfig = {
  "key": "gini-coefficient-financial-assets",
  "title": "等価金融資産残高ジニ係数",
  "subtitle": "総世帯・貯蓄現在高",
  "description": "全国家計構造調査の所得資産集計体系による、県内の等価金融資産残高の分布の不均等度です。世帯の金融資産を世帯人員の平方根で調整し、世帯員ベースで計算しています。",
  "note": "2019年10月末の貯蓄現在高で、負債控除前の値です。所得の系列とは有効集計世帯が異なり、両係数の差を同一標本上の資産の効果とは解釈できません。県の係数の平均を全国値とはしません。",
  "source": {
    "kind": "estat",
    "statsDataId": "0003440696",
    "cdTab": "25-2019",
    "cdCat01": "2",
    "displayName": "2019年全国家計構造調査（年間収入・資産分布等、第7-26表）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003440696"
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
