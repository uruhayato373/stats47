/** Parse only the observed account-total panel, not chart labels or recommendations. */
export function parseCoconalaAnalytics(text) {
  const section = text.split('全出品サービス累計')[1]?.split('閲覧数・販売数推移')[0];
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
  return { schemaVersion: 1, scope: 'account-total', period: { start: period[1].replaceAll('/', '-'), end: period[2].replaceAll('/', '-') },
    views: value('閲覧数', '回'), orders: value('販売数', '件'), grossSalesJpy: value('販売額', '円'), favorites: value('お気に入り数', '回'),
    impressions: gated ? null : value('表示数', '回'), impressionsStatus: gated ? 'subscription_required' : 'available' };
}
