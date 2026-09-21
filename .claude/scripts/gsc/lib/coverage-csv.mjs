import { parse } from 'csv-parse/sync';

/** GSC URLs can contain commas and be CSV-quoted. Do not split or silently drop them. */
export function parseCoverageDrilldown(text, category) {
  const rows = parse(text, { bom: true, skip_empty_lines: true });
  if (JSON.stringify(rows.shift()) !== JSON.stringify(['URL', '前回のクロール'])) throw new Error('coverage_csv_header');
  return rows.map(([url, lastCrawl]) => {
    if (!/^https?:\/\//.test(url)) throw new Error('coverage_csv_url');
    return { url, category, lastCrawl };
  });
}
