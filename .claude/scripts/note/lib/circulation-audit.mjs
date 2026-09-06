const TRACKING_PARAMETER = /^(?:utm_.+|link)$/i;

function decodeHtmlAttribute(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#38;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function noteKeyFromUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === "note.com"
      ? url.pathname.match(/^\/stats47\/n\/(n[0-9a-f]+)\/?$/i)?.[1] ?? null
      : null;
  } catch {
    return null;
  }
}

export function magazineKeyFromUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === "note.com"
      ? url.pathname.match(/^\/stats47\/m\/(m[0-9a-f]+)\/?$/i)?.[1] ?? null
      : null;
  } catch {
    return null;
  }
}

export function isStats47SiteUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "stats47.jp" || hostname === "www.stats47.jp";
  } catch {
    return false;
  }
}

export function normalizedSitePath(value) {
  try {
    const url = new URL(value, "https://stats47.jp");
    if (url.hostname !== "stats47.jp" && url.hostname !== "www.stats47.jp") return null;
    return url.pathname.replace(/\/$/, "") || "/";
  } catch {
    return null;
  }
}

export function hasTrackingParameters(value) {
  try {
    return [...new URL(value).searchParams.keys()].some((key) => TRACKING_PARAMETER.test(key));
  } catch {
    return false;
  }
}

