/**
 * gsc-query の引数 → Search Console searchanalytics.query request への変換 (pure)。
 *
 * 施策固有の内訳 (特定ページ群の clicks、特定クエリの順位) を、コピペ再現できる 1 行コマンドで取るため。
 * 記法は ga4-query と揃え、GSC API が持つ演算子だけを受け付ける (すべて AND):
 *   dim==value   equals
 *   dim*=value   contains
 *   dim!*=value  notContains
 *   dim~=regex   includingRegex (RE2)
 * dim は page / query / country / device / searchAppearance。page は https://stats47.jp/... の完全 URL で照合される。
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DIMENSIONS = new Set(["page", "query", "country", "device", "date", "searchAppearance"]);
const FILTER_DIMENSIONS = new Set(["page", "query", "country", "device", "searchAppearance"]);
const OPERATORS = [
  ["!*=", "notContains"],
  ["==", "equals"],
  ["*=", "contains"],
  ["~=", "includingRegex"],
];
export const DEFAULT_ROW_LIMIT = 1000;
export const MAX_ROW_LIMIT = 25000;

export function parseGscFilter(expr) {
  const text = String(expr);
  for (const [token, operator] of OPERATORS) {
    const at = text.indexOf(token);
    if (at <= 0) continue;
    const dimension = text.slice(0, at);
    if (!FILTER_DIMENSIONS.has(dimension)) throw new Error(`filter の dimension が不正: ${dimension}`);
    const expression = text.slice(at + token.length);
    if (expression === "") throw new Error(`値が空: ${text}`);
    return { dimension, operator, expression };
  }
  throw new Error(`フィルタ記法が不正: ${text} (dim==v / dim*=v / dim!*=v / dim~=regex)`);
}

const list = (value) => String(value ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** argv → { request, format }。期間は必須 (GSC は取得遅延があるので暗黙の「昨日まで」を置かない)。 */
export function buildGscQuery(argv) {
  const opts = { dims: [], filters: [], limit: DEFAULT_ROW_LIMIT, format: "csv", type: "web" };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${flag} に値が無い`);
      return value;
    };
    if (flag === "--start") opts.start = next();
    else if (flag === "--end") opts.end = next();
    else if (flag === "--dims") opts.dims = list(next());
    else if (flag === "--filter") opts.filters.push(parseGscFilter(next()));
    else if (flag === "--limit") opts.limit = Number(next());
    else if (flag === "--format") opts.format = next();
    else throw new Error(`不明な引数: ${flag}`);
  }
  if (!DATE.test(opts.start ?? "") || !DATE.test(opts.end ?? "")) throw new Error("--start/--end は YYYY-MM-DD で必須");
  if (opts.start > opts.end) throw new Error("--start が --end より後");
  for (const d of opts.dims) if (!DIMENSIONS.has(d)) throw new Error(`dimension が不正: ${d}`);
  if (!Number.isInteger(opts.limit) || opts.limit < 1 || opts.limit > MAX_ROW_LIMIT) throw new Error(`--limit は 1..${MAX_ROW_LIMIT}`);
  if (!["csv", "json"].includes(opts.format)) throw new Error("--format は csv か json");
  const request = {
    startDate: opts.start,
    endDate: opts.end,
    dimensions: opts.dims,
    type: opts.type,
    rowLimit: opts.limit,
  };
  if (opts.filters.length) request.dimensionFilterGroups = [{ groupType: "and", filters: opts.filters }];
  return { request, format: opts.format };
}
