import { NextResponse } from "next/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  createPageCachePurgeTags,
  DATA_CACHE_TAG,
} from "@/lib/cache-policy";

const MAX_URLS_PER_REQUEST = 100;

interface PurgeRequestBody {
  purgeAll?: unknown;
  purgeData?: unknown;
  urls?: unknown;
}

interface WorkerCachePurgeContext {
  cache?: {
    purge(options: { tags: string[] } | { purgeEverything: true }): Promise<{
      success: boolean;
      errors: Array<{ code: number; message: string }>;
    }>;
  };
}

interface WorkersSubtleCrypto extends SubtleCrypto {
  timingSafeEqual?(a: ArrayBuffer | ArrayBufferView, b: ArrayBuffer | ArrayBufferView): boolean;
}

function jsonResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function hasValidBearerToken(request: Request, expectedToken: string): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const actualToken = authorization.slice("Bearer ".length);
  const encoder = new TextEncoder();
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(actualToken)),
    crypto.subtle.digest("SHA-256", encoder.encode(expectedToken)),
  ]);

  const actualBytes = new Uint8Array(actualHash);
  const expectedBytes = new Uint8Array(expectedHash);
  const subtleCrypto: WorkersSubtleCrypto = crypto.subtle;

  if (typeof subtleCrypto.timingSafeEqual === "function") {
    return subtleCrypto.timingSafeEqual(actualBytes, expectedBytes);
  }

  // Node.js 上の単体テストなど、Cloudflare 拡張が無い環境でも固定長 hash を全走査する。
  let difference = actualBytes.length ^ expectedBytes.length;
  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index] ^ (expectedBytes[index] ?? 0);
  }
  return difference === 0;
}

function resolveAllowedOrigin(): string {
  return new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://stats47.jp").origin;
}

function parsePagePathnames(urls: unknown): string[] | null {
  if (!Array.isArray(urls) || urls.length === 0 || urls.length > MAX_URLS_PER_REQUEST) {
    return null;
  }

  const allowedOrigin = resolveAllowedOrigin();
  const pathnames: string[] = [];
  for (const candidate of urls) {
    if (typeof candidate !== "string") return null;

    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      return null;
    }
    if (url.origin !== allowedOrigin) return null;
    pathnames.push(url.pathname);
  }
  return pathnames;
}

export async function POST(request: Request): Promise<NextResponse> {
  const expectedToken = process.env.WORKER_CACHE_PURGE_SECRET;
  if (!expectedToken) {
    return jsonResponse({ error: "Worker cache purge is not configured" }, 503);
  }
  if (!(await hasValidBearerToken(request, expectedToken))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: PurgeRequestBody;
  try {
    body = (await request.json()) as PurgeRequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const purgeAll = body.purgeAll === true;
  const purgeData = body.purgeData === true;
  const hasUrls = body.urls !== undefined;
  const pagePathnames = parsePagePathnames(body.urls);
  const operationCount = Number(purgeAll) + Number(purgeData) + Number(hasUrls);
  const tags = purgeData
      ? [DATA_CACHE_TAG]
      : createPageCachePurgeTags(pagePathnames ?? []);

  if (operationCount !== 1 || (!purgeAll && tags.length === 0)) {
    return jsonResponse(
      { error: `Specify exactly one of purgeAll, purgeData, or 1-${MAX_URLS_PER_REQUEST} allowed page URLs` },
      400,
    );
  }

  try {
    const { ctx } = await getCloudflareContext<Record<string, unknown>, WorkerCachePurgeContext>({
      async: true,
    });
    if (!ctx.cache) {
      return jsonResponse({ error: "Workers Cache runtime is unavailable" }, 503);
    }

    const result = await ctx.cache.purge(purgeAll ? { purgeEverything: true } : { tags });
    if (!result.success) {
      return jsonResponse({ error: "Worker cache purge failed", details: result.errors }, 502);
    }

    return jsonResponse({
      success: true,
      purgedEverything: purgeAll,
      purgedTags: tags.length,
    }, 200);
  } catch {
    return jsonResponse({ error: "Worker cache purge failed" }, 502);
  }
}
