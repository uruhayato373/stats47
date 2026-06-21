// 完全DBレス (Phase F): findSurveyById / listSurveys は削除。
// survey は R2 snapshot リーダ (read-surveys-snapshot) のみを使う。
export {
  readSurveyByIdFromR2,
  readSurveysFromR2,
} from "./read-surveys-snapshot";
