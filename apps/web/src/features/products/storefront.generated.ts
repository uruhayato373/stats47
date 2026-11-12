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
    "priceYen": 1980,
    "externalUrl": "https://note.com/stats47/n/n5d86476e9c73",
    "audience": [],
    "sourceBlogSlugs": [],
    "displayTitle": "市区町村別 製造品出荷額等",
    "description": "市区町村の製造業を、時系列・業種別・地図で比較できるデータセットです。",
    "included": [
      "CSV (時系列 1980〜2023 年・1,719 自治体)",
      "CSV (業種別 2021〜2023 年・24 業種)",
      "GeoJSON (自治体の境界)",
      "README・検算表"
    ],
    "useCases": [
      {
        "title": "産業振興の資料作りに",
        "description": "近隣の自治体と、製造業の規模や業種構成を比較できます。"
      },
      {
        "title": "立地候補の調査に",
        "description": "候補地域の出荷額や業種別の内訳を比べ、製造業の特徴を把握できます。"
      },
      {
        "title": "地域経済の研究に",
        "description": "出荷額の長期推移を分析し、地図で地域差を可視化できます。"
      }
    ],
    "purchaseNotes": [
      "金額は物価調整をしていない名目値です。長期比較では調査方法や収録範囲の変更も確認してください。",
      "秘匿などにより値が空の行があります。空欄をゼロとして扱わず、同梱の注記・READMEと検算表を確認してください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "地域ごとの製造業の規模を比べる",
        "lead": "出荷額を棒グラフで比べ、地図で集積する地域を確認できます。全国の分布から県内の比較まで、調べたい範囲に合わせた資料を作れます。",
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
        "kind": "chart",
        "heading": "地域を支える業種と、その割合を読み取る",
        "lead": "業種別の内訳を円グラフや積み上げ棒グラフで比較できます。自治体ごとの産業構成や、県全体に占める各市町村の割合を説明する資料に使えます。",
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
        "kind": "chart",
        "heading": "1980〜2023 年の変化をたどる",
        "lead": "折れ線グラフで長期の推移を比べ、増減の倍率を地図にできます。地域経済の変化を振り返る分析に使えます。金額は物価調整をしていない名目値です。",
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
    "showcaseNote": "図は収録ファイルの値から作成しています。地図は国土数値情報の行政区域データと自治体コードで結合しています。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/332041499/rectangle_large_type_2_ed3faeff21eb6e6a34de3f45686521e9.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-01",
    "slug": "data-p-01",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "title": "都道府県別 人口・世帯データ 134指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/ne47eb45f8a15",
    "audience": [
      "企画・営業",
      "自治体・公務員",
      "研究者"
    ],
    "sourceBlogSlugs": [],
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
      "都道府県単位の比較用です。市区町村別・町丁目別の商圏や世帯を直接調べるデータではありません。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "人口の規模を比べる",
        "lead": "総人口を棒グラフで比較すると、自県が全国の中でどの程度の規模かを説明できます。営業エリアや行政サービスの対象規模を整理する資料に使えます。",
        "figures": [
          {
            "file": "population-scale.png",
            "alt": "総人口（2025年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "高齢化の地域差を地図で見る",
        "lead": "65歳以上人口の割合で地図を色分けし、高齢化の進み方が似ている地域を探せます。人数の多さと割合の高さを分けて説明するための図です。",
        "figures": [
          {
            "file": "aging-distribution.png",
            "alt": "65歳以上人口割合（2025年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "世帯を単位に地域を比べる",
        "lead": "一般世帯数を並べ、住宅や世帯向けサービスの対象規模を整理できます。人口と世帯数では比較の単位が異なることも、資料で示せます。",
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
    "title": "都道府県別 賃金・求人・働き方データ 107指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n46d68c153502",
    "audience": [
      "人事・採用支援",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県別 賃金・求人・働き方データ",
    "description": "地域の求人状況や賃金水準を整理し、採用計画や人事向けの比較資料を作れます。",
    "included": [
      "CSV（47地域・107指標、基準年は指標ごとに固定）",
      "Excel（107指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "採用エリアの比較に",
        "description": "有効求人倍率を県別に並べ、採用を検討する地域の求人・求職の状況を把握できます。"
      },
      {
        "title": "給与水準の説明資料に",
        "description": "調査対象や給与の定義をそろえて地域差を示し、自社の募集条件を検討するための参考資料にできます。"
      },
      {
        "title": "人事提案の根拠整理に",
        "description": "求人と賃金の指標を別々の図で示し、地域の雇用環境を社内や支援先へ説明できます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。現在の求人状況や募集相場を示すものではなく、指標ごとの基準年を確認して利用します。",
      "給与の指標は対象者、月額・年額、所定内・手当込みなどの定義が異なります。異なる指標を同じ給与として合算しないでください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "求人と求職のバランスを比べる",
        "lead": "有効求人倍率を棒グラフにし、地域の求人状況を比較できます。倍率だけで自社の採用難易度は決まりませんが、募集地域を検討する際の背景資料になります。",
        "figures": [
          {
            "file": "job-opening-comparison.png",
            "alt": "有効求人倍率（2022年度・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "給与水準の地域差を地図にする",
        "lead": "男性の所定内給与額で地図を色分けし、地域ごとの給与水準を俯瞰できます。男女合計の平均年収や手取り額とは区別して、調査対象を明記した資料に使います。",
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
    "title": "都道府県別 宿泊・交通・旅行データ 44指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n7a5f6df6f5ac",
    "audience": [
      "観光事業者",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県別 宿泊・交通・旅行データ",
    "description": "宿泊の規模、外国人の宿泊、客室の稼働状況を比較し、観光の現状を説明できます。",
    "included": [
      "CSV（47地域・44指標、基準年は指標ごとに固定）",
      "Excel（44指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "観光計画の比較資料に",
        "description": "延べ宿泊者数を近隣県や比較対象の県と並べ、観光需要の規模を整理できます。"
      },
      {
        "title": "訪日客向け施策の現状把握に",
        "description": "外国人の延べ宿泊者数を地図で示し、どの地域に宿泊が集中しているかを共有できます。"
      },
      {
        "title": "宿泊事業の調査資料に",
        "description": "宿泊者数と客室稼働率を分けて比較し、需要の大きさと施設の稼働状況を整理できます。"
      }
    ],
    "purchaseNotes": [
      "作成例の宿泊指標は、従業者数10人以上の宿泊施設が対象です。小規模施設を含む観光庁の全体推計とは対象が異なります。",
      "収録版の値を固定した商品です。月別の繁閑や将来の宿泊需要を予測するデータではありません。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "宿泊需要の規模を比べる",
        "lead": "延べ宿泊者数を棒グラフにし、宿泊需要がどの県に集まっているかを示せます。単位は人数ではなく、宿泊数を積み上げた「人泊」です。",
        "figures": [
          {
            "file": "overnight-demand.png",
            "alt": "延べ宿泊者数（2024年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "外国人の宿泊が集まる地域を見る",
        "lead": "外国人の延べ宿泊者数で地図を色分けし、訪日客の宿泊の地域差を示せます。総宿泊者数の図と見比べることで、地域の特徴を説明できます。",
        "figures": [
          {
            "file": "foreign-overnight-distribution.png",
            "alt": "外国人延べ宿泊者数（2024年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "宿泊者数とは別に、客室の稼働を比べる",
        "lead": "客室稼働率を並べると、宿泊者数の多さとは異なる面から地域を比較できます。観光計画や宿泊事業の調査で、規模と稼働を分けて説明する図に使えます。",
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
    "title": "都道府県別 自治体財政・職員給与データ 119指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n5da8a99b3506",
    "audience": [
      "自治体・公務員",
      "研究者"
    ],
    "sourceBlogSlugs": [],
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
      "作成例は都道府県財政の比較です。個々の市区町村の財政状況を直接示す図ではありません。",
      "収録版の値を固定した商品です。決算年度と各指標の定義を確認し、単独の指標で財政の健全性を断定しないでください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "財政力指数で自県の位置を確かめる",
        "lead": "財政力指数を棒グラフで比較し、自県と他県の違いを説明できます。歳入総額の多さとは別の指標として示すことで、財政の特徴を整理できます。",
        "figures": [
          {
            "file": "fiscal-strength-comparison.png",
            "alt": "財政力指数（都道府県財政）（2022年度・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "借入返済の負担を地図で比べる",
        "lead": "実質公債費比率で地図を色分けし、公債費などの負担が地域ごとにどう異なるかを示せます。財政力指数とは意味が異なるため、別の図として読み比べます。",
        "figures": [
          {
            "file": "debt-service-distribution.png",
            "alt": "実質公債費比率（都道府県財政）（2022年度・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "歳入の規模を比べる",
        "lead": "歳入総額を並べ、比較対象の県の財政規模を確認できます。人口や行政の役割も異なるため、金額の大小だけで財政の良し悪しは判断しません。",
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
    "title": "都道府県別 医療・介護データ 237指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/nbdad7c99d4b5",
    "audience": [
      "医療・介護事業者",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
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
      "県全体の資源量を示す統計です。受診のしやすさ、診療の質、施設の空き状況や待機者数を直接示すものではありません。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "人口当たりの医師数を比べる",
        "lead": "医療施設に従事する医師数を人口10万人当たりで並べ、人口規模の異なる県を比較できます。総数のランキングでは捉えにくい医療資源の違いを示す図です。",
        "figures": [
          {
            "file": "physicians-per-population.png",
            "alt": "医療施設に従事する医師数（人口10万人当たり）（2022年度・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "一般病院の病床を地域で見比べる",
        "lead": "人口10万人当たりの一般病院病床数を地図にし、病床の分布を俯瞰できます。医師数の図と併せて、地域の医療体制を整理する資料に使えます。",
        "figures": [
          {
            "file": "beds-per-population.png",
            "alt": "一般病院病床数（人口10万人当たり）（2023年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "高齢者人口に対する介護施設数を比べる",
        "lead": "65歳以上人口10万人当たりの介護老人福祉施設数を比較できます。人口全体を分母にした値と区別して、介護資源の違いを説明できます。",
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
    "title": "都道府県別 学校・保育・社会教育データ 244指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n9f0be14ecc0c",
    "audience": [
      "教育関係者",
      "移住支援",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
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
        "kind": "chart",
        "heading": "教員1人当たりの児童数を比べる",
        "lead": "小学校の教員1人当たり児童数を比較し、県全体の児童と教員の規模の関係を説明できます。1学級の人数とは異なる指標です。",
        "figures": [
          {
            "file": "students-per-teacher.png",
            "alt": "小学校児童数（教員1人当たり）（2024年度・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "子どもの人口に対する施設数を見る",
        "lead": "0〜5歳人口10万人当たりの認定こども園数を地図で示せます。施設の総数だけでは分かりにくい、子どもの人口に対する地域差を見比べられます。",
        "figures": [
          {
            "file": "childcare-center-distribution.png",
            "alt": "認定こども園数（0～5歳人口10万人当たり）（2024年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "高校卒業後の進学状況を比べる",
        "lead": "高等学校卒業者の進学率を並べ、卒業後の進路の地域差を説明できます。高校への進学率と混同せず、対象となる卒業者を明記して利用します。",
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
    "title": "都道府県別 住居費・物価・気候データ 76指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n323af74c09cc",
    "audience": [
      "移住支援",
      "個人",
      "自治体・公務員"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県別 住居費・物価・気候データ",
    "description": "物価や住居費、気候の違いを比べ、移住候補地を調べるための比較資料を作れます。",
    "included": [
      "CSV（47地域・76指標、基準年は指標ごとに固定）",
      "Excel（76指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "移住候補地の絞り込みに",
        "description": "生活に関わる物価と気候を並べ、詳しく調べたい地域を選ぶための比較表にできます。"
      },
      {
        "title": "移住相談の説明資料に",
        "description": "全国平均に対する物価水準を示し、『何がどの程度違うのか』を数字で説明できます。"
      },
      {
        "title": "生活費の下調べに",
        "description": "総合の物価と住居費目を分けて比べ、実際の家賃や家計を調べる前の基礎資料にできます。"
      }
    ],
    "purchaseNotes": [
      "収録版の値を固定した商品です。個別の物件賃料や現在の生活費を見積もる際は、最新の現地情報も確認してください。",
      "物価地域差指数は全国平均を100とする指数で、総合・住居とも持家の帰属家賃を含みません。気候指標は各地の観測地点の値です。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "全国平均に対する物価水準を比べる",
        "lead": "消費者物価地域差指数を並べ、全国平均を100とした物価水準の違いを示せます。物価の上昇率ではなく、地域間の水準を比べるための図です。",
        "figures": [
          {
            "file": "overall-price-comparison.png",
            "alt": "消費者物価地域差指数（総合）（2025年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "住居に関わる物価の地域差を見る",
        "lead": "住居費目の地域差指数を地図にし、総合の物価と違う傾向があるかを確認できます。家賃の金額や住宅の購入価格そのものを表す図ではありません。",
        "figures": [
          {
            "file": "housing-price-distribution.png",
            "alt": "消費者物価地域差指数（住居）（2025年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "各地の気温を比較する",
        "lead": "年平均気温を棒グラフで比較し、候補地の気候を調べる入口にできます。各地の観測地点の値なので、県内全域の平均や移住先の町の気温とは区別して読みます。",
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
    "title": "都道府県別 商業・小売データ 69指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n973c3f8478f5",
    "audience": [
      "小売・飲食事業者",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
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
      "都道府県単位の比較用データです。個別店舗の商圏や売上予測には、人口動態・通行量などの追加調査が必要です。",
      "指標ごとに対象年と調査範囲が異なります。比較には各図と収録ファイルに記載した年・単位・出典を使ってください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "地域の商業規模を比べる",
        "lead": "卸売業と小売業を合わせた年間商品販売額を棒グラフにできます。担当エリアの位置づけや、比較したい県との規模の違いを伝える資料に使えます。",
        "figures": [
          {
            "file": "commercial-sales.png",
            "alt": "商業年間商品販売額（卸売業＋小売業）（2022年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "事業所当たりの販売額を見る",
        "lead": "販売額を事業所当たりで比べると、総額とは異なる地域差が見えます。事業所の数と販売額の大きさを区別して説明できます。",
        "figures": [
          {
            "file": "sales-per-establishment.png",
            "alt": "商業年間商品販売額（卸売業＋小売業）（1事業所当たり）（2022年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "人口当たりの店舗数を比べる",
        "lead": "人口10万人当たりのコンビニエンスストア数を並べ、人口規模をそろえた比較を示せます。図に記載した調査時点の店舗分布を確認する資料になります。",
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
    "title": "都道府県別 産業・農業・家計データ 132指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n2ced199ed715",
    "audience": [
      "事業企画",
      "コンサル",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県別 産業・経済データ",
    "description": "製造業などの産業データをまとめて比較し、地域の経済活動を説明する資料に使えるデータ集です。",
    "included": [
      "CSV（47地域・132指標、基準年は指標ごとに固定）",
      "Excel（132指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "産業振興の比較資料に",
        "description": "製造品出荷額や従業者数を県別に並べ、地域の製造業の規模を説明できます。"
      },
      {
        "title": "法人営業の事前調査に",
        "description": "製造業の集積を県単位で確認し、訪問先や提案テーマを検討するための基礎資料を作れます。"
      },
      {
        "title": "地域経済のレポートに",
        "description": "金額と従業者数をそれぞれ図表にして、一つの指標だけでは伝わらない産業の特徴を紹介できます。"
      }
    ],
    "purchaseNotes": [
      "県単位で産業を比較するデータ集です。市区町村別の製造品出荷額データ商品とは集計範囲が異なります。",
      "収録値の対象年は指標ごとに異なります。出荷額を生産性や利益と読み替えず、調査対象と単位を確認して利用してください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "製造業の規模を金額で比べる",
        "lead": "製造品出荷額等を棒グラフにし、比較したい県の位置づけを示せます。県別の産業紹介や、地域経済レポートの導入に使えます。",
        "figures": [
          {
            "file": "manufacturing-shipments.png",
            "alt": "製造品出荷額等（2023年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "製造業の働き手が多い地域を見る",
        "lead": "製造業従業者数を地図にして、どの地域に多く集まっているかを示せます。出荷額の図と並べる場合は、対象年と調査範囲を確認して使えます。",
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
    "title": "都道府県別 防災・交通・インフラデータ 230指標｜CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/nf25cd9ae21e6",
    "audience": [
      "自治体・公務員",
      "事業企画"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県別 防災・交通・インフラデータ",
    "description": "生活インフラの整備状況や災害被害の実績を、都道府県ごとに比較するためのデータ集です。",
    "included": [
      "CSV（47地域・230指標、基準年は指標ごとに固定）",
      "Excel（230指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "地域の基礎資料作りに",
        "description": "下水道などの生活インフラの指標をそろえ、他県との違いを説明する図表を作れます。"
      },
      {
        "title": "防災学習の説明資料に",
        "description": "過去の災害被害額を県別に比較し、対象年にどの地域で被害が大きかったかを示せます。"
      },
      {
        "title": "インフラ調査の事前整理に",
        "description": "収録指標を使って県ごとの特徴を整理し、追加で確認したい地域や項目を洗い出せます。"
      }
    ],
    "purchaseNotes": [
      "災害被害額は過去の実績です。将来の災害発生確率や、個別の住所・施設の安全性を示すものではありません。",
      "指標ごとに対象年・単位・集計範囲が異なります。下水道普及率だけで生活インフラ全体を評価せず、各指標の説明と併せて確認してください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "生活インフラの整備状況を見比べる",
        "lead": "下水道普及率を地図にして、地域ごとの違いを示せます。都市や地域を紹介する資料で、生活インフラの一つの側面を説明できます。",
        "figures": [
          {
            "file": "sewerage-coverage.png",
            "alt": "下水道普及率（2012－）（2021年度・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "過去の災害被害を人口当たりで比べる",
        "lead": "人口1人当たりの災害被害額を棒グラフにし、人口規模をそろえて実績を比較できます。対象年の被害を振り返る資料として使えます。",
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
    "title": "都道府県の地図・ランキング素材 28指標｜PNG・SVG・PowerPoint",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n0f5dafef7fa8",
    "audience": [
      "編集者・ライター",
      "企画・営業",
      "クリエイター"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県の地図・ランキング素材",
    "description": "地域の特徴を伝える地図とランキング図を、資料や記事に取り入れるための図版素材集です。",
    "included": [
      "CSV（47地域・28指標、基準年は指標ごとに固定）",
      "PowerPoint（28指標の図表）",
      "PDFデータブック・地図PNG",
      "編集用の地図SVG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "プレゼン資料の導入に",
        "description": "人口や世帯の分布を示す図を添え、説明する地域の規模をひと目で伝えられます。"
      },
      {
        "title": "記事の比較図に",
        "description": "県別の地図やランキング図を使い、本文で取り上げる地域の位置づけを紹介できます。"
      },
      {
        "title": "社内資料の図版づくりに",
        "description": "用途に合わせてPNG・SVG・PowerPointの素材を選び、資料に組み込めます。"
      }
    ],
    "purchaseNotes": [
      "PNG・SVGの地図素材、PowerPoint、PDF、元データのCSVを収録しています。Excelファイルは含みません。",
      "素材を利用する際は、図に記載した基準年・単位・出典を残し、同梱の利用条件に従ってください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "人口の分布を地図で伝える",
        "lead": "都道府県別の総人口を色分けした地図です。全国の分布を示してから担当する地域の説明へ進む、資料の導入に使えます。",
        "figures": [
          {
            "file": "population-map.png",
            "alt": "総人口（2025年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "世帯数の違いを図で伝える",
        "lead": "都道府県別の一般世帯数を並べたランキング図です。数表だけではつかみにくい地域間の規模の違いを紹介できます。",
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
    "title": "47都道府県 統計データ総合集 2,073指標｜CSV・Excel",
    "priceYen": 2980,
    "externalUrl": "https://note.com/stats47/n/nfa7d235eba85",
    "audience": [
      "企画・営業",
      "自治体・公務員",
      "編集者・ライター"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "都道府県 統計データ総合集",
    "description": "人口・観光・産業などの統計をまとめて使い、複数の視点から地域を紹介する資料を作れるデータ集です。",
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
        "title": "県勢紹介の資料作りに",
        "description": "人口、観光、産業の図を組み合わせ、地域の全体像を伝える説明資料を作れます。"
      },
      {
        "title": "テーマの異なる調査案件に",
        "description": "収録指標から案件に合う項目を選び、地域比較の表やグラフを作成できます。"
      },
      {
        "title": "地域比較の授業や研修に",
        "description": "同じ県でも指標によって順位や特徴が変わることを、複数の図で説明できます。"
      }
    ],
    "purchaseNotes": [
      "収録指標には対象年・単位・調査範囲が異なるものがあります。複数の図を並べる際も、それぞれの基準年と出典を記載してください。",
      "家計調査など県庁所在市を対象とする指標もあります。地域名だけで集計範囲を判断せず、指標ごとの説明を確認してください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "人口の規模から地域を紹介する",
        "lead": "総人口の棒グラフを使い、紹介する県が全国の中でどの程度の規模かを示せます。地域比較資料の最初の一枚として使えます。",
        "figures": [
          {
            "file": "population-overview.png",
            "alt": "総人口（2025年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "宿泊の分布を加えて観光を説明する",
        "lead": "従業者10人以上の宿泊施設の延べ宿泊者数を地図にできます。人口とは違う分布を確認し、観光という視点から地域を紹介できます。",
        "figures": [
          {
            "file": "tourism-overview.png",
            "alt": "延べ宿泊者数（2024年・地図）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "製造業の規模も合わせて紹介する",
        "lead": "製造品出荷額等を県別に並べ、地域の産業を金額から説明できます。人口や観光の図と組み合わせて、多面的な地域紹介を作れます。",
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
    "title": "県庁所在市別 家計調査データ 832指標｜品目別 CSV・Excel",
    "priceYen": 980,
    "externalUrl": "https://note.com/stats47/n/n554a047cf5be",
    "audience": [
      "企画・営業",
      "編集者・ライター",
      "研究者"
    ],
    "sourceBlogSlugs": [],
    "displayTitle": "県庁所在市別 家計・消費データ",
    "description": "県庁所在市の二人以上世帯について、品目別の支出額や購入量を比較するためのデータ集です。",
    "included": [
      "CSV（47県庁所在市・二人以上世帯・685指標、基準年は指標ごとに固定）",
      "Excel（685指標）",
      "PowerPoint（30指標の図表）",
      "PDFデータブック・地図PNG",
      "出典一覧（SOURCES.csv）・利用条件"
    ],
    "useCases": [
      {
        "title": "食品・日用品の企画資料に",
        "description": "品目別の支出額を都市ごとに比べ、調査対象の世帯にどのような消費の違いがあるかを整理できます。"
      },
      {
        "title": "地域の食文化を紹介する記事に",
        "description": "牛肉やコーヒーなど身近な品目を図にして、都市ごとの支出の特徴を紹介できます。"
      },
      {
        "title": "消費の比較レポートに",
        "description": "支出額と購入量を分けて比較し、「多く買っている」と「多く支出している」の違いを説明できます。"
      }
    ],
    "purchaseNotes": [
      "対象は県庁所在市（東京都は区部）の二人以上世帯です。県全体や単身世帯を含む値ではありません。",
      "品目によって支出額・購入量の収録状況や単位が異なります。支出額の大きさを、そのまま購入量や地域全体の市場規模と読み替えないでください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "牛肉への支出を都市ごとに比べる",
        "lead": "二人以上世帯の1世帯当たりの牛肉支出額を棒グラフにできます。食品に関する企画資料で、都市ごとの支出の違いを示せます。",
        "figures": [
          {
            "file": "beef-expenditure.png",
            "alt": "牛肉消費支出額（都道府県庁所在市の二人以上世帯の年間牛肉消費支出額）（2024年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "金額に加えて、買う量を比べる",
        "lead": "牛肉の購入量を都市別に並べ、支出額の図と見比べられます。同じ品目でも、金額と量では順位が変わることを調べる資料に使えます。",
        "figures": [
          {
            "file": "beef-quantity.png",
            "alt": "牛肉消費量（都道府県庁所在市の二人以上世帯の年間牛肉消費量）（2024年・地域別比較）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "飲料への支出の特徴を紹介する",
        "lead": "コーヒーへの支出額を都市別に比べた図を作れます。身近な一品目から消費の地域差を紹介する、記事やレポートの図に使えます。",
        "figures": [
          {
            "file": "coffee-expenditure.png",
            "alt": "コーヒー消費支出額（都道府県庁所在市の二人以上世帯の年間コーヒー消費支出額）（2024年・地域別比較）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "CSVは地域コード・地域名と指標の値を横に並べた形式です。納品CSVでは県のコード・県名で記録していますが、家計調査の値は県庁所在市の二人以上世帯が対象です。画像は8行と1指標を抜粋しています。元の数値列名には指標名・年・単位が入り、画像では「数値」と省略しています。全685指標の出典と基準年はSOURCES.csvで確認できます。",
        "figures": [
          {
            "file": "file-preview.png",
            "alt": "P-14のdata.csvから列と8行を抜粋した見本"
          }
        ]
      }
    ],
    "showcaseNote": "図は販売済みの固定納品ファイルの値から作成しています。収録指標の基準年は2024〜2024年で指標ごとに異なり、時系列データではありません。",
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
