#!/usr/bin/env node
/**
 * fetch-estat-industry-sample.mjs — 商品の見本画像に使う、市区町村 × 製造業の業種別の値を e-Stat から少しだけ取る。
 *
 * appId は CI 専任なので、CI (`estat-industry-sample.yml`) だけが動かす。出力は artifact で、公開リポジトリの artifact は
 * 誰でも取れるため、指定した数自治体の行と表の構成だけを書く (表全体や販売物は書かない)。
 * 地域を絞る cdArea は使わず (estat-api.md)、表を取ってから自治体コードで抜き出す。地域と業種が 1 つの軸に
 * まとまった表 (地域編) と別々の軸の表のどちらでも抜き出せるよう、各軸のコードと名前を行ごとにそのまま残す。
 *
 * Usage (CI): node .claude/scripts/products/fetch-estat-industry-sample.mjs \
 *   --stats-data-id 0004035178 --areas 23211,33202 --item 製造品出荷額等 --out <dir>
 * 取り込み (Mac): gh run download <run> -n estat-industry-sample -D <作業領域>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fetchMetaInfo, fetchStatsData } from '../lib/estat-catalog/api.mjs';

const PAGE_LIMIT = 100000;
const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };

/**
 * 項目 (製造品出荷額等) の軸と、そのコード。名前の完全一致を優先し、無ければ「製造品出荷額等（万円）」のように
 * その名前で始まる項目を選ぶ。地域・業種の軸より件数が少ない軸の、名前が短いものを採る
 */
export function findItem(classObjs, itemName) {
  const hits = (match) => classObjs.flatMap((obj) => asList(obj.CLASS).filter((c) => match(c['@name'] ?? ''))
    .map((c) => ({ id: obj['@id'], code: c['@code'], name: c['@name'], size: asList(obj.CLASS).length })));
  const found = hits((n) => n === itemName);
  const candidates = found.length ? found : hits((n) => n.startsWith(itemName));
  return candidates.sort((a, b) => a.size - b.size || a.name.length - b.name.length)[0] ?? null;
}

/** 行のどれかの軸が対象の自治体コードを持つ (コードそのもの、または「_23211_」のように名前に含む) か */
export function areaOf(dims, areas) {
  for (const code of areas) {
    if (Object.values(dims).some((d) => d.code === code || d.code.endsWith(code) || d.name.includes(`_${code}_`) || d.name.startsWith(`${code}_`))) return code;
  }
  return null;
}

async function main() {
  const statsDataId = arg('--stats-data-id');
  const areas = (arg('--areas') ?? '').split(',').filter(Boolean);
  const itemName = arg('--item') ?? '製造品出荷額等';
  const out = arg('--out');
  if (!statsDataId || !areas.length || !out) throw Error('--stats-data-id と --areas と --out が要る');
  const meta = (await fetchMetaInfo(statsDataId)).GET_META_INFO.METADATA_INF;
  const classObjs = asList(meta.CLASS_INF.CLASS_OBJ);
  const names = Object.fromEntries(classObjs.map((obj) => [obj['@id'], new Map(asList(obj.CLASS).map((c) => [c['@code'], c['@name']]))]));
  const structure = {
    statsDataId, title: meta.TABLE_INF.TITLE?.$ ?? meta.TABLE_INF.TITLE, statName: meta.TABLE_INF.STAT_NAME?.$,
    classes: classObjs.map((obj) => ({ id: obj['@id'], name: obj['@name'], size: asList(obj.CLASS).length, first: asList(obj.CLASS).slice(0, 8).map((c) => `${c['@code']} ${c['@name']}`) })),
  };
  // 失敗しても表の構成は残す (軸と名前を見て直すため)
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'structure.json'), JSON.stringify(structure, null, 1) + '\n');
  for (const c of structure.classes) console.log(`${c.id} ${c.name} (${c.size}): ${c.first.slice(0, 3).join(' / ')}`);
  const item = findItem(classObjs, itemName);
  if (!item) throw Error(`項目「${itemName}」が表の軸に無い`);
  console.log(`項目: ${item.id} ${item.code} ${item.name}`);
  const filter = { [`cd${item.id[0].toUpperCase()}${item.id.slice(1)}`]: item.code };
  const rows = [];
  let start = 1, total = 0;
  for (;;) {
    const data = (await fetchStatsData({ statsDataId, ...filter, limit: String(PAGE_LIMIT), startPosition: String(start) })).GET_STATS_DATA.STATISTICAL_DATA;
    total = Number(data.RESULT_INF?.TOTAL_NUMBER ?? 0);
    for (const value of asList(data.DATA_INF?.VALUE)) {
      const dims = Object.fromEntries(Object.entries(value).filter(([k]) => k.startsWith('@') && names[k.slice(1)]).map(([k, code]) => [k.slice(1), { code, name: names[k.slice(1)].get(code) ?? '' }]));
      const area = areaOf(dims, areas);
      if (area) rows.push({ area, dims, unit: value['@unit'] ?? null, value: value.$ });
    }
    const next = data.RESULT_INF?.NEXT_KEY;
    if (!next) break;
    start = Number(next);
  }
  fs.writeFileSync(path.join(out, 'structure.json'), JSON.stringify({ ...structure, item, filter, totalRows: total }, null, 1) + '\n');
  fs.writeFileSync(path.join(out, 'rows.json'), JSON.stringify({ statsDataId, itemName, areas, rows }, null, 1) + '\n');
  const found = new Set(rows.map((r) => r.area));
  console.log(`${statsDataId}: 全 ${total} 行のうち対象 ${rows.length} 行 (自治体 ${found.size}/${areas.length})`);
  if (found.size !== areas.length) throw Error(`見つからない自治体: ${areas.filter((a) => !found.has(a)).join(' ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
