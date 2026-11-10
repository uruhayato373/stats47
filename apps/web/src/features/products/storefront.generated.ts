/**
 * 自動生成。手編集しない。
 * generator: apps/web/scripts/generate-product-storefront.ts
 */
import type { StorefrontProduct } from "./types";

export const STOREFRONT_PRODUCTS = [
  {
    "id": "MUNI-MANUFACTURING",
    "slug": "data-muni-manufacturing",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "市区町村別 製造品出荷額等 1980〜2023年＋業種別 CSV＋境界GeoJSON（1,719自治体・最新境域の時系列）",
    "description": "市区町村別の製造品出荷額等を 1980〜2023 年の時系列と 2021〜2023 年の業種別 (産業中分類 24 業種) でそろえ、最新の境界の地図データと結合して使う",
    "priceYen": 1980,
    "externalUrl": "https://note.com/stats47/n/n5d86476e9c73",
    "included": [
      "CSV (時系列 1980〜2023 年・1,719 自治体)",
      "CSV (業種別 2021〜2023 年・24 業種)",
      "GeoJSON (自治体の境界)",
      "README・検算表"
    ],
    "audience": [
      "自治体の企画・産業振興担当",
      "立地調査・地域分析の担当",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "showcase": [
      {
        "heading": "比べる：自治体の規模の順位と地図",
        "lead": "2023 年は豊田市が 20 兆 5,272 億円で、2 位の倉敷市の約 3.7 倍です。同じ年の値を自治体コードで境界に結合すれば、全国の地図にも、県の中の地図にもなります。",
        "figures": [
          {
            "file": "compare-bars-2023.png",
            "alt": "製造品出荷額等の上位と下位の自治体（2023年）"
          },
          {
            "file": "compare-map-2023.png",
            "alt": "製造品出荷額等の色分け地図（2023年・市区町村別）"
          },
          {
            "file": "aichi-map-2023.png",
            "alt": "愛知県の製造品出荷額等（2023年）"
          }
        ]
      },
      {
        "heading": "構成を見る：業種別の内訳と県内の割合",
        "lead": "業種別の表で、自治体の製造業がどの業種に頼っているかが分かります。豊田市は輸送用機械が 93.4% を占め、倉敷市は石油製品・鉄鋼・化学、市原市は石油製品と化学で約 9 割です。",
        "figures": [
          {
            "file": "industry-donut-toyota-2023.png",
            "alt": "豊田市の製造品出荷額等の業種別内訳（2023年）"
          },
          {
            "file": "industry-mix-3cities-2023.png",
            "alt": "上位3市の業種構成（2023年）"
          },
          {
            "file": "structure-aichi-treemap-2023.png",
            "alt": "愛知県の製造品出荷額等の内訳（2023年・54市町村）"
          },
          {
            "file": "structure-share-map-2023.png",
            "alt": "県内の合計に占める割合（2023年・市区町村別）"
          }
        ]
      },
      {
        "heading": "変化を見る：44 年の推移",
        "lead": "1980 年に 1 位だった東京都特別区部を、豊田市は 2002 年に上回りました。1980 年と 2023 年を比べた倍率も地図にできます (物価で直していない名目の値)。",
        "figures": [
          {
            "file": "change-trend-1980-2023.png",
            "alt": "製造品出荷額等の推移（1980〜2023年）"
          },
          {
            "file": "change-ratio-map-1980-2023.png",
            "alt": "1980年→2023年で何倍か（市区町村別）"
          }
        ]
      },
      {
        "heading": "ファイルの中身",
        "lead": "CSV は自治体コード・年・値の形で、業種別は業種コードと業種名の列が加わります。値が空の行には、秘匿などの理由を注記の列に書いています。",
        "figures": [
          {
            "file": "file-preview-toyota.png",
            "alt": "時系列のCSVの中身（豊田市の行の一部）"
          },
          {
            "file": "file-preview-industry-kurashiki.png",
            "alt": "業種別のCSVの中身（倉敷市・2023年の一部）"
          }
        ]
      }
    ],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/332041499/rectangle_large_type_2_ed3faeff21eb6e6a34de3f45686521e9.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-01",
    "slug": "data-p-01",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 人口・世帯データ 134指標｜CSV・Excel",
    "description": "人口・面積・世帯・所得を一冊で把握する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/ne47eb45f8a15",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "企画・営業",
      "自治体・公務員",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327852712/rectangle_large_type_2_9808a78289ba75a9473d8416baf21fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-02",
    "slug": "data-p-02",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 賃金・求人・働き方データ 107指標｜CSV・Excel",
    "description": "賃金・求人・採用市場の指標をまとめて把握・比較する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n46d68c153502",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "人事・採用支援",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327856740/rectangle_large_type_2_b5fb8a2a3e30547c5496bbd6799dfe53.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-03",
    "slug": "data-p-03",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 宿泊・交通・旅行データ 44指標｜CSV・Excel",
    "description": "宿泊・訪日・観光関連指標の地域差を把握・比較する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n7a5f6df6f5ac",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "観光事業者",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327860122/rectangle_large_type_2_12dc8af8294fe9865a47f0c34bcaefc9.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-04",
    "slug": "data-p-04",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 自治体財政・職員給与データ 119指標｜CSV・Excel",
    "description": "歳入歳出・財政指標の都道府県差を把握する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n5da8a99b3506",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "自治体・公務員",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327863352/rectangle_large_type_2_47c65477c27dcdf3f4bb97c4ab5faa33.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-05",
    "slug": "data-p-05",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 医療・介護データ 237指標｜CSV・Excel",
    "description": "病床・医師・介護・高齢化をまとめて把握・比較する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/nbdad7c99d4b5",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "医療・介護事業者",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327866695/rectangle_large_type_2_f8824e0d379bc6d8b55f8d15a4559f7f.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-06",
    "slug": "data-p-06",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 学校・保育・社会教育データ 244指標｜CSV・Excel",
    "description": "学校・保育・進学・子育て環境の指標を把握する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n9f0be14ecc0c",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "教育関係者",
      "移住支援",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327884421/rectangle_large_type_2_da2953b07fcf070247c692d68cd7c50b.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-07",
    "slug": "data-p-07",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 住居費・物価・気候データ 76指標｜CSV・Excel",
    "description": "住宅・物価など移住候補地の生活データを比較する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n323af74c09cc",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "移住支援",
      "個人",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327888189/rectangle_large_type_2_bd106c7f2e77404a07abb96967e5f273.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-08",
    "slug": "data-p-08",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 商業・小売データ 69指標｜CSV・Excel",
    "description": "出店候補地の商業・人口・購買に関する指標を比較する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n973c3f8478f5",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "小売・飲食事業者",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327892069/rectangle_large_type_2_8a0b3ef48c7ce4ae9be9ceed6aed7fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-09",
    "slug": "data-p-09",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 産業・農業・家計データ 132指標｜CSV・Excel",
    "description": "産業構成・事業所・就業者・経済規模をまとめて把握する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n2ced199ed715",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "事業企画",
      "コンサル",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327896437/rectangle_large_type_2_98a3986f90264806883eb5d2b6ade8b4.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-10",
    "slug": "data-p-10",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 防災・交通・インフラデータ 230指標｜CSV・Excel",
    "description": "災害・交通・エネルギー・インフラをまとめて把握する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/nf25cd9ae21e6",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "自治体・公務員",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327904763/rectangle_large_type_2_9fee30f49a8956331f44c2f3ccfcf7ff.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-11",
    "slug": "data-p-11",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県の地図・ランキング素材 28指標｜PNG・SVG・PowerPoint",
    "description": "資料・記事・SNS にそのまま貼れる地図・ランキング図版を入手する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n0f5dafef7fa8",
    "included": [
      "PPTX",
      "SVG",
      "PNG",
      "PDF"
    ],
    "audience": [
      "編集者・ライター",
      "企画・営業",
      "クリエイター"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328096609/rectangle_large_type_2_d9ab6507430978c166503a1f2248f9ef.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-12",
    "slug": "data-p-12",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "47都道府県 統計データ総合集 2,073指標｜CSV・Excel",
    "description": "テーマ横断で都道府県データと図表を一括で入手する",
    "priceYen": 2980,
    "externalUrl": "https://note.com/stats47/n/nfa7d235eba85",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "SVG",
      "PNG",
      "PDF"
    ],
    "audience": [
      "企画・営業",
      "自治体・公務員",
      "編集者・ライター"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328108626/rectangle_large_type_2_a20b7efd70ea5453e06527827d8cc689.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-14",
    "slug": "data-p-14",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "県庁所在市別 家計調査データ 832指標｜品目別 CSV・Excel",
    "description": "家計調査の消費支出・消費数量を品目横断でまとめて把握・比較する",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n554a047cf5be",
    "included": [
      "PPTX",
      "XLSX",
      "CSV",
      "PDF",
      "PNG"
    ],
    "audience": [
      "企画・営業",
      "編集者・ライター",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328109605/rectangle_large_type_2_3b2aa0eb69bbac8716e24beaae2009b7.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "K-S1-01",
    "slug": "kindle-k-s1-01",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "年収が高い県は、暮らしも豊かなのか",
    "description": "県民所得、家計調査の所得・支出、貯蓄と地域財政を別の対象として読み、対象世帯・年次・分母の一致を確認します。地域の平均を個人の手取りや県民性へ置き換えず、比較の限界と確認手順を整理します。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKFB434W",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "real-disposable-income-reversal",
      "heating-cost-vs-disposable-income",
      "per-capita-income-gap",
      "savings-balance-gap",
      "engel-coefficient-prefecture-ranking",
      "household-spending-prefecture-gap",
      "communication-cost-burden",
      "expenditure-structure-comparison",
      "black-tea-income-gap"
    ]
  },
  {
    "id": "K-S1-02",
    "slug": "kindle-k-s1-02",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "食卓の支出と購入数量 — 家計調査の地域差を読む",
    "description": "家計調査の品目別支出と購入数量を区別し、調査対象世帯・地域・年を確かめながら食卓の違いを読みます。生産地や県民全体の消費を直接測る統計ではないことも整理します。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKF4NLDV",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "noodle-consumption-prefecture-character",
      "miso-consumption-quantity-prefecture-gap",
      "sugar-consumption-prefecture-gap",
      "crab-expenditure-ranking",
      "mackerel-expenditure-ranking"
    ]
  },
  {
    "id": "K-S1-03",
    "slug": "kindle-k-s1-03",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "人口減少と世帯の地図 — 未婚・単身・東京集中",
    "description": "未婚率・単身高齢・世帯構造の変化・東京一極集中を束ね、人口減少が暮らしの単位をどう変えたかを読みます。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HDYKVX6F",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "unmarried-rate-40years-crisis",
      "aging-solo-living-crisis",
      "household-structure-transformation",
      "future-population-tokyo-paradox",
      "population-migration-tokyo-concentration"
    ]
  },
  {
    "id": "K-S1-04",
    "slug": "kindle-k-s1-04",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "健康と医療の地図 — 寿命・自殺・介護2040",
    "description": "寿命、自殺に関する指標、介護職員の必要数と病院の利用指標を比較し、医療資源の数と個人の健康状態を区別して読みます。掲載した化学工業の集計は医薬品・医療機器だけの生産額ではないことも整理します。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HF1C5QZ6",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "health-life-expectancy-structure",
      "suicide-rate-aging-nexus",
      "nursing-care-shortage-2040",
      "hospital-bed-utilization-map",
      "pharma-medical-device-production-map"
    ]
  },
  {
    "id": "K-S1-05",
    "slug": "kindle-k-s1-05",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "教育と子育ての地図 — 教育費・進学率・子育て指標",
    "description": "公費と家計の教育費、授業料、大学進学に関する指標、子育て関連の統計を比較します。支出額と教育成果、入学者数と定員、保育所等の利用率と入所希望の充足を区別して読みます。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKF5MMF9",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "education-cost-per-child",
      "education-expenses-gap",
      "tuition-expenditure-ranking",
      "university-advancement-capacity",
      "childcare-friendly-prefecture-ranking"
    ]
  },
  {
    "id": "K-S1-06",
    "slug": "kindle-k-s1-06",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "自治体財政の地図 — 財政力・借金・将来負担",
    "description": "財政力指数、時系列、地方税、地方債務と将来負担比率を比較し、指標ごとの分母・控除・平均期間を確認します。家計の収支とは異なる地方財政の集計として読み、単一指標から健全性を断定しません。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HF1XFXBY",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "fiscal-self-reliance-gap",
      "fiscal-health-50years-trend",
      "local-tax-revenue-gap",
      "local-government-debt-burden",
      "future-burden-ratio-extreme-gap"
    ]
  },
  {
    "id": "K-S1-07",
    "slug": "kindle-k-s1-07",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "観光とインバウンドの地図 — 宿泊・国籍・回復",
    "description": "延べ宿泊者数、国籍別の宿泊記録、対象施設の範囲、採用年の違いを確かめながら観光統計を読みます。宿泊人泊と旅行者の実人数、観測された宿泊先と個人の嗜好を区別します。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKFB2359",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "inbound-overnight-regional-gap",
      "inbound-by-nationality-regional-preference",
      "inbound-overnight-stay-concentration",
      "overnight-guests-inbound-recovery",
      "overseas-travel-gap"
    ]
  },
  {
    "id": "K-S1-08",
    "slug": "kindle-k-s1-08",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "エネルギーとインフラの地図 — 電力・再エネ・ガス",
    "description": "エネルギー消費、再エネ設備、電力需要、ガス・電気、給油所の指標を読みます。設備容量・契約件数・供給区域・道路当たり密度を区別し、実際の送電経路や住民の移動距離を示す値とは扱いません。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKDVYP8M",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "energy-consumption-structure-shift",
      "renewable-energy-regional-gap",
      "electricity-demand-gap",
      "energy-infrastructure-gas-electricity",
      "gasoline-car-society-map"
    ]
  },
  {
    "id": "K-S1-09",
    "slug": "kindle-k-s1-09",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "産業と地域経済の地図 — 製造・中小・地価",
    "description": "製造業の集計、事業所規模、工業用水、商業地地価を比較します。出荷額と付加価値、従業者当たりと事業所当たり、企業と事業所、地価の金額と変動率を分けて読みます。",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKDXP4NM",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "manufacturing-aichi-dominance",
      "manufacturing-productivity",
      "small-business-dominance-map",
      "industrial-water-manufacturing-nexus",
      "commercial-land-price-trend"
    ]
  },
  {
    "id": "K-S1-10",
    "slug": "kindle-k-s1-10",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "安全と環境の地図 — 犯罪・労災・公害・防災",
    "description": "犯罪の認知・検挙、労働災害、公害苦情、廃棄物、火災・地震保険料支出を、各指標の対象と分母に沿って読みます。集計値から個人の被害確率や地域の安全性全般を断定しません。",
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKDV78TG",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "crime-rate-regional-gap",
      "workplace-accident-regional-map",
      "pollution-complaints-regional-map",
      "waste-management-recycling-gap",
      "earthquake-insurance-prefecture-gap"
    ]
  },
  {
    "id": "K-S1-11",
    "slug": "kindle-k-s1-11",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "文化・スポーツ・余暇の地図",
    "description": "図書館・博物館・スポーツ施設、スポーツの行動者率、映画・演劇等への支出を比較します。施設数と利用、参加と頻度、市の家計と県全体を区別して読みます。",
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKFGQB8Q",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "library-museum-cultural-capital",
      "sports-facility-regional-divide",
      "sports-participation-map",
      "sports-urban-paradox",
      "movie-theater-expenditure-ranking"
    ]
  },
  {
    "id": "K-S1-12",
    "slug": "kindle-k-s1-12",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "デジタル生活の地図 — 通信・PC・テレワーク",
    "description": "テレビ・ラジオ・新聞・雑誌の利用時間、携帯契約件数、パソコン支出、テレワーク、コンビニ密度を比較します。契約件数と利用者数、支出額と保有率、有業者と雇用者の範囲を区別して読みます。",
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKF7C6JQ",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": [
      "ict-media-consumption-gender-gap",
      "mobile-contracts-over-population",
      "personal-computer-expenditure-ranking",
      "telework-gap-tokyo-6x",
      "convenience-store-density-map"
    ]
  },
  {
    "id": "K-S1-13",
    "slug": "kindle-k-s1-13",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "住む県の選び方 — 統計で比べる5つの条件",
    "description": "総合の住みやすさランキングに頼らず、自分の条件に合う指標を選んで 47 都道府県を比べる手順の本。題名の 5 つの条件は、家賃・仕事・子育て・医療・災害の 5 つの切り口のことです。第8章では、そこから自分の譲れない条件を 3 つに絞ります。",
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HQBGV4RD",
    "included": [
      "Kindle電子書籍",
      "固定時点の公的統計",
      "図表とテーマ解説"
    ],
    "audience": [
      "地域差を読み物として知りたい方"
    ],
    "sourceBlogSlugs": []
  }
] as const satisfies readonly StorefrontProduct[];
