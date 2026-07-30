/**
 * live-sitemap — 公開 sitemap.xml を read-only GET して URL 一覧を取る (credential 不要)。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * 注意: これは **sitemap.xml の内容 (掲載 URL 一覧)** の取得であり、GSC Sitemaps API の
 * submitted/pending/lastDownloaded/errors メタ (要 service account creds) とは別。API メタは live 未検証。
 * inSitemap 判定 (indexability-conflict) に使う。
 */
import { SITE_ORIGIN, toPathKey } from "./join-url.mjs";

const SITEMAP_UA = "Mozilla/5.0 (search-growth read-only sitemap fetch)";

async function get(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "user-agent": SITEMAP_UA, accept: "application/xml,text/xml" }, signal: ctrl.signal });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, text: await res.text() };
  } finally {
    clearTimeout(t);
  }
}

function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
  return locs;
}

/**
 * sitemap.xml (index 対応) を辿って掲載 URL の pathKey 集合を返す。
 * child sitemap と総 URL に上限を設け、本番を過剰に叩かない (超過時 partial)。
 * @returns {{ ok:boolean, observedAt:string, pathKeys:string[], truncated:boolean, childCount:number, error?:string }}
 */
export async function fetchSitemapPathKeys({ origin = SITE_ORIGIN, timeoutMs = 12000, maxChildren = 25, maxUrls = 40000 } = {}) {
  const observedAt = new Date().toISOString();
  const root = await get(`${origin}/sitemap.xml`, timeoutMs);
  if (!root.ok) return { ok: false, observedAt, pathKeys: [], truncated: false, childCount: 0, error: `sitemap.xml HTTP ${root.status}` };

  const isIndex = /<sitemapindex/i.test(root.text);
  const pathKeys = new Set();
  let truncated = false;
  let childCount = 0;

  const addUrls = (locs) => {
    for (const u of locs) {
      if (pathKeys.size >= maxUrls) { truncated = true; return; }
      const k = toPathKey(u);
      if (k) pathKeys.add(k);
    }
  };

  if (!isIndex) {
    addUrls(extractLocs(root.text));
  } else {
    const children = extractLocs(root.text);
    childCount = children.length;
    const take = children.slice(0, maxChildren);
    if (children.length > maxChildren) truncated = true;
    for (const child of take) {
      if (pathKeys.size >= maxUrls) { truncated = true; break; }
      const c = await get(child, timeoutMs);
      if (c.ok) addUrls(extractLocs(c.text));
    }
  }
  return { ok: true, observedAt, pathKeys: [...pathKeys], truncated, childCount };
}

export { extractLocs, SITEMAP_UA };
