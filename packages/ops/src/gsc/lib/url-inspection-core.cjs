/**
 * URL Inspection 日次測定の純粋な部分 (URL の正規化・日替わりの巡回・枠の配分・件数の切り詰め)。
 * 入口は url-inspection-daily.cjs (アプリの設定ファイルを読むためそちらに残す)。
 */

// 各グループの枠は「その日の検査件数」に対する割合で決める。静的ページ・都道府県・sitemap tag は
// 割合を持たず全件入れ、KNOWN_RANKING_KEYS は残り枠を使う。
const REMEDIATION_URL_SHARE = 0.5;
const OBSERVED_URL_SHARE = 0.25;
const GONE_RANKING_SHARE = 0.05;

function todayInTokyo(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * URL Inspection はフラグメントをサーバーへ送らないため、`/page#section` を
 * 別 URL として測る意味がない。GSC pages.csv にはサイトリンク由来の fragment URL が
 * 混ざるため、投入前に正規ページへ畳み込む。
 */
function normalizeInspectionUrl(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function uniqueNormalizedUrls(rawUrls, limit = Infinity) {
  const seen = new Set();
  const result = [];
  for (const raw of rawUrls) {
    const url = normalizeInspectionUrl(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
    if (result.length >= limit) break;
  }
  return result;
}

/** 全件を数日で巡回できるよう、日付で開始位置をずらす。 */
function rotateDaily(
  items,
  limit,
  dateString = todayInTokyo(),
) {
  if (items.length <= limit) return [...items];
  const day = Math.floor(
    new Date(`${dateString}T00:00:00.000Z`).getTime() / 86400000,
  );
  const start = (day * limit) % items.length;
  return Array.from({ length: limit }, (_, i) => items[(start + i) % items.length]);
}

/** 検査件数 maxUrls に対する各グループの枠。 */
function quotasFor(maxUrls) {
  return {
    remediation: Math.floor(maxUrls * REMEDIATION_URL_SHARE),
    observed: Math.floor(maxUrls * OBSERVED_URL_SHARE),
    gone: Math.floor(maxUrls * GONE_RANKING_SHARE),
    known: maxUrls,
  };
}

/** 優先度順に並んだ URL を正規化・重複排除し、maxUrls 件で切る。 */
function capUrls(ordered, maxUrls) {
  const seen = new Set();
  const result = [];
  let collapsed = 0;
  for (const raw of ordered) {
    const u = normalizeInspectionUrl(raw);
    if (!u) continue;
    if (!seen.has(u)) {
      seen.add(u);
      result.push(u);
    } else {
      collapsed++;
    }
    if (result.length >= maxUrls) break;
  }
  return { urls: result, collapsed };
}

module.exports = {
  GONE_RANKING_SHARE,
  OBSERVED_URL_SHARE,
  REMEDIATION_URL_SHARE,
  capUrls,
  normalizeInspectionUrl,
  quotasFor,
  rotateDaily,
  todayInTokyo,
  uniqueNormalizedUrls,
};
