import { logger } from "@stats47/logger";
import { APIResponseError } from "../types/index";
import { estatRateLimiter } from "../utils/index";

export interface HttpRequestCacheOptions {
  revalidate?: number;
  tags?: string[];
}

/**
 * プロキシ dispatcher を遅延生成（Node.js ローカル環境のみ）
 *
 * - HTTPS_PROXY / HTTP_PROXY 環境変数がある場合のみ有効
 * - Cloudflare Workers では undici が存在しないため安全にスキップ
 */
let _proxyDispatcher: unknown | null | undefined; // undefined = 未初期化
async function getProxyDispatcher(): Promise<unknown | null> {
  if (_proxyDispatcher !== undefined) return _proxyDispatcher;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) {
    _proxyDispatcher = null;
    return null;
  }
  try {
    const { ProxyAgent } = await import("undici");
    _proxyDispatcher = new ProxyAgent(proxyUrl);
    logger.debug({ proxyUrl }, "HTTP Client: ProxyAgent 初期化");
    return _proxyDispatcher;
  } catch {
    // undici が利用できない環境 (Cloudflare Workers 等)
    _proxyDispatcher = null;
    return null;
  }
}

function composeApiUrl(
  baseUrl: string,
  endpoint: string,
  params: Record<string, unknown>
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return `${baseUrl}${endpoint}?${searchParams.toString()}`;
}

async function validateResponseStatus(response: Response): Promise<void> {
  if (!response.ok) {
    throw new APIResponseError(
      `HTTP error! status: ${response.status}`,
      response.status
    );
  }
}

export async function executeHttpRequest<T>(
  baseUrl: string,
  endpoint: string,
  params: Record<string, unknown>,
  timeout: number = 25000,
  cacheOptions?: HttpRequestCacheOptions
): Promise<T> {
  const url = composeApiUrl(baseUrl, endpoint, params);

  try {
    await estatRateLimiter.acquire();

    const fetchOptions: RequestInit & { dispatcher?: unknown } = {
      method: "GET",
      headers: { Accept: "application/json" },
      // Next.jsのfetch拡張に対応。非Next.js環境でも無視される。
      // @ts-ignore
      next: cacheOptions ? { revalidate: cacheOptions.revalidate, tags: cacheOptions.tags } : undefined,
    };

    // ローカル環境のプロキシ対応
    const dispatcher = await getProxyDispatcher();
    if (dispatcher) {
      fetchOptions.dispatcher = dispatcher;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    // @ts-ignore dispatcher は Node.js undici 拡張
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    await validateResponseStatus(response);
    const data = await response.json();
    return data as T;
  } catch (error) {
    logger.error({ url, error: error instanceof Error ? error.message : String(error) }, "HTTP Client: リクエスト失敗");
    throw error;
  }
}
