/**
 * 調査ハブ (/survey/<id>) の編集コンテンツ。
 *
 * 記録の正本は `data/surveys/editorial/editorial.json` (カタログの surveys.editorial。JSON Schema 付き)。
 * ここは型・読み込み・問いの必須数の関数だけを持つ。調査 id と指標キーの実在は check-datasets が refs で止める。
 * web の調査ハブは apps/web/src/features/survey/survey-editorial.ts を通してここを読む。
 */
import editorial from '../../../data/surveys/editorial/editorial.json';

export interface SurveyReaderQuestion {
  question: string;
  rankingKey: string;
}

export interface SurveyEditorialContent {
  summary: string;
  whatYouCanLearn: readonly string[];
  readerQuestions: readonly SurveyReaderQuestion[];
  caveats: readonly string[];
  /** ハブ冒頭の地域の表記。省略時は「47都道府県」。都市別の値を集める調査はここで言い換える */
  areaLabel?: string;
  /** 「この調査を使う記事」の先頭に置く記事 (公開済みのものだけ出る)。残りは公開日の新しい順 */
  relatedArticleSlugs?: readonly string[];
}

export function requiredSurveyReaderQuestionCount(
  activeRankingCount: number
): number {
  return Math.min(3, Math.max(0, activeRankingCount));
}

const SURVEY_EDITORIAL_BY_ID: ReadonlyMap<string, SurveyEditorialContent> =
  new Map(
    (editorial.entries as ReadonlyArray<SurveyEditorialContent & { surveyId: string }>).map(
      ({ surveyId, ...content }) => [surveyId, content]
    )
  );

export function getSurveyEditorialContent(
  surveyKey: string
): SurveyEditorialContent | null {
  return SURVEY_EDITORIAL_BY_ID.get(surveyKey) ?? null;
}
