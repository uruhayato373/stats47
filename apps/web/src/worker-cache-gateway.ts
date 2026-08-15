import { WorkerEntrypoint, type WorkerExecutionContext } from "cloudflare:workers";

import { shouldBypassPageCache } from "./lib/cache-policy";
import openNextWorker, {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "./open-next-worker-proxy.js";

import type { CloudflareEnv } from "@opennextjs/cloudflare";

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };

type CachedAppBinding = {
  fetch(request: Request): Promise<Response>;
};

/**
 * Workers Cache を有効にする内部 entrypoint。
 * 外側の gateway が共有可能と判定した GET / HEAD だけをここへ渡す。
 */
export class CachedApp extends WorkerEntrypoint<CloudflareEnv> {
  override fetch(request: Request): Promise<Response> {
    return openNextWorker.fetch(request, this.env, this.ctx);
  }
}

/**
 * 認証・preview・RSC を Worker 実行前キャッシュから除外する gateway。
 * default entrypoint 自体は wrangler.toml で cache.enabled=false に固定する。
 */
export default {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response> {
    if (shouldBypassPageCache(request)) {
      return openNextWorker.fetch(request, env, ctx);
    }

    const cachedApp = ctx.exports.CachedApp as CachedAppBinding;
    return cachedApp.fetch(request);
  },
};
