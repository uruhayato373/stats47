// OpenNext creates the target module before Wrangler bundles the Worker.
// This unchecked JavaScript bridge keeps the regular TypeScript check independent of build artifacts.
export {
  default,
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "../.open-next/worker.js";
