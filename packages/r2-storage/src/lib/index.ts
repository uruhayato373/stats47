// clients
export { createS3Client } from "./clients/create-s3-client";
export { getR2Client } from "./clients/get-r2-client";

// operations
export { deleteFromR2, deleteMultipleFromR2, deletePrefixFromR2 } from "./operations/delete";
export { fetchFromR2, fetchFromR2AsJson, fetchFromR2AsString } from "./operations/fetch";
export { listFromR2, listFromR2WithSize } from "./operations/list";
export { saveToR2 } from "./operations/save";

// utils
export { calculateBodySize } from "./utils/calculate-body-size";
export { convertBodyForR2 } from "./utils/convert-body-for-r2";
export { detectEnvironment } from "./utils/detect-environment";

// errors
export { handleR2Error } from "./errors/handle-r2-error";
