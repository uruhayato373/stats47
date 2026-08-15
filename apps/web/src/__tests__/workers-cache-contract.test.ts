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

  it("developmentでは無効、productionでは有効にする", () => {
    expect(wrangler).toMatch(/\[cache\]\s+enabled = false/);
    expect(wrangler).toMatch(/\[env\.production\.cache\]\s+enabled = true/);
    // 既定のversion分離を維持し、deployで旧HTMLを自動無効化する。
    expect(wrangler).not.toContain("cross_version_cache = true");
  });

  it("Workers Cache対応版のWranglerとworkers typesを固定する", () => {
    const packageJson = JSON.parse(readFileSync(resolve(WEB_ROOT, "package.json"), "utf8")) as {
      devDependencies: Record<string, string>;
    };
    expect(packageJson.devDependencies.wrangler).toBe("^4.123.0");
    expect(packageJson.devDependencies["@cloudflare/workers-types"]).toBe("^5.20260815.1");
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
  });
});

describe("API cache safety contract", () => {
  const apiRoutes = findRouteFiles(resolve(WEB_ROOT, "src/app/api"));

  it.each(apiRoutes)("%s が失敗応答を明示的にno-storeへできる", (routePath) => {
    const source = readFileSync(routePath, "utf8");
    expect(source).toMatch(/NO_STORE_CACHE_HEADERS|private, no-store/);
  });
});
