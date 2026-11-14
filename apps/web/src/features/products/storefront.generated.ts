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
    "listingTitle": "市区町村別 製造品出荷額等 1980〜2023年＋業種別 CSV＋境界GeoJSON（1,719自治体・最新境域の時系列）",
    "priceYen": 1980,
    "externalUrl": "https://note.com/stats47/n/n5d86476e9c73",
    "audience": [],
    "sourceBlogSlugs": [],
    "title": "市区町村別 製造品出荷額等",
    "displayTitle": "市区町村別 製造品出荷額等",
    "description": "市区町村の製造業を、出荷額の規模・業種構成・長期推移の3つの視点で比較できるデータセットです。",
    "included": [
      "CSV (時系列 1980〜2023 年・1,719 自治体)",
      "CSV (業種別 2021〜2023 年・24 業種)",
      "GeoJSON (自治体の境界)",
      "README・検算表"
    ],
    "useCases": [
      {
        "title": "産業振興の説明資料に",
        "description": "近隣自治体の出荷額と業種構成を比べ、地域の製造業の特徴を地図やグラフで説明できます。"
      },
      {
        "title": "立地候補の下調べに",
        "description": "製造業が集まる自治体と主な業種を確認し、詳しく調べる候補地を選べます。"
      },
      {
        "title": "地域経済の変化を調べるときに",
        "description": "同じ境域の出荷額を時系列で比べ、県内や近隣自治体でどのように変化したかを確認できます。"
      }
    ],
    "purchaseNotes": [
      "金額は物価調整をしていない名目値です。長期比較では調査方法や収録範囲の変更も確認してください。",
      "秘匿などにより値が空の行があります。空欄をゼロとして扱わず、同梱の注記・READMEと検算表を確認してください。"
    ],
    "showcase": [
      {
        "id": "regional-comparison",
        "kind": "chart",
        "heading": "出荷額の規模と、集まる場所を比べる",
        "lead": "棒グラフで自治体間の規模を比較し、全国地図から県内の地図へ範囲を絞って製造業の集積を確認できます。",
        "themeRefs": [
          {
            "themeKey": "manufacturing",
            "sectionKey": "production",
            "title": "製造業",
            "sectionTitle": "生産規模",
            "href": "/themes/manufacturing#theme-section-production"
          }
        ],
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
        "id": "industry-composition",
        "kind": "chart",
        "heading": "地域を支える業種と内訳を見る",
        "lead": "自治体ごとの業種構成を比べ、どの業種の比重が大きいかを確認できます。県内の合計に占める市町村の割合も図にできます。",
        "themeRefs": [
          {
            "themeKey": "manufacturing",
            "sectionKey": "production",
            "title": "製造業",
            "sectionTitle": "生産規模",
            "href": "/themes/manufacturing#theme-section-production"
          }
        ],
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
        "id": "long-term-change",
        "kind": "chart",
        "heading": "出荷額の長期的な変化をたどる",
        "lead": "同じ自治体の推移を折れ線で比べ、増減の倍率を地図にして、変化の大きい地域を確認できます。",
        "themeRefs": [
          {
            "themeKey": "manufacturing",
            "sectionKey": "production",
            "title": "製造業",
            "sectionTitle": "生産規模",
            "href": "/themes/manufacturing#theme-section-production"
          }
        ],
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
        "kind": "file",
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
    "showcaseNote": "図は収録CSVの値から作成し、地図の描画には国土数値情報の行政区域データを使用しています。同梱GeoJSONは、令和2年国勢調査の境界データを自治体単位にまとめたものです（2020年10月1日時点）。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/332041499/rectangle_large_type_2_ed3faeff21eb6e6a34de3f45686521e9.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-01",
    "slug": "data-p-01",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 人口・世帯データ 134指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/ne47eb45f8a15",
    "audience": [
      "企画・営業",
      "自治体・公務員",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 人口・世帯データ",
    "displayTitle": "都道府県別 人口・世帯データ",
    "description": "人口の規模、年齢構成、世帯の違いを比較し、地域の現状を説明する資料を作れます。",
    "included": [
      "CSV（47地域・134指標、基準年は指標ごとに固定）",
      "Excel（134指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "地域計画の現状整理に",
        "description": "自県と近隣県の人口や高齢化の状況を並べ、計画の冒頭で地域の特徴を説明できます。"
      },
      {
        "title": "営業エリアの基礎資料に",
        "description": "人口と世帯数を比べ、地域ごとの市場規模を検討するための基礎表を作れます。"
      },
      {
        "title": "会議や研修の説明資料に",
        "description": "表だけでは伝わりにくい人口の集中や年齢構成の違いを、地図とランキングで示せます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。人口・世帯などの指標は基準年が異なる場合があるため、比較前に各表の年次を確認してください。",
      "基本の指標セットは都道府県単位の比較用です。町丁目別の商圏や世帯を直接調べるデータではありません。"
    ],
    "showcase": [
      {
        "id": "population-scale",
        "kind": "chart",
        "heading": "人口の規模を比べる",
        "lead": "総人口を棒グラフで比較すると、自県が全国の中でどの程度の規模かを説明できます。営業エリアや行政サービスの対象規模を整理する資料に使えます。",
        "themeRefs": [
          {
            "themeKey": "population-dynamics",
            "sectionKey": "population-change",
            "title": "人口動態",
            "sectionTitle": "人口は増えているか",
            "href": "/themes/population-dynamics#theme-section-population-change"
          }
        ],
        "figures": [
          {
            "file": "population-scale.png",
            "alt": "総人口（2025年・地域別比較）"
          }
        ]
      },
      {
        "id": "aging-distribution",
        "kind": "chart",
        "heading": "高齢化の地域差を地図で見る",
        "lead": "65歳以上人口の割合で地図を色分けし、高齢化の進み方が似ている地域を探せます。人数の多さと割合の高さを分けて説明するための図です。",
        "themeRefs": [
          {
            "themeKey": "aging-society",
            "sectionKey": "birth-aging",
            "title": "少子高齢化",
            "sectionTitle": "出生と高齢化の現在地",
            "href": "/themes/aging-society#theme-section-birth-aging"
          }
        ],
        "figures": [
          {
            "file": "aging-distribution.png",
            "alt": "65歳以上人口割合（2025年・地図）"
          }
        ]
      },
      {
        "id": "household-scale",
        "kind": "chart",
        "heading": "世帯を単位に地域を比べる",
        "lead": "一般世帯数を並べ、住宅や世帯向けサービスの対象規模を整理できます。人口と世帯数では比較の単位が異なることも、資料で示せます。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "household-structure-and-elderly",
            "title": "暮らし・住まい",
            "sectionTitle": "世帯の少人数化や高齢者の単身化は進んでいるか",
            "href": "/themes/living-housing#theme-section-household-structure-and-elderly"
          }
        ],
        "figures": [
          {
            "file": "household-scale.png",
            "alt": "一般世帯数（2020年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全134指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-01のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2003〜2050年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327852712/rectangle_large_type_2_9808a78289ba75a9473d8416baf21fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-02",
    "slug": "data-p-02",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 賃金・求人・働き方データ 107指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n46d68c153502",
    "audience": [
      "人事・採用支援",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 賃金・求人・働き方データ",
    "displayTitle": "都道府県別 賃金・求人・働き方データ",
    "description": "求人と給与の地域差を整理し、募集する地域や条件を検討するための比較資料を作れます。",
    "included": [
      "CSV（47地域・107指標、基準年は指標ごとに固定）",
      "Excel（107指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "募集する地域の比較に",
        "description": "有効求人倍率を県別に並べ、候補地域の求人・求職の状況を確認できます。"
      },
      {
        "title": "給与条件の検討資料に",
        "description": "所定内給与額の地域差を示し、募集条件を話し合うための参考表を作れます。"
      },
      {
        "title": "人事・採用会議の説明に",
        "description": "求人の状況と給与水準を別々の図で示し、地域の雇用環境を共有できます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。求人・給与の指標は基準年が異なる場合があります。求人倍率だけで個々の企業の採用難易度は判断できません。",
      "給与は対象者と月額・年額、所定内・手当込みなどの定義を確認してください。作成例の男性の所定内給与額は、男女合計の平均年収や手取り額ではありません。"
    ],
    "showcase": [
      {
        "id": "job-opening-comparison",
        "kind": "chart",
        "heading": "求人と求職のバランスを比べる",
        "lead": "県別の有効求人倍率を並べ、募集候補の地域が全国のどの位置にあるかを確認できます。",
        "themeRefs": [
          {
            "themeKey": "labor-mobility",
            "sectionKey": "job-market",
            "title": "人材流動性・雇用環境",
            "sectionTitle": "求人・求職と職業紹介",
            "href": "/themes/labor-mobility#theme-section-job-market"
          }
        ],
        "figures": [
          {
            "file": "job-opening-comparison.png",
            "alt": "有効求人倍率（2022年度・地域別比較）"
          }
        ]
      },
      {
        "id": "scheduled-pay-distribution",
        "kind": "chart",
        "heading": "給与水準の地域差を地図で見る",
        "lead": "男性の所定内給与額で色分けし、給与水準の高い地域や近隣県との違いを俯瞰できます。",
        "themeRefs": [
          {
            "themeKey": "labor-wages",
            "sectionKey": "wage-differences",
            "title": "労働・賃金",
            "sectionTitle": "属性別の賃金差",
            "href": "/themes/labor-wages#theme-section-wage-differences"
          }
        ],
        "figures": [
          {
            "file": "scheduled-pay-distribution.png",
            "alt": "所定内給与額（男）（2024年・地図）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全107指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-02のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2006〜2024年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327856740/rectangle_large_type_2_b5fb8a2a3e30547c5496bbd6799dfe53.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-03",
    "slug": "data-p-03",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 宿泊・交通・旅行データ 44指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n7a5f6df6f5ac",
    "audience": [
      "観光事業者",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 宿泊・交通・旅行データ",
    "displayTitle": "都道府県別 宿泊・交通・旅行データ",
    "description": "宿泊者数、外国人の宿泊、客室稼働率を比べ、地域の宿泊需要を説明する図表を作れます。",
    "included": [
      "CSV（47地域・44指標、基準年は指標ごとに固定）",
      "Excel（44指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "観光計画の現状整理に",
        "description": "近隣県や比較対象の県の宿泊者数を並べ、宿泊需要の規模を説明できます。"
      },
      {
        "title": "訪日客向け施策の検討に",
        "description": "外国人の宿泊が集まる地域を地図で確かめ、重点的に調べる地域を選べます。"
      },
      {
        "title": "宿泊事業の調査資料に",
        "description": "宿泊者数と客室稼働率を見比べ、需要の大きさと客室の利用状況を整理できます。"
      }
    ],
    "purchaseNotes": [
      "作成例の宿泊指標は、従業者数10人以上の宿泊施設が対象です。小規模施設を含む観光庁の全体推計とは対象が異なります。",
      "収録版の値を固定した商品です。月別の繁閑や将来の宿泊需要を予測するデータではありません。"
    ],
    "showcase": [
      {
        "id": "overnight-demand",
        "kind": "chart",
        "heading": "宿泊需要の規模を比べる",
        "lead": "延べ宿泊者数を並べ、宿泊がどの県に集まるかを確認できます。泊数を積み上げた「人泊」で規模を比べる図です。",
        "themeRefs": [
          {
            "themeKey": "tourism",
            "sectionKey": "stays",
            "title": "観光",
            "sectionTitle": "宿泊需要はどれくらいか",
            "href": "/themes/tourism#theme-section-stays"
          }
        ],
        "figures": [
          {
            "file": "overnight-demand.png",
            "alt": "延べ宿泊者数（2024年・地域別比較）"
          }
        ]
      },
      {
        "id": "foreign-overnight-distribution",
        "kind": "chart",
        "heading": "外国人の宿泊が集まる地域を見る",
        "lead": "外国人の延べ宿泊者数を地図にし、総宿泊者数の図と見比べて地域ごとの特徴を確認できます。",
        "themeRefs": [
          {
            "themeKey": "tourism",
            "sectionKey": "stays",
            "title": "観光",
            "sectionTitle": "宿泊需要はどれくらいか",
            "href": "/themes/tourism#theme-section-stays"
          }
        ],
        "figures": [
          {
            "file": "foreign-overnight-distribution.png",
            "alt": "外国人延べ宿泊者数（2024年・地図）"
          }
        ]
      },
      {
        "id": "room-utilization",
        "kind": "chart",
        "heading": "客室の利用状況を比べる",
        "lead": "客室稼働率を並べ、宿泊者数の多さとは別に、客室がどの程度使われているかを比較できます。",
        "themeRefs": [
          {
            "themeKey": "tourism",
            "sectionKey": "accommodation",
            "title": "観光",
            "sectionTitle": "客室稼働率と宿泊供給の参考",
            "href": "/themes/tourism#theme-section-accommodation"
          }
        ],
        "figures": [
          {
            "file": "room-utilization.png",
            "alt": "客室稼働率（2024年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全44指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-03のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2001〜2026年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327860122/rectangle_large_type_2_12dc8af8294fe9865a47f0c34bcaefc9.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-04",
    "slug": "data-p-04",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 自治体財政・職員給与データ 119指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n5da8a99b3506",
    "audience": [
      "自治体・公務員",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 自治体財政・職員給与データ",
    "displayTitle": "都道府県別 自治体財政・職員給与データ",
    "description": "財政力、借入返済の負担、歳入の規模を分けて比べ、財政説明の資料を作れます。",
    "included": [
      "CSV（47地域・119指標、基準年は指標ごとに固定）",
      "Excel（119指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "予算・決算の説明資料に",
        "description": "自県と比較対象の県の財政指標を並べ、数字の位置づけを説明する図表を作れます。"
      },
      {
        "title": "近隣県との財政比較に",
        "description": "歳入額の大きさと財政力指数などの比率を分け、規模だけでは捉えにくい違いを整理できます。"
      },
      {
        "title": "財政を学ぶ研修や授業に",
        "description": "財政力指数と実質公債費比率を別々の図で扱い、それぞれ何を表す指標なのかを説明できます。"
      }
    ],
    "purchaseNotes": [
      "基本の指標セットの作成例は都道府県財政の比較です。県と市区町村の図は集計範囲を確認して読み分けてください。",
      "収録版の値を固定した商品です。決算年度と各指標の定義を確認し、単独の指標で財政の健全性を断定しないでください。"
    ],
    "showcase": [
      {
        "id": "fiscal-strength-comparison",
        "kind": "chart",
        "heading": "財政力指数で自県の位置を確かめる",
        "lead": "財政力指数を棒グラフで比較し、自県と他県の違いを説明できます。歳入総額の多さとは別の指標として示すことで、財政の特徴を整理できます。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "fiscal-capacity",
            "title": "地方財政",
            "sectionTitle": "財政運営の余裕と負担",
            "href": "/themes/local-finance#theme-section-fiscal-capacity"
          }
        ],
        "figures": [
          {
            "file": "fiscal-strength-comparison.png",
            "alt": "財政力指数（都道府県財政）（2022年度・地域別比較）"
          }
        ]
      },
      {
        "id": "debt-service-distribution",
        "kind": "chart",
        "heading": "借入返済の負担を地図で比べる",
        "lead": "実質公債費比率で地図を色分けし、公債費などの負担が地域ごとにどう異なるかを示せます。財政力指数とは意味が異なるため、別の図として読み比べます。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "fiscal-capacity",
            "title": "地方財政",
            "sectionTitle": "財政運営の余裕と負担",
            "href": "/themes/local-finance#theme-section-fiscal-capacity"
          }
        ],
        "figures": [
          {
            "file": "debt-service-distribution.png",
            "alt": "実質公債費比率（都道府県財政）（2022年度・地図）"
          }
        ]
      },
      {
        "id": "revenue-scale",
        "kind": "chart",
        "heading": "歳入の規模を比べる",
        "lead": "歳入総額を並べ、比較対象の県の財政規模を確認できます。人口や行政の役割も異なるため、金額の大小だけで財政の良し悪しは判断しません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "balance",
            "title": "地方財政",
            "sectionTitle": "財政の規模と収支",
            "href": "/themes/local-finance#theme-section-balance"
          }
        ],
        "figures": [
          {
            "file": "revenue-scale.png",
            "alt": "歳入決算総額（都道府県財政）（2022年度・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全119指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-04のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2006〜2025年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327863352/rectangle_large_type_2_47c65477c27dcdf3f4bb97c4ab5faa33.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-05",
    "slug": "data-p-05",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 医療・介護データ 237指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/nbdad7c99d4b5",
    "audience": [
      "医療・介護事業者",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 医療・介護データ",
    "displayTitle": "都道府県別 医療・介護データ",
    "description": "人口当たりの医師・病床・介護施設を比較し、地域の医療・介護資源を整理できます。",
    "included": [
      "CSV（47地域・237指標、基準年は指標ごとに固定）",
      "Excel（237指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "地域医療の現状説明に",
        "description": "医師数や病床数を人口当たりで比較し、県ごとの医療資源の違いを会議資料にまとめられます。"
      },
      {
        "title": "介護サービスの調査に",
        "description": "高齢者人口当たりの施設数を比べ、介護資源の地域差を調べる入口に使えます。"
      },
      {
        "title": "医療・福祉分野の研修に",
        "description": "施設や従事者の総数と人口当たりの値を区別し、地域統計の読み方を説明できます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。医師・病床・介護施設では調査年や分母が異なるため、各表の定義を確認してください。",
      "基本の指標セットは県全体の資源量を示します。受診のしやすさ、診療の質、施設の空き状況や待機者数を直接示すものではありません。"
    ],
    "showcase": [
      {
        "id": "physicians-per-population",
        "kind": "chart",
        "heading": "人口当たりの医師数を比べる",
        "lead": "医療施設に従事する医師数を人口10万人当たりで並べ、人口規模の異なる県を比較できます。総数のランキングでは捉えにくい医療資源の違いを示す図です。",
        "themeRefs": [
          {
            "themeKey": "healthcare",
            "sectionKey": "supply",
            "title": "医療・健康",
            "sectionTitle": "医療人材と施設",
            "href": "/themes/healthcare#theme-section-supply"
          }
        ],
        "figures": [
          {
            "file": "physicians-per-population.png",
            "alt": "医療施設に従事する医師数（人口10万人当たり）（2022年度・地域別比較）"
          }
        ]
      },
      {
        "id": "beds-per-population",
        "kind": "chart",
        "heading": "一般病院の病床を地域で見比べる",
        "lead": "人口10万人当たりの一般病院病床数を地図にし、病床の分布を俯瞰できます。医師数の図と併せて、地域の医療体制を整理する資料に使えます。",
        "themeRefs": [
          {
            "themeKey": "healthcare",
            "sectionKey": "hospital-use",
            "title": "医療・健康",
            "sectionTitle": "入院の供給と利用",
            "href": "/themes/healthcare#theme-section-hospital-use"
          }
        ],
        "figures": [
          {
            "file": "beds-per-population.png",
            "alt": "一般病院病床数（人口10万人当たり）（2023年・地図）"
          }
        ]
      },
      {
        "id": "nursing-facilities-per-elderly",
        "kind": "chart",
        "heading": "高齢者人口に対する介護施設数を比べる",
        "lead": "65歳以上人口10万人当たりの介護老人福祉施設数を比較できます。人口全体を分母にした値と区別して、介護資源の違いを説明できます。",
        "themeRefs": [
          {
            "themeKey": "long-term-care",
            "sectionKey": "nursing-home-capacity",
            "title": "介護認定とサービスの需給",
            "sectionTitle": "老人ホームの受け入れ枠は足りているか",
            "href": "/themes/long-term-care#theme-section-nursing-home-capacity"
          }
        ],
        "figures": [
          {
            "file": "nursing-facilities-per-elderly.png",
            "alt": "介護老人福祉施設数（65歳以上人口10万人当たり）（2023年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全237指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-05のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は1991〜2024年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327866695/rectangle_large_type_2_f8824e0d379bc6d8b55f8d15a4559f7f.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-06",
    "slug": "data-p-06",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 学校・保育・社会教育データ 244指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n9f0be14ecc0c",
    "audience": [
      "教育関係者",
      "移住支援",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 学校・保育・社会教育データ",
    "displayTitle": "都道府県別 学校・保育・社会教育データ",
    "description": "学校の規模、保育施設、進学の状況を比較し、教育・子育てに関する説明資料を作れます。",
    "included": [
      "CSV（47地域・244指標、基準年は指標ごとに固定）",
      "Excel（244指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "教育計画の基礎資料に",
        "description": "教員1人当たりの児童数などを比較し、自県の学校教育の状況を整理できます。"
      },
      {
        "title": "子育て環境の地域比較に",
        "description": "子どもの人口に対する認定こども園の数を並べ、施設整備の違いを説明できます。"
      },
      {
        "title": "進路や地域を学ぶ授業に",
        "description": "高校卒業後の進学率を地図やグラフで示し、地域の違いを考える教材にできます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。学校年度や調査時点、対象年齢は指標ごとに確認してください。",
      "施設数や進学率だけで教育の質や入園のしやすさは判断できません。定員、地域内の距離、個別施設の情報は別途確認が必要です。"
    ],
    "showcase": [
      {
        "id": "students-per-teacher",
        "kind": "chart",
        "heading": "教員1人当たりの児童数を比べる",
        "lead": "小学校の教員1人当たり児童数を比較し、県全体の児童と教員の規模の関係を説明できます。1学級の人数とは異なる指標です。",
        "themeRefs": [
          {
            "themeKey": "education-culture",
            "sectionKey": "schools",
            "title": "教育・文化",
            "sectionTitle": "学校の配置と規模",
            "href": "/themes/education-culture#theme-section-schools"
          }
        ],
        "figures": [
          {
            "file": "students-per-teacher.png",
            "alt": "小学校児童数（教員1人当たり）（2024年度・地域別比較）"
          }
        ]
      },
      {
        "id": "childcare-center-distribution",
        "kind": "chart",
        "heading": "子どもの人口に対する施設数を見る",
        "lead": "0〜5歳人口10万人当たりの認定こども園数を地図で示せます。施設の総数だけでは分かりにくい、子どもの人口に対する地域差を見比べられます。",
        "themeRefs": [
          {
            "themeKey": "childcare-services",
            "sectionKey": "facility-capacity-and-utilization",
            "title": "保育の需給",
            "sectionTitle": "近くに預け先は十分あり、空きに余裕はあるか",
            "href": "/themes/childcare-services#theme-section-facility-capacity-and-utilization"
          }
        ],
        "figures": [
          {
            "file": "childcare-center-distribution.png",
            "alt": "認定こども園数（0～5歳人口10万人当たり）（2024年・地図）"
          }
        ]
      },
      {
        "id": "graduate-advancement",
        "kind": "chart",
        "heading": "高校卒業後の進学状況を比べる",
        "lead": "高等学校卒業者の進学率を並べ、卒業後の進路の地域差を説明できます。高校への進学率と混同せず、対象となる卒業者を明記して利用します。",
        "themeRefs": [
          {
            "themeKey": "education-culture",
            "sectionKey": "higher-education-and-advancement",
            "title": "教育・文化",
            "sectionTitle": "地元での進学機会や大学の選択肢は十分にあるか",
            "href": "/themes/education-culture#theme-section-higher-education-and-advancement"
          }
        ],
        "figures": [
          {
            "file": "graduate-advancement.png",
            "alt": "高等学校卒業者の進学率（2023年度・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全244指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-06のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2006〜2024年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327884421/rectangle_large_type_2_da2953b07fcf070247c692d68cd7c50b.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-07",
    "slug": "data-p-07",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 住居費・物価・気候データ 76指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n323af74c09cc",
    "audience": [
      "移住支援",
      "個人",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 住居費・物価・気候データ",
    "displayTitle": "都道府県別 住居費・物価・気候データ",
    "description": "物価水準、住居に関わる費用、気温の違いを並べ、移住候補地を下調べする比較資料を作れます。",
    "included": [
      "CSV（47地域・76指標、基準年は指標ごとに固定）",
      "Excel（76指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "移住候補地の下調べに",
        "description": "物価と気候を見比べ、詳しく調べたい県を絞り込むための比較表を作れます。"
      },
      {
        "title": "移住相談の説明資料に",
        "description": "全国平均に対する物価水準を図にし、候補地ごとの違いを説明できます。"
      },
      {
        "title": "生活費の違いを確認するときに",
        "description": "総合の物価と住居費目を分け、生活費のどの項目を詳しく調べるかを整理できます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。物価の地域差指数は家賃の金額や物価上昇率ではありません。実際の生活費は、最新の物件情報や現地の価格も確認してください。",
      "物価地域差指数は全国平均を100とし、持家の帰属家賃を含みません。気候指標は観測地点の値で、県内全域や個々の移住先の平均ではありません。"
    ],
    "showcase": [
      {
        "id": "overall-price-comparison",
        "kind": "chart",
        "heading": "全国平均に対する物価水準を比べる",
        "lead": "全国平均を100とした指数を並べ、候補となる県の物価水準を比較できます。",
        "themeRefs": [
          {
            "themeKey": "consumer-prices",
            "sectionKey": "overall",
            "title": "物価・消費",
            "sectionTitle": "総合水準と家賃の影響",
            "href": "/themes/consumer-prices#theme-section-overall"
          }
        ],
        "figures": [
          {
            "file": "overall-price-comparison.png",
            "alt": "消費者物価地域差指数（総合）（2025年・地域別比較）"
          }
        ]
      },
      {
        "id": "housing-price-distribution",
        "kind": "chart",
        "heading": "住居に関わる物価の地域差を見る",
        "lead": "住居費目の地域差指数を色分けし、総合の物価と同じ傾向か、異なる傾向かを見比べられます。",
        "themeRefs": [
          {
            "themeKey": "consumer-prices",
            "sectionKey": "expenses",
            "title": "物価・消費",
            "sectionTitle": "何の費目が高いか",
            "href": "/themes/consumer-prices#theme-section-expenses"
          }
        ],
        "figures": [
          {
            "file": "housing-price-distribution.png",
            "alt": "消費者物価地域差指数（住居）（2025年・地図）"
          }
        ]
      },
      {
        "id": "temperature-comparison",
        "kind": "chart",
        "heading": "各地の気温を比べる",
        "lead": "各地の観測地点の年平均気温を並べ、候補地の気候を調べる入口にできます。",
        "themeRefs": [
          {
            "themeKey": "climate",
            "sectionKey": "temperature",
            "title": "気候",
            "sectionTitle": "気温",
            "href": "/themes/climate#theme-section-temperature"
          }
        ],
        "figures": [
          {
            "file": "temperature-comparison.png",
            "alt": "年平均気温（2024年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全76指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-07のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2005〜2025年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327888189/rectangle_large_type_2_bd106c7f2e77404a07abb96967e5f273.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-08",
    "slug": "data-p-08",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 商業・小売データ 69指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n973c3f8478f5",
    "audience": [
      "小売・飲食事業者",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 商業・小売データ",
    "displayTitle": "都道府県別 商業・小売データ",
    "description": "商業の販売額や店舗数を比べ、出店候補エリアの一次調査や営業資料に使えるデータ集です。",
    "included": [
      "CSV（47地域・69指標、基準年は指標ごとに固定）",
      "Excel（69指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "出店候補エリアの絞り込みに",
        "description": "都道府県ごとの商業規模や店舗数を比べ、現地調査を進める地域を検討できます。"
      },
      {
        "title": "営業先の地域別資料に",
        "description": "担当エリアと周辺県の販売額を並べ、商業の特徴を伝える提案資料を作れます。"
      },
      {
        "title": "商業振興の基礎資料に",
        "description": "販売額の総額と事業所当たりの値を分けて比較し、地域の商業規模を説明できます。"
      }
    ],
    "purchaseNotes": [
      "基本の指標セットは都道府県単位の比較用です。個別店舗の商圏や売上予測には、人口動態・通行量などの追加調査が必要です。",
      "指標ごとに対象年と調査範囲が異なります。比較には各図と収録ファイルに記載した年・単位・出典を使ってください。"
    ],
    "showcase": [
      {
        "id": "commercial-sales",
        "kind": "chart",
        "heading": "地域の商業規模を比べる",
        "lead": "卸売業と小売業を合わせた年間商品販売額を棒グラフにできます。担当エリアの位置づけや、比較したい県との規模の違いを伝える資料に使えます。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-market-scale",
            "title": "商業と小売",
            "sectionTitle": "小売・商業の売り上げと売場は、どれくらいの規模か",
            "href": "/themes/retail-commerce#theme-section-retail-market-scale"
          }
        ],
        "figures": [
          {
            "file": "commercial-sales.png",
            "alt": "商業年間商品販売額（卸売業＋小売業）（2022年・地域別比較）"
          }
        ]
      },
      {
        "id": "sales-per-establishment",
        "kind": "chart",
        "heading": "事業所当たりの販売額を見る",
        "lead": "販売額を事業所当たりで比べると、総額とは異なる地域差が見えます。事業所の数と販売額の大きさを区別して説明できます。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-market-scale",
            "title": "商業と小売",
            "sectionTitle": "小売・商業の売り上げと売場は、どれくらいの規模か",
            "href": "/themes/retail-commerce#theme-section-retail-market-scale"
          }
        ],
        "figures": [
          {
            "file": "sales-per-establishment.png",
            "alt": "商業年間商品販売額（卸売業＋小売業）（1事業所当たり）（2022年・地図）"
          }
        ]
      },
      {
        "id": "convenience-store-density",
        "kind": "chart",
        "heading": "人口当たりの店舗数を比べる",
        "lead": "人口10万人当たりのコンビニエンスストア数を並べ、人口規模をそろえた比較を示せます。図に記載した調査時点の店舗分布を確認する資料になります。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-store-convenience",
            "title": "商業と小売",
            "sectionTitle": "買い物ができる店は、人口に対して身近にあるか",
            "href": "/themes/retail-commerce#theme-section-retail-store-convenience"
          }
        ],
        "figures": [
          {
            "file": "convenience-store-density.png",
            "alt": "コンビニエンスストア数（人口10万人当たり）（2014年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全69指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-08のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2006〜2025年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327892069/rectangle_large_type_2_8a0b3ef48c7ce4ae9be9ceed6aed7fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-09",
    "slug": "data-p-09",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 産業・農業・家計データ 132指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n2ced199ed715",
    "audience": [
      "事業企画",
      "コンサル",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 産業・経済データ",
    "displayTitle": "都道府県別 産業・経済データ",
    "description": "出荷額や従業者数などの産業指標を並べ、地域の経済活動を金額と人の両面から紹介できます。",
    "included": [
      "CSV（47地域・132指標、基準年は指標ごとに固定）",
      "Excel（132指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "産業振興の現状整理に",
        "description": "製造品出荷額を比較し、自県と近隣県の製造業の規模を説明できます。"
      },
      {
        "title": "法人営業の事前調査に",
        "description": "製造業の従業者が集まる県を確認し、詳しく調べる営業エリアを選べます。"
      },
      {
        "title": "地域経済のレポートに",
        "description": "出荷額と従業者数の図を添え、金額と雇用の両面から地域の製造業を紹介できます。"
      }
    ],
    "purchaseNotes": [
      "県単位で産業を比較するデータ集です。市区町村別の製造品出荷額データ商品とは集計範囲が異なります。",
      "収録値の対象年は指標ごとに異なります。出荷額を生産性や利益と読み替えず、調査対象と単位を確認して利用してください。"
    ],
    "showcase": [
      {
        "id": "manufacturing-shipments",
        "kind": "chart",
        "heading": "出荷額で製造業の規模を比べる",
        "lead": "県別の製造品出荷額等を並べ、自県の位置や近隣県との規模の違いを示せます。",
        "themeRefs": [
          {
            "themeKey": "manufacturing",
            "sectionKey": "production",
            "title": "製造業",
            "sectionTitle": "生産規模",
            "href": "/themes/manufacturing#theme-section-production"
          }
        ],
        "figures": [
          {
            "file": "manufacturing-shipments.png",
            "alt": "製造品出荷額等（2023年・地域別比較）"
          }
        ]
      },
      {
        "id": "manufacturing-employment",
        "kind": "chart",
        "heading": "製造業の働き手が集まる地域を見る",
        "lead": "製造業従業者数を地図にし、金額だけでは伝わらない働き手の分布を紹介できます。",
        "themeRefs": [
          {
            "themeKey": "manufacturing",
            "sectionKey": "sites-employment",
            "title": "製造業",
            "sectionTitle": "拠点と雇用",
            "href": "/themes/manufacturing#theme-section-sites-employment"
          }
        ],
        "figures": [
          {
            "file": "manufacturing-employment.png",
            "alt": "製造業従業者数（2024年・地図）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全132指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-09のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2001〜2026年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327896437/rectangle_large_type_2_98a3986f90264806883eb5d2b6ade8b4.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-10",
    "slug": "data-p-10",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県別 防災・交通・インフラデータ 230指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/nf25cd9ae21e6",
    "audience": [
      "自治体・公務員",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県別 防災・交通・インフラデータ",
    "displayTitle": "都道府県別 防災・交通・インフラデータ",
    "description": "生活インフラの整備状況と過去の災害被害を県別に整理し、地域の特徴を説明する資料を作れます。",
    "included": [
      "CSV（47地域・230指標、基準年は指標ごとに固定）",
      "Excel（230指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "インフラ整備の説明資料に",
        "description": "下水道普及率を他県と比較し、整備状況の違いを地図で示せます。"
      },
      {
        "title": "災害被害の振り返りに",
        "description": "対象年の被害額を人口あたりで比べ、被害の大きかった地域を確認できます。"
      },
      {
        "title": "地域調査の項目整理に",
        "description": "収録指標を並べ、整備状況や被害実績から詳しく確認する項目を選べます。"
      }
    ],
    "purchaseNotes": [
      "災害被害額は過去の実績です。将来の災害発生確率や、個別の住所・施設の安全性を示すものではありません。",
      "指標ごとに対象年・単位・集計範囲が異なります。下水道普及率だけで生活インフラ全体を評価せず、各指標の説明と併せて確認してください。"
    ],
    "showcase": [
      {
        "id": "sewerage-coverage",
        "kind": "chart",
        "heading": "下水道の整備状況を地図で見る",
        "lead": "下水道普及率で色分けし、自県と近隣県の違いや全国の分布を確認できます。",
        "themeRefs": [
          {
            "themeKey": "water-services",
            "sectionKey": "water-sewerage-coverage",
            "title": "水道の持続性",
            "sectionTitle": "下水道はどれくらい普及しているか",
            "href": "/themes/water-services#theme-section-water-sewerage-coverage"
          }
        ],
        "figures": [
          {
            "file": "sewerage-coverage.png",
            "alt": "下水道普及率（2012－）（2021年度・地図）"
          }
        ]
      },
      {
        "id": "disaster-losses",
        "kind": "chart",
        "heading": "災害被害を人口あたりで比べる",
        "lead": "人口1人あたりの災害被害額を並べ、人口規模を揃えて対象年の被害実績を振り返れます。",
        "themeRefs": [
          {
            "themeKey": "safety",
            "sectionKey": "natural-disaster-impact",
            "title": "安全",
            "sectionTitle": "自然災害でどれくらいの被害や費用が出ているか",
            "href": "/themes/safety#theme-section-natural-disaster-impact"
          }
        ],
        "figures": [
          {
            "file": "disaster-losses.png",
            "alt": "災害被害額（人口1人当たり）（2023年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全230指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-10のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2006〜2025年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327904763/rectangle_large_type_2_9fee30f49a8956331f44c2f3ccfcf7ff.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-11",
    "slug": "data-p-11",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "都道府県の地図・ランキング素材 28指標｜PNG・SVG・PowerPoint",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n0f5dafef7fa8",
    "audience": [
      "編集者・ライター",
      "企画・営業",
      "クリエイター"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県の地図・ランキング素材",
    "displayTitle": "都道府県の地図・ランキング素材",
    "description": "人口や世帯の地域差を伝える地図・ランキング図を、プレゼン資料や記事の図版として使えます。",
    "included": [
      "CSV（47地域・28指標、基準年は指標ごとに固定）",
      "PowerPoint（28指標の図表）",
      "PDFデータブック・地図PNG",
      "編集用の地図SVG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "プレゼンの導入に",
        "description": "人口分布の地図を添え、説明する地域が全国のどこに位置するかを伝えられます。"
      },
      {
        "title": "記事や報告書の比較図に",
        "description": "世帯数などのランキング図を使い、取り上げる県と他県の規模の違いを示せます。"
      },
      {
        "title": "資料に使う図版の準備に",
        "description": "PNG・SVG・PowerPointの収録形式から、貼り付けや図版編集の用途に合う素材を選べます。"
      }
    ],
    "purchaseNotes": [
      "PNG・SVGの地図素材、PowerPoint、PDF、元データのCSVを収録しています。Excelファイルは含みません。",
      "素材を利用する際は、図に記載した基準年・単位・出典を残し、同梱の利用条件に従ってください。"
    ],
    "showcase": [
      {
        "id": "population-map",
        "kind": "chart",
        "heading": "人口の分布を一枚の地図で伝える",
        "lead": "全国の人口分布を示してから、担当する地域の説明へ進む導入スライドを作れます。",
        "themeRefs": [
          {
            "themeKey": "population-dynamics",
            "sectionKey": "population-change",
            "title": "人口動態",
            "sectionTitle": "人口は増えているか",
            "href": "/themes/population-dynamics#theme-section-population-change"
          }
        ],
        "figures": [
          {
            "file": "population-map.png",
            "alt": "総人口（2025年・地図）"
          }
        ]
      },
      {
        "id": "household-ranking",
        "kind": "chart",
        "heading": "世帯数の違いをランキング図で伝える",
        "lead": "一般世帯数を並べた図で、本文や数表だけでは伝えにくい県ごとの規模の違いを示せます。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "household-structure-and-elderly",
            "title": "暮らし・住まい",
            "sectionTitle": "世帯の少人数化や高齢者の単身化は進んでいるか",
            "href": "/themes/living-housing#theme-section-household-structure-and-elderly"
          }
        ],
        "figures": [
          {
            "file": "household-ranking.png",
            "alt": "一般世帯数（2020年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全28指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-11のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2014〜2025年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328096609/rectangle_large_type_2_d9ab6507430978c166503a1f2248f9ef.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-12",
    "slug": "data-p-12",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "47都道府県 統計データ総合集 2,073指標｜CSV・Excel",
    "priceYen": 2980,
    "externalUrl": "https://note.com/stats47/n/nfa7d235eba85",
    "audience": [
      "企画・営業",
      "自治体・公務員",
      "編集者・ライター"
    ],
    "sourceBlogSlugs": [],
    "title": "都道府県 統計データ総合集",
    "displayTitle": "都道府県 統計データ総合集",
    "description": "人口・観光・産業などの統計を一つにまとめ、複数の視点で地域を紹介する資料を作れます。",
    "included": [
      "CSV（47地域・2,073指標、基準年は指標ごとに固定）",
      "Excel（2,073指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "編集用の地図SVG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "県勢紹介のスライドに",
        "description": "人口、宿泊、製造業の図を組み合わせ、地域の規模と特徴を説明できます。"
      },
      {
        "title": "分野をまたぐ調査資料に",
        "description": "案件に合わせて収録指標を選び、同じ県を異なる視点で比較する表や図を作れます。"
      },
      {
        "title": "地域比較の授業や研修に",
        "description": "指標を変えると県の順位や特徴がどう変わるかを、複数の図で読み比べられます。"
      }
    ],
    "purchaseNotes": [
      "指標ごとに対象年・単位・調査範囲が異なります。複数の図を並べる際も、それぞれの基準年と出典を記載してください。",
      "宿泊の作成例は従業者10人以上の宿泊施設が対象です。家計調査など県庁所在市を対象とする指標もあるため、県名だけで統計の対象範囲を判断しないでください。"
    ],
    "showcase": [
      {
        "id": "population-overview",
        "kind": "chart",
        "heading": "まず人口の規模を伝える",
        "lead": "総人口を県別に並べ、紹介する県が全国の中でどの程度の規模かを示す導入図を作れます。",
        "themeRefs": [
          {
            "themeKey": "population-dynamics",
            "sectionKey": "population-change",
            "title": "人口動態",
            "sectionTitle": "人口は増えているか",
            "href": "/themes/population-dynamics#theme-section-population-change"
          }
        ],
        "figures": [
          {
            "file": "population-overview.png",
            "alt": "総人口（2025年・地域別比較）"
          }
        ]
      },
      {
        "id": "tourism-overview",
        "kind": "chart",
        "heading": "宿泊の分布から地域を見る",
        "lead": "延べ宿泊者数を地図にし、人口の図とは異なる宿泊需要の分布を確認できます。",
        "themeRefs": [
          {
            "themeKey": "tourism",
            "sectionKey": "stays",
            "title": "観光",
            "sectionTitle": "宿泊需要はどれくらいか",
            "href": "/themes/tourism#theme-section-stays"
          }
        ],
        "figures": [
          {
            "file": "tourism-overview.png",
            "alt": "延べ宿泊者数（2024年・地図）"
          }
        ]
      },
      {
        "id": "industry-overview",
        "kind": "chart",
        "heading": "製造業の規模を加えて紹介する",
        "lead": "製造品出荷額等を並べ、人口・宿泊に続いて産業の面から地域の特徴を説明できます。",
        "themeRefs": [
          {
            "themeKey": "manufacturing",
            "sectionKey": "production",
            "title": "製造業",
            "sectionTitle": "生産規模",
            "href": "/themes/manufacturing#theme-section-production"
          }
        ],
        "figures": [
          {
            "file": "industry-overview.png",
            "alt": "製造品出荷額等（2023年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全2,073指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-12のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は1991〜2050年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328108626/rectangle_large_type_2_a20b7efd70ea5453e06527827d8cc689.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-14",
    "slug": "data-p-14",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "県庁所在市別 家計調査データ 832指標｜品目別 CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n554a047cf5be",
    "audience": [
      "企画・営業",
      "編集者・ライター",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "title": "県庁所在市別 家計・消費データ",
    "displayTitle": "県庁所在市別 家計・消費データ",
    "description": "県庁所在市の二人以上世帯について、食品や飲料などの支出額と購入量を図にして比較できます。",
    "included": [
      "CSV（47県庁所在市・二人以上世帯・832指標、基準年は指標ごとに固定）",
      "Excel（832指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "食品・日用品の企画資料に",
        "description": "品目別の支出を都市ごとに並べ、調査対象の世帯でどのような違いがあるかを整理できます。"
      },
      {
        "title": "食や暮らしを紹介する記事に",
        "description": "牛肉やコーヒーなど身近な品目を図にし、都市ごとの支出の特徴を伝えられます。"
      },
      {
        "title": "消費の比較レポートに",
        "description": "支出額と購入量を別々に示し、お金を多く使う地域と、多く買う地域を見比べられます。"
      }
    ],
    "purchaseNotes": [
      "対象は県庁所在市（東京都は区部）の二人以上世帯です。県全体や単身世帯を含む値ではありません。",
      "品目によって支出額・購入量の収録状況や単位が異なります。支出額の大きさを、そのまま購入量や地域全体の市場規模と読み替えないでください。"
    ],
    "showcase": [
      {
        "id": "beef-expenditure",
        "kind": "chart",
        "heading": "牛肉に使う金額を比べる",
        "lead": "二人以上世帯の1世帯あたり牛肉支出額を並べ、都市ごとの支出の違いを確認できます。",
        "themeRefs": [
          {
            "themeKey": "household-food-spending",
            "sectionKey": "household-food-spending-meat-dairy",
            "title": "食卓と家計の支出",
            "sectionTitle": "肉や乳製品をよく買う地域か",
            "href": "/themes/household-food-spending#theme-section-household-food-spending-meat-dairy"
          }
        ],
        "figures": [
          {
            "file": "beef-expenditure.png",
            "alt": "牛肉消費支出額（都道府県庁所在市の二人以上世帯の年間牛肉消費支出額）（2025年・地域別比較）"
          }
        ]
      },
      {
        "id": "beef-quantity",
        "kind": "chart",
        "heading": "牛肉を買う量も確認する",
        "lead": "牛肉の購入量を並べ、支出額の図と見比べることで、金額と量のどちらに違いがあるかを確認できます。",
        "themeRefs": [
          {
            "themeKey": "household-food-spending",
            "sectionKey": "household-food-spending-meat-dairy",
            "title": "食卓と家計の支出",
            "sectionTitle": "肉や乳製品をよく買う地域か",
            "href": "/themes/household-food-spending#theme-section-household-food-spending-meat-dairy"
          }
        ],
        "figures": [
          {
            "file": "beef-quantity.png",
            "alt": "牛肉消費量（都道府県庁所在市の二人以上世帯の年間牛肉消費量）（2025年・地域別比較）"
          }
        ]
      },
      {
        "id": "coffee-expenditure",
        "kind": "chart",
        "heading": "別の品目で消費の特徴を見る",
        "lead": "コーヒー支出額を都市別に比較できます。品目を変えて、地域の消費を複数の視点から紹介する図を作れます。",
        "themeRefs": [
          {
            "themeKey": "household-food-spending",
            "sectionKey": "household-food-spending-drinks",
            "title": "食卓と家計の支出",
            "sectionTitle": "どんなお茶やお酒をよく飲むか",
            "href": "/themes/household-food-spending#theme-section-household-food-spending-drinks"
          }
        ],
        "figures": [
          {
            "file": "coffee-expenditure.png",
            "alt": "コーヒー消費支出額（都道府県庁所在市の二人以上世帯の年間コーヒー消費支出額）（2025年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。納品CSVでは県のコード・県名で記録していますが、家計調査の値は県庁所在市の二人以上世帯が対象です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全832指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-14のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2024〜2025年で指標ごとに異なり、時系列データではありません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328109605/rectangle_large_type_2_3b2aa0eb69bbac8716e24beaae2009b7.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "K-S1-01",
    "slug": "kindle-k-s1-01",
    "channel": "kindle",
    "channelLabel": "Kindle電子書籍",
    "title": "年収が高い県は、暮らしも豊かなのか",
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKFB434W",
    "description": "県民所得、家計調査の所得・支出、貯蓄と地域財政を別の対象として読み、対象世帯・年次・分母の一致を確認します。地域の平均を個人の手取りや県民性へ置き換えず、比較の限界と確認手順を整理します。",
    "included": [
      "図 36 点、47 都道府県の全県表 17 表を収録しています。",
      "県民所得と家計調査の所得が別の統計で、そのまま比べられない理由が分かる",
      "エンゲル係数や電気・ガス・灯油の支出から、家計の負担の違いを読める",
      "貯蓄残高の平均が二人以上世帯の値である点に注意して読める",
      "交通・通信費など、支出の構造が県でどう違うかを比べられる"
    ],
    "audience": [
      "転職・就職・結婚を機に住む県を比べている方",
      "年収ランキングの数字をうのみにしたくない方",
      "家計の統計の読み方を身につけたい方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに — 年収の地図と、暮らしの地図は違う",
      "第0章 家計データの読み方 — 名目と実質、比率と実額",
      "県民所得と家計調査の所得を分けて読む",
      "電気・都市ガス・灯油の支出と所得指標",
      "1人当たり県民所得の格差を読む",
      "貯蓄残高 — 平均と世帯構成を読む",
      "エンゲル係数 — 食費と消費支出の比率",
      "世帯支出の構造を県で比べる",
      "交通・通信費の構成比と通信契約数",
      "地域財政の支出 — 家計とは別の会計を読む",
      "紅茶の支出・購入数量と所得の比較",
      "終章 — 「安い県」でも「豊かな県」でもなく",
      "出典と再現について"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKF4NLDV",
    "description": "家計調査の品目別支出と購入数量を区別し、調査対象世帯・地域・年を確かめながら食卓の違いを読みます。生産地や県民全体の消費を直接測る統計ではないことも整理します。",
    "included": [
      "図 11 点、47 都道府県の全県表 6 表を収録しています。",
      "麺類・味噌・砂糖・かに・さばの地域差を、図と全県表で確かめられる",
      "支出額が多いことと、買う量が多いことの違いが分かる",
      "家計調査の値が県全体ではなく県庁所在市の値であることを押さえて読める",
      "生産地の話と消費の話を分けて説明できるようになる"
    ],
    "audience": [
      "地元の名物や食文化を数字で語りたい方",
      "「日本一」の話題の根拠を確かめたい方",
      "家計調査を初めて読む方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "麺類への支出を地域で比べる",
      "味噌の購入数量を読む",
      "砂糖への支出と購入数量",
      "かに支出の日本一",
      "さばの食卓 — 支出額の地域差",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HDYKVX6F",
    "description": "未婚率・単身高齢・世帯構造の変化・東京一極集中を束ね、人口減少が暮らしの単位をどう変えたかを読みます。",
    "included": [
      "図 18 点、47 都道府県の全県表 8 表を収録しています。",
      "30代前半男性の未婚率を県ごとに比べ、30代前半の男女の未婚率の全国推移も読める",
      "単身高齢世帯の県別の割合と、世帯構造の地域差が分かる",
      "東京への人口移動の集中を、社会増減率と転入超過率で確かめられる",
      "将来人口の見通しから東京の変化を読める"
    ],
    "audience": [
      "人口や世帯の変化を県ごとに数字で知りたい方",
      "自分の県の世帯の姿を確かめたい方",
      "人口減少の議論を根拠から理解したい方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "年齢別の未婚者割合を読む",
      "単身高齢世帯の増加",
      "世帯構造の変容",
      "東京の将来人口パラドックス",
      "東京への人口移動集中",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HF1C5QZ6",
    "description": "寿命、自殺に関する指標、介護職員の必要数と病院の利用指標を比較し、医療資源の数と個人の健康状態を区別して読みます。掲載した化学工業の集計は医薬品・医療機器だけの生産額ではないことも整理します。",
    "included": [
      "図 21 点、47 都道府県の全県表 8 表を収録しています。",
      "健康寿命と平均寿命の違いと、県の差の読み方が分かる",
      "2040年度の介護職員の必要数の全国推計と、県ごとの施設数・定員・従事者数を確かめられる",
      "病床利用率の地域差から、病院の使われ方を読める",
      "医療資源の数と健康状態を分けて考えられるようになる"
    ],
    "audience": [
      "自分や親の住む県の医療・介護の数字を調べたい方",
      "医療資源の数と健康状態を分けて考えたい方",
      "医療や介護の統計を仕事で使う方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "健康寿命の構造",
      "自殺率と高齢化の連関",
      "2040年の介護職員必要数を読む",
      "病床利用率の地図",
      "化学工業の集計と医療産業の区別",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKF5MMF9",
    "description": "公費と家計の教育費、授業料、大学進学に関する指標、子育て関連の統計を比較します。支出額と教育成果、入学者数と定員、保育所等の利用率と入所希望の充足を区別して読みます。",
    "included": [
      "図 14 点、47 都道府県の全県表 4 表を収録しています。",
      "子ども1人当たりの教育費と、その県の差を比べられる",
      "公費の教育費と、家計の授業料支出を、別の指標として読み分けられる",
      "大学進学を、入学者数と定員の関係から見られる",
      "子育て関連の指標を合成した順位の限界が分かる"
    ],
    "audience": [
      "子どもの進学や引っ越しを考えている保護者の方",
      "子育てしやすい県のランキングの根拠を知りたい方",
      "教育の統計を仕事で使う方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "子ども1人当たり教育費",
      "教育費格差",
      "授業料支出のランキング",
      "大学進学の収容力",
      "子育て関連7指標の合成ランキングとその限界",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HF1XFXBY",
    "description": "財政力指数、時系列、地方税、地方債務と将来負担比率を比較し、指標ごとの分母・控除・平均期間を確認します。家計の収支とは異なる地方財政の集計として読み、単一指標から健全性を断定しません。",
    "included": [
      "図 21 点、47 都道府県の全県表 8 表を収録しています。",
      "財政力指数の見方と、県による格差が分かる",
      "1981年度以降の収録年度で財政力指数の変化を追える（欠測期間あり）",
      "地方税収と地方債の負担を県ごとに比べられる",
      "将来負担比率の分母と控除を押さえて読める"
    ],
    "audience": [
      "自分の県の財政を数字で知りたい方",
      "都道府県の財政指標の読み方を知りたい方",
      "地方自治に関わる仕事や学びの中で財政指標を使う方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "財政力指数の格差",
      "財政健全度の50年",
      "地方税収の格差",
      "地方債務の負担",
      "将来負担比率の両極",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKFB2359",
    "description": "延べ宿泊者数、国籍別の宿泊記録、対象施設の範囲、採用年の違いを確かめながら観光統計を読みます。宿泊人泊と旅行者の実人数、観測された宿泊先と個人の嗜好を区別します。",
    "included": [
      "図 14 点、47 都道府県の全県表 5 表を収録しています。",
      "延べ宿泊者数の地域差と集中の度合いが分かる",
      "国籍によって宿泊先がどう違うかを比べられる",
      "インバウンドの回復を、全国と国籍別、上位4都道府県の集中度の変化で確かめられる",
      "人泊と実人数の違いを押さえて説明できる"
    ],
    "audience": [
      "観光や宿泊の仕事に関わる方",
      "地域の観光企画の根拠を探している方",
      "インバウンドの統計を読み解きたい方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "宿泊の地域格差",
      "国籍別の宿泊先を比較する",
      "宿泊の集中",
      "宿泊客のインバウンド回復",
      "海外旅行の格差",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKDVYP8M",
    "description": "エネルギー消費、再エネ設備、電力需要、ガス・電気、給油所の指標を読みます。設備容量・契約件数・供給区域・道路当たり密度を区別し、実際の送電経路や住民の移動距離を示す値とは扱いません。",
    "included": [
      "図 13 点、47 都道府県の全県表 6 表を収録しています。",
      "エネルギー消費の構造が県によってどう違うかが分かる",
      "再生可能エネルギーの設備の地域差を比べられる",
      "電力需要とガス・電気の供給の違いを読める",
      "ガソリンと車の暮らしの地域差を確かめられる"
    ],
    "audience": [
      "光熱・水道の価格水準の地域差を知りたい方",
      "地域の供給や設備の統計を調べる前提を整理したい方",
      "エネルギーの地域差を学びたい方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "エネルギー消費構造の変化",
      "再生可能エネルギーの地域差",
      "電力需要の格差",
      "ガス・電気インフラ",
      "ガソリン車社会の地図",
      "終章"
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
    "priceYen": 800,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKDXP4NM",
    "description": "製造業の集計、事業所規模、工業用水、商業地地価を比較します。出荷額と付加価値、従業者当たりと事業所当たり、企業と事業所、地価の金額と変動率を分けて読みます。",
    "included": [
      "図 18 点、47 都道府県の全県表 5 表を収録しています。",
      "愛知に集中する製造業の姿を数字で確かめられる",
      "出荷額と付加価値、従業者当たりの値を分けて読める",
      "中小企業の分布と工業用水の使われ方を比べられる",
      "商業地の地価の推移を、金額と変動率で読める"
    ],
    "audience": [
      "事業や工場の立地を考えている方",
      "地域経済の数字を仕事で使う方",
      "製造業の地域差を学びたい方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "愛知の製造業支配",
      "製造業の生産性",
      "中小企業の地図",
      "工業用水と製造業",
      "商業地地価の推移",
      "終章"
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
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKDV78TG",
    "description": "犯罪の認知・検挙、労働災害、公害苦情、廃棄物、火災・地震保険料支出を、各指標の対象と分母に沿って読みます。集計値から個人の被害確率や地域の安全性全般を断定しません。",
    "included": [
      "図 19 点、47 都道府県の全県表 10 表を収録しています。",
      "犯罪の認知件数と検挙の違いを押さえて読める",
      "労働災害と公害苦情の地域差を比べられる",
      "廃棄物とリサイクルの差を確かめられる",
      "火災・地震保険料の支出額の地域差と、加入率との違いを押さえて読める"
    ],
    "audience": [
      "引っ越し先の治安の統計を読み比べたい方",
      "件数の多さだけで県を判断したくない方",
      "地域の安全の統計を仕事で使う方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "犯罪率の地域差",
      "労働災害の地図",
      "公害苦情の地図",
      "廃棄物とリサイクルの格差",
      "火災・地震保険料支出を読む",
      "終章"
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
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKFGQB8Q",
    "description": "図書館・博物館・スポーツ施設、スポーツの行動者率、映画・演劇等への支出を比較します。施設数と利用、参加と頻度、市の家計と県全体を区別して読みます。",
    "included": [
      "図 15 点、47 都道府県の全県表 11 表を収録しています。",
      "図書館と博物館の数の地域差を比べられる",
      "スポーツ施設の数と、実際の参加を分けて読める",
      "スポーツの行動者率を県ごとに確かめられる",
      "映画館などへの支出の違いが分かる"
    ],
    "audience": [
      "住む県の文化やスポーツの環境が気になる方",
      "地域の文化施設の統計を仕事で使う方",
      "余暇の地域差に関心がある方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "図書館・博物館の文化資本",
      "スポーツ施設の地域格差",
      "スポーツ参加の地図",
      "スポーツと都市のパラドックス",
      "映画館支出",
      "終章"
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
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HKF7C6JQ",
    "description": "テレビ・ラジオ・新聞・雑誌の利用時間、携帯契約件数、パソコン支出、テレワーク、コンビニ密度を比較します。契約件数と利用者数、支出額と保有率、有業者と雇用者の範囲を区別して読みます。",
    "included": [
      "図 11 点、47 都道府県の全県表 6 表を収録しています。",
      "テレビ・ラジオ・新聞・雑誌の利用時間の男女差が分かる",
      "人口を超える携帯契約の数字の読み方が分かる",
      "テレワークの地域差を県ごとに比べられる",
      "コンビニの密度やパソコン支出の違いを確かめられる"
    ],
    "audience": [
      "テレワークで住む場所を選びたい方",
      "デジタル環境の地域差を知りたい方",
      "通信の統計を仕事で使う方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに",
      "第0章 データの読み方",
      "テレビ・ラジオ・新聞・雑誌の時間の男女差",
      "人口を超える携帯契約",
      "パソコン支出",
      "テレワーク格差 — 東京6倍",
      "コンビニ密度の地図",
      "終章"
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
    "priceYen": 500,
    "externalUrl": "https://www.amazon.co.jp/dp/B0HQBGV4RD",
    "description": "総合の住みやすさランキングに頼らず、自分の条件に合う指標を選んで 47 都道府県を比べる手順の本。題名の 5 つの条件は、家賃・仕事・子育て・医療・災害の 5 つの切り口のことです。第8章では、そこから自分の譲れない条件を 3 つに絞ります。",
    "included": [
      "47 都道府県の全県表 3 表を収録しています。",
      "総合ランキングの順位が人によって当てはまらない理由が分かる",
      "家賃と賃金の差を並べ、比べるときの限界を押さえて読める",
      "単身者・子育て世帯・老後の場面ごとに、見る数字の順番が分かる",
      "巻末の全県の表と第8章の式で、自分の条件の点数を計算できる"
    ],
    "audience": [
      "転職・結婚・子育てで住む県を比べている方",
      "老後の住まいを考えている方",
      "総合ランキングでは決められない方"
    ],
    "purchaseNotes": [
      "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。収録年と定義は指標ごとに異なり、巻末の出典にまとめています。"
    ],
    "tableOfContents": [
      "はじめに — 「住みやすさ1位」を探す前に",
      "第1章 総合の「住みやすさ」ランキングをそのまま使えない理由",
      "第2章 家賃・物価と賃金",
      "第3章 仕事と通勤",
      "第4章 子育てと教育",
      "第5章 医療と介護",
      "第6章 気候と災害",
      "第7章 読者別の選び方の手順",
      "第8章 自分で点数を付ける手順",
      "終わりに — 県の数字は、問いの出発点",
      "出典と方法",
      "付録 47都道府県の値 — 第8章を自分で再計算するために"
    ],
    "sourceBlogSlugs": []
  }
] as const satisfies readonly StorefrontProduct[];
