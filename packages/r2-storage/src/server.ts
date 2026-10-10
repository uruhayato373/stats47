import "server-only";

export {
    createSnapshotReader,
    deleteFromR2,
    deleteMultipleFromR2,
    deletePrefixFromR2,
    fetchFromR2,
    fetchFromR2AsJson,
    fetchFromR2AsString,
    getR2Client,
    listFromR2,
    listFromR2WithSize,
    writeR2Staging,
    carryTimestamp,
    latestTimestamp,
    readPublishedSnapshot,
    shouldSkipRemoteR2Read,
    type SnapshotReader,
    type SnapshotReaderOptions,
    type SnapshotReadResult
} from "./lib";

export { assertR2WriteAllowed } from "./scripts/_assert-ci-write";
