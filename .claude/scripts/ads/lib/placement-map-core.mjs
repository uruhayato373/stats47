/**
 * placement-map-core.mjs — 「検索需要 (GSC) × 供給 (広告在庫/EPC)」突合の純ロジック。
 *
 * ★ なぜ要るか: これまで propose (次にどの案件を仕入れるか) は手順書レベルで、GSC の検索需要と
 *   在庫・EPC を突き合わせる決定的スクリプトが存在しなかった (2026-07-28 の調査で確定)。
 *   モデルが毎回目視で JOIN していたため再現性が無く、見落としも起きる。ここを機械化する。
 *
 * 入出力は全て引数と戻り値で完結させ (ファイル I/O とネットワークは runner 側)、
 * 判定はここでテストする。
 */

/** ページ種別。GSC の page URL から決定的に分類する。 */
export const PAGE_TYPES = [
  "ranking",
  "blog",
  "areas",
  "themes",
  "category",
  "tag",
  "survey",
  "home",
  "compare",
  "area-theme",
  "city",
  "city-category",
  "japan",
  "municipality-ranking",
  "municipality-theme",
  "index",
  "other",
];

/**
 * GSC の page URL をページ種別と識別子に分解する。
 * URL は絶対 (https://stats47.jp/...) でもパスでも受ける。クエリ/ハッシュは落とす。
 */
export function classifyPageUrl(url) {
  const raw = String(url ?? "");
  if (!raw) return { type: "other", key: null };
  const path = raw.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0].replace(/\/$/, "");
  if (path === "" || path === "/") return { type: "home", key: null };
  let seg;
  try {
    seg = path.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return { type: "other", key: null };
  }
  if (seg.some(part => /[\\/]/.test(part))) return { type: "other", key: null };
  const head = seg[0];
  if (seg.length === 1 && ["ranking", "blog", "areas", "themes", "category", "tag", "survey", "japan", "municipalities"].includes(head)) {
    return { type: "index", key: head };
  }
  if (head === "category" && seg.length === 3 && seg[2] === "compare") return { type: "compare", key: seg[1] };
  if (head === "areas" && /^\d{5}$/.test(seg[1] ?? "")) {
    if (seg[2] === "cities" && /^\d{5}$/.test(seg[3] ?? "")) {
      if (seg.length === 4) return { type: "city", key: seg[3], areaCode: seg[1] };
      if (seg.length === 5) return { type: "city-category", key: seg[4], areaCode: seg[1], cityCode: seg[3] };
    }
    if (seg.length === 3) return { type: "area-theme", key: seg[2], areaCode: seg[1] };
  }
  if (head === "municipalities" && seg.length === 3) {
    if (seg[1] === "ranking") return { type: "municipality-ranking", key: seg[2] };
    if (seg[1] === "themes") return { type: "municipality-theme", key: seg[2] };
  }
  if (seg.length !== 2) return { type: "other", key: null };
  switch (head) {
    case "ranking":
      return { type: "ranking", key: seg[1] ?? null };
    case "blog":
      return { type: "blog", key: seg[1] ?? null };
    case "areas":
      return /^\d{5}$/.test(seg[1]) ? { type: "areas", key: seg[1] } : { type: "other", key: null };
    case "themes":
      return { type: "themes", key: seg[1] ?? null };
    case "category":
      return { type: "category", key: seg[1] ?? null };
    case "tag":
      return { type: "tag", key: seg[1] ?? null };
    case "survey":
      return { type: "survey", key: seg[1] ?? null };
    case "japan":
      return { type: "japan", key: seg[1] };
    default:
      return { type: "other", key: null };
  }
}

/**
 * ページ 1 件が解決する vertical を返す。**広告解決の実装と同じ経路**でなければ意味が無いので、
 * ranking/blog は共有 resolveContentVertical (調査→タグ→カテゴリ、null停止) を注入する。
 * survey は調査写像を優先し、未写像時だけ実snapshotの最多カテゴリverticalを使う。
 *
 * @returns {{verticals: string[], reason: string}} 配置意図の需要。広告の実表示回数ではない。
 */
