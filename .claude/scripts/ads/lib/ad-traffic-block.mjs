/**
 * ad-traffic-block.mjs — 自動の閲覧で広告・計測の通信を出さない (AD-LAYOUT-WEEKLY-CAPTURE-01)
 * ---------------------------------------------------------------------------
 * 広告の配置の撮影 (capture-ad-layout.ts) が本番を開くと、そのままでは自動の閲覧が AdSense の表示・
 * GA4 の計測・アフィリエイトの表示の記録に混ざる。Playwright の context に差し込み、広告・計測の host への
 * 要求をブラウザから出る前に中断する。
 *
 * 設計:
 *   - 判定は純関数 (`classifyAdTraffic`)。host の末尾一致と、Google の共用 host のパスの先頭で決める
 *   - 本番 (手元の開発サーバー以外) では必ず止める (`requiresAdTrafficBlock`)。外す引数は作らない
 *   - 止めた件数・止めるはずなのに応答が返った件数・一覧に無い外部の host を記録し、撮影のログと manifest に出す。
 *     下の一覧が広告・計測の host を網羅している保証は無いので、一覧に無い外部の host は人が読んで足す
 */

/** @typedef {"adsense" | "analytics" | "affiliate"} AdTrafficKind */

/**
 * 止める host (末尾一致)。stats47 が読み込む広告・計測のスクリプト (AdSense・gtag・A8 のリンク管理) と、
 * 広告の台帳 (data/affiliate/ledger/ads.json) のクリック先・画像・計測ピクセルの host から決めた。
 * @type {ReadonlyArray<{ suffix: string, kind: AdTrafficKind }>}
 */
export const AD_TRAFFIC_HOST_RULES = [
  { suffix: "googlesyndication.com", kind: "adsense" },
  { suffix: "doubleclick.net", kind: "adsense" },
  { suffix: "googleadservices.com", kind: "adsense" },
  { suffix: "googletagservices.com", kind: "adsense" },
  { suffix: "adtrafficquality.google", kind: "adsense" },
  { suffix: "fundingchoicesmessages.google.com", kind: "adsense" },
  { suffix: "2mdn.net", kind: "adsense" },
  { suffix: "googletagmanager.com", kind: "analytics" },
  { suffix: "google-analytics.com", kind: "analytics" },
  { suffix: "analytics.google.com", kind: "analytics" },
  { suffix: "a8.net", kind: "affiliate" },
  { suffix: "moshimo.com", kind: "affiliate" },
  { suffix: "afi-b.com", kind: "affiliate" },
  { suffix: "valuecommerce.com", kind: "affiliate" },
  { suffix: "afl.rakuten.co.jp", kind: "affiliate" },
  { suffix: "affiliate.rakuten.co.jp", kind: "affiliate" },
];

/** Google の共用 host は地図の埋め込みなども配るので、広告のパスだけを止める */
const GOOGLE_SHARED_HOST = /^(?:www\.)?google\.(?:com|co\.jp)$/;
const GOOGLE_AD_PATH_PREFIXES = ["/pagead/", "/ads/", "/adsense/", "/ccm/"];

/** @param {string | URL} url */
function parseHttpUrl(url) {
  try {
    const parsed = url instanceof URL ? url : new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 広告・計測の通信なら種類を、そうでなければ null を返す (純関数)。
 * @param {string | URL} url
 * @returns {AdTrafficKind | null}
 */
export function classifyAdTraffic(url) {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  const rule = AD_TRAFFIC_HOST_RULES.find((r) => host === r.suffix || host.endsWith(`.${r.suffix}`));
  if (rule) return rule.kind;
  if (GOOGLE_SHARED_HOST.test(host) && GOOGLE_AD_PATH_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix))) return "adsense";
  return null;
}

/**
 * この接続先で通信を必ず止めるか。手元の開発サーバーだけは止めない (代わりの広告の画像を写すため)。
 * 読めない URL は止める側に倒す。
 * @param {string} baseUrl
 */
