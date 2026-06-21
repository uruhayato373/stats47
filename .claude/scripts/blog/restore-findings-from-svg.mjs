#!/usr/bin/env node
/**
 * restore-findings-from-svg.mjs — neither(json/source.json 消失=絵だけ) の findings カード
 * (「この記事でわかったこと」要点カード) を、**旧SVGのテキストそのもの**から json + source.json に
 * 復元する (1画像=1設定ファイルの徹底, §1.7)。
 *
 * findings は SSOT 指標ではなく authored テキスト。データ = 旧SVG に表示されている要点テキスト。
 * 旧SVGの構造: [title, "1", 見出し1, 本文1, "2", 見出し2, 本文2, …] (番号→見出し→本文の3点組×N)。
 *
 * **SVG は再生成しない** (旧SVGは見出し+本文の richer 形式で表示良好。現 findings-card.ts は単一 text の
 * 簡易形式のため再生成すると劣化する → 旧SVGを保持し json/source のみ復元して lineage を回復)。
 * よって push 対象は <base>.json と <base>.source.json の2点のみ (svg は既存=不変)。
 *
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.{json,source.json}
 * R2 反映: push-r2-wrangler.ts app/blog --apply
 * 正典: blog-data-schema.md §1.7 / blog-svg-chart-standards.md (findings-card)
 *
 *   node .claude/scripts/blog/restore-findings-from-svg.mjs            # 全 neither findings (staging)
 *   node .claude/scripts/blog/restore-findings-from-svg.mjs --probe-only
 *   node .claude/scripts/blog/restore-findings-from-svg.mjs --base slug/base
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STAGE = path.join(PROJECT_ROOT, ".local/r2/app/blog");
const args = process.argv.slice(2);
const PROBE_ONLY = args.includes("--probe-only");
const BASE_ARG = (() => { const i = args.indexOf("--base"); return i >= 0 ? args[i + 1] : null; })();

async function ft(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }

function svgTexts(svg) {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim())
    .filter(Boolean);
}

/** findings SVG のテキスト → {title, findings:[{heading,text}]} を抽出 */
function parseFindings(svg) {
  const toks = svgTexts(svg);
  if (!toks.length) return null;
  // [0] はカードタイトル ("この記事でわかったこと")
  const title = toks[0];
  const findings = [];
  let cur = null;
  for (let i = 1; i < toks.length; i++) {
    const t = toks[i];
    if (/^\d+$/.test(t)) { // 番号マーカー → 新しい要点
      if (cur) findings.push(cur);
      cur = { heading: "", text: "" };
    } else if (cur) {
      if (!cur.heading) cur.heading = t;        // 番号直後 = 見出し
      else cur.text += (cur.text ? " " : "") + t; // 以降 = 本文 (複数 text 行に跨る場合も連結)
    }
  }
  if (cur) findings.push(cur);
  // 見出しのみ(本文なし)も許容。1件も取れなければ null
  return findings.length ? { title, findings } : null;
}

function loadTargets() {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let entries = q.entries.filter((e) => e.status === "neither" && e.chartType === "findings").map((e) => ({ slug: e.slug, base: e.base }));
  if (BASE_ARG) { const [s, b] = BASE_ARG.split("/"); entries = entries.filter((e) => e.slug === s && e.base === b); }
  return entries;
}

async function main() {
  const targets = loadTargets();
  console.error(`[restore-findings] ${targets.length} neither findings を ${PROBE_ONLY ? "probe" : "復元(staging)"}`);
  const results = [];
  for (const { slug, base } of targets) {
    const rec = { slug, base, result: "fail", n: 0 };
    let svg;
    try { svg = await ft(`${R2}/app/blog/${slug}/data/${base}.svg`); }
    catch (e) { rec.note = `svg取得失敗 ${e.message}`; results.push(rec); continue; }
    const parsed = parseFindings(svg);
    if (!parsed) { rec.note = "要点抽出不能"; results.push(rec); continue; }
    rec.n = parsed.findings.length;
    rec.result = "restored";
    if (!PROBE_ONLY) {
      const dir = path.join(STAGE, slug, "data");
      fs.mkdirSync(dir, { recursive: true });
      // json: findings は {heading,text} で忠実に保存 (現renderer は text のみ使うが、見出しを残し
      //       将来の richer renderer / 再編集に備える)。
      const json = { title: parsed.title, findings: parsed.findings, sourceFile: `${base}.json` };
      const source = {
        kind: "authored",
        chartType: "findings",
        dataFile: `${base}.json`,
        note: "authored 要点テキスト (記事由来)。旧SVG表示テキストから忠実抽出。SVGは見出し+本文の richer 形式のため再生成せず保持 (現 findings-card.ts は単一text簡易形式)。",
        regenerated: false,
        regenerationCaveat: "現renderer で再生成すると見出し/本文の区別が失われ簡易形式になる。視覚維持のため旧SVGを保持。",
        upstream: "記事本文 (authored)。SSOT指標ではない。",
        generatedBy: "restore-findings-from-svg.mjs",
      };
      fs.writeFileSync(path.join(dir, `${base}.json`), JSON.stringify(json, null, 2));
      fs.writeFileSync(path.join(dir, `${base}.source.json`), JSON.stringify(source, null, 2));
    }
    results.push(rec);
  }
  const restored = results.filter((r) => r.result === "restored").length;
  const fail = results.filter((r) => r.result === "fail");
  console.error(`\n[restore-findings] restored ${restored} / fail ${fail.length}`);
  if (fail.length) fail.slice(0, 10).forEach((r) => console.error(`  fail ${r.slug}/${r.base}: ${r.note}`));
  fs.writeFileSync("/tmp/restore-findings-results.json", JSON.stringify({ restored, fail: fail.length, results }, null, 2));
  console.log(JSON.stringify({ restored, fail: fail.length, total: results.length, probeOnly: PROBE_ONLY }));
}
main();
