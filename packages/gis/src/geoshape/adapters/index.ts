/**
 * Geoshapeドメイン - Adapter層
 *
 * 外部API・R2 への HTTP 通信を担当。
 * Repository層からHTTP通信の詳細を分離し、責務を明確化。
 */

export {
  fetchFromExternalAPI,
  isExternalAPIAvailable,
} from "./geoshape-api-client";

export {
  fetchTopologyFromR2,
  isR2GeoshapeAvailable,
} from "./fetch-topology-from-r2";
