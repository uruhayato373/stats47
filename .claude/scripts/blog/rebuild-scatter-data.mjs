#!/usr/bin/env node
/**
 * rebuild-scatter-data.mjs — 点データ (json) を失った散布図を、指標と年の指定から R2 の観測値で作り直す。
 *
 * 公開中の SVG は答え合わせにだけ使い、値は必ず R2 から取る (SVG の絵から値を逆復元しない)。どの指標・年かは
 * 図の点の位置や <title> の値と照らして決め、spec に書く。出力は regenerate-blog-svgs.yml の
 * mode=source-repair に渡す base64 で、書き込みは CI だけが行う。
 *
 * spec: [{ slug, base, x: [key, year], y: [key, year] }, ...]
 *       x の代わりに calc: { num: [key, year], den: [key, year], digits, unit } で割り算の軸を作れる
 *       xLabel / yLabel で軸の名前を書く (指標で確かめられない軸に要る)
 *       { slug, base, patch: {...} } は点データを変えず source.json にだけ足す (sourceName など)
 *
 * Usage: node .claude/scripts/blog/rebuild-scatter-data.mjs --spec <spec.json> --out <dir>
 *        → <dir>/repair.b64 を gh workflow run regenerate-blog-svgs.yml -f mode=source-repair -f source_repair_payload=... へ渡す
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)('../lib/site-config.cjs');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const TOOL = '.claude/scripts/blog/rebuild-scatter-data.mjs';
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

const getText = async (url) => {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (res.ok) return res.text();
    } catch { /* 取り直す */ }
    await new Promise((d) => setTimeout(d, 1200 * (i + 1)));
  }
  throw new Error(`取得できない: ${url}`);
};

/** 1 年分の 47 県の値。欠けがあれば止める */
export function yearValues(rows, key, year) {
  const picked = rows.filter((r) => r.yearCode === year && /^\d{2}000$/.test(r.areaCode) && r.areaCode !== '00000' && r.value !== null);
  if (picked.length !== 47) throw new Error(`${key}@${year}: ${picked.length} 県しかない`);
  return { map: new Map(picked.map((r) => [r.areaCode, r])), unit: String(picked[0].unit ?? '').replace(/^（(.*)）$/, '$1') };
}

/** 観測値から点データと manifest を組み立てる (純粋関数) */
export function buildRepair(spec, oldSource, x, y) {
  const points = [...x.map].sort(([a], [b]) => a.localeCompare(b)).map(([code, r]) => ({ label: r.areaName, code, x: r.value, y: y.map.get(code).value }));
  const { generatedBy: _old, rankingKeys: _keys, ...kept } = oldSource;
  const manifest = spec.calc
    ? { ...kept, kind: 'calculated', yKey: spec.y[0], year: `x:${spec.calc.num[1]}/y:${spec.y[1]}`, generatedBy: TOOL,
        inputs: [{ rankingKey: spec.calc.num[0], year: spec.calc.num[1], role: 'numerator' }, { rankingKey: spec.calc.den[0], year: spec.calc.den[1], role: 'denominator' }, { rankingKey: spec.y[0], year: spec.y[1], role: 'y' }],
        formula: `x = ${spec.calc.num[0]} / ${spec.calc.den[0]} (小数${spec.calc.digits}桁) / y = ${spec.y[0]}` }
    : { ...kept, kind: 'scatter', xKey: spec.x[0], yKey: spec.y[0], year: `x:${spec.x[1]}/y:${spec.y[1]}`, generatedBy: TOOL };
  const labels = { ...(spec.xLabel ? { xLabel: spec.xLabel } : {}), ...(spec.yLabel ? { yLabel: spec.yLabel } : {}) };
  return { manifest, data: { chartType: 'scatter', title: spec.base, ...labels, xUnit: x.unit, yUnit: y.unit, points } };
}

async function main(argv) {
  const arg = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const specs = JSON.parse(fs.readFileSync(arg('--spec'), 'utf8'));
  const out = arg('--out');
  if (!out) throw new Error('--out <dir> が要る');
  const rowsCache = new Map();
  const load = async ([key, year]) => {
    if (!rowsCache.has(key)) rowsCache.set(key, JSON.parse(await getText(`${R2}/app/stats/${key}/values.json`)).rows);
    return yearValues(rowsCache.get(key), key, year);
  };
  const payload = [];
  for (const spec of specs) {
    const dir = `${R2}/app/blog/${spec.slug}/data/${spec.base}`;
    const [sourceText, dataText] = await Promise.all([getText(`${dir}.source.json`), getText(`${dir}.json`)]);
    if (!sourceText) throw new Error(`${spec.slug}/${spec.base}: source.json が無い`);
    if (spec.patch) {
      payload.push({ slug: spec.slug, base: spec.base, manifest: { ...JSON.parse(sourceText), ...spec.patch }, expectedSourceSha256: sha256(sourceText) });
      continue;
    }
    let x;
    if (spec.calc) {
      const num = await load(spec.calc.num), den = await load(spec.calc.den);
      x = { unit: spec.calc.unit, map: new Map([...num.map].map(([code, r]) => [code, { ...r, value: Number((r.value / den.map.get(code).value).toFixed(spec.calc.digits)) }])) };
    } else {
      x = await load(spec.x);
    }
    const { manifest, data } = buildRepair(spec, JSON.parse(sourceText), x, await load(spec.y));
    payload.push({ slug: spec.slug, base: spec.base, manifest, data, expectedSourceSha256: sha256(sourceText), ...(dataText ? { expectedDataSha256: sha256(dataText) } : {}) });
    console.log(`${spec.slug}/${spec.base}: ${data.points.length} 点`);
  }
  fs.writeFileSync(path.join(out, 'repair.json'), JSON.stringify(payload));
  fs.writeFileSync(path.join(out, 'repair.b64'), Buffer.from(JSON.stringify(payload)).toString('base64'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
