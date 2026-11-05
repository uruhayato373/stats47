/**
 * 問いの台帳 (data/content/issues.json) と、問いとページの関係 (data/content/issue-links.json) の検査と棚卸し。
 *
 * 位置づけ: 問いは分類軸ではなく、既存ページ (ページID = data/content/pages/*.json) を結ぶ参照関係。
 * 正典は docs/01_技術設計/03_情報設計.md「問いの台帳 (分類軸ではない)」。
 *
 * 役割の分担 (同じ検査を二か所に持たない):
 *   - 形 (JSON Schema) と参照先の実在 (外部キー) … check-datasets (config/datasets.mjs の schema / refs)
 *   - ここ … グラフとしての意味。親子・役割とページ種別・導出できる関係の重複・状態・公開状態、と棚卸し
 *
 * 純関数だけを置く。ファイルの読み込みは check-issue-graph.mjs。
 */

/** 大きな問い `issue:A01` / 小さな問い `issue:A01-3`。小さな問いの親は ID から導出する (parent 項目を持たない) */
export const ISSUE_ID = /^issue:([A-Z]\d{2})(?:-(\d+))?$/;

/** 役割ごとに、指してよいページ種別 */
export const ROLE_KINDS = {
  // 問いに答える読み物。本文で問いを主語にするページ
  answers: new Set(["blog", "geo", "japan-theme"]),
  // 答えの根拠になるデータのページ
  evidence: new Set(["ranking", "municipality-ranking", "theme", "municipality-theme", "japan-theme", "survey", "geo-layer"]),
};

/** 棚卸しの対象。地域・索引・タグ・固定ページは「場所や一覧で探す人」の入口なので問いに紐づけない */
export const COVERAGE_KINDS = ["blog", "geo", "ranking", "municipality-ranking", "theme", "municipality-theme", "japan-theme", "survey"];

/** 「読まれている」の閾値。集計期間 (既定 4 週) の合計で、どちらかを満たせば読まれているとみなす */
export const READ_THRESHOLD = { clicks: 1, impressions: 10 };

export function parentIdOf(id) {
  const m = ISSUE_ID.exec(id);
  return m && m[2] ? `issue:${m[1]}` : null;
}

/** ページID → ページ (公開・非公開を含む全種別) */
export function indexPages(pageFiles) {
  const pages = new Map();
  for (const file of pageFiles) for (const page of file.pages ?? []) pages.set(page.id, page);
  return pages;
}

const norm = (s) => String(s ?? "").replace(/\s+/g, "");

/**
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateIssueGraph({ issues, links, pages }) {
  const errors = [];
  const warnings = [];
  const byId = new Map();
  const questions = new Map();

  for (const issue of issues) {
    const m = ISSUE_ID.exec(issue.id ?? "");
    if (!m) {
      errors.push(`${issue.id}: ID は issue:A01 (大きな問い) か issue:A01-1 (小さな問い) の形`);
      continue;
    }
    if (byId.has(issue.id)) errors.push(`${issue.id}: ID が重複している`);
    byId.set(issue.id, issue);

    const isMinor = Boolean(m[2]);
    if ((issue.level === "minor") !== isMinor) {
      errors.push(`${issue.id}: level=${issue.level} と ID の形が合わない (小さな問いだけが -番号 を持つ)`);
    }
    if (isMinor && issue.primaryTheme) {
      errors.push(`${issue.id}: 小さな問いは primaryTheme を持たない (親から引き継ぐ。写しは二重管理になる)`);
    }

    const q = norm(issue.question);
    if (questions.has(q)) errors.push(`${issue.id}: 問いの文が ${questions.get(q)} と同じ`);
    else questions.set(q, issue.id);

    if (issue.status === "dropped" && !issue.dropReason) errors.push(`${issue.id}: 見送りは dropReason が要る`);
    if (issue.status !== "dropped" && issue.dropReason) errors.push(`${issue.id}: 見送りでないのに dropReason がある`);

    if (issue.primaryTheme) {
      const theme = pages.get(issue.primaryTheme);
      if (theme && theme.kind !== "theme") errors.push(`${issue.id}: primaryTheme は theme:* を指す (${issue.primaryTheme})`);
    }
  }

  for (const issue of byId.values()) {
    const parent = parentIdOf(issue.id);
    if (!parent) continue;
    const p = byId.get(parent);
    if (!p) errors.push(`${issue.id}: 親の ${parent} が無い`);
    else if (p.status === "dropped" && issue.status !== "dropped") errors.push(`${issue.id}: 親の ${parent} が見送りなのに生きている`);
  }

  const seen = new Set();
  const answerRankingKeys = new Map(); // issue → 答えのページが使う指標
  for (const link of links) {
    if (link.role !== "answers") continue;
    const page = pages.get(link.page);
    const keys = answerRankingKeys.get(link.issue) ?? new Set();
    for (const k of page?.rankingKeys ?? []) keys.add(k);
    answerRankingKeys.set(link.issue, keys);
  }

  for (const link of links) {
    const where = `${link.issue} → ${link.page}`;
    const pair = `${link.issue}\u0000${link.page}`;
    if (seen.has(pair)) errors.push(`${where}: 同じ組が重複している (役割は 1 組 1 つ)`);
    seen.add(pair);

    const issue = byId.get(link.issue);
    if (!issue) continue; // 実在は check-datasets が見る
    if (issue.status === "dropped") errors.push(`${where}: 見送りの問いにリンクしている`);

    const page = pages.get(link.page);
    if (!page) continue; // 実在は check-datasets が見る
    const allowed = ROLE_KINDS[link.role];
    if (!allowed) {
      errors.push(`${where}: role は answers / evidence`);
      continue;
    }
    if (!allowed.has(page.kind)) errors.push(`${where}: ${link.role} は ${[...allowed].join(" / ")} だけを指す (${page.kind})`);
    if (page.published === false) errors.push(`${where}: 非公開のページを指している`);

    if (link.role === "evidence") {
      const theme = issue.primaryTheme ?? byId.get(parentIdOf(issue.id) ?? "")?.primaryTheme;
      if (theme && link.page === theme) errors.push(`${where}: primaryTheme と同じテーマを evidence に書いている (導出できる関係の写し)`);
      if (page.kind === "ranking" && answerRankingKeys.get(link.issue)?.has(page.key)) {
        errors.push(`${where}: 答えの記事がすでにこの指標を使っている (導出できる関係の写し)`);
      }
    }
  }

  for (const issue of byId.values()) {
    if (issue.level !== "major" || issue.status === "dropped") continue;
    const own = links.some((l) => l.issue === issue.id);
    if (!own && !issue.primaryTheme) warnings.push(`${issue.id}: テーマも答えも根拠も無い (サイトに材料が無い問い)`);
  }

  return { errors, warnings };
}

/**
 * 問いから各ページへの到達を求める。どの経路で紐づくかを返し、写しは持たない (毎回導出する)。
 *   direct     … issue-links で直接指している
 *   theme      … 問いの primaryTheme そのもの
 *   via-answer … 答えの記事・地図が使っている指標のランキング
 *   via-theme  … primaryTheme が持つ指標のランキング、同じキーの市区町村・日本のテーマ (弱い紐づき)
 * @returns {Map<string, Set<string>>} ページID → 経路
 */
