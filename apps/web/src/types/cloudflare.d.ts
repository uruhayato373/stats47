// src/types/cloudflare.d.ts

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare module "@opennextjs/cloudflare" {
  export interface CloudflareEnv {
    STATS47_STATIC_DB: D1Database;
    STATS47_BUCKET: R2Bucket;
    // 他のバインディングがあれば追加
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

