import type { ThemeCatalog } from "./types";

export const SAFETY_CATALOG: ThemeCatalog = {
  "key": "safety",
  "title": "安全",
  "description": "犯罪、交通事故、火災の発生と被害を別の軸として確認する。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "penal-code-offenses-recognized-per-1000",
      "shortLabel": "刑法犯認知件数（人口千人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "令和6年版 犯罪白書 第1編第1章第1節1「認知件数と発生率」（法務省）",
        "sourceUrl": "https://hakusyo1.moj.go.jp/jp/71/nfm/n71_2_1_1_1_1.html",
        "surveyedAt": "2026-09-16",
        "rationale": "犯罪白書は認知件数の実数だけでなく、人口当たりに換算した「発生率」を長期推移の中心指標として提示しており、絶対数の増減が人口変動と混同されない比較軸を与えている。これは都道府県間・年次間で犯罪の起こりやすさを揃えて比較するための代表的な尺度であり、テーマが問う「地域ごとにどのような差があるか」に直接対応する。",
        "adoptionCriteria": ["representativeness", "comparability"]
      }
    },
    {
      "rankingKey": "serious-crime-per-100k",
      "shortLabel": "凶悪犯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "凶悪犯は「犯罪の認知と検挙」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "criminal-recognition-count",
      "shortLabel": "認知件数",
      "role": "context",
      "selection": {
        "proposedBy": "令和6年版 犯罪白書 第1編第1章第1節1「認知件数と発生率」（法務省）",
        "sourceUrl": "https://hakusyo1.moj.go.jp/jp/71/nfm/n71_2_1_1_1_1.html",
        "surveyedAt": "2026-09-16",
        "rationale": "犯罪白書は認知件数の実数そのものを刑法犯動向の基本統計として長期にわたり示しており、警察が把握した犯罪発生の総量を示す一次的な数値である。人口当たり指標である発生率を補い、実際の負担量（警察・地域社会が対応する件数の規模）を読者に伝える補完的な角度を持つ。",
        "adoptionCriteria": ["complementarity", "dataQuality"]
      }
    },
    {
      "rankingKey": "violent-crime-per-100k",
      "shortLabel": "粗暴犯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "粗暴犯は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "criminal-arrest-rate",
      "shortLabel": "検挙率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版 犯罪白書 第1編第1章第1節3「検挙率」（法務省）",
        "sourceUrl": "https://hakusyo1.moj.go.jp/jp/71/nfm/n71_2_1_1_1_3.html",
        "surveyedAt": "2026-09-16",
        "rationale": "犯罪白書は検挙率を認知件数・発生率と並ぶ主要統計として独立した項目で扱っており、警察の対応能力や治安維持の実効性を示す指標と位置付けている。認知件数だけでは測れない「事件解決の程度」という異なる角度を提供し、地域の治安を多面的に評価する読者の意思決定を支える。",
        "adoptionCriteria": ["complementarity", "readerValue"]
      }
    },
    {
      "rankingKey": "intellectual-crime-per-100k",
      "shortLabel": "知能犯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "知能犯は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "theft-offenses-recognized-per-1000",
      "shortLabel": "窃盗犯認知件数（人口千人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口千人当たりの窃盗犯認知件数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "theft-criminal-arrest-rate",
      "shortLabel": "窃盗検挙率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "窃盗検挙率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "juvenile-criminal-arrest-person-per-population",
      "shortLabel": "少年刑法犯検挙人員（14～19歳人口千人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "14～19歳人口千人当たりの少年刑法犯検挙人員として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "drug-enforcement-arrest-count-per-population",
      "shortLabel": "覚醒剤取締検挙件数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの覚醒剤取締検挙件数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100k",
      "shortLabel": "交通事故死者数（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年版 交通安全白書 第1部第1章第1節1「道路交通事故のすう勢」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/koutu/taisaku/r07kou_haku/zenbun/genkyo/h1/h1b1s1_1.html",
        "surveyedAt": "2026-09-16",
        "rationale": "交通安全白書は交通事故死者数を実数ではなく人口10万人当たりに換算した値を、昭和45年のピークからの長期推移を語る際の基準指標として用いており、人口規模の異なる年代・地域を同一基準で比較できる点を重視している。これはテーマが掲げる交通事故の人的被害の地域差を検証するための代表的な尺度である。",
        "adoptionCriteria": ["representativeness", "comparability"]
      }
    },
    {
      "rankingKey": "traffic-accident-count-per-population",
      "shortLabel": "交通事故発生件数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "政府統計の総合窓口（e-Stat）道路の交通に関する統計「30日以内交通事故死者の状況」解説（警察庁）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003281586",
        "surveyedAt": "2026-09-16",
        "rationale": "この統計は都道府県警察からの報告を集計し人口当たりの発生状況として整理することで、国の交通安全対策の立案という政策目的に直結する形で使われている。総数（criminal-recognition-count等と同様の考え方）だけでは埋もれる人口規模差を補正し、地域間比較を可能にする点で総数指標を補完する。",
        "adoptionCriteria": ["comparability", "complementarity"]
      }
    },
    {
      "rankingKey": "traffic-accident-count",
      "shortLabel": "事故件数",
      "role": "context",
      "selection": {
        "proposedBy": "令和7年版 交通安全白書 第1部第1章第2節「令和6年中の道路交通事故の状況」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/koutu/taisaku/r07kou_haku/zenbun/genkyo/h1/h1b1s1_2.html",
        "surveyedAt": "2026-09-16",
        "rationale": "交通安全白書は毎年の交通事故発生件数の実数を死者数・負傷者数と並べて前年比で報告しており、事故そのものの発生規模を示す基礎的な統計として扱われている。人口当たり指標だけでは分からない事故対応の絶対的な負荷（警察・救急の出動件数規模）を示す点で、他の交通安全指標を補完する。",
        "adoptionCriteria": ["dataQuality", "complementarity"]
      }
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100-accidents",
      "shortLabel": "交通事故死者数（交通事故100件当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "交通事故100件当たりの交通事故死者数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "traffic-accident-injuries-per-100k",
      "shortLabel": "交通事故負傷者数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版 交通安全白書 全文 第1編第1部第1章第2節「令和6年中の道路交通事故の状況」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/koutu/taisaku/r07kou_haku/zenbun/genkyo/h1/h1b1s1_2.html",
        "surveyedAt": "2026-09-16",
        "rationale": "交通安全白書は道路交通事故の状況を負傷者数の前年比増減で説明しており、負傷者数は事故の人的被害規模を示す中心指標として毎年報告されている。人口10万人当たりに換算することで都道府県間の被害規模を人口規模に依存せず比較でき、交通事故の発生と人的被害というテーマの問いに直接応える。",
        "adoptionCriteria": ["representativeness", "comparability"]
      }
    },
    {
      "rankingKey": "traffic-accident-casualties-elderly-65plus",
      "shortLabel": "高齢者事故",
      "role": "context",
      "selection": {
        "proposedBy": "令和6年版 交通安全白書 全文 特集第1章第1節「高齢化の進展と交通死亡事故の状況」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/koutu/taisaku/r06kou_haku/zenbun/genkyo/feature/feature_1_1.html",
        "surveyedAt": "2026-09-16",
        "rationale": "交通安全白書は高齢化の進展に伴い高齢者が交通事故死者数の過半を占める状況を特集で取り上げており、高齢者の死傷者数は交通安全対策における重点対象として継続的に把握されている。この指標は都道府県ごとの高齢化率の違いが交通事故被害にどう表れるかという問いに応え、全体の交通事故指標を補う角度を提供する。",
        "adoptionCriteria": ["representativeness", "complementarity"]
      }
    },
    {
      "rankingKey": "building-fire-count-per-100-thousand-people",
      "shortLabel": "火災出火件数（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "令和6年版 消防白書 第1章第1節1「出火状況」（総務省消防庁）",
        "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r6/chapter1/section1/para1/67985.html",
        "surveyedAt": "2026-09-16",
        "rationale": "消防白書は出火件数を火災の発生状況を示す基礎データとして毎年公表しており、出火状況の節の冒頭で扱われる代表的な統計である。人口10万人当たりに換算することで人口規模の異なる都道府県間の火災発生リスクを比較でき、火災と救急需要という章の中心的な問いに直接答える。",
        "adoptionCriteria": ["representativeness", "comparability"]
      }
    },
    {
      "rankingKey": "fire-deaths-per-100k",
      "shortLabel": "火災死者",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版 消防白書 第1章第1節1「火災の現況と最近の動向」（総務省消防庁）",
        "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r6/chapter1/section1/para1/67983.html",
        "surveyedAt": "2026-09-16",
        "rationale": "消防白書は火災死者数を火災による人的被害の最重要指標として毎年経年比較しており、出火件数（発生件数）とは別に被害の深刻さを示す補完的な角度を提供する。出火件数だけでは把握できない被害の重大性を示すため、火災と救急需要の章で出火件数と組み合わせて読む価値がある。",
        "adoptionCriteria": ["representativeness", "complementarity"]
      }
    },
    {
      "rankingKey": "fire-damage-casualties-per-population",
      "shortLabel": "火災死傷者数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの火災死傷者数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動件数（人口千人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版 消防白書 第2章第5節1「救急業務の実施状況」（総務省消防庁）",
        "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r6/chapter2/section5/68130.html",
        "surveyedAt": "2026-09-16",
        "rationale": "消防白書は救急出動件数を救急業務の実施状況を示す基幹統計として毎年公表しており、過去最多を更新し続ける救急需要の逼迫を示す指標として位置付けている。人口千人当たりに換算することで都道府県間の救急体制への負荷を比較でき、火災と救急需要という章の救急面を代表する指標となる。",
        "adoptionCriteria": ["representativeness", "comparability", "readerValue"]
      }
    },
    {
      "rankingKey": "disaster-damage-amount-per-person",
      "shortLabel": "災害被害額（人口1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "令和7年版 防災白書 附属資料3「施設関係等被害額及び同被害額の国内総生産に対する比率の推移」（内閣府）",
        "sourceUrl": "https://www.bousai.go.jp/kaigirep/hakusho/r07/honbun/3b_6s_03_00.html",
        "surveyedAt": "2026-09-16",
        "rationale": "防災白書は施設関係等被害額の推移を国内総生産に対する比率とあわせて附属資料として毎年整理しており、自然災害による経済的損失を経年で把握するための公式統計として位置付けている。人口1人当たりに換算することで都道府県間の被害規模を人口規模に依存せず比較でき、自然災害の人的・住家被害と復旧支出という章の金銭的被害の側面を補う。",
        "adoptionCriteria": ["dataQuality", "complementarity"]
      }
    },
    {
      "rankingKey": "suicide-rate-per-100k",
      "shortLabel": "自殺率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "自殺死亡を治安評価に含めず、健康アウトカムとして対象定義を明示する。 主表示は「医療・健康」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "suicides-per-100k",
      "shortLabel": "自殺者数（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人当たりの自殺者数として定義を示し、補足指標への導線を保持する。 自殺率の別系列と定義・出典を照合し、並列KPI化しない。 主表示は「医療・健康」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "accidental-deaths-per-100k",
      "shortLabel": "不慮の事故による死亡者数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの不慮の事故による死亡者数として定義を示し、補足指標への導線を保持する。 不慮の事故死亡は交通以外も含む健康アウトカムとして扱う。 主表示は「医療・健康」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "police-officer-count-per-population",
      "shortLabel": "警察官数（人口千人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "社会・人口統計体系 社会生活統計指標－都道府県の指標－ 「Ｋ　安全」分類 統計表（総務省統計局・政府統計の総合窓口 e-Stat）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010211",
        "surveyedAt": "2026-09-16",
        "rationale": "この統計表は都道府県別の社会生活指標を「Ｋ　安全」という大分類にまとめており、警察官数（人口千人当たり）はその中の1項目（#K05103）として位置付けられている。犯罪の認知・検挙状況を扱う既存論点に対し、取締り・治安維持の人的体制という供給側の指標を加えることで、認知件数や検挙率の地域差を体制面から補完的に説明できる。",
        "adoptionCriteria": ["comparability", "complementarity"],
        "readerQuestion": "人口当たりの警察官数が多い都道府県ほど、犯罪の検挙率は高い傾向にあるか。",
        "targetReaderOrDecision": "都道府県の治安体制と犯罪統計の関係を確認したい読者。"
      }
    },
    {
      "rankingKey": "traffic-accident-injuries",
      "shortLabel": "交通事故負傷者数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "交通事故負傷者数は「交通事故の発生と人的被害」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "crime-count-arrest-rate-trend",
      "componentType": "mixed-chart",
      "title": "刑法犯認知件数（人口千人当たり）と検挙率の推移",
      "componentProps": {
        "columnSeriesRefs": [
          {
            "metricKey": "penal-code-offenses-recognized-per-1000"
          }
        ],
        "lineSeriesRefs": [
          {
            "metricKey": "criminal-arrest-rate"
          }
        ],
        "columnLabels": [
          "認知件数（人口千人当たり）"
        ],
        "lineLabels": [
          "検挙率"
        ],
        "leftUnit": "件/千人",
        "rightUnit": "%",
        "columnColors": [
          "count"
        ],
        "lineColors": [
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "penal-code-offenses-recognized-per-1000",
        "criminal-arrest-rate"
      ],
      "sourceName": "犯罪統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "crime",
      "sortOrder": 10,
      "annotation": "刑法犯認知件数は人口千人当たり、検挙率は認知件数に対する検挙件数の割合です。"
    },
    {
      "componentKey": "traffic-accident-deaths-trend",
      "componentType": "line-chart",
      "title": "交通事故 発生件数と負傷者数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "traffic-accident-count"
          },
          {
            "metricKey": "traffic-accident-injuries"
          }
        ],
        "labels": [
          "事故発生件数",
          "負傷者数"
        ],
        "seriesColors": [
          "count",
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "traffic-accident-count",
        "traffic-accident-injuries"
      ],
      "sourceName": "交通事故統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "traffic",
      "sortOrder": 20
    },
    {
      "componentKey": "fire-emergency-trend",
      "componentType": "line-chart",
      "title": "救急出動件数（人口千人当たり）の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "annual-emergency-dispatches-per-1000",
            "label": "救急出動件数（人口千人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "annual-emergency-dispatches-per-1000"
      ],
      "sourceName": "消防統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 30,
      "section": "fire-emergency"
    },
    {
      "componentKey": "fire-emergency-trend-fire",
      "componentType": "line-chart",
      "title": "火災出火件数（人口10万人当たり）の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "building-fire-count-per-100-thousand-people",
            "label": "火災出火件数（人口10万人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "building-fire-count-per-100-thousand-people"
      ],
      "sourceName": "消防統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 40,
      "annotation": "現在配信している2023年の人口10万人当たりの火災出火件数です。建物以外の火災も含みます。",
      "section": "fire-emergency"
    },
    {
      "componentKey": "safety-crime-types-donut",
      "componentType": "donut-chart",
      "title": "罪種別 刑法犯認知件数の内訳（2023年）",
      "componentProps": {
        "topN": 5,
        "seriesRefs": [
          {
            "metricKey": "theft-offenses-recognized",
            "label": "窃盗犯",
            "colorRole": "population"
          },
          {
            "metricKey": "violent-crime-per-100k",
            "label": "粗暴犯",
            "colorRole": "count"
          },
          {
            "metricKey": "intellectual-crime-per-100k",
            "label": "知能犯",
            "colorRole": "special"
          },
          {
            "metricKey": "theme-prostitution-crime-recognition-count",
            "label": "風俗犯",
            "colorRole": "series-6"
          },
          {
            "metricKey": "serious-crime-per-100k",
            "label": "凶悪犯",
            "colorRole": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "criminal-recognition-count"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系（警察庁 犯罪統計）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "crime",
      "sortOrder": 50
    },
    {
      "componentKey": "safety-fire-casualties-donut",
      "componentType": "donut-chart",
      "title": "火災による死傷者の内訳（2023年）",
      "componentProps": {
        "topN": 2,
        "seriesRefs": [
          {
            "metricKey": "theme-fire-injured-count",
            "label": "火災負傷者",
            "colorRole": "count"
          },
          {
            "metricKey": "fire-deaths-per-100k",
            "label": "火災死亡者",
            "colorRole": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "fire-deaths-per-100k"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系（消防庁 火災年報）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "fire-emergency",
      "sortOrder": 60
    }
  ],
  "evidenceTopics": [
    {
      "key": "recognized-crime-and-clearance",
      "lensKey": "outcomes",
      "title": "犯罪の認知状況と検挙状況",
      "question": "人口千人当たりの刑法犯認知件数と検挙率には、地域ごとにどのような差があるか",
      "summary": "刑法犯認知件数は警察が犯罪の発生を認知した事件数で、未認知の事件は含みません。主指標と推移図では人口千人当たりの値を使い、罪種別の内訳は総件数で表示します。検挙率は検挙した事件件数を認知件数で割った割合であり、検挙人員の割合ではありません。",
      "sourceKeys": [
        "npa-crime-statistics"
      ],
      "relatedRankingKeys": [
        "penal-code-offenses-recognized-per-1000",
        "criminal-arrest-rate"
      ],
      "relatedChartKeys": [
        "crime-count-arrest-rate-trend"
      ]
    },
    {
      "key": "traffic-accidents-and-injuries",
      "lensKey": "outcomes",
      "title": "交通事故の発生と人的被害",
      "question": "交通事故の発生件数と負傷者数には、地域ごとにどのような差があるか",
      "summary": "現在の交通事故統計は、人の死亡または負傷を伴う事故を対象とし、物損事故は含みません。発生件数は事故の数、負傷者数は重傷者と軽傷者の人数なので、同じ単位として足し合わせません。",
      "sourceKeys": [
        "npa-traffic-accident-statistics"
      ],
      "relatedRankingKeys": [
        "traffic-accident-count",
        "traffic-accident-injuries"
      ],
      "relatedChartKeys": [
        "traffic-accident-deaths-trend"
      ]
    }
  ],
  "keywords": [
    "犯罪",
    "刑法犯",
    "凶悪犯",
    "治安",
    "交通事故",
    "死者数",
    "火災",
    "救急",
    "災害",
    "自殺",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "crime",
      "title": "犯罪の認知と検挙",
      "description": "主指標は人口千人当たりの刑法犯認知件数です。検挙率とは別の尺度であり、認知件数には届け出や把握状況も影響します。",
      "metricGroupKeys": [
        "crime-1",
        "crime-2"
      ],
      "chartKeys": [
        "crime-count-arrest-rate-trend",
        "safety-crime-types-donut"
      ]
    },
    {
      "key": "traffic",
      "title": "交通事故の発生と人的被害",
      "description": "主指標は人口10万人当たりの事故件数・死者数・負傷者数です。総件数・総人数の推移図と分けて確認します。",
      "metricGroupKeys": [
        "traffic-1",
        "traffic-2"
      ],
      "chartKeys": [
        "traffic-accident-deaths-trend"
      ]
    },
    {
      "key": "fire-emergency",
      "title": "火災と救急需要",
      "description": "火災は人口10万人当たり、救急出動は人口千人当たりで比較します。火災死傷者の内訳は総人数です。",
      "metricGroupKeys": [
        "fire-emergency-1",
        "fire-emergency-2"
      ],
      "chartKeys": [
        "fire-emergency-trend",
        "fire-emergency-trend-fire",
        "safety-fire-casualties-donut"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "crime-1",
      "title": "刑法犯認知件数（人口千人当たり）",
      "rankingKeys": [
        "penal-code-offenses-recognized-per-1000"
      ],
      "defaultCheckedKeys": [
        "penal-code-offenses-recognized-per-1000"
      ]
    },
    {
      "key": "crime-2",
      "title": "検挙率",
      "rankingKeys": [
        "criminal-arrest-rate"
      ],
      "defaultCheckedKeys": [
        "criminal-arrest-rate"
      ]
    },
    {
      "key": "traffic-1",
      "title": "交通事故死者・負傷者数（人口10万人当たり）",
      "rankingKeys": [
        "traffic-accident-deaths-per-100k",
        "traffic-accident-injuries-per-100k"
      ],
      "defaultCheckedKeys": [
        "traffic-accident-deaths-per-100k",
        "traffic-accident-injuries-per-100k"
      ]
    },
    {
      "key": "traffic-2",
      "title": "交通事故発生件数（人口10万人当たり）",
      "rankingKeys": [
        "traffic-accident-count-per-population"
      ],
      "defaultCheckedKeys": [
        "traffic-accident-count-per-population"
      ]
    },
    {
      "key": "fire-emergency-1",
      "title": "人口当たりの火災・救急出動",
      "rankingKeys": [
        "building-fire-count-per-100-thousand-people",
        "annual-emergency-dispatches-per-1000"
      ],
      "defaultCheckedKeys": [
        "building-fire-count-per-100-thousand-people",
        "annual-emergency-dispatches-per-1000"
      ]
    },
    {
      "key": "fire-emergency-2",
      "title": "火災死者",
      "rankingKeys": [
        "fire-deaths-per-100k"
      ],
      "defaultCheckedKeys": [
        "fire-deaths-per-100k"
      ]
    }
  ]
};