export function computeReach({ issues, links, pages }) {
  const reach = new Map();
  const add = (id, how) => {
    if (!pages.has(id)) return;
    const set = reach.get(id) ?? new Set();
    set.add(how);
    reach.set(id, set);
  };
  const active = new Map(issues.filter((i) => i.status !== "dropped").map((i) => [i.id, i]));
  const themeOf = (issue) => issue.primaryTheme ?? active.get(parentIdOf(issue.id) ?? "")?.primaryTheme ?? null;

  for (const link of links) {
    if (!active.has(link.issue)) continue;
    add(link.page, "direct");
    if (link.role === "answers") for (const k of pages.get(link.page)?.rankingKeys ?? []) add(`ranking:${k}`, "via-answer");
  }
  for (const issue of active.values()) {
    const theme = themeOf(issue);
    if (!theme) continue;
    add(theme, "theme");
    const key = theme.slice("theme:".length);
    add(`municipality-theme:${key}`, "via-theme");
    add(`japan-theme:${key}`, "via-theme");
    for (const k of pages.get(theme)?.rankingKeys ?? []) add(`ranking:${k}`, "via-theme");
  }
  return reach;
}

/** GSC の URL → サイト内のパス (/ranking/x)。クエリ・末尾の / を落とす */
export function pathOfUrl(url) {
  const m = /^https?:\/\/[^/]+(\/[^?#]*)?/.exec(url);
  if (!m) return null;
  const p = m[1] ?? "/";
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

/** pages.csv の行 ({page, clicks, impressions}) を週ごとに渡し、パス → 合計を返す */
export function sumTraffic(weeks) {
  const traffic = new Map();
  for (const rows of weeks) {
    for (const row of rows) {
      const p = pathOfUrl(row.page);
      if (!p) continue;
      const t = traffic.get(p) ?? { clicks: 0, impressions: 0 };
      t.clicks += Number(row.clicks) || 0;
      t.impressions += Number(row.impressions) || 0;
      traffic.set(p, t);
    }
  }
  return traffic;
}

export function isRead(t) {
  return Boolean(t) && (t.clicks >= READ_THRESHOLD.clicks || t.impressions >= READ_THRESHOLD.impressions);
}

/**
 * 棚卸し。公開ページを 4 つに分ける。
 *   linked     … 直接・テーマ・答えの記事の経路で紐づく
 *   weak       … テーマが持つ指標としてだけ紐づく
 *   orphanRead … 紐づかないが読まれている → 問いを足す候補 (検索語が問いの証拠)
 *   orphanIdle … 紐づかず読まれてもいない → 統合・転送・検索除外の候補
 */
export function classifyCoverage({ pages, reach, traffic }) {
  const byKind = {};
  const orphanRead = [];
  for (const page of pages.values()) {
    if (!COVERAGE_KINDS.includes(page.kind) || page.published === false) continue;
    const row = (byKind[page.kind] ??= { total: 0, linked: 0, weak: 0, orphanRead: 0, orphanIdle: 0 });
    row.total += 1;
    const how = reach.get(page.id);
    const t = traffic.get(page.href);
    if (how && [...how].some((h) => h !== "via-theme")) row.linked += 1;
    else if (how) row.weak += 1;
    else if (isRead(t)) {
      row.orphanRead += 1;
      orphanRead.push({ id: page.id, title: page.title, clicks: t.clicks, impressions: t.impressions });
    } else row.orphanIdle += 1;
  }
  orphanRead.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  return { byKind, orphanRead };
}

/** RFC 4180 の最小の CSV 読み (GSC の pages.csv は引用符付きの値を含みうる) */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