export function extractNavigationUrls(body, embeddedContents = []) {
  const urls = [];
  const source = String(body || "");
  for (const match of source.matchAll(/\b(?:href|data-src)=(['"])(https?:\/\/.*?)\1/gi)) {
    urls.push(decodeHtmlAttribute(match[2]));
  }
  for (const embedded of embeddedContents || []) {
    // note は差し替え済みカードの metadata を残すことがある。本文から参照されるものだけ有効。
    if (typeof embedded?.url === "string" && source.includes(embedded.url)) urls.push(embedded.url);
  }
  return unique(urls);
}

export function extractCardUrls(body, embeddedContents = []) {
  const urls = [];
  const source = String(body || "");
  for (const match of source.matchAll(/<figure\b[^>]*\bembedded-service="external-article"[^>]*\bdata-src="(https?:\/\/[^"]+)"/gi)) {
    urls.push(decodeHtmlAttribute(match[1]));
  }
  for (const embedded of embeddedContents || []) {
    if (
      embedded?.service === "external-article"
      && typeof embedded.url === "string"
      && source.includes(embedded.url)
    ) urls.push(embedded.url);
  }
  return unique(urls);
}

export function buildArticleAudit({
  article,
  live,
  magazinesByKey,
  catalogNoteKeys,
  eligibleRelatedNoteKeys = new Set(),
  linkHealthByUrl = new Map(),
}) {
  const links = extractNavigationUrls(live.body, live.embedded_contents);
  const cardUrls = extractCardUrls(live.body, live.embedded_contents);
  const siteLinks = links.filter(isStats47SiteUrl);
  const noteArticleLinks = links.filter((url) => {
    const key = noteKeyFromUrl(url);
    return key && key !== live.key && catalogNoteKeys.has(key);
  });
  const magazineLinks = links.filter((url) => magazineKeyFromUrl(url));
  const expectedMagazine = article.magazine ? magazinesByKey.get(article.magazine) : null;
  const expectedMagazineNoteKey = magazineKeyFromUrl(expectedMagazine?.noteUrl);
  const actualMagazineKeys = Array.isArray(live.belonging_magazine_keys)
    ? live.belonging_magazine_keys
    : [];
  const errors = [];
  const warnings = [];

  if (live.user?.urlname !== "stats47") errors.push({ code: "account_mismatch", detail: live.user?.urlname || null });
  if (live.status !== "published") errors.push({ code: "not_published", detail: live.status || null });

  const hashtagCount = Array.isArray(live.hashtag_notes) ? live.hashtag_notes.length : 0;
  if (hashtagCount < 95) errors.push({ code: "hashtags_below_95", detail: hashtagCount });

  const livePaid = Number(live.price || 0) > 0;
  if (livePaid !== article.isPaid) errors.push({ code: "paid_state_mismatch", detail: { catalog: article.isPaid, live: livePaid } });
  if (article.priceJpy > 0 && Number(live.price || 0) !== article.priceJpy) {
    errors.push({ code: "price_mismatch", detail: { catalog: article.priceJpy, live: Number(live.price || 0) } });
  }
  if (article.publishedSeparator && live.separator !== article.publishedSeparator) {
    errors.push({
      code: "published_separator_mismatch",
      detail: { catalog: article.publishedSeparator, live: live.separator || null },
    });
  }
  if (article.pinned && !live.is_pinned) errors.push({ code: "expected_pinned_article_missing" });
  if (article.profiled && !live.is_profiled) errors.push({ code: "expected_profile_article_missing" });

  if (expectedMagazineNoteKey && !actualMagazineKeys.includes(expectedMagazineNoteKey)) {
    errors.push({ code: "missing_magazine_membership", detail: expectedMagazineNoteKey });
  }
  const knownMagazineKeys = new Set(
    [...magazinesByKey.values()].map((magazine) => magazineKeyFromUrl(magazine.noteUrl)).filter(Boolean),
  );
  const unexpectedMagazineKeys = actualMagazineKeys.filter(
    (key) => knownMagazineKeys.has(key) && key !== expectedMagazineNoteKey,
  );
  if (unexpectedMagazineKeys.length > 0) {
    warnings.push({ code: "unexpected_magazine_membership", detail: unexpectedMagazineKeys });
  }

  // 有料記事では購入が無料プレビューの主 CTA。無料記事向けの回遊 CTA を
  // 機械的に強制すると購入導線を弱めるため、欠落警告は無料記事だけに出す。
  if (!livePaid && siteLinks.length === 0) warnings.push({ code: "missing_site_link" });
  if (!livePaid && expectedMagazine?.noteUrl && !magazineLinks.some((url) => magazineKeyFromUrl(url) === expectedMagazineNoteKey)) {
    warnings.push({ code: "missing_magazine_link_in_free_body", detail: expectedMagazine.noteUrl });
  }
  if (!livePaid && eligibleRelatedNoteKeys.size > 0 && noteArticleLinks.length === 0) {
    warnings.push({ code: "missing_related_note_link" });
  }
  if (!livePaid && links.length === 0) warnings.push({ code: "no_navigation_links" });

  const targetPaths = article.stats47Targets.map(normalizedSitePath).filter(Boolean);
  const linkedPaths = new Set(siteLinks.map(normalizedSitePath).filter(Boolean));
  const missingTargets = targetPaths.filter((target) => !linkedPaths.has(target));
  if (!livePaid && missingTargets.length > 0) {
    errors.push({ code: "missing_catalog_site_target", detail: missingTargets });
  }

  const nonHttpsSiteLinks = siteLinks.filter((value) => new URL(value).protocol !== "https:");
  if (nonHttpsSiteLinks.length > 0) warnings.push({ code: "non_https_site_link", detail: nonHttpsSiteLinks });
  const trackedCardUrls = cardUrls.filter((value) => isStats47SiteUrl(value) && hasTrackingParameters(value));
  if (trackedCardUrls.length > 0) warnings.push({ code: "tracked_url_used_as_card", detail: trackedCardUrls });

  const brokenSiteLinks = [];
  const redirectedSiteLinks = [];
  for (const url of siteLinks) {
    const health = linkHealthByUrl.get(url);
    if (!health) continue;
    if (health.status === 404 || health.status === 410 || health.status >= 500 || health.error) {
      brokenSiteLinks.push({ url, ...health });
    } else if (health.redirected) {
      redirectedSiteLinks.push({ url, ...health });
    }
  }
  if (brokenSiteLinks.length > 0) errors.push({ code: "broken_site_link", detail: brokenSiteLinks });
  if (redirectedSiteLinks.length > 0) warnings.push({ code: "redirected_site_link", detail: redirectedSiteLinks });

  return {
    key: article.key,
    noteKey: live.key,
    title: article.title,
    vertical: article.vertical,
    isPaid: article.isPaid,
    r2Body: article.r2Body,
    noteUrl: article.noteUrl,
    hashtagCount,
    linkCounts: {
      total: links.length,
      cards: cardUrls.length,
      site: siteLinks.length,
      relatedNote: noteArticleLinks.length,
      magazine: magazineLinks.length,
    },
    actualMagazineKeys,
    expectedMagazineKey: expectedMagazineNoteKey,
    isPinned: Boolean(live.is_pinned),
    isProfiled: Boolean(live.is_profiled),
    errors,
    warnings,
  };
}

export function summarizeArticleAudits(articles) {
  const countWith = (predicate) => articles.filter(predicate).length;
  return {
    total: articles.length,
    errors: articles.reduce((sum, article) => sum + article.errors.length, 0),
    warnings: articles.reduce((sum, article) => sum + article.warnings.length, 0),
    compliantHashtags: countWith((article) => article.hashtagCount >= 95),
    withSiteLink: countWith((article) => article.linkCounts.site > 0),
    withRelatedNoteLink: countWith((article) => article.linkCounts.relatedNote > 0),
    withMagazineLink: countWith((article) => article.linkCounts.magazine > 0),
    withNoNavigation: countWith((article) => article.linkCounts.total === 0),
    assignedMagazineMembershipOk: countWith(
      (article) => !article.expectedMagazineKey || article.actualMagazineKeys.includes(article.expectedMagazineKey),
    ),
    pinnedArticles: countWith((article) => article.isPinned),
    profiledArticles: countWith((article) => article.isProfiled),
  };
}

export function buildProfileAudit(profile) {
  const externalLinks = profile?.externalLinks || {};
  const biography = String(profile?.profile || "").trim();
  const externalText = `${JSON.stringify(externalLinks)} ${biography}`;
  const warnings = [];
  if (!biography) warnings.push({ code: "profile_bio_missing" });
  if (!/stats47\.jp/i.test(externalText)) warnings.push({ code: "profile_site_link_missing" });
  if (!profile?.headerImageUrl) warnings.push({ code: "profile_header_missing" });
  return {
    urlname: profile?.urlname || null,
    noteCount: profile?.noteCount ?? null,
    magazineCount: profile?.magazineCount ?? null,
    followerCount: profile?.followerCount ?? null,
    hasBio: Boolean(biography),
    hasSiteLink: /stats47\.jp/i.test(externalText),
    hasHeaderImage: Boolean(profile?.headerImageUrl),
    warnings,
  };
}
