export interface SurveyReaderQuestion {
  question: string;
  rankingKey: string;
}

export interface SurveyEditorialContent {
  summary: string;
  whatYouCanLearn: readonly string[];
  readerQuestions: readonly SurveyReaderQuestion[];
  caveats: readonly string[];
}

const SURVEY_EDITORIAL_CONTENT = {
  census: {
    summary:
      '国勢調査は、日本に住むすべての人と世帯を対象に5年ごとに行われる基幹統計です。人口だけでなく、年齢、配偶関係、世帯構成、就業状態などから地域の姿を比較できます。',
    whatYouCanLearn: [
      '年齢・性別ごとの人口構成と地域差',
      '未婚率や単独世帯割合など世帯構成の違い',
      '高齢世帯や生産年齢人口の地域的な偏り',
      '昼間人口・流入人口から見た都市の通勤通学構造',
    ],
    readerQuestions: [
      {
        question: '30代前半男性の未婚率が高い都道府県は？',
        rankingKey: 'unmarried-ratio-male-30-34',
      },
      {
        question: '一人暮らし世帯が多い都道府県は？',
        rankingKey: 'single-person-household-ratio',
      },
      {
        question: '高齢者の一人暮らしが多い都道府県は？',
        rankingKey: 'single-person-household-old-population-ratio',
      },
      {
        question: '生産年齢人口の割合が高い都道府県は？',
        rankingKey: 'production-age-population-ratio',
      },
      {
        question: '昼間に人口が集まる都道府県は？',
        rankingKey: 'day-time-population-ratio',
      },
    ],
    caveats: [
      '割合は母数によって意味が変わります。未婚率なら、性別や年齢階級が同じ指標同士で比較してください。',
      '国勢調査は5年ごとの特定時点を捉える調査です。毎年の変化を見る場合は、人口推計など他の統計も併用します。',
      '順位だけでは地域差の原因は分かりません。年齢構成、人口移動、都市化など複数の背景を分けて考える必要があります。',
    ],
  },
} as const satisfies Record<string, SurveyEditorialContent>;

export function getSurveyEditorialContent(
  surveyKey: string
): SurveyEditorialContent | null {
  if (!(surveyKey in SURVEY_EDITORIAL_CONTENT)) return null;

  return SURVEY_EDITORIAL_CONTENT[
    surveyKey as keyof typeof SURVEY_EDITORIAL_CONTENT
  ];
}