export function requiresAdTrafficBlock(baseUrl) {
  const parsed = parseHttpUrl(baseUrl);
  if (!parsed) return true;
  const host = parsed.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost");
  return !isLocal;
}

/** Service Worker が出す通信は route を通らないので、context を作るときに Service Worker を止める */
export const AD_TRAFFIC_CONTEXT_OPTIONS = Object.freeze({ serviceWorkers: /** @type {const} */ ("block") });

/**
 * @typedef {object} AdTrafficTally
 * @property {string | null} baseHost 撮る先の host (外部の host の判定に使う)
 * @property {Record<AdTrafficKind, number>} blocked 止めた要求の数 (種類ごと)
 * @property {string[]} leaked 止めるはずなのに応答が返った URL
 * @property {Record<string, number>} passedThirdPartyHosts 一覧に無く、通した外部の host と要求の数
 */

/**
 * 1 回の撮影の記録。context ごとに差し込み、同じ記録へ足していく。
 * @param {string} baseUrl
 * @returns {AdTrafficTally}
 */
export function createAdTrafficTally(baseUrl) {
  return {
    baseHost: parseHttpUrl(baseUrl)?.hostname.toLowerCase() ?? null,
    blocked: { adsense: 0, analytics: 0, affiliate: 0 },
    leaked: [],
    passedThirdPartyHosts: {},
  };
}

/**
 * context に遮断を差し込む。ページを開く前 (context.newPage() の前) に呼ぶ。
 * @param {Pick<import("playwright").BrowserContext, "route" | "on">} context
 * @param {AdTrafficTally} tally
 */
export async function installAdTrafficBlock(context, tally) {
  await context.route(
    (url) => classifyAdTraffic(url) !== null,
    async (route) => {
      const kind = classifyAdTraffic(route.request().url());
      if (kind) tally.blocked[kind] += 1;
      await route.abort("blockedbyclient");
    },
  );
  // 中断した要求には応答が無い。止めるはずの URL に応答が返ったら、遮断をすり抜けている
  context.on("response", (response) => {
    if (classifyAdTraffic(response.url()) !== null) tally.leaked.push(response.url());
  });
  context.on("request", (request) => {
    const parsed = parseHttpUrl(request.url());
    if (!parsed || classifyAdTraffic(parsed) !== null) return;
    const host = parsed.hostname.toLowerCase();
    if (host === tally.baseHost) return;
    tally.passedThirdPartyHosts[host] = (tally.passedThirdPartyHosts[host] ?? 0) + 1;
  });
}

/**
 * manifest に書く形。
 * @param {AdTrafficTally} tally
 */
export function summarizeAdTraffic(tally) {
  const blocked = { ...tally.blocked };
  return {
    blocked,
    blockedTotal: blocked.adsense + blocked.analytics + blocked.affiliate,
    leaked: [...new Set(tally.leaked)],
    passedThirdPartyHosts: Object.fromEntries(Object.entries(tally.passedThirdPartyHosts).sort(([a], [b]) => a.localeCompare(b))),
  };
}

/**
 * 撮影のログの 1 行。
 * @param {AdTrafficTally} tally
 */
export function formatAdTrafficSummary(tally) {
  const { blocked, blockedTotal, leaked, passedThirdPartyHosts } = summarizeAdTraffic(tally);
  const hosts = Object.entries(passedThirdPartyHosts).map(([host, count]) => `${host} ${count}`);
  return [
    `広告・計測の通信: 止めた ${blockedTotal} 件 (AdSense ${blocked.adsense}・計測 ${blocked.analytics}・アフィリエイト ${blocked.affiliate})`,
    `通った ${leaked.length} 件`,
    `一覧に無い外部の host ${hosts.length} 種${hosts.length ? ` (${hosts.join(", ")})` : ""}`,
  ].join("・");
}
