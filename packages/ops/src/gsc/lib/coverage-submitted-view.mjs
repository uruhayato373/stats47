/** 「すべての送信済みページ」ビュー。値は 2026-11-11 に画面で確認 (SUBMITTED 等は HTTP 400)。 */
export const SUBMITTED_VIEW = "ALL_SUBMITTED_URLS";
export const SUBMITTED_VIEW_SLUG = "概要-送信済みビュー"; // ingest 側の SUBMITTED_MARKER と一致させる
export const submittedViewUrl = (indexUrl) => `${indexUrl}&pages=${SUBMITTED_VIEW}`;
