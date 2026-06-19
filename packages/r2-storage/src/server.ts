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
    saveToR2,
    shouldSkipRemoteR2Read,
    type SnapshotReaderOptions
} from "./lib";

export { assertR2WriteAllowed } from "./scripts/_assert-ci-write";
