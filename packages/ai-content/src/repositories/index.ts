// 完全DBレス (Phase F): D1 ai_content repository は削除。
// runtime は R2 reader (read-ranking-ai-content-snapshot) を使う。
export { readRankingAiContentFromR2 } from "./read-ranking-ai-content-snapshot";