export function resolveVerticalsForPage(page, maps) {
  const { rankingKeyToCategory = {}, categoryMap = {}, categoryPagePolicy = categoryMap, tagMap = {}, themeMap = {}, municipalityThemeMap = {}, themeContent = {}, rankingContent = {}, articleContent = {}, surveyItems = {}, resolveContentVertical } = maps;
  const resolveIntent = (input, unresolvedReason) => {
    const result = resolveContentVertical(input);
    const reason = result.source === "survey-none" ? "no-intent"
      : result.source === "none" ? unresolvedReason
      : result.source === "category" ? `category:${input.categoryKey}` : result.source;
    return { verticals: result.verticals, reason };
  };
  switch (page.type) {
    case "ranking": {
      const input = rankingContent[page.key];
      if (!input) return { verticals: [], reason: rankingKeyToCategory[page.key] ? "ranking-metadata-unavailable" : "ranking-key-unknown" };
      return resolveIntent(input, `category-unmapped:${input.categoryKey ?? "unknown"}`);
    }
    case "category": {
      const v = categoryPagePolicy[page.key];
      if (v === null) return { verticals: [], reason: `category-policy-none:${page.key}` };
      return v ? { verticals: [v], reason: `category:${page.key}` } : { verticals: [], reason: `category-unmapped:${page.key}` };
    }
    case "compare":
    case "municipality-ranking": {
      const category = page.type === "compare" ? page.key : rankingKeyToCategory[page.key];
      const v = categoryMap[category];
      return v ? { verticals: [v], reason: `category:${category}` } : { verticals: [], reason: `category-unmapped:${category ?? "unknown"}` };
    }
    case "blog": {
      const input = articleContent[page.key];
      if (!input) return { verticals: [], reason: "article-unknown" };
      return resolveIntent(input, "tags-unmapped");
    }
    case "tag": {
      const v = tagMap[page.key];
      return v ? { verticals: [v], reason: `tag:${page.key}` } : { verticals: [], reason: `tag-unmapped:${page.key}` };
    }
    case "area-theme":
    case "themes": {
      if (page.type === "area-theme" && maps.areaThemeKeys && !maps.areaThemeKeys.includes(page.key)) return { verticals: [], reason: "area-theme-unknown" };
      const tags = themeContent[page.key]?.tagKeys ?? [];
      const verticals = [...new Set(tags.map(tag => tagMap[tag]).filter(Boolean))];
      if (verticals.length) return { verticals, reason: "theme-tags" };
      const v = themeMap[page.key];
      if (!v && Object.hasOwn(themeContent, page.key)) return { verticals: [], reason: "no-intent" };
      return v ? { verticals: [v], reason: `theme:${page.key}` } : { verticals: [], reason: `theme-unmapped:${page.key}` };
    }
    case "japan": {
      const v = themeMap[page.key];
      if (!v && Object.hasOwn(themeContent, page.key)) return { verticals: [], reason: "no-intent" };
      return v ? { verticals: [v], reason: `theme:${page.key}` } : { verticals: [], reason: `theme-unmapped:${page.key}` };
    }
    case "municipality-theme": {
      const v = municipalityThemeMap[page.key];
      return v ? { verticals: [v], reason: `municipality-theme:${page.key}` } : { verticals: [], reason: `theme-unmapped:${page.key}` };
    }
    case "home":
      return { verticals: ["economy"], reason: "home-economy" };
    case "index":
      return page.key === "blog" ? { verticals: ["furusato"], reason: "blog-index-furusato" } : { verticals: [], reason: `no-slot:index:${page.key}` };
    case "areas":
      // 県プロフィールはfurusato本文に加え、area-sidebarと楽天カードを持つ。
      return { verticals: ["furusato"], reason: "area-furusato" };
    case "city":
      // CityPageFooterはAreaBannerAdと県別楽天カード。furusato verticalの本文resolverはない。
      return { verticals: ["furusato"], reason: "city-furusato" };
    case "survey": {
      const resolved = resolveIntent({ surveyIds: [page.key] }, "none");
      if (resolved.reason !== "none") return resolved;
      const items = surveyItems[page.key];
      if (!items) return { verticals: [], reason: "survey-items-unavailable" };
      if (!items.length) return { verticals: [], reason: "survey-items-empty" };
      // survey page dominantVertical: count mapped verticals; first occurrence wins ties.
      const counts = new Map();
      for (const item of items) {
        const vertical = categoryMap[item.categoryKey];
        if (vertical) counts.set(vertical, (counts.get(vertical) ?? 0) + 1);
      }
      let best = "economy";
      let bestCount = 0;
      for (const [vertical, count] of counts) {
        if (count > bestCount) { best = vertical; bestCount = count; }
      }
      return { verticals: [best], reason: "survey-category" };
    }
    default:
      return { verticals: [], reason: `no-slot:${page.type}` };
  }
}

