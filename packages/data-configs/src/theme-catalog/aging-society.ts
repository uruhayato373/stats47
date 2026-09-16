import type { ThemeCatalog } from "./types";
import { buildPopulationPyramidSeriesRefs } from "./population-pyramid-deps";

export const AGING_SOCIETY_CATALOG: ThemeCatalog = {
  "key": "aging-society",
  "title": "少子高齢化",
  "description": "出生の状況と年齢構造、高齢者の暮らす世帯が地域ごとにどう異なるかを把握する。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "高齢化率",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年版 高齢社会白書 第1章第1節4「地域別に見た高齢化」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_4.html",
        "surveyedAt": "2026-09-16",
        "rationale": "白書が地域比較の中心指標として都道府県別の高齢化率（秋田39.5%・東京22.7%）を掲げており、テーマの主問「高齢化はどう進んでいるか」に直接答える見出し指標。社会生活統計指標#A03503と定義が一致する。",
        "adoptionCriteria": ["representativeness", "comparability", "readerValue"],
        "readerQuestion": "自分の県の高齢化率（65歳以上人口割合）は全国のどの位置にあるか。",
        "targetReaderOrDecision": "移住先や実家の将来、医療・介護需要を考える読者の比較材料。"
      }
    },
    {
      "rankingKey": "aging-index",
      "shortLabel": "老年化指数（15歳未満人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "老年化指数は「年齢構造はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "primary",
      "selection": {
        "proposedBy": "人口動態統計 令和6年（2024）確定数 報道発表（厚生労働省・2025-09-16）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/dl/14_houdouR06.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省が確定数公表の「調査結果のポイント」先頭に置く看板指標（令和6年は1.15で過去最低・9年連続低下）。出生の水準を都道府県で同一定義で比較でき、高齢化率と対になる主問の見出し指標。",
        "adoptionCriteria": ["representativeness", "dataQuality", "readerValue"],
        "readerQuestion": "自分の県の合計特殊出生率は、全国値1.15や過去最低の水準とどう違うか。",
        "targetReaderOrDecision": "出産・子育て環境や移住先の少子化の程度を比較したい読者。"
      }
    },
    {
      "rankingKey": "crude-birth-rate",
      "shortLabel": "粗出生率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "粗出生率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "crude-death-rate",
      "shortLabel": "死亡率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "死亡率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "average-age-of-first-marriage-wife",
      "shortLabel": "初婚年齢(妻)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "初婚年齢(妻)は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "総人口の増減結果は人口動態で扱う。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "人口増減の要因分解へ集約する。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "social-increase-rate",
      "shortLabel": "社会増減率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "居住移動の説明は人口動態を主責務とする。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "dependent-population-index",
      "shortLabel": "従属人口指数（15～64歳人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "従属人口指数は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "household-ratio-with-65plus",
      "shortLabel": "65歳以上世帯割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版 高齢社会白書 第1章第1節3「家族と世帯」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_3.html",
        "surveyedAt": "2026-09-16",
        "rationale": "白書が「65歳以上の者のいる世帯は全世帯の49.5%」と、本指標と同じ分子・分母で提示している。「高齢者はどの世帯で暮らすか」の章の基準となる指標。",
        "adoptionCriteria": ["representativeness", "comparability", "dataQuality"],
        "readerQuestion": "65歳以上の世帯員がいる世帯は全世帯の何割で、県ごとにどう違うか。",
        "targetReaderOrDecision": "実家の高齢者世帯の支援や見守りの頻度を考える読者の目安。"
      }
    },
    {
      "rankingKey": "marriages-per-total-population",
      "shortLabel": "婚姻率（人口千人）",
      "role": "secondary",
      "selection": {
        "proposedBy": "人口動態統計 令和6年（2024）確定数 報道発表（厚生労働省）／社会生活統計指標 #A06601",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/dl/14_houdouR06.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省の確定数が婚姻件数（令和6年485,092組・増加）を「調査結果のポイント」に掲げる。人口千人当たりの率（#A06601）で家族形成の入口を県別に比較し、「婚姻と家族形成」章（candidateId 42）の指標とする。",
        "adoptionCriteria": ["dataQuality", "comparability", "readerValue"],
        "readerQuestion": "人口千人当たりの婚姻件数は、自分の県では全国とどう違うか。",
        "targetReaderOrDecision": "結婚・家族形成の地域差を知りたい読者、移住先を検討する読者。"
      }
    },
    {
      "rankingKey": "divorces-per-total-population",
      "shortLabel": "離婚率（人口千人）",
      "role": "secondary",
      "selection": {
        "proposedBy": "人口動態統計 令和6年（2024）確定数 報道発表（厚生労働省）／社会生活統計指標 #A06602",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei24/dl/14_houdouR06.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省の確定数が離婚件数（令和6年185,904組・増加）を「調査結果のポイント」に掲げる。人口千人当たりの率（#A06602）で婚姻率と対にして県別に比較し、「婚姻と家族形成」章（candidateId 42）の指標とする。",
        "adoptionCriteria": ["dataQuality", "comparability", "readerValue"],
        "readerQuestion": "人口千人当たりの離婚件数は、自分の県では全国とどう違うか。",
        "targetReaderOrDecision": "家族形成や離婚後の生活設計を考える読者の比較材料。"
      }
    },
    {
      "rankingKey": "births",
      "shortLabel": "出生数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "出生実数と死亡実数の自然増減図を人口動態へ集約する。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "death-count",
      "shortLabel": "死亡数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "人口動態の自然増減図と重複する。 主表示は「人口動態」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "late-elderly-medical-expense-per-insured",
      "shortLabel": "後期高齢者医療費（被保険者1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/J",
        "surveyedAt": "2026-09-08",
        "rationale": "被保険者1人を基準にした後期高齢者医療費として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "総人口は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯（一般世帯に対して）",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会生活統計指標（統計でみる都道府県のすがた）指標算式 #A06304（総務省統計局）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "社会生活統計指標の#A06304（65歳以上の単独世帯数÷一般世帯数）として公式収録。分母が一般世帯であり、高齢社会白書の独居率（分母＝65歳以上人口）とは別指標のため、章の注記で区別したうえで「高齢者はどの世帯で暮らすか」の章に置く。",
        "adoptionCriteria": ["dataQuality", "comparability"],
        "readerQuestion": "65歳以上が一人で暮らす単独世帯は一般世帯の何%で、県によってどう違うか。",
        "targetReaderOrDecision": "高齢の親の見守りや同居を検討する読者の目安。"
      }
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦のみの世帯の割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会生活統計指標（統計でみる都道府県のすがた）指標算式 #A06302（総務省統計局）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "社会生活統計指標の#A06302（夫65歳以上・妻60歳以上の夫婦のみ世帯数÷一般世帯数）として公式収録。高齢単独世帯と対にして、高齢期の暮らし方の型を同じ分母で読む。",
        "adoptionCriteria": ["dataQuality", "comparability", "complementarity"],
        "readerQuestion": "夫65歳以上・妻60歳以上の夫婦のみ世帯は一般世帯の何%で、県によってどう違うか。",
        "targetReaderOrDecision": "高齢期の同居・別居の暮らし方を考える読者の目安。"
      }
    },
    {
      "rankingKey": "pension-benefit-total",
      "shortLabel": "厚生年金受給権者年金総額",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "厚生年金受給権者年金総額は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "volunteer-activity-annual-participation-rate-15plus",
      "shortLabel": "ボランティア活動の年間行動者率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "15歳以上の一般的社会参加であり高齢者固有の参加率ではない。 主表示は「教育・文化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "young-population-index",
      "shortLabel": "年少人口指数（15～64歳人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "年少人口指数は「年齢構造はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "old-population-index",
      "shortLabel": "老年人口指数（15～64歳人口100人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "老年人口指数は「年齢構造はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "nursing-home-capacity-per-1000-65plus",
      "shortLabel": "老人ホーム定員（65歳以上千人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会生活統計指標（統計でみる都道府県のすがた）指標算式 #J042011（総務省統計局）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "社会生活統計指標の#J042011（老人ホーム定員数÷65歳以上人口・千人当たり）として公式収録。高齢者人口を分母にそろえた施設供給の指標で、高齢化率だけでは見えない受け皿を同じ基準で比較する。公式ダッシュボード研究カタログでもRESAS「介護需給分析」が介護供給を独立メニューとしている。",
        "adoptionCriteria": ["dataQuality", "comparability", "complementarity"],
        "readerQuestion": "65歳以上人口千人当たりの老人ホーム定員は、自分の県ではどれくらいか。",
        "targetReaderOrDecision": "親の施設入所先や介護を前提とした移住を検討する読者の比較材料。"
      }
    },
    {
      "rankingKey": "elderly-workers-ratio",
      "shortLabel": "高齢就業者割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版 高齢社会白書 第1章第2節1「就業・所得」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_1.html",
        "surveyedAt": "2026-09-16",
        "rationale": "白書が高齢者の就業を主要論点とし、65〜69歳の労働力人口比率54.9%・就業率の10年で13.5ポイント上昇を示す。県別の高齢就業者割合（#F0350303）で地域差を読み、「高齢者の就業」章（candidateId 36）の指標とする。",
        "adoptionCriteria": ["representativeness", "dataQuality", "comparability"],
        "readerQuestion": "65歳以上のうち働いている人の割合は、県によってどう違うか。",
        "targetReaderOrDecision": "高齢期の就労や再雇用、移住先の就業環境を検討する読者。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-late-elderly-medical-expense-trend",
      "componentType": "line-chart",
      "title": "後期高齢者医療費（被保険者1人当たり）の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "late-elderly-medical-expense-per-insured",
            "label": "後期高齢者医療費（被保険者1人当たり）"
          }
        ],
        "labels": [
          "後期高齢者医療費（被保険者1人当たり）"
        ],
        "seriesColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "late-elderly-medical-expense-per-insured"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "estat",
      "section": "elderly-care",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-age-composition",
      "componentType": "composition-chart",
      "title": "年齢3区分人口構成の推移",
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
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "age-structure",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-population-pyramid",
      "componentType": "pyramid-chart",
      "title": "人口ピラミッド",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "theme-population-pyramid-0-4-male",
            "label": "0〜4歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-0-4-female",
            "label": "0〜4歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-5-9-male",
            "label": "5〜9歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-5-9-female",
            "label": "5〜9歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-10-14-male",
            "label": "10〜14歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-10-14-female",
            "label": "10〜14歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-15-19-male",
            "label": "15〜19歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-15-19-female",
            "label": "15〜19歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-20-24-male",
            "label": "20〜24歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-20-24-female",
            "label": "20〜24歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-25-29-male",
            "label": "25〜29歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-25-29-female",
            "label": "25〜29歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-30-34-male",
            "label": "30〜34歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-30-34-female",
            "label": "30〜34歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-35-39-male",
            "label": "35〜39歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-35-39-female",
            "label": "35〜39歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-40-44-male",
            "label": "40〜44歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-40-44-female",
            "label": "40〜44歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-45-49-male",
            "label": "45〜49歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-45-49-female",
            "label": "45〜49歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-50-54-male",
            "label": "50〜54歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-50-54-female",
            "label": "50〜54歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-55-59-male",
            "label": "55〜59歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-55-59-female",
            "label": "55〜59歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-60-64-male",
            "label": "60〜64歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-60-64-female",
            "label": "60〜64歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-65-69-male",
            "label": "65〜69歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-65-69-female",
            "label": "65〜69歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-70-74-male",
            "label": "70〜74歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-70-74-female",
            "label": "70〜74歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-75-79-male",
            "label": "75〜79歳・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-75-79-female",
            "label": "75〜79歳・女性",
            "colorRole": "female"
          },
          {
            "metricKey": "theme-population-pyramid-80-plus-male",
            "label": "80歳以上・男性",
            "colorRole": "population"
          },
          {
            "metricKey": "theme-population-pyramid-80-plus-female",
            "label": "80歳以上・女性",
            "colorRole": "female"
          }
        ]
      },
      "relatedRankingKeys": [
        "total-population"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "age-structure",
      "sortOrder": 30
    },
    {
      "componentKey": "md-aging-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "高齢者の人口割合と出生の水準を別の尺度として読みます。\n\n人数の構成と男女・年齢階級の分布から、高齢化の背景を確認します。\n\n高齢単独世帯の割合は一般世帯に対する割合です。高齢者本人の独居率とは異なります。"
      },
      "sourceName": "高齢社会白書 (令和6年版) / 厚生労働白書 (令和7年版) / 国土交通白書 2025 / 男女共同参画白書 (令和7年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 40
    },
    {
      "componentKey": "cmp-pop-elderly-household",
      "componentType": "line-chart",
      "title": "高齢世帯の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "household-ratio-with-65plus"
          },
          {
            "metricKey": "single-person-household-old-population-ratio"
          },
          {
            "metricKey": "elderly-couple-only-household-ratio"
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
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 6,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "elderly-households",
      "sortOrder": 50
    },
    {
      "componentKey": "md-aging-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 出生と高齢化の現在地を見るときの注意は？\n\n高齢者の人口割合と出生の水準を別の尺度として読みます。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n出生・高齢化・世帯構成は、それぞれ対象者と分母を確認して読みます。"
      },
      "sourceName": "高齢社会白書 (令和6年版) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 60
    }
  ],
  "evidenceTopics": [
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
        "theme-age-composition"
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
  ],
  "sections": [
    {
      "key": "birth-aging",
      "title": "出生と高齢化の現在地",
      "description": "高齢者の人口割合と出生の水準を別の尺度として読みます。",
      "metricGroupKeys": [
        "birth-aging-1",
        "birth-aging-2"
      ],
      "chartKeys": []
    },
    {
      "key": "age-structure",
      "title": "年齢構造はどう変わるか",
      "description": "人数の構成と男女・年齢階級の分布から、高齢化の背景を確認します。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-age-composition",
        "theme-population-pyramid"
      ]
    },
    {
      "key": "elderly-households",
      "title": "高齢者はどの世帯で暮らすか",
      "description": "高齢単独世帯の割合は一般世帯に対する割合です。高齢者本人の独居率とは異なります。",
      "metricGroupKeys": [
        "elderly-households"
      ],
      "chartKeys": [
        "cmp-pop-elderly-household"
      ]
    },
    {
      "key": "elderly-care",
      "title": "医療アクセスと費用",
      "description": "老人ホーム定員は65歳以上人口千人当たりです。空き定員や入所需要の充足率を表すものではありません。医療費とアクセスは別の側面として確認します。",
      "metricGroupKeys": [
        "elderly-care"
      ],
      "chartKeys": [
        "theme-late-elderly-medical-expense-trend"
      ],
      "embeddedSectionKeys": [
        "depopulation-medical"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "出生・高齢化・世帯構成は、それぞれ対象者と分母を確認して読みます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-aging-discussion",
        "md-aging-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "birth-aging-1",
      "title": "高齢化率",
      "rankingKeys": [
        "ratio-65-plus"
      ],
      "defaultCheckedKeys": [
        "ratio-65-plus"
      ]
    },
    {
      "key": "birth-aging-2",
      "title": "合計特殊出生率",
      "rankingKeys": [
        "total-fertility-rate"
      ],
      "defaultCheckedKeys": [
        "total-fertility-rate"
      ]
    },
    {
      "key": "elderly-households",
      "title": "高齢者はどの世帯で暮らすか",
      "rankingKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "defaultCheckedKeys": [
        "household-ratio-with-65plus",
        "single-person-household-old-population-ratio"
      ]
    },
    {
      "key": "elderly-care",
      "title": "医療アクセスと費用",
      "rankingKeys": [
        "nursing-home-capacity-per-1000-65plus"
      ],
      "defaultCheckedKeys": [
        "nursing-home-capacity-per-1000-65plus"
      ]
    }
  ]
};
