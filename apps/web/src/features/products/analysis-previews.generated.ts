/** 自動生成。products:analysis:build。未公開の改訂候補。 */
import type { StorefrontProduct } from './types';
export const ANALYSIS_PREVIEWS: readonly StorefrontProduct[] = [
  {
    "id": "MUNI-MANUFACTURING",
    "slug": "data-muni-manufacturing-analysis-20261113",
    "channel": "note",
    "channelLabel": "note有料データ集",
    "listingTitle": "市区町村別 製造品出荷額等 1980〜2023年＋業種別 CSV＋境界GeoJSON（1,719自治体・最新境域の時系列）",
    "priceYen": 1980,
    "externalUrl": "https://note.com/stats47/n/n5d86476e9c73",
    "audience": [],
    "sourceBlogSlugs": [],
    "title": "製造品出荷額等の規模と推移を読むデータ集",
    "displayTitle": "製造品出荷額等の規模と推移を読むデータ集",
    "description": "2023年の製造品出荷額等の地域比較と2022〜2023年の推移を分け、製造業の名目金額の規模を説明できます。",
    "included": [
      "製造品出荷額等（1,741地域・2022〜2023年・3,482行、うち欠測114行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "産業振興の現状説明に",
        "description": "2023年の製造品出荷額等の分布から比較地域を選び、名目金額の規模を説明できます。"
      },
      {
        "title": "地域経済の比較資料に",
        "description": "豊田市・大阪市の2022〜2023年の値を比較し、同じ調査対象の金額の変化を整理できます。"
      }
    ],
    "purchaseNotes": [
      "この改訂分析では出荷額の規模と推移を扱います。従業者数との結合や生産性の計算は行っていません。",
      "分析データ追加分の取得範囲は全国1741自治体で、既存の1719自治体を含む固定販売版とは異なります。固定販売版の収録範囲が増えたことを示すものではありません。",
      "2023年の1741自治体には秘匿Xが57自治体、実値0が15自治体あります。秘匿・欠測は数値0と区別します。"
    ],
    "showcase": [
      {
        "id": "national-municipal-manufacturing-scale",
        "kind": "chart",
        "heading": "製造品出荷額等を全国の市区町村で見る",
        "lead": "2023年の製造品出荷額等を全国の市町村・特別区の地図で確認します。製造業の規模が大きい地域の分布を、位置関係とともに説明できます。",
        "note": "従業者4人以上の事業所の名目金額です。付加価値・利益や生産性ではありません。秘匿のXと実値0を区別し、欠測を0に置き換えません。",
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
            "file": "national-municipal-manufacturing-scale.png",
            "alt": "2023年の製造品出荷額等（全国の市町村・特別区・2023年）"
          }
        ]
      },
      {
        "id": "municipal-manufacturing-trend",
        "kind": "chart",
        "heading": "2022〜2023年の名目金額の推移を見る",
        "lead": "豊田市・大阪市の2022・2023年の製造品出荷額等を折れ線で比較します。地域間の規模の違いと、同じ地域の2年の変化を分けて確認できます。",
        "note": "比較期間は2年です。長期傾向や変化の原因を断定せず、物価変動を含む名目金額として読みます。従業者あたり出荷額や付加価値を示す図ではありません。",
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
            "file": "municipal-manufacturing-trend.png",
            "alt": "製造品出荷額等の推移（豊田市・大阪市・2022〜2023年）"
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
            "alt": "製造品出荷額等の規模と推移を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/332041499/rectangle_large_type_2_ed3faeff21eb6e6a34de3f45686521e9.png?fit=bounds&quality=85&width=480"
  },
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
        "id": "national-municipality-change",
        "kind": "chart",
        "heading": "人口が増えた地域・減った地域を全国で見る",
        "lead": "2000〜2020年の人口増減率を全国の市区町村で塗り分けます。都道府県の平均では見えない、都市周辺とそれ以外の地域の違いを確認できます。",
        "note": "市町村合併を調整した系列を使用し、政令指定都市は市単位、東京都の特別区は区単位で比較します。基準年が0・欠測の場合は算出せず、離島は別位置に表示します。",
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
            "file": "national-municipality-change.png",
            "alt": "全国の市区町村別 人口増減率（全国の市町村・特別区・2000〜2020年）"
          }
        ]
      },
      {
        "id": "municipality-change",
        "kind": "chart",
        "heading": "県内の人口変化を詳しく見る",
        "lead": "2000〜2020年の人口増減率を、高知県内の市町村ごとに塗り分けます。減少の大きい地域がどこにあるかを、位置関係とともに確認できます。",
        "note": "市町村の境界は取得表に合わせて調整されています。基準年が0・欠測の自治体は増減率を算出しません。",
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
            "file": "municipality-change.png",
            "alt": "高知県の市町村別 人口増減率（高知県内の市町村・2000〜2020年）"
          }
        ]
      },
      {
        "id": "population-household-trend",
        "kind": "chart",
        "heading": "人口と世帯数の動きの違いを見る",
        "lead": "2000年を100とした指数で、人数と世帯数の増減の方向を比較します。見本は高知県です。",
        "note": "指数は規模の大小を示しません。世帯数だけから住宅需要の増減を断定できません。",
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
            "file": "population-household-trend.png",
            "alt": "人口と世帯数の動きの違いを見る（高知県・2000〜2020年）"
          }
        ]
      },
      {
        "id": "municipal-household-size-trend",
        "kind": "chart",
        "heading": "1世帯あたりの人数がどう変わったかを見る",
        "lead": "高知市・いの町・黒潮町を例に、一般世帯人員を一般世帯数で割った値を比較します。人口の減少と世帯の小規模化を分けて、住宅・福祉計画の基礎資料にできます。",
        "note": "一般世帯の平均です。施設等の世帯は含まず、個別の世帯構成や必要な住宅戸数を直接示しません。",
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
            "file": "municipal-household-size-trend.png",
            "alt": "一般世帯の1世帯あたり人員（高知市・いの町・黒潮町・2000〜2020年）"
          }
        ]
      },
      {
        "id": "single-household-trend",
        "kind": "chart",
        "heading": "単身世帯の変化を確認する",
        "lead": "一般世帯数を分母に、単独世帯の割合の変化を確認します。見本は高知県です。",
        "note": "単独世帯は全年齢の1人世帯です。高齢者の一人暮らしの割合とは区別します。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "households",
            "title": "暮らし・住まい",
            "sectionTitle": "住む世帯はどう変わるか",
            "href": "/themes/living-housing#theme-section-households"
          }
        ],
        "figures": [
          {
            "file": "single-household-trend.png",
            "alt": "単身世帯の変化を確認する（高知県・2000〜2020年）"
          }
        ]
      },
      {
        "id": "elderly-household-trend",
        "kind": "chart",
        "heading": "高齢単独世帯と高齢夫婦世帯の変化を見る",
        "lead": "一般世帯に占める高齢単独世帯と高齢夫婦のみの世帯の割合を、同じ分母で比較します。見本は高知県です。",
        "note": "高齢夫婦のみの世帯は夫65歳以上・妻60歳以上です。割合の分母は一般世帯数で、65歳以上人口ではありません。",
        "themeRefs": [
          {
            "themeKey": "aging-society",
            "sectionKey": "elderly-households",
            "title": "少子高齢化",
            "sectionTitle": "高齢者はどの世帯で暮らすか",
            "href": "/themes/aging-society#theme-section-elderly-households"
          }
        ],
        "figures": [
          {
            "file": "elderly-household-trend.png",
            "alt": "一般世帯に占める高齢世帯の割合（高知県・2000〜2020年）"
          }
        ]
      },
      {
        "id": "elderly-single-household-map",
        "kind": "chart",
        "heading": "高齢単独世帯の割合を全国の市区町村で比べる",
        "lead": "2020年の一般世帯に占める高齢単独世帯の割合を全国地図で確認できます。地域の世帯構成を比較する基礎資料として使えます。",
        "note": "高齢夫婦のみの世帯は夫65歳以上・妻60歳以上です。割合の分母は一般世帯数で、65歳以上人口ではありません。 世帯構成だけでは、見守りや介護の必要性は判断できません。",
        "themeRefs": [
          {
            "themeKey": "aging-society",
            "sectionKey": "elderly-households",
            "title": "少子高齢化",
            "sectionTitle": "高齢者はどの世帯で暮らすか",
            "href": "/themes/aging-society#theme-section-elderly-households"
          }
        ],
        "figures": [
          {
            "file": "elderly-single-household-map.png",
            "alt": "一般世帯に占める高齢単独世帯の割合（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "elderly-couple-household-map",
        "kind": "chart",
        "heading": "高齢夫婦のみの世帯の割合を全国の市区町村で比べる",
        "lead": "2020年の一般世帯に占める高齢夫婦のみの世帯の割合を全国地図で確認できます。地域の世帯構成を比較する基礎資料として使えます。",
        "note": "高齢夫婦のみの世帯は夫65歳以上・妻60歳以上です。割合の分母は一般世帯数で、65歳以上人口ではありません。 世帯構成だけでは、見守りや介護の必要性は判断できません。",
        "themeRefs": [
          {
            "themeKey": "aging-society",
            "sectionKey": "elderly-households",
            "title": "少子高齢化",
            "sectionTitle": "高齢者はどの世帯で暮らすか",
            "href": "/themes/aging-society#theme-section-elderly-households"
          }
        ],
        "figures": [
          {
            "file": "elderly-couple-household-map.png",
            "alt": "一般世帯に占める高齢夫婦のみの世帯の割合（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "municipal-single-household-map",
        "kind": "chart",
        "heading": "単身世帯の割合を地図で比べる",
        "lead": "同じ2020年の一般世帯数を分母に、単独世帯の割合を市町村ごとに比較します。人口増減率の地図と見比べることで、人口規模と世帯構成の違いを整理できます。",
        "note": "単独世帯は1人で暮らす一般世帯です。高齢者だけの割合ではなく、単身であることから支援の必要性は判断できません。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "households",
            "title": "暮らし・住まい",
            "sectionTitle": "住む世帯はどう変わるか",
            "href": "/themes/living-housing#theme-section-households"
          }
        ],
        "figures": [
          {
            "file": "municipal-single-household-map.png",
            "alt": "一般世帯に占める単独世帯の割合（高知県内の市町村・2020年）"
          }
        ]
      },
      {
        "id": "population-flow-trend",
        "kind": "chart",
        "heading": "自然増減と国内移動を分けて見る",
        "lead": "日本人について、出生数と死亡数の差、国内の転入者と転出者の差を比べます。見本は高知県です。",
        "note": "国外移動・外国人を含まず、社会増減全体や国勢調査人口の増減を説明する分解ではありません。",
        "themeRefs": [
          {
            "themeKey": "population-dynamics",
            "sectionKey": "natural-social-change",
            "title": "人口動態",
            "sectionTitle": "出生と死亡・転入と転出の内訳",
            "href": "/themes/population-dynamics#theme-section-natural-social-change"
          }
        ],
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
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327852712/rectangle_large_type_2_9808a78289ba75a9473d8416baf21fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-02",
    "slug": "data-p-02-analysis-20261113",
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
    "title": "市区町村の他地域への通勤を読むデータ集",
    "displayTitle": "市区町村の他地域への通勤を読むデータ集",
    "description": "全国の他市区町村への通勤者数の分布と、八王子市・京都市の推移を地図と折れ線で確認できます。",
    "included": [
      "他市区町村への通勤者数（1,741地域・2010〜2020年・5,223行、うち欠測6行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "採用圏を検討する基礎資料に",
        "description": "他市区町村へ通勤する人数の全国分布から比較地域を選び、地域を越える通勤の規模を説明できます。"
      },
      {
        "title": "自治体の雇用施策の現状整理に",
        "description": "国勢調査年の通勤者数の推移を確認し、県別の求人・賃金とは異なる市区町村の動きを整理できます。"
      }
    ],
    "purchaseNotes": [
      "市区町村の通勤者数を対象とする分析データ追加分です。求人倍率・賃金の県別固定販売版とは分けて確認してください。"
    ],
    "showcase": [
      {
        "id": "national-municipal-outcommuters",
        "kind": "chart",
        "heading": "他市区町村へ通勤する人数を全国で見る",
        "lead": "2020年に他市区町村へ通勤した人数を全国地図で確認します。人数の大きい地域を位置関係とともに示し、詳しく比較する地域を選べます。",
        "note": "通勤者の実人数であり、域外通勤の割合や移動距離は示しません。総人口を労働供給とみなしたり、県別求人倍率を自治体へ割り振ったりしません。",
        "themeRefs": [
          {
            "themeKey": "labor-mobility",
            "sectionKey": "regional-commute-and-daytime-population",
            "title": "人材流動性・雇用環境",
            "sectionTitle": "職住近接や他市区町村への通勤など就業者の移動実態はどうなっているか",
            "href": "/themes/labor-mobility#theme-section-regional-commute-and-daytime-population"
          }
        ],
        "figures": [
          {
            "file": "national-municipal-outcommuters.png",
            "alt": "全国の他市区町村への通勤者数（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "municipal-outcommuter-trend",
        "kind": "chart",
        "heading": "他地域へ通勤する人数の推移を比べる",
        "lead": "八王子市と京都市について、2010・2015・2020年の他市区町村への通勤者数を比較します。通勤の規模がどう変わったかを、自治体の雇用施策の説明資料にできます。",
        "note": "人数の増減は人口規模や就業構成にも影響されます。通勤のしやすさや採用成功の因果関係は示しません。",
        "themeRefs": [
          {
            "themeKey": "labor-mobility",
            "sectionKey": "regional-commute-and-daytime-population",
            "title": "人材流動性・雇用環境",
            "sectionTitle": "職住近接や他市区町村への通勤など就業者の移動実態はどうなっているか",
            "href": "/themes/labor-mobility#theme-section-regional-commute-and-daytime-population"
          }
        ],
        "figures": [
          {
            "file": "municipal-outcommuter-trend.png",
            "alt": "他市区町村への通勤者数の推移（八王子市・京都市・2010〜2020年）"
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
            "alt": "市区町村の他地域への通勤を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327856740/rectangle_large_type_2_b5fb8a2a3e30547c5496bbd6799dfe53.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-03",
    "slug": "data-p-03-analysis-20261113",
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
    "title": "宿泊需要の規模と外国人割合を読むデータ集",
    "displayTitle": "宿泊需要の規模と外国人割合を読むデータ集",
    "description": "2019〜2024年の延べ宿泊者数と外国人延べ宿泊者数の割合を別々の図で確認し、宿泊の規模と構成を整理できます。",
    "included": [
      "延べ宿泊者数・外国人延べ宿泊者数（47地域・2019〜2024年・564行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "観光施策の現状説明に",
        "description": "延べ宿泊者数の推移と外国人割合を分け、東京都の例から宿泊の規模と構成の変化を説明できます。"
      },
      {
        "title": "宿泊統計の読み方を学ぶ研修に",
        "description": "人数の合計と割合を別図で比較し、対象施設の範囲を揃えて時系列を読む練習ができます。"
      }
    ],
    "purchaseNotes": [
      "都道府県47地域のデータを対象とし、東京都は作成例です。市区町村の宿泊需要へ値を割り振りません。",
      "従業者数10人以上の施設の結果です。全施設を含む観光庁の推計値と区別してください。"
    ],
    "showcase": [
      {
        "id": "tokyo-overnight-stays-trend",
        "kind": "chart",
        "heading": "延べ宿泊者数の変化を見る",
        "lead": "東京都について2019〜2024年の延べ宿泊者数を確認します。人泊の合計を折れ線で示し、宿泊需要の規模の変化を説明できます。",
        "note": "延べ人数であり、実際に訪れた人の数ではありません。観光目的と業務目的は識別できず、従業者数10人未満の施設を含みません。",
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
            "file": "tokyo-overnight-stays-trend.png",
            "alt": "東京都の延べ宿泊者数（東京都・2019〜2024年）"
          }
        ]
      },
      {
        "id": "tokyo-foreign-overnight-share",
        "kind": "chart",
        "heading": "外国人宿泊の割合を別の図で見る",
        "lead": "東京都の外国人延べ宿泊者数を延べ宿泊者総数で割り、2019〜2024年の割合を比較します。宿泊総数の図と見比べ、規模と構成の違いを説明できます。",
        "note": "分母・分子とも従業者数10人以上の施設の人泊です。外国人旅行者の実人数割合や、全宿泊施設の外国人割合とは異なります。",
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
            "file": "tokyo-foreign-overnight-share.png",
            "alt": "東京都の外国人延べ宿泊者数の割合（東京都・2019〜2024年）"
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
            "alt": "宿泊需要の規模と外国人割合を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327860122/rectangle_large_type_2_12dc8af8294fe9865a47f0c34bcaefc9.png?fit=bounds&quality=85&width=480"
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
    "title": "都道府県・市区町村の財政を推移と内訳で比べるデータ集",
    "displayTitle": "都道府県・市区町村の財政を推移と内訳で比べるデータ集",
    "description": "47都道府県と全国の市区町村のデータから、歳入・歳出の推移、財源の内訳、目的別・性質別の支出を図にできます。県と市町村は分けて比較します。",
    "included": [
      "市町村財政の指標（1,741地域・2022年度・3,482行、うち欠測23行）",
      "都道府県の普通会計決算（47地域・2018〜2022年度・2,820行）",
      "市区町村の普通会計決算（1,741地域・2018〜2022年度・104,460行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "予算・決算の説明資料に",
        "description": "歳入・歳出が何年でどう変わったかを折れ線で示し、財源と支出の構成を別の図で説明できます。"
      },
      {
        "title": "財源や支出の見直しに",
        "description": "地方税・地方交付税・国庫支出金・地方債の割合と、福祉・教育・土木などの支出の割合を年度別に比べられます。"
      },
      {
        "title": "他自治体との比較や研修に",
        "description": "47都道府県と全国の市区町村をそれぞれ選べるCSV・Excelを使い、地域と年度を揃えた比較資料を作れます。"
      }
    ],
    "purchaseNotes": [
      "都道府県と市区町村を分けて収録します。互いの財政を同じ順位表に混ぜず、重複する移転額を全国の純額として合計しません。",
      "普通会計の歳入・歳出と内訳は2018〜2022年度、財政力指数・経常収支比率の地域比較は2022年度です。最新年度への自動更新商品ではありません。",
      "高知県・高知市は作成例です。分析データ追加分の原票には47都道府県と全国の市区町村の値・欠測理由を収録します。",
      "目的別と性質別は同じ歳出を異なる切り口で分類します。両者の内訳を足し合わせません。",
      "財政力指数は過去3年平均です。単年度の歳入規模や経常収支比率と区別してください。",
      "東京特別区などの欠測を0に置き換えません。比較できる地域・年度を確認して利用します。"
    ],
    "showcase": [
      {
        "id": "prefecture-budget-trend",
        "kind": "chart",
        "heading": "都道府県の歳入・歳出の推移を見る",
        "lead": "高知県を例に、2018〜2022年度の歳入・歳出の動きを同じ図に示します。期間を通じた規模の変化を確認し、次の構成図と読み比べられます。",
        "note": "普通会計の名目金額です。物価の影響を除いた実質増減や、差額だけで財政の健全性を判断する図ではありません。県と市区町村は別々に比較します。",
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
            "file": "prefecture-budget-trend.png",
            "alt": "歳入・歳出の推移（高知県・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "prefecture-budget-revenue",
        "kind": "chart",
        "heading": "都道府県の歳入の構成を比べる",
        "lead": "高知県を例に、地方税・地方交付税・国庫支出金・地方債とその他の財源が、歳入総額に占める割合を年度別に比較します。総額の大小とは分けて、内訳の変化を説明できます。",
        "note": "地方債は当年度の収入で、年度末の地方債残高ではありません。 その他は総額から表示した内訳を引いた残額です。原典の欠測を0にせず、内訳の欠けた地域・年度では図を作りません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "finance-flow",
            "title": "地方財政",
            "sectionTitle": "どこから調達し何に使うか",
            "href": "/themes/local-finance#theme-section-finance-flow"
          }
        ],
        "figures": [
          {
            "file": "prefecture-budget-revenue.png",
            "alt": "歳入の構成（高知県・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "prefecture-budget-purpose",
        "kind": "chart",
        "heading": "都道府県の目的別の歳出構成を比べる",
        "lead": "高知県を例に、民生費・教育費・土木費とその他の支出が、歳出総額に占める割合を年度別に比較します。総額の大小とは分けて、内訳の変化を説明できます。",
        "note": "行政の何の目的に使ったかを示します。人件費や扶助費などの性質別内訳とは合算しません。 その他は総額から表示した内訳を引いた残額です。原典の欠測を0にせず、内訳の欠けた地域・年度では図を作りません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "candidate-122",
            "title": "地方財政",
            "sectionTitle": "目的別と性質別の歳出を分けて見る",
            "href": "/themes/local-finance#theme-section-candidate-122"
          }
        ],
        "figures": [
          {
            "file": "prefecture-budget-purpose.png",
            "alt": "目的別の歳出構成（高知県・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "prefecture-budget-nature",
        "kind": "chart",
        "heading": "都道府県の性質別の歳出構成を比べる",
        "lead": "高知県を例に、人件費・扶助費・公債費とその他の支出が、歳出総額に占める割合を年度別に比較します。総額の大小とは分けて、内訳の変化を説明できます。",
        "note": "経費の性質で分類します。民生費や教育費などの目的別内訳とは合算しません。 その他は総額から表示した内訳を引いた残額です。原典の欠測を0にせず、内訳の欠けた地域・年度では図を作りません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "candidate-122",
            "title": "地方財政",
            "sectionTitle": "目的別と性質別の歳出を分けて見る",
            "href": "/themes/local-finance#theme-section-candidate-122"
          }
        ],
        "figures": [
          {
            "file": "prefecture-budget-nature.png",
            "alt": "性質別の歳出構成（高知県・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "municipal-budget-trend",
        "kind": "chart",
        "heading": "市区町村の歳入・歳出の推移を見る",
        "lead": "高知市を例に、2018〜2022年度の歳入・歳出の動きを同じ図に示します。期間を通じた規模の変化を確認し、次の構成図と読み比べられます。",
        "note": "普通会計の名目金額です。物価の影響を除いた実質増減や、差額だけで財政の健全性を判断する図ではありません。県と市区町村は別々に比較します。",
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
            "file": "municipal-budget-trend.png",
            "alt": "歳入・歳出の推移（高知県 高知市・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "municipal-budget-revenue",
        "kind": "chart",
        "heading": "市区町村の歳入の構成を比べる",
        "lead": "高知市を例に、地方税・地方交付税・国庫支出金・地方債とその他の財源が、歳入総額に占める割合を年度別に比較します。総額の大小とは分けて、内訳の変化を説明できます。",
        "note": "地方債は当年度の収入で、年度末の地方債残高ではありません。 その他は総額から表示した内訳を引いた残額です。原典の欠測を0にせず、内訳の欠けた地域・年度では図を作りません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "finance-flow",
            "title": "地方財政",
            "sectionTitle": "どこから調達し何に使うか",
            "href": "/themes/local-finance#theme-section-finance-flow"
          }
        ],
        "figures": [
          {
            "file": "municipal-budget-revenue.png",
            "alt": "歳入の構成（高知県 高知市・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "municipal-budget-purpose",
        "kind": "chart",
        "heading": "市区町村の目的別の歳出構成を比べる",
        "lead": "高知市を例に、民生費・教育費・土木費とその他の支出が、歳出総額に占める割合を年度別に比較します。総額の大小とは分けて、内訳の変化を説明できます。",
        "note": "行政の何の目的に使ったかを示します。人件費や扶助費などの性質別内訳とは合算しません。 その他は総額から表示した内訳を引いた残額です。原典の欠測を0にせず、内訳の欠けた地域・年度では図を作りません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "candidate-122",
            "title": "地方財政",
            "sectionTitle": "目的別と性質別の歳出を分けて見る",
            "href": "/themes/local-finance#theme-section-candidate-122"
          }
        ],
        "figures": [
          {
            "file": "municipal-budget-purpose.png",
            "alt": "目的別の歳出構成（高知県 高知市・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "municipal-budget-nature",
        "kind": "chart",
        "heading": "市区町村の性質別の歳出構成を比べる",
        "lead": "高知市を例に、人件費・扶助費・公債費とその他の支出が、歳出総額に占める割合を年度別に比較します。総額の大小とは分けて、内訳の変化を説明できます。",
        "note": "経費の性質で分類します。民生費や教育費などの目的別内訳とは合算しません。 その他は総額から表示した内訳を引いた残額です。原典の欠測を0にせず、内訳の欠けた地域・年度では図を作りません。",
        "themeRefs": [
          {
            "themeKey": "local-finance",
            "sectionKey": "candidate-122",
            "title": "地方財政",
            "sectionTitle": "目的別と性質別の歳出を分けて見る",
            "href": "/themes/local-finance#theme-section-candidate-122"
          }
        ],
        "figures": [
          {
            "file": "municipal-budget-nature.png",
            "alt": "性質別の歳出構成（高知県 高知市・2018〜2022年度）"
          }
        ]
      },
      {
        "id": "national-municipal-fiscal-strength",
        "kind": "chart",
        "heading": "市町村の財政力を全国地図で見る",
        "lead": "2022年度の財政力指数を全国の市町村・特別区で表示します。都道府県の平均では見えない地域差を確認し、詳しく比較する地域を選ぶための基礎資料にできます。",
        "note": "2022年度の財政力指数は基準財政収入額を基準財政需要額で除した値の過去3年平均です。県の財政と同じ順位表に混ぜず、欠測は0に置き換えません。指数だけでは財政の健全性や住民サービスの水準は判断できません。",
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
            "file": "national-municipal-fiscal-strength.png",
            "alt": "全国の市町村別 財政力指数（全国の市町村・特別区・2022年度）"
          }
        ]
      },
      {
        "id": "municipal-fiscal-strength",
        "kind": "chart",
        "heading": "県内の財政力を詳しく見る",
        "lead": "全国地図から高知県内へ範囲を絞り、同じ2022年度の財政力指数を市町村ごとに確認します。近隣自治体との位置関係を示し、決算説明や財政研修の比較資料に使えます。",
        "note": "2022年度の財政力指数は基準財政収入額を基準財政需要額で除した値の過去3年平均です。県の財政と同じ順位表に混ぜず、欠測は0に置き換えません。指数だけでは財政の健全性や住民サービスの水準は判断できません。",
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
            "file": "municipal-fiscal-strength.png",
            "alt": "市町村別の財政力指数（高知県内の市町村・2022年度）"
          }
        ]
      },
      {
        "id": "municipal-current-balance",
        "kind": "chart",
        "heading": "経常的な財政負担を比べる",
        "lead": "高知県の市といの町を例に、2022年度の経常収支比率を並べます。財政力指数とは別の図で確認し、経常的な経費に充てる一般財源の割合を説明できます。",
        "note": "値の大小を単独で財政の良し悪しに読み替えません。歳入の構成や行政の役割も確認してください。",
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
            "file": "municipal-current-balance.png",
            "alt": "2022年度の経常収支比率（2022年度）"
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
            "alt": "都道府県・市区町村の財政を推移と内訳で比べるデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
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
    "description": "一般診療所の実数と人口あたりの施設数を分け、全国の分布と県内の地域差を地図・グラフで確認できます。高齢人口の割合も別図で整理できます。",
    "included": [
      "一般診療所と人口構成（1,741地域・2020年・5,223行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "地域医療の現状整理に",
        "description": "全国の人口あたり診療所数を見渡してから県内を拡大し、近隣市町村との違いを説明できます。"
      },
      {
        "title": "医療・福祉担当者の研修に",
        "description": "診療所の実数と人口あたりの値、高齢人口の割合を別図で読み、施設の規模と人口構成の違いを学べます。"
      }
    ],
    "purchaseNotes": [
      "医療施設数と人口構成を別図にし、診療所数だけで医療の充足や不足を断定しません。",
      "人口0または欠測の自治体は比率を算出しません。診療所の実値0は欠測と区別して保持します。",
      "改訂データの対象は全国の市町村・特別区です。高知県内の地図・グラフは比較方法を示す作成例です。"
    ],
    "showcase": [
      {
        "id": "national-clinics-per-population",
        "kind": "chart",
        "heading": "人口あたりの診療所数を全国で見る",
        "lead": "2020年の一般診療所数を人口10万人あたりに換算し、全国の市町村・特別区を地図で比較します。人口規模の違いを揃え、地域医療の現状を整理するための基礎資料にできます。",
        "note": "施設の規模・診療科・自治体を越える受診は含まれず、医療アクセスの順位ではありません。",
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
            "file": "national-clinics-per-population.png",
            "alt": "全国の人口10万人あたり一般診療所数（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "clinics-per-population",
        "kind": "chart",
        "heading": "県内の人口あたり診療所数を詳しく見る",
        "lead": "全国地図から高知県内へ範囲を絞り、同じ2020年の一般診療所数を人口10万人あたりで比較します。近隣の市町村の位置関係と比率の違いを、地域医療の検討資料にまとめられます。",
        "note": "施設の規模・診療科・自治体を越える受診は含まれず、医療アクセスの順位ではありません。",
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
            "file": "clinics-per-population.png",
            "alt": "人口10万人あたりの一般診療所数（高知県内の市町村・2020年）"
          }
        ]
      },
      {
        "id": "municipal-clinic-count",
        "kind": "chart",
        "heading": "診療所の実数と人口あたりの値を分けて見る",
        "lead": "高知県の市といの町を例に、2020年の一般診療所数そのものを並べます。人口あたりの地図と見比べ、施設数の規模と人口に対する比率の違いを説明できます。",
        "note": "一般診療所の施設数であり、医師数・診療科・診療能力は示しません。施設数の多さだけで医療へのアクセスを判断できません。",
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
            "file": "municipal-clinic-count.png",
            "alt": "2020年の一般診療所数（2020年）"
          }
        ]
      },
      {
        "id": "elderly-population-share",
        "kind": "chart",
        "heading": "高齢人口の割合を比べる",
        "lead": "同じ高知県の市といの町について、2020年の総人口に占める65歳以上人口の割合を確認します。診療所の規模・人口あたりの施設数とは別の図で、人口構成を説明できます。",
        "note": "総人口には年齢不詳を含みます。年齢不詳を除く人口を分母とする公表割合とは一致しない場合があります。",
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
            "file": "elderly-population-share.png",
            "alt": "2020年の65歳以上人口の割合（2020年）"
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
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
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
    "description": "全国の市町村の教員1人あたり児童数を見渡し、県内の児童総数と1校あたりの規模を別々の図で比較できます。",
    "included": [
      "小学校の学校数・児童数・本務教員数（1,741地域・2024年度・5,223行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "教育委員会の現状説明に",
        "description": "全国の教員1人あたり児童数の地図から県内の棒グラフへ絞り、具体的な自治体の値を説明できます。"
      },
      {
        "title": "学校配置を考える基礎資料に",
        "description": "児童総数と1校あたりの規模を分けて比較し、総数だけでは見えない学校規模の違いを整理できます。"
      }
    ],
    "purchaseNotes": [
      "小学校の指標であり、義務教育学校など別区分の学校は含めません。",
      "学校数・本務教員数が0または欠測の自治体は比率を算出しません。分母が小さい地域では比率が大きく動くため、元の人数・学校数も確認してください。",
      "改訂データの対象は全国の市町村・特別区です。高知県内の地図・グラフは比較方法を示す作成例です。"
    ],
    "showcase": [
      {
        "id": "national-pupils-per-teacher",
        "kind": "chart",
        "heading": "教員1人あたりの児童数を全国で見る",
        "lead": "2024年度の小学校児童数を本務教員数で割り、全国の市町村・特別区を地図で比較します。学校の規模とは異なる教員配置の目安を、地域の位置関係とともに確認できます。",
        "note": "学級の人数や個々の教員の担当人数ではありません。教育の質を直接評価する指標には使えません。",
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
            "file": "national-pupils-per-teacher.png",
            "alt": "全国の本務教員1人あたり小学校児童数（全国の市町村・特別区・2024年度）"
          }
        ]
      },
      {
        "id": "pupils-per-teacher",
        "kind": "chart",
        "heading": "県内の教員1人あたり児童数を比べる",
        "lead": "高知県の市といの町を例に、2024年度の本務教員1人あたり小学校児童数を棒グラフで比較します。全国地図で確認した地域差を、具体的な値で説明できます。",
        "note": "学級の人数や個々の教員の担当人数ではありません。教育の質を直接評価する指標には使えません。",
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
            "file": "pupils-per-teacher.png",
            "alt": "本務教員1人あたりの小学校児童数（2024年度）"
          }
        ]
      },
      {
        "id": "municipal-pupil-count",
        "kind": "chart",
        "heading": "児童総数と教員あたりの値を分けて見る",
        "lead": "同じ高知県の市といの町について、2024年度の小学校児童数そのものを並べます。教員1人あたりのグラフと見比べ、児童の総数と配置の目安を分けて説明できます。",
        "note": "小学校児童の総数です。別区分の義務教育学校等を含めず、個々の学校の規模や教育の質を直接示しません。",
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
            "file": "municipal-pupil-count.png",
            "alt": "2024年度の小学校児童数（2024年度）"
          }
        ]
      },
      {
        "id": "pupils-per-school",
        "kind": "chart",
        "heading": "小学校の平均的な規模を地図で見る",
        "lead": "2024年度の児童数を小学校数で割り、高知県内の市町村ごとに比較します。児童総数や教員1人あたりの値とは分けて、学校配置を検討するための平均的な学校規模を説明できます。",
        "note": "学校間の規模差や通学距離は示しません。義務教育学校など別区分の学校を含めません。",
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
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327884421/rectangle_large_type_2_da2953b07fcf070247c692d68cd7c50b.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-07",
    "slug": "data-p-07-analysis-20261113",
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
    "title": "市区町村の住宅ストックと空き家割合を読むデータ集",
    "displayTitle": "市区町村の住宅ストックと空き家割合を読むデータ集",
    "description": "住宅・土地統計調査の総住宅数と空き家数から、八王子市・京都市の空き家割合の推移と直近の違いを確認できます。",
    "included": [
      "総住宅数・空き家数（1,741地域・2013〜2023年・10,446行、うち欠測3,926行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "住宅施策の現状整理に",
        "description": "同じ住宅調査年の総住宅数を分母にし、空き家割合の推移を自治体間で比較できます。"
      },
      {
        "title": "統計研修の比較資料に",
        "description": "割合の時系列と2023年の比較図を使い、標本調査の対象や欠測を確認しながら住宅ストックを読めます。"
      }
    ],
    "purchaseNotes": [
      "八王子市・京都市は利用可能な値を確認した作成例です。小規模自治体等には欠測が多いため全国地図は作成していません。",
      "標本調査の推計値であり、個別住宅の状態・売買需要や人口減少との因果関係は示しません。"
    ],
    "showcase": [
      {
        "id": "municipal-vacancy-share-trend",
        "kind": "chart",
        "heading": "空き家の割合の推移を比べる",
        "lead": "八王子市と京都市について、2013・2018・2023年の空き家数を総住宅数で割り、割合の推移を比較します。自治体の住宅ストックの現状整理に使えます。",
        "note": "標本調査による推計値であり標本誤差があります。空き家には種類の違いがあり、割合だけから人口減少との因果関係や個別物件の不動産需要を判断できません。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "housing-stock",
            "title": "暮らし・住まい",
            "sectionTitle": "住宅ストックは余っているか",
            "href": "/themes/living-housing#theme-section-housing-stock"
          }
        ],
        "figures": [
          {
            "file": "municipal-vacancy-share-trend.png",
            "alt": "総住宅数に占める空き家の割合（八王子市・京都市・2013〜2023年）"
          }
        ]
      },
      {
        "id": "municipal-vacancy-share-2023",
        "kind": "chart",
        "heading": "同じ2023年の空き家割合を並べる",
        "lead": "八王子市と京都市の2023年の空き家割合を棒グラフで比較します。推移の図と同じ分母を用い、直近の水準の違いを説明できます。",
        "note": "全国の全自治体を同じ精度で比べる図ではありません。総住宅数が0・欠測の場合は割合を算出せず、秘匿・欠測を0に置き換えません。不動産投資や売買需要の指標にはしません。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "housing-stock",
            "title": "暮らし・住まい",
            "sectionTitle": "住宅ストックは余っているか",
            "href": "/themes/living-housing#theme-section-housing-stock"
          }
        ],
        "figures": [
          {
            "file": "municipal-vacancy-share-2023.png",
            "alt": "2023年の空き家割合（2023年）"
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
            "alt": "市区町村の住宅ストックと空き家割合を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327888189/rectangle_large_type_2_bd106c7f2e77404a07abb96967e5f273.png?fit=bounds&quality=85&width=480"
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
    "description": "全国の市町村の卸売業・小売業の年間商品販売額を見渡し、県内の総額と住民1人あたり販売額を別々の図で比較できます。",
    "included": [
      "年間商品販売額と総人口（1,741地域・2020年・3,482行、うち欠測15行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "商業の現状説明に",
        "description": "全国の卸売業・小売業の販売額の分布から県内の比較へ絞り、地域の商業規模を地図・グラフで説明できます。"
      },
      {
        "title": "人口規模の異なる自治体の比較に",
        "description": "販売額の総額と住民1人あたりの値を分けて比較し、人口規模に対する商業集積の違いを整理できます。"
      }
    ],
    "purchaseNotes": [
      "卸売業を含む年間商品販売額であり、小売だけの市場規模や住民の消費額として解釈しません。",
      "販売額の欠測・秘匿を0に変換しません。実値0は保持し、人口0または欠測の場合は人口あたり比率を算出しません。",
      "改訂データの対象は全国の市町村・特別区です。高知県内の地図・グラフは比較方法を示す作成例です。",
      "年間商品販売額は卸売業・小売業の総額です。小売業だけの販売額や、地域住民の個人消費額とは区別してください。"
    ],
    "showcase": [
      {
        "id": "national-municipal-sales-scale",
        "kind": "chart",
        "heading": "卸売・小売の販売額を全国地図で見る",
        "lead": "2020年の卸売業・小売業の年間商品販売額を、全国の市町村・特別区で塗り分けます。総額の大きい地域がどこにあるかを確認し、商業の現状説明で比較する地域を選べます。",
        "note": "卸売業を含むため、地域住民の買い物額や小売店の集客力を直接示すものではありません。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-market-scale",
            "title": "商業と小売",
            "sectionTitle": "地域での買い物の市場規模や年間売り上げはどれくらい大きいか",
            "href": "/themes/retail-commerce#theme-section-retail-market-scale"
          }
        ],
        "figures": [
          {
            "file": "national-municipal-sales-scale.png",
            "alt": "全国の卸売業・小売業の年間商品販売額（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "municipal-sales-scale",
        "kind": "chart",
        "heading": "県内の販売額の規模を比べる",
        "lead": "全国地図で見た地域から高知県の市といの町を取り上げ、2020年の卸売業・小売業の年間商品販売額を棒グラフで比較します。総額の規模を、具体的な自治体の値で説明できます。",
        "note": "卸売業を含むため、地域住民の買い物額や小売店の集客力を直接示すものではありません。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-market-scale",
            "title": "商業と小売",
            "sectionTitle": "地域での買い物の市場規模や年間売り上げはどれくらい大きいか",
            "href": "/themes/retail-commerce#theme-section-retail-market-scale"
          }
        ],
        "figures": [
          {
            "file": "municipal-sales-scale.png",
            "alt": "2020年の卸売業・小売業の年間商品販売額（2020年）"
          }
        ]
      },
      {
        "id": "municipal-sales-per-resident",
        "kind": "chart",
        "heading": "人口あたりの販売額を県内地図で比べる",
        "lead": "同じ2020年の卸売業・小売業の年間商品販売額を住民人口で割り、高知県内の市町村を塗り分けます。総額の棒グラフと見比べ、商業の規模と人口規模に対する比率を分けて説明できます。",
        "note": "住民1人の消費額ではありません。卸売業、法人間取引や自治体外からの需要なども含みます。人口0・欠測の場合は比率を算出せず、販売額の秘匿・欠測を0に置き換えません。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-market-scale",
            "title": "商業と小売",
            "sectionTitle": "地域での買い物の市場規模や年間売り上げはどれくらい大きいか",
            "href": "/themes/retail-commerce#theme-section-retail-market-scale"
          }
        ],
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
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327892069/rectangle_large_type_2_8a0b3ef48c7ce4ae9be9ceed6aed7fe5.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-09",
    "slug": "data-p-09-analysis-20261113",
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
    "title": "製造品出荷額等の規模と推移を読むデータ集",
    "displayTitle": "製造品出荷額等の規模と推移を読むデータ集",
    "description": "2023年の製造品出荷額等の地域比較と2022〜2023年の推移を分け、製造業の名目金額の規模を説明できます。",
    "included": [
      "製造品出荷額等（47地域・2022〜2023年・94行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "産業振興の現状説明に",
        "description": "2023年の製造品出荷額等の分布から比較地域を選び、名目金額の規模を説明できます。"
      },
      {
        "title": "地域経済の比較資料に",
        "description": "愛知県・東京都の2022〜2023年の値を比較し、同じ調査対象の金額の変化を整理できます。"
      }
    ],
    "purchaseNotes": [
      "この改訂分析では出荷額の規模と推移を扱います。従業者数との結合や生産性の計算は行っていません。"
    ],
    "showcase": [
      {
        "id": "prefecture-manufacturing-scale-2023",
        "kind": "chart",
        "heading": "2023年の製造品出荷額等の規模を比べる",
        "lead": "2023年の製造品出荷額等を47都道府県の棒グラフで比較します。名目金額の規模の違いを、産業振興の説明資料にできます。",
        "note": "従業者4人以上の事業所の名目金額です。付加価値・利益や生産性ではありません。",
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
            "file": "prefecture-manufacturing-scale-2023.png",
            "alt": "2023年の製造品出荷額等（2023年）"
          }
        ]
      },
      {
        "id": "prefecture-manufacturing-trend",
        "kind": "chart",
        "heading": "2022〜2023年の名目金額の推移を見る",
        "lead": "愛知県・東京都の2022・2023年の製造品出荷額等を折れ線で比較します。地域間の規模の違いと、同じ地域の2年の変化を分けて確認できます。",
        "note": "比較期間は2年です。長期傾向や変化の原因を断定せず、物価変動を含む名目金額として読みます。従業者あたり出荷額や付加価値を示す図ではありません。",
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
            "file": "prefecture-manufacturing-trend.png",
            "alt": "製造品出荷額等の推移（愛知県・東京都・2022〜2023年）"
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
            "alt": "製造品出荷額等の規模と推移を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327896437/rectangle_large_type_2_98a3986f90264806883eb5d2b6ade8b4.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-10",
    "slug": "data-p-10-analysis-20261113",
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
    "title": "市区町村のごみ計画収集人口を読むデータ集",
    "displayTitle": "市区町村のごみ計画収集人口を読むデータ集",
    "description": "ごみ収集区域の人口を全国地図で確認し、豊田市・大阪市の年度別の推移を比較できます。災害被害の実績とは分けて生活インフラの対象規模を整理します。",
    "included": [
      "ごみ計画収集人口（1,741地域・2015〜2023年度・5,223行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "廃棄物行政の現状説明に",
        "description": "全国のごみ計画収集人口の分布から比較地域を選び、行政サービスの対象規模を説明できます。"
      },
      {
        "title": "自治体サービスの推移を整理するときに",
        "description": "豊田市・大阪市の2015・2020・2023年度の人口を並べ、収集区域の対象人数の変化を確認できます。"
      }
    ],
    "purchaseNotes": [
      "取得範囲は全国1741自治体で、豊田市・大阪市は推移の作成例です。",
      "各年度10月1日の住民基本台帳による人口です。国勢調査人口で割った普及率や、災害の将来危険度を示す図にはしません。"
    ],
    "showcase": [
      {
        "id": "national-garbage-collection-population",
        "kind": "chart",
        "heading": "ごみ収集区域の人口を全国で見る",
        "lead": "2023年度のごみ計画収集人口を全国の市町村・特別区の地図で確認します。収集区域の対象人数の規模を示し、廃棄物行政の現状説明に使えます。",
        "note": "収集区域内の人口であり、ごみ排出量や収集頻度・サービスの質は示しません。国勢調査人口とは定義・時点が異なるため、人口比の普及率は算出しません。",
        "themeRefs": [
          {
            "themeKey": "waste-recycling",
            "sectionKey": "waste-disposal",
            "title": "ごみ・リサイクル",
            "sectionTitle": "ごみの排出・処分量はどこで多いか",
            "href": "/themes/waste-recycling#theme-section-waste-disposal"
          }
        ],
        "figures": [
          {
            "file": "national-garbage-collection-population.png",
            "alt": "2023年度のごみ計画収集人口（全国の市町村・特別区・2023年度）"
          }
        ]
      },
      {
        "id": "municipal-garbage-collection-trend",
        "kind": "chart",
        "heading": "収集区域の人口の推移を比べる",
        "lead": "豊田市と大阪市について、2015・2020・2023年度のごみ計画収集人口を折れ線で比較します。サービスの対象人数の変化を説明する基礎資料にできます。",
        "note": "ごみ収集区域の対象人口の推移です。人口の変化だけからごみ処理能力の過不足やサービス改善の効果を判断できません。",
        "themeRefs": [
          {
            "themeKey": "waste-recycling",
            "sectionKey": "waste-disposal",
            "title": "ごみ・リサイクル",
            "sectionTitle": "ごみの排出・処分量はどこで多いか",
            "href": "/themes/waste-recycling#theme-section-waste-disposal"
          }
        ],
        "figures": [
          {
            "file": "municipal-garbage-collection-trend.png",
            "alt": "ごみ計画収集人口の推移（豊田市・大阪市・2015〜2023年度）"
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
            "alt": "市区町村のごみ計画収集人口を読むデータ集のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/327904763/rectangle_large_type_2_9fee30f49a8956331f44c2f3ccfcf7ff.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-14",
    "slug": "data-p-14-analysis-20261113",
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
    "title": "県庁所在市の牛肉支出と購入量の変化",
    "displayTitle": "県庁所在市の牛肉支出と購入量の変化",
    "description": "札幌市と京都市の二人以上世帯について、牛肉への年間支出額と購入量を2022〜2024年で比較します。",
    "included": [
      "県庁所在市の牛肉支出額・購入量（47地域・2022〜2024年・282行）",
      "CSV・Excel、分析結果CSV、共通型の図表PNG、出典・計算方法・取得原票"
    ],
    "useCases": [
      {
        "title": "金額と量の動きを分けて説明する",
        "description": "同じ都市・年・品目で支出額と購入量を別々の図にし、金額だけでは分からない違いを確認できます。"
      }
    ],
    "purchaseNotes": [
      "対象は県庁所在市の二人以上世帯です。全市区町村や単身世帯、県全体の市場規模を示しません。単年の標本変動があり、支出額の変化を購入量や価格だけの変化とはみなしません。",
      "各年の値を示し、複数年平均や将来予測とは区別します。"
    ],
    "showcase": [
      {
        "id": "beef-expenditure-trend",
        "kind": "chart",
        "heading": "牛肉に使う金額はどう変わったか",
        "lead": "札幌市と京都市の年間支出額を同じ期間で比べます。",
        "note": "対象は県庁所在市の二人以上世帯です。全市区町村や単身世帯、県全体の市場規模を示しません。単年の標本変動があり、支出額の変化を購入量や価格だけの変化とはみなしません。",
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
            "file": "beef-expenditure-trend.png",
            "alt": "牛肉に使う金額はどう変わったか（札幌市・京都市の二人以上世帯・2022〜2024年）"
          }
        ]
      },
      {
        "id": "beef-quantity-trend",
        "kind": "chart",
        "heading": "牛肉を買う量はどう変わったか",
        "lead": "同じ2都市の購入量を示し、支出額の図と見比べます。",
        "note": "対象は県庁所在市の二人以上世帯です。全市区町村や単身世帯、県全体の市場規模を示しません。単年の標本変動があり、支出額の変化を購入量や価格だけの変化とはみなしません。",
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
            "file": "beef-quantity-trend.png",
            "alt": "牛肉を買う量はどう変わったか（札幌市・京都市の二人以上世帯・2022〜2024年）"
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
            "alt": "県庁所在市の牛肉支出と購入量の変化のCSV見本"
          }
        ]
      }
    ],
    "showcaseNote": "分析の図は追加ファイルに同梱する観測値から計算しています。既存の固定版とは対象地域・基準年・収録形式が異なるため、各図の条件と出典を確認してください。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328109605/rectangle_large_type_2_3b2aa0eb69bbac8716e24beaae2009b7.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-11",
    "slug": "data-p-11-analysis-20261113",
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
    "title": "人口・世帯の地域分析 図表素材集",
    "displayTitle": "人口・世帯の地域分析 図表素材集",
    "description": "全国の市区町村を塗り分けた地図と世帯の推移を、資料や記事に使える共通サイズの図で収録します。人口・世帯パックで検証した値と図をそのまま使います。",
    "included": [
      "共通型の図表PNG 3枚",
      "元商品の版・出典・計算方法・利用条件"
    ],
    "useCases": [
      {
        "title": "地域の特徴を地図で説明する",
        "description": "人口の増減や高齢単身世帯の割合を全国の市区町村地図で比べられます。"
      },
      {
        "title": "世帯構成の変化を伝える",
        "description": "高齢者世帯の推移を示す折れ線図を、出典・計算条件と一緒に資料へ掲載できます。"
      }
    ],
    "purchaseNotes": [
      "分析の追加ファイルはPNG素材集です。公開中の商品に含まれるSVG・PowerPoint・PDFとは構成が異なります。",
      "元商品の版・対象年・地域・欠測・利用条件を引き継ぎます。",
      "図の対象・年・単位・欠測条件と利用条件を確認してご利用ください。"
    ],
    "showcase": [
      {
        "id": "p-01-national-municipality-change",
        "kind": "chart",
        "heading": "人口が増えた地域・減った地域を全国で見る",
        "lead": "2000〜2020年の人口増減率を全国の市区町村で塗り分けます。都道府県の平均では見えない、都市周辺とそれ以外の地域の違いを確認できます。",
        "note": "市町村合併を調整した系列を使用し、政令指定都市は市単位、東京都の特別区は区単位で比較します。基準年が0・欠測の場合は算出せず、離島は別位置に表示します。",
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
            "file": "p-01-national-municipality-change.png",
            "alt": "全国の市区町村別 人口増減率（全国の市町村・特別区・2000〜2020年）"
          }
        ]
      },
      {
        "id": "p-01-elderly-single-household-map",
        "kind": "chart",
        "heading": "高齢単独世帯の割合を全国の市区町村で比べる",
        "lead": "2020年の一般世帯に占める高齢単独世帯の割合を全国地図で確認できます。地域の世帯構成を比較する基礎資料として使えます。",
        "note": "高齢夫婦のみの世帯は夫65歳以上・妻60歳以上です。割合の分母は一般世帯数で、65歳以上人口ではありません。 世帯構成だけでは、見守りや介護の必要性は判断できません。",
        "themeRefs": [
          {
            "themeKey": "aging-society",
            "sectionKey": "elderly-households",
            "title": "少子高齢化",
            "sectionTitle": "高齢者はどの世帯で暮らすか",
            "href": "/themes/aging-society#theme-section-elderly-households"
          }
        ],
        "figures": [
          {
            "file": "p-01-elderly-single-household-map.png",
            "alt": "一般世帯に占める高齢単独世帯の割合（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "p-01-elderly-household-trend",
        "kind": "chart",
        "heading": "高齢単独世帯と高齢夫婦世帯の変化を見る",
        "lead": "一般世帯に占める高齢単独世帯と高齢夫婦のみの世帯の割合を、同じ分母で比較します。見本は高知県です。",
        "note": "高齢夫婦のみの世帯は夫65歳以上・妻60歳以上です。割合の分母は一般世帯数で、65歳以上人口ではありません。",
        "themeRefs": [
          {
            "themeKey": "aging-society",
            "sectionKey": "elderly-households",
            "title": "少子高齢化",
            "sectionTitle": "高齢者はどの世帯で暮らすか",
            "href": "/themes/aging-society#theme-section-elderly-households"
          }
        ],
        "figures": [
          {
            "file": "p-01-elderly-household-trend.png",
            "alt": "一般世帯に占める高齢世帯の割合（高知県・2000〜2020年）"
          }
        ]
      }
    ],
    "showcaseNote": "分析の追加ファイルは元商品の同じ版の図・出典・計算条件を引き継ぎます。既存の固定版とは別ファイルです。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328096609/rectangle_large_type_2_d9ab6507430978c166503a1f2248f9ef.png?fit=bounds&quality=85&width=480"
  },
  {
    "id": "P-12",
    "slug": "data-p-12-analysis-20261113",
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
    "title": "地域分析データ 総合集",
    "displayTitle": "地域分析データ 総合集",
    "description": "人口、財政、医療、教育、商業などの分析データを、検証済みの商品別ZIPでまとめます。分野に合う地域・年・単位を保ち、必要なデータと図を選んで利用できます。",
    "included": [
      "分析データ 11商品分（各商品のCSV・Excel・図表・原票をZIPで同梱）",
      "元商品の版・出典・計算方法・利用条件"
    ],
    "useCases": [
      {
        "title": "複数分野の地域資料を作る",
        "description": "市区町村の人口・公共サービス・産業の図を、共通のサイズで資料に並べられます。"
      },
      {
        "title": "必要な分野から分析を始める",
        "description": "各商品のCSV・Excelと計算方法を使い、出典と条件をたどりながら比較できます。"
      }
    ],
    "purchaseNotes": [
      "分析の追加ファイルは、列挙した版の分析データをまとめたものです。販売中の固定版の収録内容とは異なります。",
      "対象地域・基準年・調査定義は分野ごとに異なります。異なる年や対象の値を無条件に結合しないでください。",
      "元商品の利用条件を引き継ぎます。図の対象・年・単位・欠測条件と利用条件を確認してご利用ください。"
    ],
    "showcase": [
      {
        "id": "p-01-national-municipality-change",
        "kind": "chart",
        "heading": "人口が増えた地域・減った地域を全国で見る",
        "lead": "2000〜2020年の人口増減率を全国の市区町村で塗り分けます。都道府県の平均では見えない、都市周辺とそれ以外の地域の違いを確認できます。",
        "note": "市町村合併を調整した系列を使用し、政令指定都市は市単位、東京都の特別区は区単位で比較します。基準年が0・欠測の場合は算出せず、離島は別位置に表示します。",
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
            "file": "p-01-national-municipality-change.png",
            "alt": "全国の市区町村別 人口増減率（全国の市町村・特別区・2000〜2020年）"
          }
        ]
      },
      {
        "id": "p-02-national-municipal-outcommuters",
        "kind": "chart",
        "heading": "他市区町村へ通勤する人数を全国で見る",
        "lead": "2020年に他市区町村へ通勤した人数を全国地図で確認します。人数の大きい地域を位置関係とともに示し、詳しく比較する地域を選べます。",
        "note": "通勤者の実人数であり、域外通勤の割合や移動距離は示しません。総人口を労働供給とみなしたり、県別求人倍率を自治体へ割り振ったりしません。",
        "themeRefs": [
          {
            "themeKey": "labor-mobility",
            "sectionKey": "regional-commute-and-daytime-population",
            "title": "人材流動性・雇用環境",
            "sectionTitle": "職住近接や他市区町村への通勤など就業者の移動実態はどうなっているか",
            "href": "/themes/labor-mobility#theme-section-regional-commute-and-daytime-population"
          }
        ],
        "figures": [
          {
            "file": "p-02-national-municipal-outcommuters.png",
            "alt": "全国の他市区町村への通勤者数（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "p-03-tokyo-overnight-stays-trend",
        "kind": "chart",
        "heading": "延べ宿泊者数の変化を見る",
        "lead": "東京都について2019〜2024年の延べ宿泊者数を確認します。人泊の合計を折れ線で示し、宿泊需要の規模の変化を説明できます。",
        "note": "延べ人数であり、実際に訪れた人の数ではありません。観光目的と業務目的は識別できず、従業者数10人未満の施設を含みません。",
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
            "file": "p-03-tokyo-overnight-stays-trend.png",
            "alt": "東京都の延べ宿泊者数（東京都・2019〜2024年）"
          }
        ]
      },
      {
        "id": "p-04-national-municipal-fiscal-strength",
        "kind": "chart",
        "heading": "市町村の財政力を全国地図で見る",
        "lead": "2022年度の財政力指数を全国の市町村・特別区で表示します。都道府県の平均では見えない地域差を確認し、詳しく比較する地域を選ぶための基礎資料にできます。",
        "note": "2022年度の財政力指数は基準財政収入額を基準財政需要額で除した値の過去3年平均です。県の財政と同じ順位表に混ぜず、欠測は0に置き換えません。指数だけでは財政の健全性や住民サービスの水準は判断できません。",
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
            "file": "p-04-national-municipal-fiscal-strength.png",
            "alt": "全国の市町村別 財政力指数（全国の市町村・特別区・2022年度）"
          }
        ]
      },
      {
        "id": "p-05-national-clinics-per-population",
        "kind": "chart",
        "heading": "人口あたりの診療所数を全国で見る",
        "lead": "2020年の一般診療所数を人口10万人あたりに換算し、全国の市町村・特別区を地図で比較します。人口規模の違いを揃え、地域医療の現状を整理するための基礎資料にできます。",
        "note": "施設の規模・診療科・自治体を越える受診は含まれず、医療アクセスの順位ではありません。",
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
            "file": "p-05-national-clinics-per-population.png",
            "alt": "全国の人口10万人あたり一般診療所数（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "p-06-national-pupils-per-teacher",
        "kind": "chart",
        "heading": "教員1人あたりの児童数を全国で見る",
        "lead": "2024年度の小学校児童数を本務教員数で割り、全国の市町村・特別区を地図で比較します。学校の規模とは異なる教員配置の目安を、地域の位置関係とともに確認できます。",
        "note": "学級の人数や個々の教員の担当人数ではありません。教育の質を直接評価する指標には使えません。",
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
            "file": "p-06-national-pupils-per-teacher.png",
            "alt": "全国の本務教員1人あたり小学校児童数（全国の市町村・特別区・2024年度）"
          }
        ]
      },
      {
        "id": "p-07-municipal-vacancy-share-trend",
        "kind": "chart",
        "heading": "空き家の割合の推移を比べる",
        "lead": "八王子市と京都市について、2013・2018・2023年の空き家数を総住宅数で割り、割合の推移を比較します。自治体の住宅ストックの現状整理に使えます。",
        "note": "標本調査による推計値であり標本誤差があります。空き家には種類の違いがあり、割合だけから人口減少との因果関係や個別物件の不動産需要を判断できません。",
        "themeRefs": [
          {
            "themeKey": "living-housing",
            "sectionKey": "housing-stock",
            "title": "暮らし・住まい",
            "sectionTitle": "住宅ストックは余っているか",
            "href": "/themes/living-housing#theme-section-housing-stock"
          }
        ],
        "figures": [
          {
            "file": "p-07-municipal-vacancy-share-trend.png",
            "alt": "総住宅数に占める空き家の割合（八王子市・京都市・2013〜2023年）"
          }
        ]
      },
      {
        "id": "p-08-national-municipal-sales-scale",
        "kind": "chart",
        "heading": "卸売・小売の販売額を全国地図で見る",
        "lead": "2020年の卸売業・小売業の年間商品販売額を、全国の市町村・特別区で塗り分けます。総額の大きい地域がどこにあるかを確認し、商業の現状説明で比較する地域を選べます。",
        "note": "卸売業を含むため、地域住民の買い物額や小売店の集客力を直接示すものではありません。",
        "themeRefs": [
          {
            "themeKey": "retail-commerce",
            "sectionKey": "retail-market-scale",
            "title": "商業と小売",
            "sectionTitle": "地域での買い物の市場規模や年間売り上げはどれくらい大きいか",
            "href": "/themes/retail-commerce#theme-section-retail-market-scale"
          }
        ],
        "figures": [
          {
            "file": "p-08-national-municipal-sales-scale.png",
            "alt": "全国の卸売業・小売業の年間商品販売額（全国の市町村・特別区・2020年）"
          }
        ]
      },
      {
        "id": "p-09-prefecture-manufacturing-scale-2023",
        "kind": "chart",
        "heading": "2023年の製造品出荷額等の規模を比べる",
        "lead": "2023年の製造品出荷額等を47都道府県の棒グラフで比較します。名目金額の規模の違いを、産業振興の説明資料にできます。",
        "note": "従業者4人以上の事業所の名目金額です。付加価値・利益や生産性ではありません。",
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
            "file": "p-09-prefecture-manufacturing-scale-2023.png",
            "alt": "2023年の製造品出荷額等（2023年）"
          }
        ]
      },
      {
        "id": "p-10-national-garbage-collection-population",
        "kind": "chart",
        "heading": "ごみ収集区域の人口を全国で見る",
        "lead": "2023年度のごみ計画収集人口を全国の市町村・特別区の地図で確認します。収集区域の対象人数の規模を示し、廃棄物行政の現状説明に使えます。",
        "note": "収集区域内の人口であり、ごみ排出量や収集頻度・サービスの質は示しません。国勢調査人口とは定義・時点が異なるため、人口比の普及率は算出しません。",
        "themeRefs": [
          {
            "themeKey": "waste-recycling",
            "sectionKey": "waste-disposal",
            "title": "ごみ・リサイクル",
            "sectionTitle": "ごみの排出・処分量はどこで多いか",
            "href": "/themes/waste-recycling#theme-section-waste-disposal"
          }
        ],
        "figures": [
          {
            "file": "p-10-national-garbage-collection-population.png",
            "alt": "2023年度のごみ計画収集人口（全国の市町村・特別区・2023年度）"
          }
        ]
      },
      {
        "id": "p-14-beef-expenditure-trend",
        "kind": "chart",
        "heading": "牛肉に使う金額はどう変わったか",
        "lead": "札幌市と京都市の年間支出額を同じ期間で比べます。",
        "note": "対象は県庁所在市の二人以上世帯です。全市区町村や単身世帯、県全体の市場規模を示しません。単年の標本変動があり、支出額の変化を購入量や価格だけの変化とはみなしません。",
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
            "file": "p-14-beef-expenditure-trend.png",
            "alt": "牛肉に使う金額はどう変わったか（札幌市・京都市の二人以上世帯・2022〜2024年）"
          }
        ]
      }
    ],
    "showcaseNote": "分析の追加ファイルは元商品の同じ版の図・出典・計算条件を引き継ぎます。既存の固定版とは別ファイルです。",
    "coverImageUrl": "https://assets.st-note.com/production/uploads/images/328108626/rectangle_large_type_2_a20b7efd70ea5453e06527827d8cc689.png?fit=bounds&quality=85&width=480"
  }
];