/**
 * 実resolverと同じ在庫fallback鎖/配信ガードを使う候補pool。表示・GA4観測ではない。
 * slot上限、nativeの横長制約、手動記事内配置、楽天R2、house枠の最終選択は対象外。
 */
export function eligibleAdsForPage(page, maps, ads, today) {
  const intent = resolveVerticalsForPage(page, maps);
  const empty = (status, reason) => ({ status, reason, ads: status === "unavailable" ? null : [], adCount: status === "unavailable" ? null : 0, programRefs: status === "unavailable" ? null : [], stage: "resolver-pool-before-slot-selection" });
  if (!Array.isArray(ads)) return empty("unavailable", "inventory-unavailable");
  if (page.type === "other") return empty("unavailable", "route-not-modeled");
  if (page.type === "themes" && page.key === "local-finance") return empty("none", "bespoke-page-no-affiliate-resolver");
  if (!intent.verticals.length) {
    const unresolved = /unavailable|unknown|unmapped/.test(intent.reason);
    return empty(unresolved ? "unavailable" : "none", intent.reason);
  }
  const { isAffiliateActive, matchesRankingTarget, uniqueAffiliateDestinations, adVertical, resolveContentVerticalChain } = maps;
  if (![isAffiliateActive, matchesRankingTarget, uniqueAffiliateDestinations, adVertical].every(fn => typeof fn === "function")) return empty("unavailable", "delivery-policy-unavailable");
  // 市区町村rankingのcallerはrankingKeyを渡さない。都道府県rankingだけallowlistを照合する。
  const rankingKey = page.type === "ranking" ? page.key : undefined;
  const active = ads.filter(ad => isAffiliateActive(ad, today) && !(ad.experimentId || ad.variantId) && matchesRankingTarget(ad, rankingKey))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  let steps = [{ source: intent.reason, verticals: intent.verticals }];
  if (["ranking", "blog"].includes(page.type)) {
    if (!resolveContentVerticalChain) return empty("unavailable", "content-chain-unavailable");
    const input = page.type === "ranking" ? maps.rankingContent[page.key] : maps.articleContent[page.key];
    const chain = resolveContentVerticalChain(input);
    if (chain.blocked) return empty("none", "no-intent");
    steps = chain.steps;
  } else if (["themes", "area-theme"].includes(page.type)) {
    const vertical = maps.themeMap[page.key];
    if (vertical && !intent.verticals.includes(vertical)) steps.push({ source: `theme:${page.key}`, verticals: [vertical] });
  }
  const collect = (adType) => {
    for (const step of steps) {
      const candidates = uniqueAffiliateDestinations(active.filter(ad => ad.adType === adType && step.verticals.includes(adVertical(ad)) && (adType !== "text" || ad.locationCode === "sidebar-bottom")))
        .filter(ad => adType !== "banner" || !!ad.imageUrl);
      if (candidates.length) return candidates.map(ad => ({ ...ad, sourceStep: step.source }));
    }
    return [];
  };
  const banners = page.type === "city" ? [] : collect("banner");
  const text = page.type === "blog" ? collect("text") : [];
  // AreaBannerAd / homeのSidebarStickyBannerAdはverticalではなくlocationで引く。
  const location = ["areas", "city"].includes(page.type) ? "area-sidebar" : page.type === "home" ? "sidebar-sticky" : null;
  const locationAds = location ? active.filter(ad => ad.adType === "banner" && ad.locationCode === location && ad.imageUrl).map(ad => ({ ...ad, sourceStep: `location:${location}` })) : [];
  const selected = uniqueAffiliateDestinations([...banners, ...text, ...locationAds]);
  return {
    status: selected.length ? "eligible" : "none", reason: selected.length ? "active-matching-resolver-pool" : "no-eligible-inventory",
    stage: "resolver-pool-before-slot-selection",
    ads: selected.map(ad => ({ id: ad.id, programRef: ad.programRef ?? null, vertical: adVertical(ad) ?? null, adType: ad.adType, sourceStep: ad.sourceStep })),
    adCount: selected.length,
    programRefs: [...new Set(selected.map(ad => ad.programRef).filter(Boolean))],
  };
}

