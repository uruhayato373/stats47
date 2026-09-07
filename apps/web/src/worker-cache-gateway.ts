import { WorkerEntrypoint, type WorkerExecutionContext } from "cloudflare:workers";

import { enforcePageCacheBypass, shouldBypassPageCache } from "./lib/cache-policy";
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
 *
 * ここは **flight ヘッダーが残っている唯一の層**。Next.js の middleware adapter は
 * NextRequest を作る前に rsc / next-router-* を削除するため、middleware は RSC を
 * 判定できず HTML 用の共有キャッシュ指示を付けてしまう。出口で必ず是正する。
 */
export default {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response> {
    const response = shouldBypassPageCache(request)
      ? await openNextWorker.fetch(request, env, ctx)
      : await (ctx.exports.CachedApp as CachedAppBinding).fetch(request);

    return enforcePageCacheBypass(request, response);
  },
};
