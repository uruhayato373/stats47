import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const WEB_ROOT = resolve(import.meta.dirname, "../..");
const PROJECT_ROOT = resolve(WEB_ROOT, "../..");

function readProjectFile(relativePath: string): string {
  return readFileSync(resolve(PROJECT_ROOT, relativePath), "utf8");
}

function findRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return findRouteFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

describe("Cloudflare Workers Cache configuration", () => {
  const wrangler = readFileSync(resolve(WEB_ROOT, "wrangler.toml"), "utf8");

  it("gatewayは常時実行し、安全な内部entrypointだけproductionで有効にする", () => {
    expect(wrangler).toContain('main = "src/worker-cache-gateway.ts"');
    expect(wrangler).toMatch(/\[cache\]\s+enabled = false/);
    expect(wrangler).toMatch(/\[env\.production\.cache\][\s\S]*?enabled = false/);
    expect(wrangler).toMatch(
      /\[env\.production\.exports\.CachedApp\.cache\][\s\S]*?enabled = true/,
    );
    // 既定のversion分離を維持し、deployで旧HTMLを自動無効化する。
    expect(wrangler).not.toContain("cross_version_cache = true");
  });

  it("gatewayがRSC・認証系をOpenNextへ直送し、安全なrequestだけCachedAppへ渡す", () => {
    const gateway = readFileSync(resolve(WEB_ROOT, "src/worker-cache-gateway.ts"), "utf8");
    const openNextProxy = readFileSync(
      resolve(WEB_ROOT, "src/open-next-worker-proxy.js"),
      "utf8",
    );
    expect(gateway).toContain("shouldBypassPageCache(request)");
    expect(gateway).toContain("openNextWorker.fetch(request, env, ctx)");
    expect(gateway).toContain("ctx.exports.CachedApp");
    expect(gateway).toContain('from "./open-next-worker-proxy.js"');
    expect(openNextProxy).toContain('from "../.open-next/worker.js"');
  });

  it("Workers Cache対応版のWranglerとworkers typesを固定する", () => {
    const packageJson = JSON.parse(readFileSync(resolve(WEB_ROOT, "package.json"), "utf8")) as {
      devDependencies: Record<string, string>;
    };
    expect(packageJson.devDependencies.wrangler).toBe("^4.126.0");
    expect(packageJson.devDependencies["@cloudflare/workers-types"]).toBe("^5.20260825.1");
  });
});

describe("Workers Cache invalidation wiring", () => {
  const publisherWorkflows = [
    ".github/workflows/blog-auto-publish.yml",
    ".github/workflows/commute-flow-ingest.yml",
    ".github/workflows/data-refresh.yml",
    ".github/workflows/publish-affiliate-ads.yml",
    ".github/workflows/publish-ai-content.yml",
    ".github/workflows/publish-blog.yml",
    ".github/workflows/regenerate-blog-svgs.yml",
    ".github/workflows/sync-rakuten-catalog.yml",
    ".github/workflows/sync-snapshots.yml",
  ];

  it.each(publisherWorkflows)("%s がWorker cache purgeを実行する", (workflowPath) => {
    const workflow = readProjectFile(workflowPath);
    expect(workflow).toContain("WORKER_CACHE_PURGE_SECRET");
    expect(workflow).toContain("purge-worker-cache.ts");
  });

  it("deploy workflowがpurge secretをWorkerへ設定する", () => {
    const workflow = readProjectFile(".github/workflows/deploy-workers.yml");
    expect(workflow).toContain('set_secret "WORKER_CACHE_PURGE_SECRET"');
    expect(workflow).toContain('if [ -z "$WORKER_CACHE_PURGE_SECRET" ]');
    expect(workflow).toContain('main = "src/worker-cache-gateway.ts"');
    expect(workflow).toContain('from "../.open-next/worker.js"');
    expect(workflow).not.toContain('main = ".open-next/worker.js"');
  });

  it("deploy prebuildが検索index専用processでCloudflare資格情報を変換する", () => {
    const workflow = readProjectFile(".github/workflows/deploy-workers.yml");
    const generator = readProjectFile("apps/web/scripts/generate-search-index.ts");
    expect(workflow).toContain(
      "CLOUDFLARE_R2_ACCESS_KEY_ID: ${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}",
    );
    expect(workflow).toContain(
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}",
    );
    expect(generator).toContain("configureSearchIndexR2Environment(process.env)");
    expect(workflow).not.toMatch(/^\s+R2_ACCESS_KEY_ID:/m);
  });
});

describe("API cache safety contract", () => {
  const apiRoutes = findRouteFiles(resolve(WEB_ROOT, "src/app/api"));

  it.each(apiRoutes)("%s が失敗応答を明示的にno-storeへできる", (routePath) => {
    const source = readFileSync(routePath, "utf8");
    expect(source).toMatch(/NO_STORE_CACHE_HEADERS|private, no-store/);
  });
});
