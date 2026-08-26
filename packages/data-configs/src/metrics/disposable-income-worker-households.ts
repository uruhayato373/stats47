import type { MetricConfig } from "../types";

export const disposableIncomeWorkerHouseholds: MetricConfig = {
  "key": "disposable-income-worker-households",
  "title": "可処分所得（二人以上の世帯のうち勤労者世帯）",
  "description": "家計調査の二人以上の世帯のうち勤労者世帯について、1世帯当たり年平均1か月間の実収入から、直接税や社会保険料などの非消費支出を差し引いた額。",
  "note": "都道府県値は県庁所在都市別の結果で、都道府県全域の平均ではない。2007年までは農林漁家世帯を除き、2008年から含む。",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L3130",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  // e-Stat 実測 (2026-08-05): 0000010112 × L3130 は 1975-2025 の 51 年が連続で存在する
  // (東京都で確認・単位は全年 円)。2024 単年に絞っていたのは取り込み側の設定で、
  // データ側の制約ではなかった。この 1 年しか無いことが real-disposable-income /
  // disposable-income-after-rent (どちらも本指標を分子に持つ計算型) の推移チャートが
  // 空になる根因だった。
  //
  // 上限を 2025 ではなく 2024 に留めるのは、最新年が動くと下の seoTitle /
  // seoDescription の実数 (1位東京都 637,958円 = 2024年値) が古くなるため。
  // 2025 への更新は SEO 文面の更新とセットで別途行う。
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "可処分所得（二人以上の世帯のうち勤労者世帯）ランキング都道府県【2024年】｜1位東京都（637,958円）",
  "seoDescription": "2024年の可処分所得（二人以上の世帯のうち勤労者世帯）の都道府県別ランキング。1位東京都（637,958円）、最下位愛媛県（420,678円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
