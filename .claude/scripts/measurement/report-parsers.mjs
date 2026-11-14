/**
 * note の売上 API (`/api/v1/stats/sales`) の応答を週次実売の入力にする。
 * 今月の売上 (total_current_month_sales) と締め済み月の販売額 (total_sales[].sales) だけを使い、
 * 振込残高 (unpaid_*) は読まない。金額はどちらも手数料控除前。
 */
export function parseNoteSales(body, observedDate) {
  if (body?.error?.code === 'user_verification_needed') throw new Error('verification_required');
  const data = body?.data;
  const start = /^(\d{4})\/(\d{2})\/01$/.exec(data?.start_date ?? '');
  if (!start || !Number.isSafeInteger(data.total_current_month_sales) || data.total_current_month_sales < 0 || !Array.isArray(data.total_sales)) {
    throw new Error('report_schema_changed');
  }
  const closedMonths = {};
  for (const row of data.total_sales) {
    const month = /^(\d{4})(\d{2})$/.exec(String(row?.date ?? ''));
    if (!month || !Number.isSafeInteger(row.sales) || row.sales < 0) throw new Error('report_schema_changed');
    closedMonths[`${month[1]}-${month[2]}`] = row.sales;
  }
  return { date: observedDate, month: `${start[1]}-${start[2]}`, monthToDateYen: data.total_current_month_sales, closedMonths };
}

/**
 * note の販売履歴 (/dashboard/sales?datespan=YYYYMM) から読んだ購入を、収益の明細 (data/revenue/daily) の行にする。
 * 画面には購入者名が出るが、取得側 (note-sales.mjs) は URL・日付・金額だけを取り出し、名前はブラウザの外へ出さない。
 * ここへ渡る items に名前の項目があれば止める (公開リポジトリへ個人の名前を書かない)。
 * 同じ日・同じ記事の購入は 1 行にまとめる。記事に結べない購入 (マガジン・メンバーシップ・チップ) は productId の無い合計行にする。
 *
 * @param {Array<{month:string, complete:boolean, items:Array<{url:string|null, date:string, priceYen:number}>}>} pages
 * @param {{start:string, end:string, observedAt:string}} range
 * @returns {{channel:'note', start:string, end:string, rows:Array<object>}}
 */
export function parseNoteSalesHistory(pages, { start, end, observedAt }) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.some(p => p?.complete !== true || !Array.isArray(p.items))) throw new Error('report_incomplete');
  const months = new Set(pages.map(p => p.month));
  for (let m = start.slice(0, 7); m <= end.slice(0, 7);) {
    if (!months.has(m)) throw new Error('report_incomplete');
    const [y, mo] = m.split('-').map(Number);
    m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
  }
  const rows = new Map();
  for (const page of pages) {
    for (const item of page.items) {
      if (Object.keys(item).some(k => !['url', 'date', 'priceYen'].includes(k))) throw new Error('report_schema_changed');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date ?? '') || item.date.slice(0, 7) !== page.month
        || !Number.isSafeInteger(item.priceYen) || item.priceYen < 0) throw new Error('report_schema_changed');
      if (item.date < start || item.date > end) continue;
      const id = /^https:\/\/note\.com\/stats47\/n\/(n[0-9a-f]{12})$/.exec(item.url ?? '')?.[1] ?? null;
      const kind = id ? 'sales' : 'sales-total';
      const key = JSON.stringify([item.date, id]);
      const row = rows.get(key) ?? { date: item.date, channel: 'note', productId: id, kind, quantity: 0, amountYen: 0, finality: 'final', observedAt };
      row.quantity += 1;
      row.amountYen += item.priceYen;
      rows.set(key, row);
    }
  }
  return { channel: 'note', start, end, rows: [...rows.values()] };
}
