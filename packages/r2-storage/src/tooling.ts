/** Node.js build scripts only. Unlike ./server this entry has no Next.js server-only guard. */
export { listFromR2, listFromR2WithSize, type R2ListedObject } from "./lib/operations/list";
export { deleteMultipleFromR2 } from "./lib/operations/delete";
export {
  fetchFromR2,
  fetchFromR2AsJson,
  fetchFromR2AsString,
} from "./lib/operations/fetch";
export { createS3ImageObjectStoreFromEnv } from "./image-pipeline";
export {
  publishExactR2Assets,
  resolveExactAssetCandidates,
  type ExactAssetCandidate,
} from "./scripts/push-exact-r2-assets-core";
export { assertR2WriteAllowed } from "./scripts/_assert-ci-write";
// 生成側が「この ranking は公開構造化データにできない」を publisher と同じ判定で知るため。
// 生成してから push で落とすと 1 件で task 全体が止まる (gis-data.md の公開構造化データ禁止)。
export {
  findKsjPublicStructuredOutputBlock,
  isKsjPublicStructuredOutputBlocked,
} from "./scripts/lib/ksj-publication-guard";
