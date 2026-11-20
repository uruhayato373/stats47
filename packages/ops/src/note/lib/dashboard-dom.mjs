/** browser-use evalへ渡す純DOM関数。ラベル以外の非公開アプリ状態は参照しない。 */
export function extractDashboardDom() {
  const clean = e => e?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const tables = [...document.querySelectorAll('table[aria-label="記事一覧"]')];
  const table = tables[0];
  const section = table?.closest("section");
  const paragraphs = [...(section?.querySelectorAll("p") ?? [])];
  const summary = {};
  for (const label of ["インプレッション", "ページビュー", "スキ", "コメント", "売上"]) {
    const labels = paragraphs.filter(e => clean(e) === label);
    const candidates = labels.map(e => [...e.parentElement.parentElement.querySelectorAll("p")].map(clean))
      .filter(values => (values.length === 2 || (values.length === 3 && values[2] === "円")) && values[0] === label);
    summary[label] = candidates.length === 1 ? candidates[0][1] : null;
  }
  const times = paragraphs.filter(e => /集計$/.test(clean(e)));
  const tableTime = section?.querySelector('[data-testid="last-aggregated-at"]');
  const summaryTimes = times.filter(e => e !== tableTime);
  return {
    url: location.href, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    periodText: paragraphs.map(clean).find(t => /^\d{4}\/\d{1,2}\/\d{1,2}[〜～]\d{4}\/\d{1,2}\/\d{1,2}$/.test(t)) ?? "",
    periodLabel: clean(document.querySelector('button[aria-label="期間選択"]')),
    articleAggregatedAt: clean(tableTime), summaryAggregatedAt: summaryTimes.length === 1 ? clean(summaryTimes[0]) : "",
    selectedTab: clean(section?.querySelector('[role="tab"][aria-selected="true"]')),
    tableCount: tables.length,
    headers: [...(table?.querySelectorAll("thead th") ?? [])].map(clean),
    rows: [...(table?.querySelectorAll("tbody tr") ?? [])].map(tr => {
      const cells = [...tr.querySelectorAll("td")];
      const a = tr.querySelector('a[href*="/n/"]');
      const spans = [...(cells[0]?.querySelectorAll("span") ?? [])].map(clean);
      return { url: a?.href ?? "", title: clean(a), cells: cells.map(clean),
        statusText: spans.find(t => ["公開中", "非公開"].includes(t)) ?? "",
        publishedText: spans.find(t => /^\d{4}年\d{1,2}月\d{1,2}日$/.test(t)) ?? "" };
    }),
    hasMore: [...(section?.querySelectorAll("button") ?? [])].some(e => clean(e) === "もっとみる"),
    summary,
  };
}

/** 「もっとみる」が読み込み中に一瞬消えても、次のページを取りこぼさない。 */
export async function collectDashboardPages({ initial, read, loadMore, settle, onProgress = () => {}, maxPages = 100 }) {
  let raw = initial;
  let pages = 1;
  while (true) {
    if (!raw.hasMore) {
      await settle();
      const next = await read();
      if (!next.hasMore && next.rows.length === raw.rows.length) return { ...next, paginationComplete: true, pages };
      raw = next;
      continue;
    }
    if (pages >= maxPages) throw new Error("pagination_limit");
    const previousCount = raw.rows.length;
    raw = await loadMore(previousCount);
    if (raw.rows.length <= previousCount) throw new Error("pagination_no_progress");
    pages++;
    onProgress(pages, raw.rows.length);
  }
}
