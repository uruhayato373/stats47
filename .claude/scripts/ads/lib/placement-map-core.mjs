/**
 * placement-map-core.mjs — 「需要 (ページ/トラフィック) × 供給 (広告在庫/EPC)」突合の純ロジック。
 *
 * ★ なぜ要るか: これまで propose (次にどの案件を仕入れるか) は手順書レベルで、GSC の実トラフィックと
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
  const seg = path.split("/").filter(Boolean);
  const head = seg[0];
  // /category/<key>/compare は compare 扱い (category より優先して判定する)
  if (seg.includes("compare")) return { type: "compare", key: seg[1] ?? null };
  switch (head) {
    case "ranking":
      return { type: "ranking", key: seg[1] ?? null };
    case "blog":
      return { type: "blog", key: seg[1] ?? null };
    case "areas":
      return { type: "areas", key: seg[1] ?? null };
    case "themes":
      return { type: "themes", key: seg[1] ?? null };
    case "category":
      return { type: "category", key: seg[1] ?? null };
    case "tag":
      return { type: "tag", key: seg[1] ?? null };
    case "survey":
      return { type: "survey", key: seg[1] ?? null };
    default:
      return { type: "other", key: null };
  }
}

/**
 * ページ 1 件が解決する vertical を返す。**広告解決の実装と同じ経路**でなければ意味が無いので、
 * ranking/category は categoryKey→vertical、blog/tag は tagKey→vertical、themes は themeKey→vertical に揃える。
 *
 * @returns {{verticals: string[], reason: string}} verticals が空 = **広告が出ない** (AdSense に落ちる)
 */
export function resolveVerticalsForPage(page, maps) {
  const { rankingKeyToCategory = {}, categoryMap = {}, tagMap = {}, themeMap = {}, articleTags = {} } = maps;
  switch (page.type) {
    case "ranking": {
      const cat = rankingKeyToCategory[page.key];
      if (!cat) return { verticals: [], reason: "ranking-key-unknown" };
      const v = categoryMap[cat];
      return v ? { verticals: [v], reason: `category:${cat}` } : { verticals: [], reason: `category-unmapped:${cat}` };
    }
    case "category": {
      const v = categoryMap[page.key];
      return v ? { verticals: [v], reason: `category:${page.key}` } : { verticals: [], reason: `category-unmapped:${page.key}` };
    }
    case "blog": {
      const tags = articleTags[page.key];
      if (!tags) return { verticals: [], reason: "article-unknown" };
      const vs = [...new Set(tags.map((t) => tagMap[t]).filter(Boolean))];
      return vs.length ? { verticals: vs, reason: "tags" } : { verticals: [], reason: "tags-unmapped" };
    }
    case "tag": {
      const v = tagMap[page.key];
      return v ? { verticals: [v], reason: `tag:${page.key}` } : { verticals: [], reason: `tag-unmapped:${page.key}` };
    }
    case "themes": {
      const v = themeMap[page.key];
      return v ? { verticals: [v], reason: `theme:${page.key}` } : { verticals: [], reason: `theme-unmapped:${page.key}` };
    }
    case "areas":
      // area は locationCode="area-sidebar" + 楽天ふるさと納税で、vertical 解決を経由しない
      return { verticals: ["furusato"], reason: "area-furusato" };
    case "survey":
      // ★ survey の native 枠は tag が `['economy','population','labor']` の**ハードコード**で
      //   surveyKey と連動していない (2026-07-28 棚卸しで確認)。枠はあるので no-slot ではないが、
      //   調査主題とズレる。reason に残して是正対象と分かるようにする。
      return { verticals: ["economy", "population", "labor"], reason: "survey-hardcoded-tags" };
    default:
      return { verticals: [], reason: `no-slot:${page.type}` };
  }
}

/**
 * GSC の行を「ページ種別 × vertical」に集計する。
 * 複数 vertical に解決するページ (blog の複数タグ) は **imp を分割せず全 vertical に計上**する
 * (どの軸の在庫がその imp に接触しうるかを見るため。合計は imp 総和と一致しない)。
 */
export function aggregateDemand(rows, maps) {
  const byType = {};
  const byVertical = {};
  const byTypeVertical = {};
  const unmapped = [];
  for (const r of rows) {
    const page = classifyPageUrl(r.url);
    const t = page.type;
    byType[t] = byType[t] || { imp: 0, clicks: 0, pages: 0 };
    byType[t].imp += r.imp;
    byType[t].clicks += r.clicks;
    byType[t].pages += 1;

    const { verticals, reason } = resolveVerticalsForPage(page, maps);
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
  return { byType, byVertical, byTypeVertical: Object.values(byTypeVertical), unmapped };
}

/**
 * 需要 (imp) と供給 (在庫件数) を突き合わせ、**手当てすべき順**に並べる。
 *
 * - `no-inventory`: imp があるのに banner/text いずれかがゼロ → 埋めれば即効く
 * - `unmapped`: vertical に解決できず AdSense に落ちている imp → 写像追加の候補
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
