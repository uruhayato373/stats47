/** Parse only the observed account-total panel, not chart labels or recommendations. */
export function parseCoconalaAnalytics(text, { service = false } = {}) {
  const section = text.split(service ? 'サービスのパフォーマンス' : '全出品サービス累計')[1]?.split('閲覧数・販売数推移')[0];
  const period = section?.match(/対象期間：\s*(\d{4}\/\d{2}\/\d{2})\s*-\s*(\d{4}\/\d{2}\/\d{2})/);
  if (!period) throw new Error('report_schema_changed');
  const value = (label, unit) => {
    const match = section.match(new RegExp(`(?:^|\\n)${label}\\s*\\n([\\d,]+)\\s*${unit}(?:\\n|$)`));
    if (!match) throw new Error('report_schema_changed');
    const number = Number(match[1].replaceAll(',', ''));
    if (!Number.isSafeInteger(number) || number < 0) throw new Error('report_schema_changed');
    return number;
  };
  const gated = section.includes('表示数を確認しましょう');
  return { schemaVersion: 1, scope: service ? 'service' : 'account-total', period: { start: period[1].replaceAll('/', '-'), end: period[2].replaceAll('/', '-') },
    views: value('閲覧数', '回'), orders: value('販売数', '件'), grossSalesJpy: service ? null : value('販売額', '円'), favorites: value('お気に入り数', '回'),
    impressions: gated ? null : value('表示数', '回'), impressionsStatus: gated ? 'subscription_required' : 'available' };
}

export function validateCoconalaCoverage(total, records) {
  if (!records.length || new Set(records.map(r => r.serviceId)).size !== records.length) throw new Error('collection_incomplete');
  if (records.some(r => r.period.start !== total.period.start || r.period.end !== total.period.end)) throw new Error('collection_incomplete');
  for (const key of ['views', 'orders', 'favorites']) {
    if (records.reduce((sum, row) => sum + row[key], 0) !== total[key]) throw new Error('collection_incomplete');
  }
  return { complete: true, serviceCount: records.length, totalsMatched: true };
}

/**
 * 売上管理ページ (/mypage/revenue) の「売上実績」のサービス欄だけを読む。値は手数料控除後で、
 * トークルームのクローズ時点で計上される (画面の注記)。振込残高や広告欄の数字は読まない。
 */
export function parseCoconalaRevenue(text) {
  const section = text.split('売上実績')[1]?.split('売上履歴')[0];
  const service = section?.split('サービス')[1]?.split('ブログ')[0];
  const read = (label) => {
    const match = service?.match(new RegExp(`${label}\\s*\\n\\s*([\\d,]+)\\s*円`));
    if (!match) throw new Error('report_schema_changed');
    const number = Number(match[1].replaceAll(',', ''));
    if (!Number.isSafeInteger(number) || number < 0) throw new Error('report_schema_changed');
    return number;
  };
  return { schemaVersion: 1, scope: 'service-net-revenue', monthToDateYen: read('今月の売上'), cumulativeYen: read('累積売上') };
}

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
