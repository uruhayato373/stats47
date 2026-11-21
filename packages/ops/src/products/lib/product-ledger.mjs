/**
 * 商品の台帳の組み立て (読み書きをしない部分)。価格・状態・実績は既存の台帳と記録から読み、
 * 商品群の判断だけを data/products/product-strategy.json から足す。
 */

/** 記事台帳と KDP の出品台帳を、同じ形の商品の行にする */
export function collectProducts({ articles, listings }) {
  const notes = articles
    .filter((article) => article.isPaid)
    .map((article) => ({
      channel: "note",
      key: article.key,
      title: article.title,
      priceYen: article.priceJpy ?? null,
      status: article.status,
      vertical: article.vertical ?? null,
      noteId: article.noteUrl ? article.noteUrl.split("/").pop() : null,
    }));
  const books = Object.values(listings).map((listing) => ({
    channel: "kdp",
    key: listing.id,
    title: listing.title,
    priceYen: listing.priceYen ?? null,
    status: listing.publicationStage ?? listing.status,
    vertical: null,
    noteId: null,
  }));
  return [...notes, ...books];
}

const matches = (rule, product) =>
  rule.channel === product.channel
  && rule.status.includes(product.status)
  && (rule.vertical === undefined || rule.vertical === product.vertical)
  && (rule.minYen === undefined || (product.priceYen ?? 0) >= rule.minYen)
  && (rule.maxYen === undefined || (product.priceYen ?? 0) <= rule.maxYen);

/** 商品群は台帳の順で最初に当たったものにする。どれにも当たらない商品は null */
export function lineOf(lines, product) {
  return lines.find((line) => matches(line.match, product))?.id ?? null;
}

/** note のカード払いの手取り (公式ヘルプの料率。事務手数料を引いた額にプラットフォーム利用料) */
export function noteNetYen(priceYen, fee) {
  return Math.floor(priceYen * (1 - fee.cardProcessingRate) * (1 - fee.platformRate));
}

/**
 * 商品の行に実績を足す。閲覧を測れない販売面は null のままにし、0 と書かない。
 * 売上は note が閲覧の記録の期間、KDP が販売台帳の累計で、期間が違う。
 */
export function buildLedger({ strategy, products, dashboard, salesObservations, priceHistory, asOf }) {
  const byNote = new Map((dashboard?.articles ?? []).map((row) => [row.noteId, row]));
  const kdpSales = new Map();
  for (const row of salesObservations.filter((o) => o.channel === "kdp")) {
    const sum = kdpSales.get(row.productId) ?? { units: 0, netYen: 0 };
    kdpSales.set(row.productId, { units: sum.units + row.units, netYen: sum.netYen + row.netRevenueYen });
  }
  const rows = products.map((product) => {
    const dash = product.noteId ? byNote.get(product.noteId) : null;
    const sold = product.channel === "kdp" ? (kdpSales.get(product.key) ?? { units: 0, netYen: 0 }) : null;
    const lastChange = priceHistory.changes.filter((c) => c.productKey === product.key && c.status === "applied").at(-1) ?? null;
    return {
      channel: product.channel,
      key: product.key,
      title: product.title,
      line: lineOf(strategy.lines, product),
      status: product.status,
      priceYen: product.priceYen,
      netPerSaleYen: product.channel === "note" && product.priceYen ? noteNetYen(product.priceYen, strategy.fees.note) : null,
      pageViews: dash ? dash.pageViews : null,
      salesYen: dash ? dash.salesJpy : (sold?.netYen ?? null),
      unitsSold: sold?.units ?? null,
      lastPriceChange: lastChange ? { fromYen: lastChange.fromYen, toYen: lastChange.toYen, appliedAt: lastChange.appliedAt } : null,
    };
  });
  const lines = strategy.lines.map((line) => {
    const members = rows.filter((row) => row.line === line.id);
    const prices = members.map((row) => row.priceYen).filter((price) => price !== null);
    const sum = (field) => (members.some((row) => row[field] !== null) ? members.reduce((total, row) => total + (row[field] ?? 0), 0) : null);
    return {
      id: line.id,
      name: line.name,
      stance: line.stance,
      products: members.length,
      priceMinYen: prices.length ? Math.min(...prices) : null,
      priceMaxYen: prices.length ? Math.max(...prices) : null,
      pageViews: sum("pageViews"),
      salesYen: sum("salesYen"),
      nextReviewOn: line.nextReviewOn,
      reviewDue: line.nextReviewOn <= asOf,
    };
  });
  return {
    schemaVersion: 1,
    asOf,
    notePeriod: dashboard?.period ? { start: dashboard.period.start, end: dashboard.period.end } : null,
    lines,
    experiments: priceHistory.experiments.map((e) => ({ id: e.id, status: e.status, reviewOn: e.reviewOn, due: e.status === "running" && e.reviewOn <= asOf })),
    unassigned: rows.filter((row) => row.line === null).map((row) => `${row.channel}:${row.key}`),
    products: rows,
  };
}

const yen = (value) => (value === null ? "未計測" : `¥${value.toLocaleString("en-US")}`);
const range = (line) => (line.priceMinYen === null ? "—" : line.priceMinYen === line.priceMaxYen ? yen(line.priceMinYen) : `${yen(line.priceMinYen)}〜${yen(line.priceMaxYen)}`);
const STANCE = { "price-test": "価格の実験中", keep: "続ける", hold: "保留", stop: "止める" };

/** 週次・月次のレビューが読む要約 */
export function renderLedgerMarkdown(ledger, strategy) {
  const lines = [`# 商品の台帳 — ${ledger.asOf}`, ""];
  if (ledger.notePeriod) lines.push(`note の閲覧と売上は ${ledger.notePeriod.start}〜${ledger.notePeriod.end}。KDP の売上は販売台帳の累計 (手取り)。`, "");
  lines.push("| 商品群 | 構え | 本数 | 価格 | 閲覧 | 売上 | 次の見直し |", "|---|---|---:|---|---:|---:|---|");
  for (const line of ledger.lines) {
    lines.push(`| ${line.name} | ${STANCE[line.stance]} | ${line.products} | ${range(line)} | ${line.pageViews ?? "未計測"} | ${yen(line.salesYen)} | ${line.nextReviewOn}${line.reviewDue ? " ⚠️ 期日" : ""} |`);
  }
  lines.push("");
  const due = ledger.experiments.filter((experiment) => experiment.due);
  if (due.length) lines.push(`**判定の期日が来た価格実験**: ${due.map((e) => e.id).join("・")}`, "");
  lines.push("## 次に議論する論点", "");
  for (const item of strategy.agenda) lines.push(`- **${item.topic}**: ${item.question} (必要な材料: ${item.evidenceNeeded})`);
  lines.push("", "## 直近の決定", "");
  for (const item of strategy.decisions.slice(-5).reverse()) lines.push(`- ${item.date} ${item.topic}: ${item.decision}`);
  lines.push("");
  return lines.join("\n");
}
