import type { ThemeCatalog } from "./types";
import { buildPopulationPyramidSeriesRefs } from "./population-pyramid-deps";

export const AGING_SOCIETY_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "高齢化と出生、高齢世帯の暮らしを比較。",
    "headlineRankingKeys": [
      "ratio-65-plus",
      "total-fertility-rate",
      "single-person-household-old-population-ratio",
      "elderly-couple-only-household-ratio"
    ],
    "comparisonRankingKeys": [
      "ratio-65-plus",
      "total-fertility-rate",
      "single-person-household-old-population-ratio",
      "elderly-couple-only-household-ratio",
      "household-ratio-with-65plus",
      "aging-index",
      "late-elderly-medical-expense-per-insured"
    ],
    "mapNotes": {
      "ratio-65-plus": "総人口に占める65歳以上の割合。就業や健康状態は示しません。",
      "total-fertility-rate": "15～49歳の年齢別出生率の合計。高齢化率との単純な因果は示しません。",
      "single-person-household-old-population-ratio": "一般世帯に占める65歳以上の1人世帯の割合。",
      "elderly-couple-only-household-ratio": "一般世帯が分母。夫65歳以上・妻60歳以上の夫婦のみ。",
      "household-ratio-with-65plus": "一般世帯に占める65歳以上の世帯員がいる世帯。単独・夫婦のみを含みます。",
      "aging-index": "15歳未満人口を100とした65歳以上人口。高齢化率とは分母が異なります。",
      "late-elderly-medical-expense-per-insured": "後期高齢者医療制度の被保険者1人当たり。全住民の医療費ではありません。"
    }
  },
  "key": "aging-society",
  "title": "少子高齢化",
  "description": "都道府県別の合計特殊出生率・高齢化率・人口増減率をランキングとチャートで比較。少子高齢化の実態を47都道府県のデータで確認できます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "65歳以上割合",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書 第1章第1節",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_1.html",
        "surveyedAt": "2026-09-09",
        "rationale": "白書の高齢化の現状・県別高齢化率を起点に地域構造を地図で示す。"
      }
    },
    {
      "rankingKey": "aging-index",
      "shortLabel": "老年化指数",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書・社会人口統計体系",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "年少人口とのバランスを補助比較する指数。高齢化率と重複するため主要カードにはしない。"
      }
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "primary",
      "selection": {
        "proposedBy": "こども白書（令和7年度）図表2-1-1・人口動態統計",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-09",
        "rationale": "少子高齢化の出生側を表す主指標。粗出生率との重複表示を避けて概況に採用する。"
      }
    },
    {
      "rankingKey": "crude-birth-rate",
      "shortLabel": "粗出生率",
      "role": "context"
    },
    {
      "rankingKey": "crude-death-rate",
      "shortLabel": "死亡率",
      "role": "context"
    },
    {
      "rankingKey": "average-age-of-first-marriage-wife",
      "shortLabel": "初婚年齢(妻)",
      "role": "context"
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "context"
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "context"
    },
    {
      "rankingKey": "social-increase-rate",
      "shortLabel": "社会増減率",
      "role": "context"
    },
    {
      "rankingKey": "dependent-population-index",
      "shortLabel": "従属人口指数",
      "role": "context"
    },
    {
      "rankingKey": "household-ratio-with-65plus",
      "shortLabel": "65歳以上を含む世帯率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書「家族と世帯」・国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_3.html",
        "surveyedAt": "2026-09-09",
        "rationale": "高齢世帯の全体像を比較表で示す。単独・夫婦のみとの包含関係があるので積み上げない。"
      }
    },
    {
      "rankingKey": "marriages-per-total-population",
      "shortLabel": "婚姻率",
      "role": "context"
    },
    {
      "rankingKey": "divorces-per-total-population",
      "shortLabel": "離婚率",
      "role": "context"
    },
    {
      "rankingKey": "births",
      "shortLabel": "出生数",
      "role": "context"
    },
    {
      "rankingKey": "death-count",
      "shortLabel": "死亡数",
      "role": "context"
    },
    {
      "rankingKey": "late-elderly-medical-expense-per-insured",
      "shortLabel": "後期高齢者1人当たり医療費",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会・人口統計体系（後期高齢者医療事業状況報告）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "高齢化の人口構造から医療利用の費用へつなぐ補助指標。受給者数に左右される年金総額より1人当たり指標を優先。"
      }
    },
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "context"
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯率",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書「家族と世帯」・国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_3.html",
        "surveyedAt": "2026-09-09",
        "rationale": "白書の家族・世帯の論点を受け、高齢者の同居条件を可視化する。白書の高齢世帯を分母にした割合と区別する。"
      }
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦のみ世帯率",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書「家族と世帯」・国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_3.html",
        "surveyedAt": "2026-09-09",
        "rationale": "高齢単独世帯とともに世帯内支援の背景を比較する。年齢条件を短く明示する。"
      }
    },
    {
      "rankingKey": "pension-benefit-total",
      "shortLabel": "厚生年金受給権者年金総額",
      "role": "context"
    },
    {
      "rankingKey": "volunteer-activity-annual-participation-rate-15plus",
      "shortLabel": "ボランティア活動の年間行動者率",
      "role": "context"
    },
    {
      "rankingKey": "young-population-index",
      "shortLabel": "年少人口指数",
      "role": "context"
    },
    {
      "rankingKey": "old-population-index",
      "shortLabel": "老年人口指数",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-aging-age-composition",
      "componentType": "composition-chart",
      "title": "年齢3区分の人口構成",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "theme-age-composition-young-population",
            "label": "年少人口(0〜14歳)",
            "colorRole": "improve"
          },
          {
            "metricKey": "theme-age-composition-production-age-population",
            "label": "生産年齢人口(15〜64歳)",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-age-composition-elderly-population",
            "label": "老年人口(65歳以上)",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "ratio-65-plus"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "出生・婚姻",
      "sortOrder": 10,
      "annotation": "年齢不詳の扱いは出典に従います。人口割合の変化と人数の変化は異なります。"
    },
    {
      "componentKey": "md-aging-discussion",
      "componentType": "markdown-section",
      "title": "データの読み解き — 高齢化の構造的要因",
      "componentProps": {
        "subtitle": "白書から見る、なぜ秋田と東京で大きな差があるのか",
        "markdown": "日本の高齢化率は、2020年の28.6%から2050年には約37.1%、2070年には38.7%へ上昇すると推計される、世界でも類を見ない水準にある。ただし「47都道府県平均」だけを見ても実態は掴めない。秋田・高知・島根といった上位県と、東京・沖縄・愛知といった下位県の差は、単なる高齢者の絶対数ではなく、人口構造そのものの違いから生じている。本稿では各種白書のデータを基に、その構造を読み解く。\n\n### 現状 — 「2025年問題」と将来推計\n\n2024年時点の総人口は1億2,380万人。2025年には団塊の世代（1947〜49年生まれ）が全員75歳以上の後期高齢者となる。医療・介護需要が一段と高まる局面であり、これが「2025年問題」と呼ばれる。\n\n高齢者人口の推計上のピークは2043年の約3,953万人である。2040年に向けた生産年齢人口の減少とは時期を区別して読む。2070年には総人口が約8,700万人、高齢化率は約39%に達するとも推計されている。\n\n### 都道府県差の構造 — 「分母の縮小」が高齢化率を押し上げる\n\n2040年までに東京都を除く46道府県で高齢化率が30%を超えると推計されている。地方の高齢化が急進する背景には、3つの構造的要因がある。\n\n**(1) 若年層の社会減少**\n\n都道府県間の人口移動は22歳前後をピークに10代後半〜20代に集中し、地方から東京圏への一極集中が続いている。男女別に見ると、東京圏への転入超過数は近年、女性が男性を上回って推移している。地方では若年女性の流出が出生数の減少と高齢化率の上昇を同時に引き起こす悪循環が起きている。\n\n**(2) 産業構造と賃金格差**\n\n所定内給与は東京都が最も高く、青森県や沖縄県との差は大きい。地方では「医療・福祉」「製造業」に雇用が偏る一方、都市部は情報通信業など職種の選択肢が広く、男女差の少ない働き方も整いやすい。職業選択の幅が、若い世代の定着可否を左右している。\n\n**(3) 出生率と性比の不均衡**\n\n全国的な少子化に加え、地方では30代前半の未婚者性比（女性100に対する男性数）が140を超える地域もある。固定的な性別役割分担意識が地方に根強く残ることも、若い女性が地元を離れる要因の1つとされている。\n\n### 政策的含意 — 「全世代型社会保障」と「健康寿命の延伸」\n\n政府は「高齢者は支えられる側」という固定観念を改め、全ての世代が能力に応じて支え合う**全世代型社会保障**への転換を進めている。2023年成立の改正健康保険法等もこの方向性に沿うものだ。\n\nまた**健康寿命の延伸**も中核戦略である。2022年の健康寿命は男性72.57年・女性75.45年であり、2040年までにさらに3年以上延伸させ「生涯現役社会」を目指す。あわせて**Society 5.0**の深化により、AI・ロボットの活用で労働力不足を補い、地域格差のない医療・行政サービスの提供を図る方針が示されている。\n\n### 読み解きのコツ\n\n高齢化率の数字だけを追わず、出生・死亡による**自然増減**と転入・転出による**社会増減**を分けて見ることが重要である。地方の高齢化は「高齢者が増えた」以上に「若年層が流出して分母が縮んだ」という構造変化の結果という側面が大きい。\n\n都道府県ランキングを読むときも、同じ「高齢化率上位県」であっても、自然減（出生減）が主因の県と、社会減（若年流出）が主因の県では、必要な対策が大きく異なる。たとえば人口流出の比重が大きい県では、地元産業の競争力や働きやすさの向上が中核施策になるのに対し、出生減が中心の県では、子育て世代への直接支援や住環境整備の重みが増す。47都道府県を横並びで比較する際には、上位／下位の順位そのものよりも、**「なぜその水準なのか」を構造で説明できるか**が、データの読み解きとして本質的である。",
        "sources": [
          {
            "label": "高齢社会白書 (令和7年版)",
            "url": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_1.html"
          },
          {
            "label": "厚生労働白書 (令和7年版)",
            "url": "https://www.mhlw.go.jp/stf/wp/hakusyo/kousei/index.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
            "url": "https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp"
          }
        ]
      },
      "sourceName": "高齢社会白書 (令和7年版) / 厚生労働白書 (令和7年版) / 国土交通白書 2025 / 男女共同参画白書 (令和7年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 30
    },
    {
      "componentKey": "cmp-pop-elderly-household",
      "componentType": "line-chart",
      "title": "高齢の単独・夫婦世帯",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "household-ratio-with-65plus",
            "label": "65歳以上を含む世帯率"
          },
          {
            "metricKey": "single-person-household-old-population-ratio",
            "label": "高齢単独世帯率"
          },
          {
            "metricKey": "elderly-couple-only-household-ratio",
            "label": "高齢夫婦のみ世帯率"
          }
        ],
        "labels": [
          "65歳以上世帯員のいる世帯",
          "65歳以上単独世帯",
          "高齢夫婦のみ世帯"
        ],
        "yAxisConfig": {
          "mode": "sync"
        }
      },
      "relatedRankingKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "sourceName": null,
      "sourceLink": null,
      "gridColumnSpan": 6,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "暮らし・年金",
      "sortOrder": 20,
      "annotation": "分母は一般世帯。65歳以上を含む世帯は他の2区分を包含。夫婦のみは夫65歳以上・妻60歳以上。"
    },
    {
      "componentKey": "md-aging-related-topics",
      "componentType": "markdown-section",
      "title": "関連トピック・中長期課題",
      "componentProps": {
        "subtitle": "2025年問題から地域包括ケアまで",
        "markdown": "高齢化は単独の課題ではなく、社会保障・労働市場・地域コミュニティといった複数の領域が連動して進行している。各種白書から、特に重要度の高い4つの論点を整理する。\n\n### 1. 人口構造の変化 —「2025年問題」と「2040年問題」\n\n**2025年問題**は、団塊の世代が全員75歳以上の後期高齢者に達し、医療・介護需要が一段と高まる局面を指す。\n\n**2040年問題**では、生産年齢人口の減少と医療・介護の担い手確保が課題となる。高齢者人口の推計上のピークは2043年の約3,953万人であり、2040年とは異なる。\n\n### 2. 社会保障費の増大と国民負担\n\n社会保障給付費は年々増加し、**2024年度予算ベースで138兆円（対GDP比22.4%）**に達している。これを支える税と社会保険料の合計である**国民負担率**は、令和6年度実績見込みで45.8%、令和7年度見通しで46.2%と高水準で推移する。\n\n介護分野だけを見ても、保険費用は2040年度に約25.8兆円まで膨らむ試算が示されている。給付と負担のバランス確保が、財政・制度設計の両面で急務となっている。\n\n### 3. 医療・介護・物流分野の人材不足\n\n**介護職員**は、2022年度の約215万人から2040年度には約272万人が必要とされ、約57万人の追加確保が課題となる。**物流分野**でも「2030年問題」が指摘されており、ドライバー数の減少により輸送能力の約34.1%が不足する可能性が試算されている。生活インフラを支える人材の確保が、高齢化と並行して直面する制約条件である。\n\n### 4. 地域コミュニティと「地域包括ケアシステム」\n\n地方では限界集落化が進み、2050年には全市区町村の約2割で人口が2020年比で半数未満になると推計されている。これに対し政府は、医療・介護・住まいを地域で一体的に提供する**地域包括ケアシステム**の深化、世代を超えて支え合う**全世代型社会保障**、住民同士が助け合う**地域共生社会**の構築を進めている。2024年度からの第9期介護保険事業計画では、介護情報基盤の整備と職場環境改善・生産性向上が柱に据えられている。\n\n### 5. 地方創生2.0と「人の流れ」の創出\n\n若年層の都市集中を緩和する政策として、二地域居住の促進やデジタル技術を活用した地方の魅力ある職場づくり、地域未来基金（令和8年度4,000億円）による産業クラスター形成などが進められている。高齢化対策は「高齢者そのもの」だけでなく、人口移動の流れを変える地域戦略と一体で考える必要がある。",
        "sources": [
          {
            "label": "厚生労働白書 (令和7年版)",
            "url": "https://www.mhlw.go.jp/stf/wp/hakusyo/kousei/index.html"
          },
          {
            "label": "高齢社会白書 (令和7年版)",
            "url": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_1.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          },
          {
            "label": "持続可能な物流の実現に向けた検討会 (国土交通省)",
            "url": "https://www.mlit.go.jp/seisakutokatsu/freight/seisakutokatsu_freight_tk1_000204.html"
          },
          {
            "label": "日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
            "url": "https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp"
          }
        ]
      },
      "sourceName": "厚生労働白書 (令和7年版) / 高齢社会白書 (令和7年版) / 国土交通白書 2025 / 持続可能な物流の実現に向けた検討会 (国土交通省) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 40
    },
    {
      "componentKey": "md-aging-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "subtitle": "高齢化について読者が気になる 6 問",
        "markdown": "### Q1: 高齢化率って何?\n\n高齢化率とは、総人口に占める65歳以上人口の割合のこと。日本では2020年に28.6%だったものが、2050年には約37.1%、2070年には38.7%に達すると推計されている。国民の約2.6人に1人が65歳以上となる計算で、社会保障や労働力確保の中核課題となっている。(出典: 高齢社会白書 令和6年版)\n\n### Q2: 日本は世界と比べてどれくらい高齢化が進んでいる?\n\n日本は先進7か国（G7）の中で平均寿命・健康寿命ともに最も長く、長寿社会を実現している国である。一方で、2070年には高齢化率が約39%に達し、現役世代（15〜64歳）が1990年代の約7割から約5割へ縮む見通しで、世界でも類を見ない速度で人口減少・少子高齢化が進行している。(出典: 厚生労働白書 令和7年版)\n\n### Q3: 「2025年問題」「2040年問題」とは?\n\n2025年問題は、団塊の世代が全員75歳以上の後期高齢者となり、医療・介護需要が急増する課題を指す。2040年問題は、生産年齢人口が減る中で医療・介護の担い手をどう確保するかという課題。高齢者人口のピークは2043年の約3,953万人と推計されている。(出典: 高齢社会白書 令和7年版)\n\n### Q4: 高齢者はどれくらい働いている?\n\n高齢者の就業意欲は高く、約6割が65歳を超えても働くことを希望している。実際の就業率も上昇傾向にあり、2024年時点で60〜64歳男性は84.0%、65〜69歳男性は62.8%が就業している。深刻な人手不足を背景に、年齢に関わらず能力を発揮できる「生涯現役社会」の実現が国家戦略となっている。(出典: 厚生労働白書 令和7年版)\n\n### Q5: 仕事と介護を両立している人はどのくらい?\n\n2022年時点で介護をしている約629万人のうち、58.0%にあたる約365万人が働きながら介護を行っている。介護離職を防ぐため、介護休業制度の拡充や企業向け「介護支援プラン」策定支援、両立支援企業の象徴である「トモニン」マークの普及などが進められている。(出典: 厚生労働白書 令和7年版)\n\n### Q6: 社会保障の費用と国民負担はどのくらい?\n\n2024年度の社会保障給付費は予算ベースで138兆円に達し、対GDP比で22.4%を占める。これを支える税と社会保険料の合計である「国民負担率」は、令和6年度実績見込みで45.8%、令和7年度見通しで46.2%である。介護費用だけでも2040年度には約25.8兆円まで増大する見通しで、給付と負担のバランス確保が急務とされている。(出典: 厚生労働白書 令和7年版)\n\n### Q7: 地方と都市で高齢化の進み方はなぜ違う?\n\n高齢化率の分母は総人口である。若い世代の流出で総人口が減ると、高齢者数が増えなくても高齢化率が上がる場合がある。高齢者数と総人口の変化を分けて確認する。(出典: 高齢社会白書 令和7年版)",
        "sources": [
          {
            "label": "高齢社会白書 (令和7年版)",
            "url": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_1.html"
          },
          {
            "label": "厚生労働白書 (令和7年版)",
            "url": "https://www.mhlw.go.jp/stf/wp/hakusyo/kousei/index.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
            "url": "https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp"
          }
        ]
      },
      "sourceName": "高齢社会白書 (令和7年版) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 50
    }
  ],
  evidenceTopics: [
    {
      "key": "regional-aging-composition",
      "lensKey": "composition",
      "title": "地域別の高齢化と年齢構成",
      "question": "65歳以上人口割合と年齢3区分の構成には、地域ごとにどのような差があるか",
      "summary": "高齢化率は65歳以上人口を総人口で割った割合で、65歳以上人口の絶対数ではありません。年少・生産年齢・老年人口の構成と合わせ、分子と分母の変化を分けて読みます。",
      "sourceKeys": [
        "cao-aging-whitepaper-2025-regional-aging"
      ],
      "relatedRankingKeys": [
        "ratio-65-plus"
      ],
      "relatedChartKeys": [
        "theme-aging-age-composition"
      ]
    },
    {
      "key": "elderly-household-composition",
      "lensKey": "composition",
      "title": "高齢者が暮らす世帯の構成",
      "question": "高齢者のいる世帯、単独世帯、高齢夫婦のみの世帯には、地域ごとにどのような差があるか",
      "summary": "関連ランキングの3指標は、それぞれ該当する世帯数を一般世帯数で割った割合です。高齢者のいる世帯だけを分母にした構成比ではないため、3指標を足して100％になるとは限りません。",
      "sourceKeys": [
        "cao-aging-whitepaper-2025-households"
      ],
      "relatedRankingKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "relatedChartKeys": [
        "cmp-pop-elderly-household"
      ]
    }
  ],
  "keywords": [
    "少子高齢化",
    "高齢化率",
    "合計特殊出生率",
    "人口減少",
    "都道府県",
    "ランキング"
  ]
};
