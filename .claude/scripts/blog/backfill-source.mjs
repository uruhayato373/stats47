#!/usr/bin/env node
/**
 * backfill-source.mjs — source-backfill 復元: 既存 data/<base>.json があり source.json が無い
 * ranking SVG に出典 manifest (source.json) を後付けする。json の値を SSOT(app/ranking) と照合して
 * rankingKey + 年を確定する (SVG の絵からは逆復元しない、§1.6)。
 *
 * 入力: .claude/state/blog/svg-lineage-queue.json の restoreMethod==="source-backfill" && chartType==="ranking"
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.source.json (svg/json は既存・不変)
 * R2 反映: push-r2-wrangler.ts app/blog --apply
 * 正典: blog-data-schema.md §1.7
 *
 *   node .claude/scripts/blog/backfill-source.mjs            # 全件 dry-run(staging)
 *   node .claude/scripts/blog/backfill-source.mjs --limit 10
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const RANK = `${R2}/app/ranking`;
const STAGE = path.join(PROJECT_ROOT, ".local/r2/app/blog");
const LIMIT = process.argv.includes("--limit") ? Number(process.argv[process.argv.indexOf("--limit") + 1]) : null;

async function fj(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
async function ft(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }
async function pMap(items, fn, c) {
  const out = []; let i = 0;
  const w = async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]); } catch (e) { out[k] = { error: String(e.message || e) }; } } };
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return out;
}

function jsonValueMap(json) {
  const arr = Array.isArray(json) ? json : (json.data || json.rankings?.data || []);
  const m = new Map();
  for (const it of arr) {
    const name = it.areaName ?? it.pref ?? it.name; // json により県キー名が異なる
    if (name != null && it.value != null) m.set(name, Number(it.value));
  }
  return { map: m, unit: json.unit || json.rankings?.unit || "", label: json.title || json.label || json.rankings?.label || "" };
}
/** json の値が SSOT partition の値と一致する割合 (areaName 一致・相対2%) */
function matchRate(jsonMap, ssotVals) {
  let ok = 0, n = 0;
  for (const v of ssotVals) {
    const jv = jsonMap.get(v.areaName) ?? jsonMap.get(v.areaName.replace(/[都道府県]$/, ""));
    if (jv == null) continue;
    n++;
    if (Math.abs(v.value - jv) <= Math.max(0.15, Math.abs(v.value) * 0.02)) ok++;
  }
  return n >= 5 ? ok / n : 0;
}
async function ssotPartitions(key) {
  const v = await fj(`${RANK}/${key}/values.json`);
  return (v.partitions || []).map((p) => ({ year: p.yearCode, values: p.values }));
}

async function main() {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let targets = q.entries.filter((e) => e.restoreMethod === "source-backfill" && e.chartType === "ranking");
  if (LIMIT) targets = targets.slice(0, LIMIT);
  console.error(`[backfill] ranking source-backfill: ${targets.length} 枚`);

  const mdCache = new Map();
  async function keysOf(slug) {
    if (!mdCache.has(slug)) {
      const md = await ft(`${R2}/app/blog/${slug}/article.md`);
      mdCache.set(slug, [...new Set([...md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)].map((m) => m[1]))]);
    }
    return mdCache.get(slug);
  }

  const results = await pMap(targets, async (t) => {
    const json = await fj(`${R2}/app/blog/${t.slug}/data/${t.base}.json`);
    const { map: jmap, unit, label } = jsonValueMap(json);
    if (jmap.size < 5) return { ...t, error: "json値<5件" };
    // json 自体に rankingKey が埋め込まれていれば最優先 (照合不要で信頼度高)。次に記事の /ranking リンク。
    const embeddedKey = json.rankingKey || json.rankings?.rankingKey;
    const keys = [...new Set([embeddedKey, ...(await keysOf(t.slug))].filter(Boolean))];
    if (!keys.length) return { ...t, error: "rankingKey/リンク0件" };
    let best = null;
    for (const key of keys) {
      let parts; try { parts = await ssotPartitions(key); } catch { continue; }
      for (const p of parts) { const rate = matchRate(jmap, p.values); if (!best || rate > best.rate) best = { key, year: p.year, rate }; }
    }
    if (!best || best.rate < 0.8) return { ...t, error: `照合失敗(最大${best ? Math.round(best.rate * 100) : 0}% / key ${keys.length})` };
    const manifest = {
      kind: "ranking", rankingKey: best.key, year: best.year, unit, label,
      transform: "all47 (svg-builder が上位5+下位5を抽出)",
      source: `r2:app/ranking/${best.key}/values.json`,
      upstream: "metric config → e-Stat → R2 app/ranking",
      restore: `node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug ${t.slug} --keys ${best.key} --data-name ${t.base}`,
      verifiedMatchRate: Math.round(best.rate * 100),
      generatedBy: "backfill-source.mjs",
      note: "source-backfill: 既存jsonの値をSSOTと照合しrankingKey+年を確定(SVGから逆復元しない)",
    };
    const dir = path.join(STAGE, t.slug, "data");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${t.base}.source.json`), JSON.stringify(manifest, null, 2));
    return { ...t, key: best.key, year: best.year, rate: Math.round(best.rate * 100) };
  }, 10);

  const ok = results.filter((r) => !r.error);
  console.error(`\n[backfill] 成功 ${ok.length} / 失敗 ${results.length - ok.length}`);
  const fails = results.filter((r) => r.error);
  if (fails.length) console.error("失敗内訳:\n  " + fails.slice(0, 8).map((f) => `${f.slug}/${f.base}: ${f.error}`).join("\n  "));
  console.error(`\nstaging: .local/r2/app/blog/<slug>/data/<base>.source.json (R2反映: push-r2-wrangler.ts app/blog --apply)`);
}
main();
