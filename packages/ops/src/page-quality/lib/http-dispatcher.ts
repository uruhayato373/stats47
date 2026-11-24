import { createRequire } from "node:module";

/**
 * 会社ネットワーク等、直接の外向き通信が遮断され明示CONNECTだけが通る環境向け。
 * CIではHTTPS_PROXYが無いのでdispatcherはundefined = 従来どおり素のfetch。
 * 手本: .claude/scripts/audit/theme-chart-live-audit.mjs の resolveDispatcher。
 */
export function isLoopbackUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function resolveDispatcher(url?: string): unknown {
  if (isLoopbackUrl(url)) return undefined;
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY;
  if (!proxy) return undefined;
  try {
    const { ProxyAgent } = createRequire(import.meta.url)("undici");
    return new ProxyAgent(proxy);
  } catch {
    return undefined;
  }
}
