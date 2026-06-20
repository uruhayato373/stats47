#!/usr/bin/env node
/**
 * backfill-source.mjs — source-backfill 復元: 既存 data/<base>.json があり source.json が無い SVG に
 * 出典 manifest (source.json) を後付けする (1画像=1設定ファイルの徹底, §1.7)。
 *   - ranking      : json の値を SSOT(app/ranking) と照合して rankingKey+年を確定 (verified・質高)
 *   - その他/照合失敗: json 埋め込み情報(rankingKey/derived)から導出 (derived)。出自不明なら incomplete:true で
 *                     記録し補完を促す (SVG だけを残さない)
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.source.json (svg/json は既存・不変)
 * R2 反映: push-r2-wrangler.ts app/blog --apply
 * 正典: blog-data-schema.md §1.7
 *
 *   node .claude/scripts/blog/backfill-source.mjs            # 全 source-backfill を dry-run(staging)
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
  const m = new Map();
  // line(時系列): series[].data の最新年値を県別に取り、ranking と同じ照合に乗せる
  if (Array.isArray(json.series)) {
    for (const s of json.series) {
      const name = s.name || s.label || s.areaName;
      const last = (s.data || []).filter((d) => d && d.value != null).slice(-1)[0];
      if (name && last) m.set(name, Number(last.value));
    }
    return { map: m, unit: json.unit || "", label: json.title || json.label || "" };
  }
  const arr = Array.isArray(json) ? json : (json.data || json.rankings?.data || []);
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
  // line(時系列)は一部県のみ(4県等)のことがあるため最小3県で照合。記事リンクkeyとの照合前提で偶然一致リスクは低い。
  return n >= 3 ? ok / n : 0;
}
async function ssotPartitions(key) {
  const v = await fj(`${RANK}/${key}/values.json`);
  return (v.partitions || []).map((p) => ({ year: p.yearCode, values: p.values }));
}

/** json 埋め込み情報から source.json を導出 (ranking照合できない種別・出自不明の補完) */
function deriveSourceFromJson(json, dataFile, chartType) {
  const rankingKey = json.rankingKey || json.rankings?.rankingKey;
  const subtitle = typeof json.subtitle === "string" ? json.subtitle : "";
  const year = json.year || subtitle.match(/(\d{4})/)?.[1];
  const common = {
    generatedBy: "backfill-source.mjs",
    chartType: chartType || "unknown",
    dataFile,
    year,
    unit: json.unit || json.rankings?.unit,
    label: json.title || json.label || json.rankings?.label,
  };
  if (rankingKey) return { kind: "ranking", rankingKey, source: `r2:app/ranking/${rankingKey}/values.json`, upstream: "metric config → e-Stat → R2 app/ranking", ...common };
  if (json.derived) return { kind: "derived", formula: json.derived, ...common };
  return { kind: chartType === "summary" ? "authored" : (chartType || "unknown"), incomplete: true, note: "出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること", ...common };
}

async function main() {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let targets = q.entries.filter((e) => e.restoreMethod === "source-backfill");
  if (LIMIT) targets = targets.slice(0, LIMIT);
  console.error(`[backfill] source-backfill: ${targets.length} 枚 (全 chartType)`);

  const mdCache = new Map();
  async function keysOf(slug) {
    if (!mdCache.has(slug)) {
      try { const md = await ft(`${R2}/app/blog/${slug}/article.md`); mdCache.set(slug, [...new Set([...md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)].map((m) => m[1]))]); }
      catch { mdCache.set(slug, []); }
    }
    return mdCache.get(slug);
  }

  const results = await pMap(targets, async (t) => {
    let json;
    try { json = await fj(`${R2}/app/blog/${t.slug}/data/${t.base}.json`); } catch { return { ...t, error: "json取得失敗" }; }
    const dir = path.join(STAGE, t.slug, "data");
    const write = (manifest) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${t.base}.source.json`), JSON.stringify(manifest, null, 2)); };

    // ranking / line: SSOT照合で確定 (verified) を試みる (line は series 最新年値で照合)
    if (t.chartType === "ranking" || t.chartType === "line") {
      const { map: jmap, unit, label } = jsonValueMap(json);
      if (jmap.size >= 3) {
        const keys = [...new Set([json.rankingKey || json.rankings?.rankingKey, ...(await keysOf(t.slug))].filter(Boolean))];
        let best = null;
        for (const key of keys) { let parts; try { parts = await ssotPartitions(key); } catch { continue; } for (const p of parts) { const rate = matchRate(jmap, p.values); if (!best || rate > best.rate) best = { key, year: p.year, rate }; } }
        if (best && best.rate >= 0.8) {
          write({
            kind: "ranking", rankingKey: best.key, year: best.year, unit, label,
            transform: "all47 (svg-builder が上位5+下位5を抽出)",
            source: `r2:app/ranking/${best.key}/values.json`,
            upstream: "metric config → e-Stat → R2 app/ranking",
            restore: `node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug ${t.slug} --keys ${best.key} --data-name ${t.base}`,
            verifiedMatchRate: Math.round(best.rate * 100), generatedBy: "backfill-source.mjs",
            note: "source-backfill: jsonの値をSSOTと照合しrankingKey+年を確定",
          });
          return { ...t, mode: "verified", key: best.key, year: best.year, rate: Math.round(best.rate * 100) };
        }
      }
    }
    // 他 chartType or ranking照合失敗: json 埋め込み情報から導出
    const manifest = deriveSourceFromJson(json, `${t.base}.json`, t.chartType);
    write(manifest);
    return { ...t, mode: manifest.incomplete ? "incomplete" : "derived", kind: manifest.kind };
  }, 10);

  const cnt = (m) => results.filter((r) => r.mode === m).length;
  console.error(`\n[backfill] verified(SSOT照合) ${cnt("verified")} / derived(json由来) ${cnt("derived")} / incomplete(出自不明・要補完) ${cnt("incomplete")} / error ${results.filter((r) => r.error).length}`);
  const inc = results.filter((r) => r.mode === "incomplete");
  if (inc.length) console.error("incomplete(後で SSOT 特定が要る):\n  " + inc.slice(0, 10).map((r) => `${r.slug}/${r.base} (${r.chartType})`).join("\n  "));
  console.error(`\nstaging: .local/r2/app/blog/<slug>/data/<base>.source.json (R2反映: push-r2-wrangler.ts app/blog --apply)`);
}
main();
