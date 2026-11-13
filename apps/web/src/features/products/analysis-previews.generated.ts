/** 自動生成。products:analysis:build。未公開の改訂候補。 */
import type { StorefrontProduct } from './types';
export const ANALYSIS_PREVIEWS: readonly StorefrontProduct[] = [
  {
    "id": "P-01",
    "slug": "data-p-01-analysis-20261112",
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
    "title": "人口・世帯の変化を読むデータ集",
    "displayTitle": "人口・世帯の変化を読むデータ集",
    "description": "人口と世帯数の推移、1世帯あたりの人数、単身世帯の割合を組み合わせ、全国の市区町村の分布と身近な地域の変化を地図・グラフで説明できます。",
    "included": [
      "人口・世帯（都道府県）（47地域・2000〜2020年・1,410行）",
      "人口・世帯（市区町村）（1,741地域・2000〜2020年・52,230行）",
      "出生・死亡・国内移動（都道府県、日本人）（47地域・2015〜2023年・1,692行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "人口ビジョンの現状整理に",
        "description": "人口と一般世帯数の推移を同じ基準年で比較し、地域の変化を説明できます。"
      },
      {
        "title": "福祉・住宅計画の基礎資料に",
        "description": "単独世帯と高齢単独世帯の割合を、同じ分母・同じ国勢調査年で比較できます。"
      },
      {
        "title": "県内の地域差を調べるときに",
        "description": "市町村合併を調整した人口増減率と単身世帯の割合を地図にし、県全体の平均では見えない違いを説明できます。"
      }
    ],
    "purchaseNotes": [
      "国勢調査の人口・世帯と、日本人の暦年動態を別系列で収録しています。外国人を含む人口差の完全な分解には使えません。",
      "市区町村は2025年3月31日の境域に揃えた原典表を使用しています。欠測・秘匿・実値0を区別してください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "人口が増えた地域・減った地域を全国で見る",
        "lead": "2000〜2020年の人口増減率を全国の市区町村で塗り分けます。都道府県の平均では見えない、都市周辺とそれ以外の地域の違いを確認できます。",
        "note": "市町村合併を調整した系列を使用し、政令指定都市は市単位、東京都の特別区は区単位で比較します。基準年が0・欠測の場合は算出せず、離島は別位置に表示します。",
        "figures": [
          {
            "file": "national-municipality-change.png",
            "alt": "全国の市区町村別 人口増減率（全国の市町村・特別区・2000〜2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "県内の人口変化を詳しく見る",
        "lead": "2000〜2020年の人口増減率を、高知県内の市町村ごとに塗り分けます。減少の大きい地域がどこにあるかを、位置関係とともに確認できます。",
        "note": "市町村の境界は取得表に合わせて調整されています。基準年が0・欠測の自治体は増減率を算出しません。",
        "figures": [
          {
            "file": "municipality-change.png",
            "alt": "高知県の市町村別 人口増減率（高知県内の市町村・2000〜2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "人口と世帯数の動きの違いを見る",
        "lead": "2000年を100とした指数で、人数と世帯数の増減の方向を比較します。見本は高知県です。",
        "note": "指数は規模の大小を示しません。世帯数だけから住宅需要の増減を断定できません。",
        "figures": [
          {
            "file": "population-household-trend.png",
            "alt": "人口と世帯数の動きの違いを見る（高知県・2000〜2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "1世帯あたりの人数がどう変わったかを見る",
        "lead": "高知市・いの町・黒潮町を例に、一般世帯人員を一般世帯数で割った値を比較します。人口の減少と世帯の小規模化を分けて、住宅・福祉計画の基礎資料にできます。",
        "note": "一般世帯の平均です。施設等の世帯は含まず、個別の世帯構成や必要な住宅戸数を直接示しません。",
        "figures": [
          {
            "file": "municipal-household-size-trend.png",
            "alt": "一般世帯の1世帯あたり人員（高知市・いの町・黒潮町・2000〜2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "単身世帯の変化を確認する",
        "lead": "一般世帯数を分母に、単独世帯と65歳以上の単独世帯の割合を比較します。見本は高知県です。",
        "note": "高齢単独世帯は単独世帯の内数です。2つの割合を合計しません。",
        "figures": [
          {
            "file": "single-household-trend.png",
            "alt": "単身世帯の変化を確認する（高知県・2000〜2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "単身世帯の割合を地図で比べる",
        "lead": "同じ2020年の一般世帯数を分母に、単独世帯の割合を市町村ごとに比較します。人口増減率の地図と見比べることで、人口規模と世帯構成の違いを整理できます。",
        "note": "単独世帯は1人で暮らす一般世帯です。高齢者だけの割合ではなく、単身であることから支援の必要性は判断できません。",
        "figures": [
          {
            "file": "municipal-single-household-map.png",
            "alt": "一般世帯に占める単独世帯の割合（高知県内の市町村・2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "自然増減と国内移動を分けて見る",
        "lead": "日本人について、出生数と死亡数の差、国内の転入者と転出者の差を比べます。見本は高知県です。",
        "note": "国外移動・外国人を含まず、社会増減全体や国勢調査人口の増減を説明する分解ではありません。",
        "figures": [
          {
            "file": "population-flow-trend.png",
            "alt": "自然増減と国内移動を分けて見る（高知県・2015〜2023年）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "地域コード・地域名・年・指標・値・単位を列に持つCSVとExcelです。観測値と分析結果を分け、欠測は理由付きで保持します。",
        "figures": [
          {
            "file": "analysis-file-preview.png",
            "alt": "人口・世帯の変化を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "図はこの改訂候補に同梱する観測値から計算しています。公開中の固定版には含まれていません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327852712/rectangle_large_type_2_9808a78289ba75a9473d8416baf21fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-04",
    "slug": "data-p-04-analysis-20261112",
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
    "title": "市町村の財政基盤と経常負担を比べるデータ集",
    "displayTitle": "市町村の財政基盤と経常負担を比べるデータ集",
    "description": "同じ年度の財政力指数と経常収支比率を揃え、自治体ごとの財政基盤と経常的な負担を別々の図で比較できます。",
    "included": [
      "市町村財政の指標（1,741地域・2022年度・3,482行、うち欠測23行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "決算説明の比較資料に",
        "description": "近隣市町村の財政力指数と経常収支比率を並べ、自分の自治体の位置を説明できます。"
      },
      {
        "title": "財政研修の教材に",
        "description": "財政力と経常的な負担を別の指標として読み、金額の規模だけで判断しない比較ができます。"
      }
    ],
    "purchaseNotes": [
      "分析対象は市町村財政です。県財政と同じ順位表に混ぜません。",
      "東京特別区など原典で欠測となる自治体を0に置き換えません。値のある自治体だけで比較します。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "財政力の地域差を地図で見る",
        "lead": "2022年度の財政力指数を、高知県内の市町村ごとに塗り分けます。近隣自治体との違いを位置関係とともに示し、決算説明の比較資料に使えます。",
        "note": "財政力指数だけで自治体の健全性や住民サービスの水準は判断できません。",
        "figures": [
          {
            "file": "municipal-fiscal-strength.png",
            "alt": "市町村別の財政力指数（高知県内の市町村・2022年度）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "経常的な財政負担を比べる",
        "lead": "同じ自治体の経常収支比率を並べ、財政力とは別の面から比較します。",
        "note": "値の大小を単独で財政の良し悪しに読み替えません。歳入の構成や行政の役割も確認してください。",
        "figures": [
          {
            "file": "municipal-current-balance.png",
            "alt": "経常的な財政負担を比べる（2022年度）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "地域コード・地域名・年・指標・値・単位を列に持つCSVとExcelです。観測値と分析結果を分け、欠測は理由付きで保持します。",
        "figures": [
          {
            "file": "analysis-file-preview.png",
            "alt": "市町村の財政基盤と経常負担を比べるデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "図はこの改訂候補に同梱する観測値から計算しています。公開中の固定版には含まれていません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327863352/rectangle_large_type_2_47c65477c27dcdf3f4bb97c4ab5faa33.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-05",
    "slug": "data-p-05-analysis-20261112",
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
    "title": "市区町村の診療所と高齢化を比べるデータ集",
    "displayTitle": "市区町村の診療所と高齢化を比べるデータ集",
    "description": "一般診療所数を人口規模で調整した値と、高齢人口の割合を別々に比較し、地域医療の現状整理に使えます。",
    "included": [
      "一般診療所と人口構成（1,741地域・2020年・5,223行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "地域医療の基礎資料に",
        "description": "人口10万人あたり一般診療所数を並べ、施設数の規模を人口との関係で確認できます。"
      },
      {
        "title": "高齢化の地域差を説明するときに",
        "description": "同じ年の総人口と65歳以上人口から割合を作り、近隣自治体の違いを確認できます。"
      }
    ],
    "purchaseNotes": [
      "医療施設数と人口構成を別図にし、診療所数だけで医療の充足や不足を断定しません。",
      "人口0または欠測の自治体は比率を算出しません。診療所の実値0は欠測と区別して保持します。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "人口あたりの診療所数を地図で見る",
        "lead": "高知県内の全市町村について、2020年の一般診療所数を人口10万人あたりに換算します。人口規模を揃えて、施設数の地域差を確認できます。",
        "note": "施設の規模・診療科・自治体を越える受診は含まれず、医療アクセスの順位ではありません。",
        "figures": [
          {
            "file": "clinics-per-population.png",
            "alt": "人口10万人あたりの一般診療所数（高知県内の市町村・2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "高齢人口の割合を比べる",
        "lead": "同じ自治体の総人口に占める65歳以上人口の割合を確認します。",
        "note": "総人口には年齢不詳を含みます。年齢不詳を除く人口を分母とする公表割合とは一致しない場合があります。",
        "figures": [
          {
            "file": "elderly-population-share.png",
            "alt": "高齢人口の割合を比べる（2020年）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "地域コード・地域名・年・指標・値・単位を列に持つCSVとExcelです。観測値と分析結果を分け、欠測は理由付きで保持します。",
        "figures": [
          {
            "file": "analysis-file-preview.png",
            "alt": "市区町村の診療所と高齢化を比べるデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "図はこの改訂候補に同梱する観測値から計算しています。公開中の固定版には含まれていません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327866695/rectangle_large_type_2_f8824e0d379bc6d8b55f8d15a4559f7f.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-06",
    "slug": "data-p-06-analysis-20261112",
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
    "title": "市区町村の小学校規模と教員配置を比べるデータ集",
    "displayTitle": "市区町村の小学校規模と教員配置を比べるデータ集",
    "description": "同じ年度の小学校児童数・本務教員数・学校数を揃え、教員1人あたりと学校1校あたりの児童数を比較できます。",
    "included": [
      "小学校の学校数・児童数・本務教員数（1,741地域・2024年度・5,223行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "教育計画の現状整理に",
        "description": "学校数と児童数から1校あたりの規模を比べ、自治体の学校配置を考える基礎資料を作れます。"
      },
      {
        "title": "教員配置の説明資料に",
        "description": "児童数と本務教員数の比率を近隣自治体と比較し、集計上の特徴を確認できます。"
      }
    ],
    "purchaseNotes": [
      "小学校の指標であり、義務教育学校など別区分の学校は含めません。",
      "学校数・本務教員数が0または欠測の自治体は比率を算出しません。分母が小さい地域では比率が大きく動くため、元の人数・学校数も確認してください。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "本務教員1人あたりの児童数を比べる",
        "lead": "高知県の市といの町を例に、小学校児童数と本務教員数の比率を比較します。",
        "note": "学級の人数や個々の教員の担当人数ではありません。教育の質を直接評価する指標には使えません。",
        "figures": [
          {
            "file": "pupils-per-teacher.png",
            "alt": "本務教員1人あたりの児童数を比べる（2024年度）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "小学校の平均的な規模を地図で見る",
        "lead": "2024年度の児童数を小学校数で割り、高知県内の市町村ごとに比較します。1校あたりの規模が異なる地域を、学校配置を考えるための基礎資料にできます。",
        "note": "学校間の規模差や通学距離は示しません。義務教育学校など別区分の学校を含めません。",
        "figures": [
          {
            "file": "pupils-per-school.png",
            "alt": "小学校1校あたりの児童数（高知県内の市町村・2024年度）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "地域コード・地域名・年・指標・値・単位を列に持つCSVとExcelです。観測値と分析結果を分け、欠測は理由付きで保持します。",
        "figures": [
          {
            "file": "analysis-file-preview.png",
            "alt": "市区町村の小学校規模と教員配置を比べるデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "図はこの改訂候補に同梱する観測値から計算しています。公開中の固定版には含まれていません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327884421/rectangle_large_type_2_da2953b07fcf070247c692d68cd7c50b.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-08",
    "slug": "data-p-08-analysis-20261112",
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
    "title": "市区町村の商業規模を人口と比べるデータ集",
    "displayTitle": "市区町村の商業規模を人口と比べるデータ集",
    "description": "卸売業・小売業の年間商品販売額と同じ年の人口を揃え、商業の規模と人口あたりの規模を分けて比較できます。",
    "included": [
      "年間商品販売額と総人口（1,741地域・2020年・3,482行、うち欠測15行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "商業集積の比較資料に",
        "description": "自治体ごとの年間商品販売額を並べ、商業の規模を確認できます。"
      },
      {
        "title": "立地検討の基礎調査に",
        "description": "人口あたり販売額を補助指標に、人口規模だけでは説明しにくい商業集積の違いを確認できます。"
      }
    ],
    "purchaseNotes": [
      "卸売業を含む年間商品販売額であり、小売だけの市場規模や住民の消費額として解釈しません。",
      "販売額の欠測・秘匿を0に変換しません。実値0は保持し、人口0または欠測の場合は人口あたり比率を算出しません。"
    ],
    "showcase": [
      {
        "kind": "chart",
        "heading": "市町村の商業規模を比べる",
        "lead": "高知県の市といの町を例に、卸売業・小売業の年間商品販売額を比較します。",
        "note": "卸売業を含むため、地域住民の買い物額や小売店の集客力を直接示すものではありません。",
        "figures": [
          {
            "file": "municipal-sales-scale.png",
            "alt": "市町村の商業規模を比べる（2020年）"
          }
        ]
      },
      {
        "kind": "chart",
        "heading": "人口あたりの商業規模を地図で見る",
        "lead": "2020年の年間商品販売額を住民人口で割り、高知県内の市町村を塗り分けます。販売額の総額だけでは見えない、人口規模に対する商業集積の違いを整理できます。",
        "note": "住民1人の消費額ではありません。法人間取引や自治体外からの需要なども含みます。",
        "figures": [
          {
            "file": "municipal-sales-per-resident.png",
            "alt": "住民1人あたりの年間商品販売額（高知県内の市町村・2020年）"
          }
        ]
      },
      {
        "kind": "file",
        "heading": "ファイルの中身",
        "lead": "地域コード・地域名・年・指標・値・単位を列に持つCSVとExcelです。観測値と分析結果を分け、欠測は理由付きで保持します。",
        "figures": [
          {
            "file": "analysis-file-preview.png",
            "alt": "市区町村の商業規模を人口と比べるデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "図はこの改訂候補に同梱する観測値から計算しています。公開中の固定版には含まれていません。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327892069/rectangle_large_type_2_8a0b3ef48c7ce4ae9be9ceed6aed7fe5.png?fit=bounds&quality=85&width=480"
  }
];
