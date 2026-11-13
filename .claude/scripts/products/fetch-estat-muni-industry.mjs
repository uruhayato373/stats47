#!/usr/bin/env node
/**
 * fetch-estat-muni-industry.mjs — 市区町村 × 製造業の業種 (産業中分類) の値を e-Stat の地域編の表から取る。
 *
 * appId は CI 専任なので、CI (`estat-muni-industry.yml`) だけが動かす。出力は e-Stat が公開している値を
 * 「年・自治体コード・業種」に分けて並べ直しただけの JSON で、そろえた CSV・境界・README などの販売物は作らない
 * (公開リポジトリの artifact は誰でも取れるため。販売物は Mac が build-muni-data-product.mjs で作る)。
 * 地域を絞る cdArea は使わず (estat-api.md)、項目 (製造品出荷額等) の軸だけで絞って表を取り、自治体はメモリで選ぶ。
 * 地域編の表は地域と業種が 1 つの軸にまとまり、名前は「年コード_年_自治体コード_自治体名_業種コード_業種名」。
 *
 * Usage (CI): node .claude/scripts/products/fetch-estat-muni-industry.mjs \
 *   --stats-data-ids 0004048588,0004028808,0004035178 [--areas all|23211,33202] --out <dir>
 * 取り込み (Mac): gh run download <run> -n estat-muni-industry -D .local/muni-data-products/_cache/industry
 */
import fs from 'node:fs';
import path from 'node:path';
import { fetchMetaInfo, fetchStatsData } from '../lib/estat-catalog/api.mjs';

const PAGE_LIMIT = 100000;
const ITEM_NAME = '製造品出荷額等';
const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };

/**
 * 項目 (製造品出荷額等) の軸と、そのコード。名前の完全一致を優先し、無ければ「製造品出荷額等【万円】」のように
 * その名前で始まる項目を選ぶ。地域・業種の軸より件数が少ない軸の、名前が短いものを採る
 */
export function findItem(classObjs, itemName) {
  const hits = (match) => classObjs.flatMap((obj) => asList(obj.CLASS).filter((c) => match(c['@name'] ?? ''))
    .map((c) => ({ id: obj['@id'], code: c['@code'], name: c['@name'], size: asList(obj.CLASS).length })));
  const found = hits((n) => n === itemName);
  const candidates = found.length ? found : hits((n) => n.startsWith(itemName));
  return candidates.sort((a, b) => a.size - b.size || a.name.length - b.name.length)[0] ?? null;
}

const AREA_INDUSTRY = /^\d+_(\d{4})_(\d{2}|\d{5})_(.+)_(\d{2})_([^_]+)$/;
/**
 * 地域編の名前「2023000000_2023_23211_豊田市_09_食料品製造業」を年・自治体・業種に分ける。
 * 都道府県は 2 桁 (「_23_愛知県_」) なので NN000 に、全国計は 00000 にそろえる。形が違えば null
 */
export function parseAreaIndustry(name) {
  const m = AREA_INDUSTRY.exec(name);
  if (!m) return null;
  const [, year, code, areaName, industry, industryName] = m;
  return { year: Number(year), area: code.length === 2 ? `${code}000` : code, areaName, industry, industryName };
}

/** 項目名の【】から単位を読む (「製造品出荷額等【万円】」→「万円」)。無ければ null */
export const unitOf = (itemName) => /【(.+)】/.exec(itemName)?.[1] ?? null;

async function fetchTable(statsDataId, areas) {
  const meta = (await fetchMetaInfo(statsDataId)).GET_META_INFO.METADATA_INF;
  const classObjs = asList(meta.CLASS_INF.CLASS_OBJ);
  const item = findItem(classObjs, ITEM_NAME);
  if (!item) throw Error(`${statsDataId}: 項目「${ITEM_NAME}」が表の軸に無い`);
  const axis = classObjs.find((obj) => asList(obj.CLASS).some((c) => parseAreaIndustry(c['@name'] ?? '')));
  if (!axis) throw Error(`${statsDataId}: 地域と業種の軸 (年_自治体_業種) が見つからない`);
  const names = new Map(asList(axis.CLASS).map((c) => [c['@code'], c['@name']]));
  const filter = { [`cd${item.id[0].toUpperCase()}${item.id.slice(1)}`]: item.code };
  const rows = [];
  const unparsed = new Set();
  let start = 1, total = 0;
  for (;;) {
    const data = (await fetchStatsData({ statsDataId, ...filter, limit: String(PAGE_LIMIT), startPosition: String(start) })).GET_STATS_DATA.STATISTICAL_DATA;
    total = Number(data.RESULT_INF?.TOTAL_NUMBER ?? 0);
    for (const value of asList(data.DATA_INF?.VALUE)) {
      const name = names.get(value[`@${axis['@id']}`]) ?? '';
      const parsed = parseAreaIndustry(name);
      if (!parsed) { unparsed.add(name); continue; }
      if (areas && !areas.has(parsed.area)) continue;
      rows.push({ ...parsed, value: value.$ });
    }
    const next = data.RESULT_INF?.NEXT_KEY;
    if (!next) break;
    start = Number(next);
  }
  return {
    statsDataId, statName: meta.TABLE_INF.STAT_NAME?.$, title: meta.TABLE_INF.TITLE?.$ ?? meta.TABLE_INF.TITLE,
    item: item.name, unit: unitOf(item.name), totalRows: total, unparsed: [...unparsed].slice(0, 20), rows,
  };
}

async function main() {
  const ids = (arg('--stats-data-ids') ?? '').split(',').filter(Boolean);
  const areaArg = arg('--areas') ?? 'all';
  const areas = areaArg === 'all' ? null : new Set(areaArg.split(',').filter(Boolean));
  const out = arg('--out');
  if (!ids.length || !out) throw Error('--stats-data-ids と --out が要る');
  fs.mkdirSync(out, { recursive: true });
  for (const id of ids) {
    const table = await fetchTable(id, areas);
    fs.writeFileSync(path.join(out, `estat-industry-${id}.json`), `${JSON.stringify(table)}\n`);
    const years = [...new Set(table.rows.map((r) => r.year))];
    console.log(`${id}: 年 ${years.join(',')} / 単位 ${table.unit} / 全 ${table.totalRows} 行・保存 ${table.rows.length} 行・形の違う名前 ${table.unparsed.length}`);
    if (!table.rows.length) throw Error(`${id}: 行が 0`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
