/** note 商品展開ファクトリー 公開 API。 */
export * from "./types";
export * from "./series";
export * from "./pricing";
export { CANONICAL_ARTICLES } from "./article-plan";
export {
  NOTE_PRODUCT_MAPPINGS,
  buildNoteMappings,
  buildArticleIndex,
  dispositionFor,
} from "./product-note-mapping";
export {
  validateNoteChannel,
  checkCoverage,
  checkDuplication,
  checkClaims,
  checkPaidBoundary,
  scanText,
  BANNED_PHRASES,
} from "./validators";
export type { NoteChannelValidation, NoteIssue, NoteValidationResult } from "./validators";
