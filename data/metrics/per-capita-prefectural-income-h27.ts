import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const perCapitaPrefecturalIncomeH27: MetricConfig = {
  "key": "per-capita-prefectural-income-h27",
  "title": "1人当たり県民所得",
  "subtitle": "H27年基準",
  "description": "県民経済計算 (内閣府) の県民所得を県の総人口で割った値。県民所得は県の居住者 (個人のほか法人企業・行政機関を含む) に分配された所得で、雇用者報酬・財産所得・企業所得から成る。県内の生産から生まれた所得に、県外から受け取った所得の純額を加える。年度計 (4月〜翌3月)。",
  "note": "個人の給与や世帯の手取りではない (企業所得を含む)。分母が総人口であることは、内閣府の2021年度の総括表で全県計 417,900,154百万円 ÷ 125,502,290人 = 3,330千円が公表の1人当たり県民所得と一致することで確かめた (2026-10-21)。県内総生産には名目と実質の両方の表があるが、県民所得は一方の系列しか公表されておらず、物価変動を除いた値ではない。平成17年・23年基準の系列とはつながない。出典: e-Stat 統計項目の定義 C 経済基盤 (C122101) https://www.e-stat.go.jp/koumoku/koumoku_teigi/C / 内閣府 県民経済計算 https://www.esri.cao.go.jp/jp/sna/data/data_list/kenmin/files/contents/main_2021.html",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01321",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  // 2026-08-12: 2020 のみだったため、ブログ per-capita-income-gap が引用する 2021年度に
  // SSOT の裏付けが無い状態だった (記事「東京 5,214千円 / 2021年度」に対し R2 は 2020年度の
  // 5,204千円しか持たない)。e-Stat は全年度を返し `years` は絞り込みなので、上端を伸ばしても
  // 上流に 2021 が無ければ何も増えない (推測で値を作らない)。
  // 2026-10-06: getStatsData (cdCat01=#C01321) で 2012〜2021 年度に 48 地域の値があることを確認し、下端を広げた。
  // 分類名は全年度「1人当たり県民所得（平成27年基準）」で同じ系列。平成17年・23年基準の別 key とはつながない。
  "years": {
    "from": 2012,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "1人当たり県民所得（平成27年基準）",
  "isActive": true,
};