/**
 * GSC の行を「ページ種別 × vertical」に集計する。
 * 複数 vertical に解決するページ (blog の複数タグ) は **imp を分割せず全 vertical に計上**する
 * (検索需要の意図別集計であり広告表示回数ではない。合計は検索imp総和と一致しない)。
 */
export function aggregateDemand(rows, maps, ads = null, today) {
  const byType = {};
  const byVertical = {};
  const byTypeVertical = {};
  const unmapped = [];
  const pages = [];
  for (const r of rows) {
    const page = classifyPageUrl(r.url);
    const t = page.type;
    byType[t] = byType[t] || { imp: 0, clicks: 0, pages: 0 };
    byType[t].imp += r.imp;
    byType[t].clicks += r.clicks;
    byType[t].pages += 1;

    const { verticals, reason } = resolveVerticalsForPage(page, maps);
    pages.push({ url: r.url, ...page, gsc: { imp: r.imp, clicks: r.clicks }, intent: { verticals, reason }, eligible: eligibleAdsForPage(page, maps, ads, today) });
    if (verticals.length === 0) {
      unmapped.push({ url: r.url, type: t, key: page.key, imp: r.imp, clicks: r.clicks, reason });
      continue;
    }
    for (const v of verticals) {
      byVertical[v] = byVertical[v] || { imp: 0, clicks: 0, pages: 0 };
      byVertical[v].imp += r.imp;
      byVertical[v].clicks += r.clicks;
      byVertical[v].pages += 1;
      const k = `${t}|${v}`;
      byTypeVertical[k] = byTypeVertical[k] || { type: t, vertical: v, imp: 0, clicks: 0, pages: 0 };
      byTypeVertical[k].imp += r.imp;
      byTypeVertical[k].clicks += r.clicks;
      byTypeVertical[k].pages += 1;
    }
  }
  unmapped.sort((a, b) => b.imp - a.imp);
  return { byType, byVertical, byTypeVertical: Object.values(byTypeVertical), unmapped, pages,
    denominator: { source: "GSC pages (anchor rows excluded)", pages: rows.length, imp: rows.reduce((sum, row) => sum + row.imp, 0), clicks: rows.reduce((sum, row) => sum + row.clicks, 0), verticalTotalsAreAdditive: false } };
}

/**
 * 需要 (imp) と供給 (在庫件数) を突き合わせ、**手当てすべき順**に並べる。
 *
 * - `no-inventory`: 検索需要があるが banner/text いずれかがゼロ → 適合案件を検討する候補
 * - `unmapped`: 意図未解決/no-intent の検索需要 (AdSense表示や広告未表示の実測ではない)
 * - `oversupply`: 在庫が厚いのに imp が小さい → 新規仕入れの優先度を下げる根拠
 */
export function buildGapReport({ byVertical, unmapped, inventoryByVertical, textByVertical, bannerByVertical }) {
  const gaps = [];
  for (const [v, d] of Object.entries(byVertical)) {
    const total = inventoryByVertical?.[v] ?? 0;
    const text = textByVertical?.[v] ?? 0;
    const banner = bannerByVertical?.[v] ?? 0;
    const kinds = [];
    if (banner === 0) kinds.push("banner-zero");
    if (text === 0) kinds.push("text-zero");
    if (total > 0 && d.imp < 500) kinds.push("oversupply");
    gaps.push({ vertical: v, imp: d.imp, clicks: d.clicks, inventory: total, banner, text, kinds });
  }
  gaps.sort((a, b) => b.imp - a.imp);
  const unmappedImp = unmapped.reduce((s, u) => s + u.imp, 0);
  // 未写像の理由別にまとめる (category-unmapped:commercial のように、何を足せば効くかが分かる形)
  const byReason = {};
  for (const u of unmapped) {
    byReason[u.reason] = byReason[u.reason] || { reason: u.reason, imp: 0, pages: 0, examples: [] };
    byReason[u.reason].imp += u.imp;
    byReason[u.reason].pages += 1;
    if (byReason[u.reason].examples.length < 3) byReason[u.reason].examples.push(u.key ?? u.url);
  }
  return {
    gaps,
    unmappedImp,
    unmappedByReason: Object.values(byReason).sort((a, b) => b.imp - a.imp),
  };
}

