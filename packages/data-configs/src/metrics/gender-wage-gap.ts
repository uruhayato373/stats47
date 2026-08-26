import type { MetricConfig } from "../types";

export const genderWageGap: MetricConfig = {
  "key": "gender-wage-gap",
  "title": "男女間賃金格差（女性/男性）",
  "description": "賃金構造基本統計調査における女性一般労働者の所定内給与額を男性一般労働者の所定内給与額で割り、100倍した値。男性を100としたときの女性の賃金水準を表す。",
  "note": "所定内給与額は調査年6月分の税・社会保険料控除前の現金給与から、時間外・深夜・休日勤務などの超過労働給与を除いた額。短時間労働者の賃金格差ではない。",
  "unit": "%",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "cdTab": "10",
    "cdCat02": "01",
    "cdCat03": "01",
    "cdCat04": "01",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["03"],
      "denominatorCodes": ["02"],
    },
    "displayName": "賃金構造基本統計調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateRdYlBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    // 取り込み時に axisRatio (cat01: 女 03 / 男 02) で確定するので実行時計算ではない。
    // 旧: female/male-scheduled-earnings を実行時に割る宣言だったが、builder が
    // calculation.type を焼いていなかったため常に空を返していた。
    "isCalculated": false,
  },
  "groupKey": "gender-wage",
  "seoTitle": "男女間賃金格差（女性/男性） 都道府県ランキング【2022年】｜1位青森県（81.9%）",
  "seoDescription": "2022年の男女間賃金格差（女性/男性）を都道府県別に比較。1位は青森県（81.9%）、最下位は香川県（73.2%）、最大と最小の差は1.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
