/**
 * Googlebot のリクエスト集計 (Cloudflare httpRequestsAdaptiveGroups の応答 → 日次 snapshot の `googlebot`)。
 * 純粋関数だけを置く。API 呼び出しは fetch-usage.mjs 側。
 */

export const GOOGLEBOT_QUERY = `query($z:string!,$f:ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!){viewer{zones(filter:{zoneTag:$z}){httpRequestsAdaptiveGroups(filter:$f,limit:1000,orderBy:[count_DESC]){count sum{edgeResponseBytes} dimensions{clientRequestHTTPHost clientRequestHTTPMethodName edgeResponseContentTypeName clientRequestPath}}}}}`;

export const GOOGLEBOT_UA_LIKE = "%Googlebot%";

/** パスの型。県×テーマ `/areas/<5桁>/<slug>`・テーマ `/themes/<slug>`・Geo `/geo/...`・その他。 */
export function classifyPath(path) {
  const p = String(path ?? "").split("?")[0];
  if (/^\/areas\/\d{5}\/[^/]+/.test(p)) return "area-theme";
  if (/^\/themes\/[^/]+/.test(p)) return "theme";
  if (/^\/geo(\/|$)/.test(p)) return "geo";
  return "other";
}

function bump(map, key, count, bytes) {
  const cur = map[key] ?? { count: 0, bytes: 0 };
  cur.count += count;
  cur.bytes += bytes;
  map[key] = cur;
}

function withAvg(map) {
  const out = {};
  for (const [key, { count, bytes }] of Object.entries(map)) {
    out[key] = { count, avgBytes: count ? Math.round(bytes / count) : 0 };
  }
  return out;
}

/** groups: httpRequestsAdaptiveGroups の配列。 */
export function aggregateGooglebot(groups) {
  const hostMethod = {};
  const methodContentType = {};
  const postPathType = {};
  let total = 0;
  for (const g of groups ?? []) {
    const count = g.count || 0;
    const bytes = g.sum?.edgeResponseBytes || 0;
    const d = g.dimensions ?? {};
    const host = d.clientRequestHTTPHost || "unknown";
    const method = d.clientRequestHTTPMethodName || "unknown";
    const contentType = d.edgeResponseContentTypeName || "unknown";
    total += count;
    bump(hostMethod, `${host} ${method}`, count, bytes);
    bump(methodContentType, `${method} ${contentType}`, count, bytes);
    if (method === "POST") bump(postPathType, classifyPath(d.clientRequestPath), count, bytes);
  }
  return {
    status: "ok",
    total,
    byHostMethod: withAvg(hostMethod),
    byMethodContentType: withAvg(methodContentType),
    postByPathType: withAvg(postPathType),
    // limit:1000 に達したら上位 1000 行で切れている。合計は下限として読む。
    truncated: (groups ?? []).length >= 1000,
  };
}

export function unavailableGooglebot(err) {
  return { status: "unavailable", reason: String(err?.message ?? err).slice(0, 300) };
}
