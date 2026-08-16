import type { ThemeCatalog } from "./types";

export const CONSUMER_PRICES_CATALOG: ThemeCatalog = {
  "key": "consumer-prices",
  "title": "物価・消費",
  "description": "都道府県別の消費者物価地域差指数を食料・住居・光熱水道など品目別にチャートとランキングで比較。物価プロファイル・ヒートマップで生活コストの地域差を47都道府県で確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "総合",
      "role": "primary"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "家賃除く総合",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "食料",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "住居",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-utilities",
      "shortLabel": "光熱・水道",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-education",
      "shortLabel": "教育",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-culture-recreation",
      "shortLabel": "教養娯楽",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-transport-communication",
      "shortLabel": "交通・通信",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-healthcare",
      "shortLabel": "保健医療",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-clothing-footwear",
      "shortLabel": "被服",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-furniture-household",
      "shortLabel": "家具",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-miscellaneous",
      "shortLabel": "諸雑費",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-cpi-profile",
      "componentType": "cpi-profile",
      "title": "物価プロファイル",
      "componentProps": {
        "statsDataId": "0003441258",
        "excludeCodes": [
          "00010",
          "00120"
        ]
      },
      "sourceName": "小売物価統計調査（構造編）",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "総合",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-cpi-living-cost",
      "componentType": "line-chart",
      "title": "生活費の地域差指数の推移（食料・住居・光熱水道）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04416"
          },
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04417"
          },
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04418"
          }
        ],
        "labels": [
          "食料",
          "住居",
          "光熱・水道"
        ],
        "seriesColors": [
          "count",
          "danger",
          "population"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "生活費",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-cpi-heatmap",
      "componentType": "cpi-heatmap",
      "title": "物価推移ヒートマップ",
      "componentProps": {
        "statsDataId": "0003441258",
        "excludeCodes": [
          "00010",
          "00120"
        ]
      },
      "sourceName": "小売物価統計調査（構造編）",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "総合",
      "sortOrder": 10
    },
    {
      "componentKey": "md-cpi-discussion",
      "componentType": "markdown-section",
      "title": "データの読み解き — 物価格差の構造的要因",
      "componentProps": {
        "subtitle": "白書から見る、なぜ東京と鹿児島で物価水準が違うのか",
        "markdown": "消費者物価地域差指数（全国平均=100）は、2023年時点で最も高い東京都が104.5、最も低い鹿児島県が95.9と、約9ポイントの開きがある。38府県が全国平均を下回り、上位は東京・神奈川といった首都圏、下位は南九州が並ぶ。ただし「総合指数の上位／下位」だけを見ても実態は掴めない。本稿では各種白書のデータを基に、地域差の構造を読み解く。\n\n### 現状 — マクロは「3年連続で前年比2%超の物価上昇」局面\n\n2024年度時点で日本の消費者物価は、デフレ脱却後の新たな局面に入っている。CPI総合は2025年1月に前年同月比4.0%に達し、1991年以来となる「3年連続で前年比2%以上の上昇」を記録した。米類は2025年5月に前年比101.7%（2倍超）まで上昇し、調理食品や外食価格にも波及している。\n\n背景には3つの圧力が重なっている。第一に輸入原材料費の上昇と既往の円安、第二に物流・建設・サービス分野の深刻な人手不足に伴う人件費の販売価格への転嫁、第三に夏の高温による農作物の生育不良など気候要因である。家計の予想物価上昇率も高止まりしており、1年後に10%以上の物価上昇を予想する世帯が約半数を占める。\n\n### 都道府県差の構造 — 「費目別寄与度」が地域格差を作る\n\n地域差を分解すると、地域ごとに「どの費目が押し上げているか」が大きく異なることが見えてくる。\n\n**(1) 住居費 — 東京圏を押し上げる最大要因**\n\n首都圏（特に東京都）の物価を全国平均より高くしている最大要因は「住居」費目である。都市部への人口流入による需要増と、地価・建築費の高騰が家賃水準を押し上げ、家賃比較だけで全国平均との差の大半が説明できる構造になっている。\n\n**(2) 食料費 — 沖縄・離島で重い負担**\n\n沖縄県では「食料」費目が全国平均との差を強くプラス側に振らせている。離島ゆえの輸送コストや流通構造が小売価格に反映され、家計に占める食料支出の比重を相対的に重くしている。\n\n**(3) 光熱・水道費 — 北海道・東北・中国地方で押し上げ**\n\n寒冷地や山間地域では「光熱・水道」費目の寄与が大きく、冬季の暖房需要やインフラ維持コストが物価を押し上げている。北海道・東北・中国地方の指数を見るときは、この寄与を切り分けることが重要である。\n\n### 政策的含意 — 「賃上げを起点とした成長型経済」への移行\n\n政府は、デフレ時代の「コストカット型経済」から脱却し、物価上昇を上回る賃上げが定着する**「賃上げを起点とした成長型経済」**への移行を中核政策に据えている。2029年度までの5年間で、実質賃金1%程度の上昇を新たなノルム（社会規範）として定着させることを目標としている。\n\n足元では、名目賃金は2024年度に前年度比3.0%増と33年ぶりの伸びを記録した一方、物価高により実質賃金は0.0%の横ばいにとどまる。電気・ガス料金や燃料油価格の激変緩和措置で家計負担を軽減しつつ、中小企業の労務費の適切な価格転嫁、生産性向上、事業承継支援を総動員する方針である。\n\n### 読み解きのコツ\n\n都道府県の物価ランキングを読むときは、**(a) 総合指数の順位**だけでなく、**(b) 費目別寄与度**を必ず併せて確認することが本質である。\n\n総合指数が100未満の地域でも、特定費目（食料や燃料）が突出して高ければ、生活必需品への支出割合が高い「生活の質の格差」として家計を直撃している。逆に総合指数が高い地域でも、住居費の寄与が大半を占めるなら、賃貸需要の強さの裏返しでもある。\n\nまた、CPI は固定された品目で計算される統計指標であるため、実際の家計が支払う「購入単価」とは乖離する点に注意が必要だ。消費者は安価なドラッグストアへのシフト、牛肉から鶏肉への代替、中古品の活用といった節約行動でコスト上昇を吸収しており、統計の物価上昇率より家計実感の負担増のほうが軽くなることもあれば重くなることもある。47都道府県の物価指数を比較する際には、順位そのものよりも、**「どの費目が地域差を作っているか」を構造で説明できるか**が、データの読み解きとして本質的である。",
        "sources": [
          {
            "label": "経済財政白書 (令和7年度版)",
            "url": "https://www5.cao.go.jp/keizai3/whitepaper.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "小売物価統計調査 — 総務省統計局",
            "url": "https://www.stat.go.jp/data/kouri/index.html"
          }
        ]
      },
      "sourceName": "経済財政白書 (令和7年度版) / 男女共同参画白書 (令和7年版) / 小売物価統計調査 — 総務省統計局",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 10
    },
    {
      "componentKey": "md-cpi-related-topics",
      "componentType": "markdown-section",
      "title": "関連トピック・中長期課題",
      "componentProps": {
        "subtitle": "賃金と物価の好循環から GX 投資・物流 2030 年問題まで",
        "markdown": "消費者物価は、賃金・エネルギー・労働力・国際収支といった複数の領域が連動して形成される。各種白書から、特に重要度の高い4つの論点を整理する。\n\n### 1. 「賃金と物価の好循環」の定着と実質賃金\n\n最大の中長期課題は、物価上昇を上回る賃上げを社会規範として定着させることである。政府は2029年度までの5年間で、持続的・安定的な物価上昇の下、**実質賃金で1%程度の上昇**を新たなノルムとして定着させることを目指している。\n\n足元の数字を見ると、2024年度の名目賃金（現金給与総額）は前年度比3.0%増と33年ぶりの高い伸びとなった一方、物価高が同水準で進行したため、実質賃金は0.0%の横ばいにとどまっている。賃上げが企業規模・地域・職種で広く定着するかが、デフレ脱却を決定づける鍵となる。\n\n### 2. 食料・エネルギー価格の変動と GX 投資\n\n輸入原材料や気候変動に伴う食料品価格の高騰が家計を継続的に圧迫している。象徴的なのが米類で、2025年5月には前年比101.7%（2倍超）の上昇を記録した。\n\nエネルギー面では、政府は今後10年間で**150兆円超の官民GX投資**を通じて、化石燃料依存からの脱却と安定供給の確保を図る見通しを示している。GX投資の進捗は、電気・都市ガス料金の長期トレンドを左右する重要要素となる。\n\n### 3. 労働力不足と物流「2030年問題」\n\n人手不足は物価への構造的押し上げ圧力となっている。2024年4月から始まったトラックドライバーの時間外労働規制（いわゆる「2024年問題」）に続き、対策を講じない場合、物流分野の輸送能力は**2030年度に約34%不足**すると試算されている。\n\nこの構造的な労務費上昇は、宅配料金や流通コストを通じて、最終的には消費者物価に転嫁されていく。建設・介護・小売など労働集約型サービスでも同様の圧力が継続する見通しである。\n\n### 4. デジタル赤字と円安圧力\n\nデジタル化の進展に伴い、海外大手プラットフォーマーへのクラウド・広告・ライセンス支払が急増している。2024年のデジタル関連サービス収支は**6.8兆円の赤字**に達した。\n\nこの構造的な経常赤字は中長期的な円安圧力となり、輸入物価を通じて消費者物価を下支えするリスク要因として注視されている。デジタル赤字を縮小するための国内クラウド・SaaS産業の育成や輸出競争力の強化が、間接的な物価対策としても重要性を増している。\n\n### 5. 中小企業の価格転嫁と地域格差\n\n物価上昇に賃金を追随させるには、特に中小企業における労務費・原材料費の適切な価格転嫁が不可欠である。政府は労務費転嫁ガイドラインの周知徹底、価格交渉支援、地方交付税の増額（令和7年度補正予算で2,000億円増額交付）を通じて、地方でも価格転嫁が進む環境整備を進めている。地域別の物価上昇率と賃上げ率の格差は、今後の地域経済の活力を測る重要指標となる。",
        "sources": [
          {
            "label": "経済財政白書 (令和7年度版)",
            "url": "https://www5.cao.go.jp/keizai3/whitepaper.html"
          },
          {
            "label": "GX 推進戦略 — 経済産業省",
            "url": "https://www.meti.go.jp/policy/energy_environment/global_warming/GX/"
          },
          {
            "label": "持続可能な物流の実現に向けた検討会 (国土交通省)",
            "url": "https://www.mlit.go.jp/seisakutokatsu/freight/seisakutokatsu_freight_tk1_000204.html"
          },
          {
            "label": "国際収支統計 — 財務省",
            "url": "https://www.mof.go.jp/policy/international_policy/reference/balance_of_payments/index.htm"
          }
        ]
      },
      "sourceName": "経済財政白書 (令和7年度版) / GX 推進戦略 — 経済産業省 / 持続可能な物流の実現に向けた検討会 (国土交通省) / 国際収支統計 — 財務省",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 20
    },
    {
      "componentKey": "md-cpi-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "subtitle": "消費者物価について読者が気になる 7 問",
        "markdown": "### Q1: 消費者物価地域差指数って何?\n\n消費者物価地域差指数とは、全国平均を100として、各都道府県の物価水準を比較した指標。2023年時点で東京都が104.5で最も高く、鹿児島県が95.9で最も低い。38府県が全国平均を下回り、地域間で約9ポイントの差がある。住居・食料・光熱水道など費目別寄与度を見ることで、地域差の構造が読み解ける。(出典: 小売物価統計調査)\n\n### Q2: なぜ東京の物価が高いの?\n\n首都圏（特に東京都）の物価を押し上げている最大要因は住居費である。都市部への人口流入による需要増と、地価・建築費の高騰が家賃水準を押し上げ、家賃の差だけで全国平均との差の大半が説明できる構造となっている。食料品や交通費の差は比較的小さい。(出典: 経済財政白書 令和7年度版)\n\n### Q3: 沖縄や北海道で物価が高い理由は?\n\n沖縄県では離島ゆえの輸送コストにより食料品価格が、北海道・東北・中国地方では寒冷地特有の暖房需要やインフラ維持コストにより光熱・水道費が、それぞれ全国平均より高くなっている。総合指数だけでなく費目別寄与度を見ることで、地域固有の物価構造が把握できる。(出典: 経済財政白書 令和7年度版)\n\n### Q4: 現在の物価上昇率はどのくらい?\n\nCPI総合は2025年1月に前年同月比4.0%に達し、1991年以来となる「3年連続で前年比2%以上の上昇」局面にある。特に米類は2025年5月に前年比101.7%（2倍超）の上昇を記録した。輸入原材料費の上昇、円安、人手不足に伴う人件費の販売価格への転嫁が複合的に作用している。(出典: 経済財政白書 令和7年度版)\n\n### Q5: 賃金は物価上昇に追いついている?\n\n2024年度の名目賃金（現金給与総額）は前年度比3.0%増と、33年ぶりの高い伸びとなった。しかし物価上昇率が同水準で進んだため、物価の影響を除いた実質賃金は0.0%の横ばいにとどまっている。政府は2029年度までに実質賃金1%程度の上昇を新たなノルムとして定着させることを目標としている。(出典: 経済財政白書 令和7年度版)\n\n### Q6: 物価高に対する政府の対策は?\n\n政府は「激変緩和対策事業」を通じて家計や企業の負担を軽減している。ガソリン等の燃料油価格の抑制に加え、電気・都市ガスについても使用量に応じた料金値引きを実施している。また、中小企業の労務費の適切な価格転嫁、地方交付税の増額（令和7年度補正予算で2,000億円増額交付）など、賃上げが定着する環境整備も並行して進めている。(出典: 経済財政白書 令和7年度版)\n\n### Q7: 家計はどんな節約行動をとっている?\n\n消費者は安価な店舗や品目への徹底した代替行動をとっている。スーパーより価格が低い傾向にあるドラッグストアでの食料品購入を増やし、牛肉や豚肉から安価な鶏肉へ切り替えたり、中古品を選択したりする動きが特に若年層で強まっている。統計上のCPIと家計が実際に支払う購入単価には乖離が生じている。(出典: 経済財政白書 令和7年度版)",
        "sources": [
          {
            "label": "経済財政白書 (令和7年度版)",
            "url": "https://www5.cao.go.jp/keizai3/whitepaper.html"
          },
          {
            "label": "小売物価統計調査 — 総務省統計局",
            "url": "https://www.stat.go.jp/data/kouri/index.html"
          },
          {
            "label": "毎月勤労統計調査 — 厚生労働省",
            "url": "https://www.mhlw.go.jp/toukei/list/30-1a.html"
          }
        ]
      },
      "sourceName": "経済財政白書 (令和7年度版) / 小売物価統計調査 — 総務省統計局 / 毎月勤労統計調査 — 厚生労働省",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 30
    }
  ],
  "keywords": [
    "消費者物価指数",
    "物価",
    "地域差指数",
    "生活コスト",
    "食費",
    "家賃",
    "都道府県",
    "ランキング"
  ]
};
