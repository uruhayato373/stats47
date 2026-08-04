// src/types/cloudflare.d.ts

import type { AnalyticsEngineDataset, R2Bucket } from "@cloudflare/workers-types";

declare module "@opennextjs/cloudflare" {
  export interface CloudflareEnv {
    STATS47_BUCKET: R2Bucket;
    NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
    ANALYTICS?: AnalyticsEngineDataset;
  }

  export interface CloudflareContext {
    env: CloudflareEnv;
    cf?: {
      colo?: string;
      country?: string;
      city?: string;
    };
    ctx?: ExecutionContext;
  }

  export function getCloudflareContext(options?: { async?: boolean }): CloudflareContext;
  export function getCloudflareContext(options: { async: true }): Promise<CloudflareContext>;
}
