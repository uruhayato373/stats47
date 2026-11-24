/**
 * live-http — production HTTP probe (read-only GET・credential 不要)。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md
 * (read-only smoke は許可)。
 * Googlebot UA と通常 UA の status 差を見て、5xx / soft-404(thin 200) / noindex / redirect を実測する。
 * mutation はしない (GET のみ)。ログに query/secret を出さない。
 */
const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const NORMAL_UA = "Mozilla/5.0 (search-growth read-only probe)";

const NOT_FOUND_MARKERS = [
  "が見つかりません", // ランキング/地域/市区町村が見つかりません
  "ページが見つかりません",
  "notFound",
];

async function fetchOnce(url, ua, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": ua, accept: "text/html" }, signal: ctrl.signal });
    const ttfb = Date.now() - start;
    let body = "";
    // 本文は先頭のみ読む (thin/noindex 判定に十分)。全文は読まない。
    if (res.status >= 200 && res.status < 300) {
      const text = await res.text();
      body = text.slice(0, 20000);
    } else {
      // consume body to release socket
      await res.text().catch(() => {});
    }
    return { status: res.status, contentType: res.headers.get("content-type") || "", location: res.headers.get("location") || null, ttfb, body };
  } finally {
    clearTimeout(t);
  }
}

/** 1 URL を Googlebot UA (+ 通常 UA) で probe する。read-only。 */
export async function probeUrl(url, { timeoutMs = 10000, alsoNormalUa = true } = {}) {
  const out = { url, ok: true };
  try {
    const g = await fetchOnce(url, GOOGLEBOT_UA, timeoutMs);
    out.statusGooglebot = g.status;
    out.contentType = g.contentType;
    out.ttfbMs = g.ttfb;
    out.redirectLocation = g.location;
    const isHtml = /text\/html/i.test(g.contentType);
    const body = g.body || "";
    out.bodyLen = body.length;
    out.truncated = body.length >= 20000; // 20KB で打ち切った = 実 body はさらに長い
    out.notFoundText = isHtml && NOT_FOUND_MARKERS.some((m) => body.includes(m));
    // thin 判定: 信頼できる not-found マーカーを主とし、長さ heuristic は「全文を読めた短いページ」に限定する
    // (head/inline 資産で先頭 20KB が埋まる大きなページを thin と誤判定しない)。
    out.thinContent = g.status === 200 && isHtml && (out.notFoundText || (!out.truncated && textLength(body) < 400));
    out.noindex = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(body) || /<meta[^>]+noindex[^>]*name=["']robots["']/i.test(body);
    out.emptyR2Body = g.status === 200 && out.notFoundText;
    if (alsoNormalUa) {
      try {
        const n = await fetchOnce(url, NORMAL_UA, timeoutMs);
        out.statusNormal = n.status;
        out.uaStatusDiff = n.status !== g.status;
      } catch {
        out.statusNormal = null;
      }
    }
  } catch (err) {
    out.ok = false;
    out.error = String(err?.name === "AbortError" ? "timeout" : err?.message || err).slice(0, 120);
  }
  return out;
}

/** 複数 URL を控えめな並列度で probe する (本番サイトを叩きすぎない)。 */
export async function probeUrls(urls, { concurrency = 4, timeoutMs = 10000 } = {}) {
  const results = [];
  const queue = [...urls];
  async function worker() {
    while (queue.length) {
      const u = queue.shift();
      results.push(await probeUrl(u, { timeoutMs }));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  // 決定的順序に戻す (入力順)
  const order = new Map(urls.map((u, i) => [u, i]));
  results.sort((a, b) => order.get(a.url) - order.get(b.url));
  return results;
}

/** HTML の可視テキスト量をおおまかに測る (タグ/空白除去)。 */
function textLength(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

export { GOOGLEBOT_UA, NORMAL_UA, NOT_FOUND_MARKERS, textLength };
