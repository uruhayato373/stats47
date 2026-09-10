export const PROPERTY_PRICE_DISTRIBUTION_SOURCE = {
  "r2Key": "app/themes/land-property-market/property-prices.json",
  "profileKey": "property-price-distribution",
  "year": "2025",
  "unit": "円/m2",
  "displayUnit": "円/㎡",
  "sourceManifestSha256": "172eeb706c9bd080567ca828a38b6dbf05b50444da69fe5e6e5bb61cc3bdf639",
  "definition": {
    "areaM2": {
      "minInclusive": 100,
      "maxExclusive": 300
    },
    "transactionType": "宅地(土地)",
    "transactionRegion": "住宅地",
    "priceClassification": "01",
    "transactionPeriod": {
      "from": "2025-Q1",
      "to": "2025-Q4"
    },
    "officialUseCode": "000",
    "officialPriceDate": "2025-01-01",
    "quantileMethod": "Hyndman-Fan type 7: sorted x; h=(n-1)p; linear interpolation",
    "nationalAggregation": "pooled selected rows; not average of prefecture quantiles"
  },
  "metrics": [
    {
      "key": "residential-land-transaction-median-price",
      "exportName": "residentialLandTransactionMedianPrice",
      "title": "住宅地の取引単価中央値（100〜300㎡未満）",
      "dataset": "transactions",
      "statistic": "median",
      "unit": "円/m2"
    },
    {
      "key": "residential-land-transaction-sample-count",
      "exportName": "residentialLandTransactionSampleCount",
      "title": "住宅地の取引価格標本数（100〜300㎡未満）",
      "dataset": "transactions",
      "statistic": "count",
      "unit": "件"
    },
    {
      "key": "residential-official-land-median-price",
      "exportName": "residentialOfficialLandMedianPrice",
      "title": "住宅地の公示価格中央値（100〜300㎡未満）",
      "dataset": "officialLandPrice",
      "statistic": "median",
      "unit": "円/m2"
    },
    {
      "key": "residential-official-land-point-count",
      "exportName": "residentialOfficialLandPointCount",
      "title": "住宅地の公示標準地数（100〜300㎡未満）",
      "dataset": "officialLandPrice",
      "statistic": "count",
      "unit": "地点"
    }
  ],
  "sources": [
    {
      "id": "transactions",
      "title": "国土交通省 不動産情報ライブラリ 不動産取引価格情報 2025年",
      "url": "https://www.reinfolib.mlit.go.jp/",
      "downloadPageUrl": "https://www.reinfolib.mlit.go.jp/realEstatePrices/",
      "accessedAt": "2026-09-10",
      "license": "PDL1.0",
      "unitColumn": "取引価格（㎡単価）",
      "rawUnit": "円/m2",
      "calculation": "CSV公表単価を直接使用。総額/面積の再計算はしない。"
    },
    {
      "id": "officialLandPrice",
      "title": "国土交通省 国土数値情報 地価公示 2025年1月1日",
      "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2025.html",
      "downloadUrl": "https://nlftp.mlit.go.jp/ksj/old/data/L01/L01-2025P/L01-2025P-48-01.0a.zip",
      "accessedAt": "2026-09-10",
      "license": "CC-BY-4.0",
      "unitColumn": "価格R07",
      "rawUnit": "円/m2",
      "calculation": "1標準地1行の公示価格を使用。鑑定士ごとの鑑定評価額は使用しない。"
    }
  ],
  "notes": [
    "取引価格は回答された取引を個別物件が特定されないよう加工したサンプルであり、全物件の相場や全取引件数を示しません。",
    "取引は地域区分「住宅地」、地価公示は用途区分「住宅地」を用い、公表面積帯を揃えています。地域区分と用途区分は同一の分類ではなく、立地・接道・形状等も統制していません。価格を時点調整していないため、2025年中の取引と2025年1月1日の公示価格を比率や割安・割高の判定に使いません。",
    "取引面積は公表時点で丸められており、100㎡以上300㎡未満は公表された面積値で判定します。上限表記・欠測は数値に置換せず除外数を表示します。",
    "取引単価は原表の円/㎡列を使い、丸め済み総額を丸め済み面積で割り直しません。",
    "各CSV行を1標本として保持します。匿名化後の完全一致行は同一取引と断定できないため自動削除していません。取引価格01のみを用い、成約価格02を混ぜていません。",
    "地価公示は2025年に調査した25,563標準地から抽出します。26,000地点のうち隔年調査430地点、福島第一原発事故6地点、能登半島地震1地点は当年調査休止です。",
    "全国表示は条件に合う公表行をまとめた当サイトの集計であり、公的機関が公表した全国中央値ではありません。",
    "該当標本がない場合は価格を表示せず、10件未満は標本が少ないことを示します。今後の追加回答で原表が更新されるため、2026年9月10日に取得したデータを用いています。"
  ]
} as const;
