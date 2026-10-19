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
