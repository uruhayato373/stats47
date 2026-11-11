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

  // 答えの記事は問いごとに 1 本。関連する記事は指標でつながるので台帳に書かない (2026-11-06 オーナー決定)
  const answerCount = new Map();
  for (const link of links) {
    if (link.role === "answers") answerCount.set(link.issue, (answerCount.get(link.issue) ?? 0) + 1);
  }
  for (const [issue, count] of answerCount) {
    if (count > 1) errors.push(`${issue}: 答えのページは 1 本だけ (${count} 本ある)`);
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

/**
 * 問いになりそうな検索語の型。読者が理由や関係を知りたがっている語を拾う。
 * 配偶関係・位置関係は統計や地図の用語で、問いではない。
 */
export const WHY_QUERY = /なぜ|何故|理由|原因|(?<!配偶|位置)関係/;

/** 型の語を除いて 2 文字未満なら、何についての問いか分からない (「何故」「原因は？」) */
const hasSubject = (q) => q.replace(WHY_QUERY, "").replace(/[?？!！。、]/g, "").length >= 2;

/**
 * 下から問いを足す候補。queries.csv の行 ({query, clicks, impressions}) を週ごとに渡す。
 * 空白違いは同じ語として合算し、見送りを含むどの問いの queries にも無い語だけを返す
 * (見送った問いの語は、一度判断したものなので再び出さない)。
 * @returns {{query: string, clicks: number, impressions: number}[]} 表示回数の多い順
 */
export function findQueryCandidates({ issues, weeks }) {
  const known = new Set(issues.flatMap((i) => i.queries ?? []).map(norm));
  const found = new Map();
  for (const rows of weeks) {
    for (const row of rows) {
      const key = norm(row.query);
      if (known.has(key) || !WHY_QUERY.test(key) || !hasSubject(key)) continue;
      const c = found.get(key) ?? { query: row.query, clicks: 0, impressions: 0 };
      c.clicks += Number(row.clicks) || 0;
      c.impressions += Number(row.impressions) || 0;
      found.set(key, c);
    }
  }
  return [...found.values()].sort(
    (a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.query.localeCompare(b.query, "ja"),
  );
}

/** RFC 4180 の最小の CSV 読み (GSC の pages.csv は引用符付きの値を含みうる) */
/**
 * 図の配信先のうち、まだ載っていないものと、図の台帳と配信先の台帳の状態がずれたものを返す。
 * 公開の状態の正本は配信先の台帳なので、ここでは比べるだけで直さない。
 * ページが公開中でも図が載っているとは限らないため、ページは「公開済みと書いたのにページが無い」だけをずれとする。
 */
export function listFigureDestinations({ figures, analyses, posts, pages, drafts = new Map() }) {
  const issueOf = new Map(analyses.map((a) => [a.id, a.issue]));
  const postOf = new Map(posts.map((p) => [p.id, p]));
  return figures.flatMap((figure) =>
    figure.destinations.flatMap((d) => {
      if (d.slug !== undefined) {
        const actual = drafts.get(d.slug) ?? "下書きなし";
        return [{ figure: figure.id, issue: issueOf.get(figure.analysis) ?? null, channel: d.channel, target: `blog:${d.slug}`, status: d.status, actual, drift: actual === "下書きなし" }];
      }
      const actual = d.postId === undefined ? (pages.get(d.page)?.published ? "公開中" : "なし") : (postOf.get(d.postId)?.status ?? "なし");
      const placed = d.status === "published";
      const drift =
        d.postId === undefined
          ? placed && actual === "なし"
          : placed !== (actual === "posted") || actual === "なし" || actual === "deleted";
      if (placed && !drift) return [];
      return [{ figure: figure.id, issue: issueOf.get(figure.analysis) ?? null, channel: d.channel, target: d.page ?? `post:${d.postId}`, status: d.status, actual, drift }];
    }),
  );
}

/**
 * 下書きが公開までの何待ちかを返す。先に済ませるものから順に見る。
 * 背景画像は別の工程なので、本文の審査が通ったあとの待ちとして数える。
 */
export function classifyDraft({ hasArticle, published, verdict, hasBackground }) {
  if (!hasArticle) return "執筆待ち";
  if (verdict !== "PASS") return "レビュー待ち";
  if (!hasBackground) return "背景待ち";
  return published ? "公開処理中" : "公開待ち";
}

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

/**
 * 分析の軸 (issues[].axes) から、問いに答える図の目的と型を引く。
 *
 * 軸は「説明側 (explanatory)」と「結果側 (outcome)」で、それぞれ 比較 (compare)・構成 (compose)・変化 (change) のどれか。
 * 説明側が無い問い (記述の問い) は explanatory: null。名前を原因・結果にしないのは、相関を因果と読ませないため。
 * 説明側が群の区分 (年収五分位・世帯類型など) のときは group: true を書く。時間は軸にせず、結果側の変化で表す。
 * 軸が使うデータは data に参照で書く (指標キーか系列の ID)。実在と粒度は resolveAxesFigure が正本と照らす。
 *
 * 決めるのは図の「目的」だけで、図の型そのものは図の型の台帳 (image-templates.json の purposes・renderer・review)
 * から引く。型の決定表をここに手書きすると台帳とずれるため (2026-11-10 Fable のレビュー)。
 */
export const AXIS_PATTERNS = ["compare", "compose", "change"];

/** 1 軸のときの目的。2 軸は figurePurpose が組み合わせで決める */
const SINGLE_PURPOSE = { compare: "ranking", compose: "composition", change: "trend" };

/**
 * 目的ごとに先に使う型。47 県の全体を見せる図は地図を主にする (2026-11-03 オーナー決定)。
 * 並べるのは図の型の台帳でその目的 (purposes) を持ち、描画できる型だけ (テストが台帳と照合する)。
 * distribution (箱ひげ図) は軸の語彙 (比較・構成・変化) から引かないので持たない
 */
export const PREFERENCE = {
  ranking: ["tile-map", "bar"],
  comparison: ["bar", "grouped-bar", "radar"],
  composition: ["stacked-bar", "waterfall", "sankey"],
  trend: ["line", "tile-map", "choropleth"],
  relationship: ["scatter", "chord", "sankey"],
};

/** 地域の境界や県の並びが要る型。全国の集計 (unit=japan) では描けない */
const NEEDS_REGIONS = new Set(["tile-map", "choropleth"]);

/** 小さな問いが軸を省いたら、粒度 (unit) が同じ親の軸を継ぐ。粒度が違えば指標も違うので継がない */
export function effectiveAxes(issue, byId) {
  if (issue.axes) return issue.axes;
  const parent = byId.get(parentIdOf(issue.id) ?? "");
  return parent && parent.unit === issue.unit ? parent.axes : undefined;
}

export function figurePurpose({ explanatory, outcome }) {
  if (!explanatory) return SINGLE_PURPOSE[outcome.pattern];
  // 群の区分 (年収五分位・世帯類型・東西など) は group: true で明示する。群ごとの値は関係ではなく比較の図にする。
  // 指標が無いことを区分と読み替えない (量の指標の候補が見つからなかっただけの軸を棒グラフに回してしまう)
  const isGroup = explanatory.pattern === "compare" && explanatory.group === true;
  if (isGroup && outcome.pattern === "compare") return "comparison";
  // 群ごとの推移は群を系列にした折れ線 (五分位なら 5 系列で line の上限に収まる)
  if (isGroup && outcome.pattern === "change") return "trend";
  const pair = new Set([explanatory.pattern, outcome.pattern]);
  // 説明側の群ごとの内訳 (比較×構成) と、増減の内訳 (構成×変化) は内訳の図。ほかは 2 つの値の関係として散布図などに還元する
  if (explanatory.pattern === "compare" && outcome.pattern === "compose") return "composition";
  if (pair.has("compose") && pair.has("change")) return "composition";
  return "relationship";
}

/** 台帳の誤りとして検査を止める理由。ほかは埋める作業の残りなので止めない */
export const AXES_ERRORS = ["指標なし", "粒度不一致"];

/**
 * 問いの粒度に、別の粒度の値で答えてよいもの。図は描けるが、図と本文に注記が要る。
 * 県の問いに県庁所在市の値 (家計調査) で答える図は、タイル地図にも県の並びにも載るが、県全体の値ではない。
 */
export const GRAIN_STAND_INS = { prefecture: { "capital-city": "県庁所在市の値 (県全体の値ではない)" } };

/**
 * 軸が指すデータ (data) の参照は 2 通り。
 *   { metric, grain? } … 指標。grain を省くと問いの unit の粒度で使う。問いと違う粒度の値で答えるときだけ grain を書く
 *   { series }         … 系列 (家計調査の分析単位。年収階級・世帯類型など属性別の値)
 *
 * @param {{ issue: object, axes?: object, templates: object[], metricGrains?: Map<string, Set<string>>, seriesIds?: Set<string> }} p
 *   metricGrains: 指標キー → 値のある粒度 / seriesIds: 系列の ID。渡さなければ実在と粒度は確かめない
 * @returns {{ purpose: string|null, primary: string|null, allowed: string[], gaps: string[], notes: string[] }}
 *   gaps: 型未定 (軸が無い) / 描画器なし / 粒度不足 (全国の集計で関係を問う) / 未検証 (群の区分以外の軸にデータが無い) /
 *         別粒度 (問いと違う粒度の値で答える) / 指標なし (書いた指標・系列が存在しない) / 粒度不一致 (その粒度の値が指標に無い)
 *   notes: 図は決まるが図と本文に書く注記 (GRAIN_STAND_INS)
 */
export function resolveAxesFigure({ issue, axes, templates, metricGrains, seriesIds }) {
  if (!axes) return { purpose: null, primary: null, allowed: [], gaps: ["型未定"], notes: [] };
  const gaps = [];
  const purpose = figurePurpose(axes);
  const usable = templates.filter(
    (t) => t.renderer != null && t.review?.status !== "unused" && (t.purposes ?? []).includes(purpose),
  );
  const allowed = usable
    .map((t) => t.id)
    .filter((id) => issue.unit !== "japan" || !NEEDS_REGIONS.has(id))
    .sort((a, b) => rank(PREFERENCE[purpose], a) - rank(PREFERENCE[purpose], b));
  if (!allowed.length) gaps.push("描画器なし");

  const sides = [axes.explanatory, axes.outcome].filter(Boolean);
  // 全国の単年値は 1 点なので、変化の軸が無ければ 2 つの値の関係を描けない
  if (issue.unit === "japan" && purpose === "relationship" && !sides.some((s) => s.pattern === "change")) gaps.push("粒度不足");
  // 群の区分以外の軸はデータが無いと、データがあるか・描けるかを確かめられない
  if (sides.some((s) => s.group !== true && !s.data?.length)) gaps.push("未検証");

  const refs = sides.flatMap((s) => s.data ?? []);
  const metricRefs = refs.filter((r) => r.metric !== undefined);
  const standIns = GRAIN_STAND_INS[issue.unit] ?? {};
  // 問いと違う粒度の値で答える図は、問いの粒度の図としては決まっていない (代わりに使ってよい粒度は注記で足りる)
  if (metricRefs.some((r) => r.grain !== undefined && r.grain !== issue.unit && !standIns[r.grain])) gaps.push("別粒度");
  const missingMetric = metricGrains && metricRefs.some((r) => !metricGrains.has(r.metric));
  const missingSeries = seriesIds && refs.some((r) => r.series !== undefined && !seriesIds.has(r.series));
  if (missingMetric || missingSeries) gaps.push("指標なし");
  // 指標はあるが、使うと書いた粒度 (省けば問いの粒度か、代わりに使ってよい粒度) の値を持たない
  const notes = new Set();
  const fits = (r) => {
    const has = metricGrains.get(r.metric);
    if (r.grain !== undefined) return has.has(r.grain);
    if (has.has(issue.unit)) return true;
    const standIn = Object.keys(standIns).find((g) => has.has(g));
    if (standIn) notes.add(standIns[standIn]);
    return Boolean(standIn);
  };
  if (metricGrains && metricRefs.some((r) => metricGrains.has(r.metric) && !fits(r))) gaps.push("粒度不一致");
  for (const r of metricRefs) if (r.grain && standIns[r.grain]) notes.add(standIns[r.grain]);

  // 増減の内訳は滝の図が主 (台帳の waterfall が「全体の増減はどの要素の足し引きか」に答える)
  const primary =
    purpose === "composition" && sides.some((s) => s.pattern === "change") && allowed.includes("waterfall")
      ? "waterfall"
      : allowed[0] ?? null;
  return { purpose, primary, allowed, gaps, notes: [...notes] };
}

/** 問いの一覧を軸から図へ引く (検査と --axes の一覧が同じ結果を使う) */
export function resolveAllAxes({ issues, templates, metricGrains, seriesIds }) {
  const byId = new Map(issues.map((i) => [i.id, i]));
  return issues
    .filter((i) => i.status === "active")
    .map((issue) => ({
      id: issue.id,
      question: issue.question,
      ...resolveAxesFigure({ issue, axes: effectiveAxes(issue, byId), templates, metricGrains, seriesIds }),
    }));
}

const rank = (order, id) => {
  const i = order.indexOf(id);
  return i < 0 ? order.length : i;
};
