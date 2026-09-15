import { createRequire } from "node:module";

/**
 * 会社ネットワーク等、直接の外向き通信が遮断され明示CONNECTだけが通る環境向け。
 * CIではHTTPS_PROXYが無いのでdispatcherはundefined = 従来どおり素のfetch。
 * 手本: .claude/scripts/audit/theme-chart-live-audit.mjs の resolveDispatcher。
 */
export function resolveDispatcher(): unknown {
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY;
  if (!proxy) return undefined;
  try {
    const { ProxyAgent } = createRequire(import.meta.url)("undici");
    return new ProxyAgent(proxy);
  } catch {
    return undefined;
  }
}
