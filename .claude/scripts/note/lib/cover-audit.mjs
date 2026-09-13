/** カバー設定の判定元は v3 記事詳細だけ。一覧サムネイル・R2画像は代用しない。 */
export function inspectNoteCover(detail, expectedKey, account = "stats47") {
  const unknown = (reason) => ({ status: "unknown", url: null, reason });
  if (!detail || typeof detail !== "object") return unknown("detail_missing");
  if (detail.key !== expectedKey) return unknown("note_key_mismatch");
  if (detail.user?.urlname !== account) return unknown("account_mismatch");
  if (detail.status !== "published") return unknown("not_published");
  if (!Object.hasOwn(detail, "eyecatch")) return unknown("eyecatch_field_missing");
  if (detail.eyecatch === null) return { status: "missing", url: null, reason: "eyecatch_null" };
  if (typeof detail.eyecatch !== "string") return unknown("eyecatch_invalid");
  try {
    if (new URL(detail.eyecatch).protocol !== "https:") return unknown("eyecatch_invalid");
  } catch {
    return unknown("eyecatch_invalid");
  }
  return { status: "configured", url: detail.eyecatch, reason: null };
}

export function summarizeCovers(articles) {
  return {
    total: articles.length,
    configured: articles.filter((article) => article.cover.status === "configured").length,
    missing: articles.filter((article) => article.cover.status === "missing").length,
    unknown: articles.filter((article) => article.cover.status === "unknown").length,
    missingWithListThumbnail: articles.filter(
      (article) => article.cover.status === "missing" && article.listThumbnail,
    ).length,
    bodyImageUsedInList: articles.filter(
      (article) => article.cover.status === "missing" && article.listThumbnailMatchesFirstBodyImage,
    ).length,
  };
}

function noteKey(url, account) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== "https://note.com") return null;
    const parts = parsed.pathname.split("/");
    return parts.length === 4 && parts[1] === account && parts[2] === "n" && /^n[0-9a-f]+$/.test(parts[3])
      ? parts[3] : null;
  } catch {
    return null;
  }
}

/** fetchJson は GET 専用。依存注入により欠損・途中失敗・カタログ差分も実ネットワークなしで検証する。 */
export async function auditNoteCovers({ catalog, fetchJson, now = () => new Date().toISOString(), maxPages = 1000 }) {
  const account = "stats47";
  const generatedAt = now();
  const issues = [];
  const byKey = new Map();
  if (catalog?.account !== account || !Array.isArray(catalog?.articles)) {
    issues.push({ code: "catalog_invalid" });
  } else {
    for (const article of catalog.articles) {
      const key = noteKey(article.noteUrl, account);
      if (!key || !article.key) {
        issues.push({ code: "catalog_article_invalid", catalogKey: article.key ?? null });
      } else if (byKey.has(key)) {
        issues.push({ code: "catalog_duplicate_note", noteKey: key });
      } else {
        byKey.set(key, article);
      }
    }
  }

  const listed = new Map();
  const pages = [];
  let declaredTotal = null;
  let reachedLastPage = false;
  for (let page = 1; page <= maxPages; page += 1) {
    const url = `https://note.com/api/v2/creators/${account}/contents?kind=note&page=${page}&coverAudit=${encodeURIComponent(generatedAt)}`;
    try {
      const { data } = await fetchJson(url);
      if (!Array.isArray(data?.contents) || !Number.isInteger(data.totalCount) || data.totalCount < 0
        || typeof data.isLastPage !== "boolean") throw new Error("invalid list response");
      pages.push({ page, count: data.contents.length, totalCount: data.totalCount, isLastPage: data.isLastPage });
      if (declaredTotal !== null && declaredTotal !== data.totalCount) throw new Error("list total changed during audit");
      declaredTotal = data.totalCount;
      for (const item of data.contents) {
        if (!/^n[0-9a-f]+$/.test(item?.key) || item.user?.urlname !== account || item.status !== "published") {
          throw new Error("invalid list article identity or status");
        }
        if (listed.has(item.key)) issues.push({ code: "list_duplicate_note", noteKey: item.key, page });
        listed.set(item.key, item);
      }
      if (data.isLastPage) { reachedLastPage = true; break; }
      if (data.contents.length === 0) throw new Error("empty page before last page");
    } catch (error) {
      issues.push({ code: "list_fetch_failed", page, detail: String(error.message || error) });
      break;
    }
  }
  if (!reachedLastPage || listed.size !== declaredTotal) {
    issues.push({ code: "list_incomplete", declaredTotal, observed: listed.size, reachedLastPage });
  }

  // live のみの記事も監査し、カタログのみの記事も詳細取得する。片側にない記事を落とさない。
  const keys = [...new Set([...listed.keys(), ...byKey.keys()])];
  const articles = new Array(keys.length);
  let next = 0;
  async function worker() {
    while (next < keys.length) {
      const index = next++;
      const key = keys[index];
      const author = byKey.get(key);
      const item = listed.get(key);
      const sourceUrl = `https://note.com/api/v3/notes/${key}?coverAudit=${encodeURIComponent(generatedAt)}`;
      let detail = null;
      let cover;
      try {
        detail = (await fetchJson(sourceUrl)).data;
        cover = inspectNoteCover(detail, key, account);
      } catch (error) {
        cover = { status: "unknown", url: null, reason: "detail_fetch_failed", error: String(error.message || error) };
      }
      const firstBodyImage = typeof detail?.body === "string"
        ? /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(detail.body)?.[1]?.replaceAll("&amp;", "&") : null;
      articles[index] = {
        noteKey: key,
        catalogKey: author?.key ?? null,
        vertical: author?.vertical ?? null,
        title: detail?.name ?? item?.name ?? author?.title ?? key,
        noteUrl: `https://note.com/${account}/n/${key}`,
        inCatalog: byKey.has(key),
        inPublicList: listed.has(key),
        cover,
        listThumbnail: typeof item?.eyecatch === "string" ? item.eyecatch : null,
        listThumbnailMatchesFirstBodyImage: Boolean(firstBodyImage && item?.eyecatch === firstBodyImage),
        observedAt: now(),
        sourceUrl,
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, keys.length) }, worker));
  const summary = summarizeCovers(articles);
  const catalogDifferences = {
    liveOnly: keys.filter((key) => !byKey.has(key)),
    catalogOnly: keys.filter((key) => !listed.has(key)),
  };
  const complete = issues.length === 0 && summary.unknown === 0;
  const status = !complete ? "incomplete"
    : summary.missing || catalogDifferences.liveOnly.length || catalogDifferences.catalogOnly.length ? "fail" : "pass";
  return {
    schemaVersion: 1,
    generatedAt,
    completedAt: now(),
    account,
    scope: "published articles; drafts and scheduled unpublished articles excluded",
    status,
    source: { cover: "v3 article detail data.eyecatch", catalog: ".claude/scripts/note/catalog/", imageHealthChecked: false, storedAssetsChecked: false },
    coverage: { complete, declaredTotal, listed: listed.size, catalog: byKey.size, reachedLastPage, pages, issues },
    summary,
    groups: { prefectureHousehold: summarizeCovers(articles.filter((article) => article.catalogKey?.startsWith("a-kakei-"))) },
    catalogDifferences,
    articles,
  };
}

export function coverAuditExitCode(report) {
  return report.status === "pass" ? 0 : report.status === "fail" ? 1 : 2;
}
