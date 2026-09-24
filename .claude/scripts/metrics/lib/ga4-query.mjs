/**
 * ga4-query の引数 → GA4 Data API runReport request への変換 (pure)。
 *
 * 施策ごとの効果判定では「その施策に固有の内訳」(特定ページの source/medium、特定 ad_id の imp 等)
 * が必要になり、週次 snapshot だけでは足りない。その照会をコピペ再現できる 1 行のコマンドにするため、
 * フィルタは次の小さな記法だけを受け付ける (すべて AND):
 *   field==value   EXACT
 *   field^=value   BEGINS_WITH
 *   field*=value   CONTAINS
 *   field=in:a|b   IN_LIST
 */
const DATE = /^(\d{4}-\d{2}-\d{2}|\d+daysAgo|today|yesterday)$/;
const FIELD = /^[A-Za-z][A-Za-z0-9_:]*$/;
const OPERATORS = [
  ['==', 'EXACT'],
  ['^=', 'BEGINS_WITH'],
  ['*=', 'CONTAINS'],
];
export const DEFAULT_LIMIT = 1000;
export const MAX_LIMIT = 100000;

export function parseFilterExpr(expr) {
  const text = String(expr);
  const inMatch = text.match(/^([^=]+)=in:(.+)$/);
  if (inMatch) {
    const [, field, list] = inMatch;
    assertField(field);
    const values = list.split('|').filter(Boolean);
    if (values.length === 0) throw new Error(`in: の値が空: ${text}`);
    return { filter: { fieldName: field, inListFilter: { values } } };
  }
  for (const [token, matchType] of OPERATORS) {
    const at = text.indexOf(token);
    if (at <= 0) continue;
    const field = text.slice(0, at);
    assertField(field);
    const value = text.slice(at + token.length);
    if (value === '') throw new Error(`値が空: ${text}`);
    return { filter: { fieldName: field, stringFilter: { matchType, value } } };
  }
  throw new Error(`フィルタ記法が不正: ${text} (field==v / field^=v / field*=v / field=in:a|b)`);
}

function assertField(field) {
  if (!FIELD.test(field)) throw new Error(`field 名が不正: ${field}`);
}

const list = (value) => String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** argv (process.argv.slice(2)) → { request, format } */
export function buildQuery(argv) {
  const opts = { start: '28daysAgo', end: 'yesterday', dims: [], metrics: [], filters: [], limit: DEFAULT_LIMIT, format: 'csv' };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${flag} に値が無い`);
      return value;
    };
    if (flag === '--start') opts.start = next();
    else if (flag === '--end') opts.end = next();
    else if (flag === '--dims') opts.dims = list(next());
    else if (flag === '--metrics') opts.metrics = list(next());
    else if (flag === '--filter') opts.filters.push(parseFilterExpr(next()));
    else if (flag === '--japan') opts.filters.push(parseFilterExpr('country==Japan'));
    else if (flag === '--order') opts.order = next();
    else if (flag === '--limit') opts.limit = Number(next());
    else if (flag === '--format') opts.format = next();
    else throw new Error(`不明な引数: ${flag}`);
  }
  if (!DATE.test(opts.start) || !DATE.test(opts.end)) throw new Error('--start/--end は YYYY-MM-DD / NdaysAgo / today / yesterday');
  if (opts.metrics.length === 0) throw new Error('--metrics は必須');
  for (const name of [...opts.dims, ...opts.metrics]) assertField(name);
  if (!Number.isInteger(opts.limit) || opts.limit < 1 || opts.limit > MAX_LIMIT) throw new Error(`--limit は 1..${MAX_LIMIT}`);
  if (!['csv', 'json'].includes(opts.format)) throw new Error('--format は csv か json');
  if (opts.order && !opts.metrics.includes(opts.order)) throw new Error('--order は --metrics のどれか');

  const request = {
    dateRanges: [{ startDate: opts.start, endDate: opts.end }],
    dimensions: opts.dims.map((name) => ({ name })),
    metrics: opts.metrics.map((name) => ({ name })),
    limit: opts.limit,
    orderBys: [{ metric: { metricName: opts.order ?? opts.metrics[0] }, desc: true }],
  };
  if (opts.filters.length === 1) request.dimensionFilter = opts.filters[0];
  if (opts.filters.length > 1) request.dimensionFilter = { andGroup: { expressions: opts.filters } };
  return { request, format: opts.format };
}
