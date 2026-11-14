import { httpUrl } from './contracts.mjs';

export function apiHeaders(fetchRecipe, env = process.env) {
  if (fetchRecipe.type !== 'api-paged' || !fetchRecipe.apiKeySecret) return {};
  const value = env[fetchRecipe.apiKeySecret];
  if (!value) throw Error(`Missing API key secret: ${fetchRecipe.apiKeySecret}`);
  return { authorization: `Bearer ${value}` };
}

/** api-paged uses 1-based pages, pageSize query parameter, and optional Bearer authentication. */
export async function expandUrls(fetchRecipe, client) {
  const f = fetchRecipe;
  if (f.type === 'skip') return [];
  if (f.type === 'http-file') return [...new Set(f.urls.map(httpUrl))];
  if (f.type === 'api-paged') {
    return Array.from({ length: f.maxPages }, (_, i) => {
      const url = new URL(httpUrl(f.url));
      url.searchParams.set(f.pageParam, String(i + 1));
      url.searchParams.set('pageSize', String(f.pageSize));
      return url.href;
    });
  }
  let urls;
  if (f.type === 'http-index') {
    const html = await client.text(httpUrl(f.indexUrl));
    const pattern = new RegExp(f.linkPattern);
    urls = [...html.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)].flatMap((m) => {
      const link = (m[1] ?? m[2] ?? m[3]).replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
      let url;
      try { url = httpUrl(new URL(link, f.indexUrl).href); } catch { return []; }
      return pattern.test(url) ? [url] : [];
    });
    urls = [...new Set(urls)].sort();
    // Reject a changed index rather than silently truncating a publication.
    if (urls.length > f.maxFiles) throw Error('http-index maxFiles exceeded');
  } else if (f.type === 'ckan') {
    const base = httpUrl(f.baseUrl).replace(/\/$/, '');
    const endpoint = new URL(`${base}/api/3/action/package_show`);
    endpoint.searchParams.set('id', f.packageId);
    const doc = JSON.parse(await client.text(endpoint.href));
    if (doc.success !== true || !Array.isArray(doc.result?.resources)) throw Error('Invalid CKAN package_show response');
    const formats = new Set(f.formats.map((s) => s.toLowerCase()));
    urls = [...new Set(doc.result.resources.filter((r) => formats.has(String(r.format).toLowerCase())).map((r) => httpUrl(r.url)))].sort();
  } else throw Error(`Unknown fetch type: ${f.type}`);
  if (!urls.length) throw Error('No matching source files');
  return urls;
}
