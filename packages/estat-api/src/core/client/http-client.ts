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
    logger.debug({ proxyConfigured: true }, "HTTP Client: ProxyAgent 初期化");
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

function redactRequestSecrets(text: string, params: Record<string, unknown>): string {
  let redacted = text;
  for (const [key, value] of Object.entries(params)) {
    if (!/(appid|token|secret|api[_-]?key|password|credential|signature)/i.test(key) || value == null || value === "") continue;
    const secret = String(value);
    const encoded = new URLSearchParams({ value: secret }).toString().slice("value=".length);
    for (const form of new Set([secret, encodeURIComponent(secret), encoded])) {
      redacted = redacted.split(form).join("[REDACTED]");
    }
  }
  return redacted;
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
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
    timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    // @ts-ignore dispatcher は Node.js undici 拡張
    const response = await fetch(url, fetchOptions);
    await validateResponseStatus(response);
    const data = await response.json();
    return data as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const safeMessage = redactRequestSecrets(message, params);
    logger.error({ url: redactRequestSecrets(url, params), error: safeMessage }, "HTTP Client: リクエスト失敗");
    if (safeMessage !== message) {
      const safeError = new Error(safeMessage);
      if (error instanceof Error) safeError.name = error.name;
      throw safeError;
    }
    throw error;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}
