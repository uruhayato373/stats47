// clients
export { getR2Client } from "./clients/get-r2-client";

// operations
export { deleteFromR2, deleteMultipleFromR2, deletePrefixFromR2 } from "./operations/delete";
export { fetchFromR2, fetchFromR2AsJson, fetchFromR2AsString } from "./operations/fetch";
export { listFromR2, listFromR2WithSize } from "./operations/list";
export { writeR2Staging, type WriteR2StagingResult } from "./operations/write-staging";
export { carryTimestamp, latestTimestamp, readPublishedSnapshot } from "./operations/stable-snapshot";
export {
  createSnapshotReader,
  type SnapshotReader,
  type SnapshotReaderOptions,
  type SnapshotReadResult,
} from "./operations/snapshot-reader";

// utils
export { formatBytes } from "./utils/format-bytes";
export { shouldSkipRemoteR2Read } from "./utils/should-skip-remote-r2-read";