/**
 * 高EPC の未接続案件を「当て先候補」と一緒に返す (reverse アプローチの入力)。
 *
 * ★ 共用案件の除外: doboku-note と同じ A8 口座を使っているため、両サイトが配信している案件の
 *   EPC/確定率は**口座横断の実績**で stats47 単独の実力ではない。`sharedProgramIds` に入れて
 *   `shared: true` で明示し、これを stats47 の期待値として扱わないようにする。
 */
export function buildReverseCandidates({
  catalogEntries,
  confirmedEpcOf,
  registeredProgramIds,
  sharedProgramIds = [],
  minEpc = 50,
  isExcluded = () => false,
}) {
  const shared = new Set(sharedProgramIds);
  const registered = new Set(registeredProgramIds);
  const out = [];
  for (const e of catalogEntries) {
    // blocklist (アダルト/テスト用プログラム等) は候補にしない。
    // これが無いと「【A8.net】成果反映用プログラム」(確定EPC 66,625) が常に 1 位に出て
    // リストが読めなくなる (2026-07-28 実測)。
    if (isExcluded(e)) continue;
    const epc = confirmedEpcOf(e);
    if (!(epc >= minEpc)) continue;
    out.push({
      programId: e.programId,
      name: e.name ?? null,
      vertical: e.vertical ?? null,
      status: e.status ?? null,
      confirmedEpc: Number(epc.toFixed(1)),
      rewardYen: e.rewardYen ?? null,
      shared: shared.has(e.programId),
      registered: registered.has(e.programId),
    });
  }
  out.sort((a, b) => b.confirmedEpc - a.confirmedEpc);
  return out;
}

/**
 * 案件名から当て先 ranking キーを提案する (targetRankingKeys の下書き)。
 * **適用はしない** — 意味判断 (ブランド適合・文脈) は agent/人が行う前提の suggest に留める。
 */
export function suggestTargetRankingKeys(programName, rankingKeyTitles, { limit = 5, minMatchLen = 3 } = {}) {
  const name = String(programName ?? "");
  if (!name) return [];
  const a = ngramSet(name);
  if (a.size === 0) return [];
  const scored = [];
  for (const [key, title] of Object.entries(rankingKeyTitles)) {
    const b = ngramSet(`${title ?? ""}`);
    // ★ 2 文字一致は日本語ではノイズが多すぎる ("レンタカー" と "訳アリ不動産買取" が
    //   偶然の 2-gram で繋がる事故を実測)。既定 3 文字以上の一致だけを採る。
    const matched = [...a].filter((t) => t.length >= minMatchLen && b.has(t));
    if (matched.length === 0) continue;
    // 長い一致ほど確度が高い ("不動産取引" > "不動産")
    const maxLen = Math.max(...matched.map((m) => m.length));
    const best = matched.filter((m) => m.length === maxLen);
    scored.push({ key, title: title ?? null, matched: best, score: maxLen });
  }
  scored.sort((x, y) => y.score - x.score || y.matched.length - x.matched.length || x.key.localeCompare(y.key));
  return scored.slice(0, limit).map(({ key, title, matched }) => ({ key, title, matched }));
}

/**
 * 漢字/カタカナ連続から 2〜4 文字の n-gram 集合を作る。
 *
 * ★ 連続語をそのまま比較すると当たらない: 「不動産買取専門店」と「不動産取引件数」は
 *   文字列としては一致しないが、意味的には「不動産」で繋がる。両側を n-gram にして
 *   共通部分を取ることで、この橋渡しができる (2026-07-28 にテストで発覚)。
 */
function ngramSet(text) {
  const runs = String(text ?? "").match(/[一-鿿]{2,}|[゠-ヿ]{2,}/g) ?? [];
  const out = new Set();
  for (const run of runs) {
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= run.length; i++) out.add(run.slice(i, i + n));
    }
  }
  return out;
}
