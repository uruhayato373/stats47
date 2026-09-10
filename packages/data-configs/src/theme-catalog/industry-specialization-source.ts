export const INDUSTRY_SPECIALIZATION_SOURCE = {
  "title": "令和3年経済センサス‐活動調査 事業所 第20表",
  "url": "https://www.e-stat.go.jp/dbview?sid=0004005665",
  "sha256": "b3f8f5f9b2bc304fb6ef7b70c36cd5bc276ff0628c4d51707447b622b645b5a7",
  "period": "2021",
  "r2Key": "app/themes/local-economy/specialization.json",
  "population": "民営事業所（外国の会社及び法人でない団体を除く）・事業所所在地別・2021年6月1日",
  "industryClassification": "日本標準産業分類（2013年10月改定）大分類A〜R",
  "denominator": "公式全産業（S 公務を除く）従業者数。18大分類に分かれない上位集計の差分も含む。",
  "formula": "(県内産業従業者数 / 県内全産業従業者数) / (全国産業従業者数 / 全国全産業従業者数)",
  "notes": [
    "1は全国と同じ従業者構成比。1超は全国より構成比が高いことを示し、生産性や成長性の優劣ではない。",
    "公務と農林漁業の個人経営等を除く。全国全産業の279人は大分類内訳に含まれない上位集計の差分で、分母から除外しない。"
  ]
} as const;
