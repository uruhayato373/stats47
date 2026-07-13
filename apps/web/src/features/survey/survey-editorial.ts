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
  'wage-structure-survey': {
    summary:
      '賃金構造基本統計調査は、厚生労働省が毎年実施する賃金の基幹統計です。大工やソフトウェア作成者など職種別の平均年収から、初任給、パートの時給、労働時間まで、性別・学歴などの区分で都道府県の賃金水準を比較できます。',
    whatYouCanLearn: [
      '大工からITエンジニアまで、職種ごとの平均年収の地域差',
      '男女の賃金格差と所定内給与の水準',
      '大卒・高卒など学歴と性別ごとの初任給の都道府県差',
      'パート労働者の時給と月間実労働時間の違い',
    ],
    readerQuestions: [
      {
        question: '大工の平均年収が高い都道府県は？',
        rankingKey: 'carpenter-annual-income',
      },
      {
        question: 'ソフトウェア作成者（SE・プログラマー）の平均年収が高い都道府県は？',
        rankingKey: 'software-engineer-annual-income',
      },
      {
        question: '理学療法士等の平均年収が高い都道府県は？',
        rankingKey: 'physical-therapist-annual-income',
      },
      {
        question: '公認会計士・税理士の平均年収が高い都道府県は？',
        rankingKey: 'accountant-annual-income',
      },
      {
        question: '管理職（管理的職業従事者）の平均年収が高い都道府県は？',
        rankingKey: 'manager-annual-income',
      },
    ],
    caveats: [
      '「平均年収」は、きまって支給する現金給与と年間賞与などから算出した額面の推計値です。手取りではなく、所定内給与・初任給・時給とも定義が異なるため、種類の違う指標同士を直接比較しないでください。',
      '職種別の値は、性別・年齢・勤続年数・企業規模など標本の構成に影響されます。順位の差がそのまま同じ人の待遇差を意味するわけではなく、都道府県の平均値から個人の給与は予測できません。',
      '物価や家賃など生活費を控除した可処分所得のランキングではありません。地域の生活コストと合わせて読む必要があります。',
      '「理学療法士等」「公認会計士・税理士」「管理的職業従事者」のように複数の職種をまとめた区分があります。職種の正確な範囲は、各ランキングページの定義・出典で確認してください。最新データは2023年調査です。',
      '2020年に調査の推計方法と職種区分が変わりました。2019年以前の旧系列と現行の数値は接続しない場合があるため、時系列で比較するときは注意してください。',
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
