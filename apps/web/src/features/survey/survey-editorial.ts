/**
 * 調査ハブの編集コンテンツ。記録は data/surveys/editorial/editorial.json が正本で、
 * 型と読み込みは packages/data-configs/src/survey-editorial.ts。ここは web が読む入口。
 */
export {
  getSurveyEditorialContent,
  requiredSurveyReaderQuestionCount,
  type SurveyEditorialContent,
  type SurveyReaderQuestion,
} from '@stats47/data-configs/survey-editorial';
