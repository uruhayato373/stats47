#!/usr/bin/env tsx
/**
 * regenerate-tile-maps.ts
 *
 * 公開済みブログ記事のタイルマップ(choropleth)を統一デザイン(600×700・白文字+縁取り・
 * タイトル左上)で一括再生成するオーケストレータ。
 *
 * ## データ取得ルール (SSOT・捏造禁止)
 *   データ源は SSOT = R2 `app/ranking/<key>/values.json`(metric config → e-Stat → R2 派生)。
 *   1. 記事 article.md の `/ranking/<key>` 候補を抽出
 *   2. 各候補 key × 各年の SSOT 値を、既存地図SVGの表示値(<title>県：値)と照合し metric+年を確定
 *      (既存SVGは「照合」のみ。値の取得元にはしない = SVGからの逆復元はしない)
 *   3. 一致率 >= 0.8 を確証できたものだけ、SSOT から型付き data JSON + 出典 manifest を書き、
 *      `generate-article-charts.ts` 互換の choropleth で再生成
 *   4. 確証できない地図は flag(個別に metric→key を特定する必要。捏造しない)
 *
 * デフォルトは dry-run(staging `.local/regen-tilemaps` に出力 + before/after gallery)。
 * R2 反映は別途 `diff-push-r2` で行う(本スクリプトは push しない)。
 *
 * Usage:
 *   npx tsx .claude/scripts/blog/regenerate-tile-maps.ts            # 全件 dry-run + gallery
 *   npx tsx .claude/scripts/blog/regenerate-tile-maps.ts --limit 10 # 先頭10枚のみ
 *
 * 正典: .claude/rules/blog-data-schema.md §1.6 / カタログ: blog-svg-chart-standards.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateChoroplethSvg } from "../../../packages/svg-builder/src/charts/index.ts";
import { formatTick } from "../../../packages/svg-builder/src/shared/axis.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const R2 = `${R2_PUBLIC}/app/blog`;
const RANK = `${R2_PUBLIC}/app/ranking`;
const STAGE = path.join(PROJECT_ROOT, ".local/regen-tilemaps");
const LIMIT = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : null;

// 都道府県 名前(短縮/正式)→ 2桁コード
const PREF: Record<string, string> = {};
for (const p of JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
)) {
  const code = String(p.prefCode).slice(0, 2);
  PREF[p.prefName] = code;
  PREF[(p.prefName as string).replace(/[都道府県]$/, "")] = code;
}
const codeOf = (n: string) => PREF[n] ?? PREF[n.replace(/[都道府県]$/, "")] ?? "";
const isMapName = (b: string) => /tile-?map|tile-?grid|choropleth|-map$|-map-|地図/i.test(b);

async function ft(u: string) {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function fj(u: string) {
  return JSON.parse(await ft(u));
}
async function pMap<T, R>(items: T[], fn: (x: T) => Promise<R>, c: number): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const w = async () => {
    while (i < items.length) {
      const k = i++;
      try {
        out[k] = await fn(items[k]);
      } catch {
        (out[k] as unknown) = null;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return out;
}

/** 既存地図SVGの表示値(照合用): name -> "値+単位文字列" */
function parseMapDisplay(svg: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of [...svg.matchAll(/<title>([^<]*)<\/title>/g)].map((x) => x[1])) {
    const i = t.indexOf("：");
    if (i < 0) continue;
    m.set(t.slice(0, i).trim(), t.slice(i + 1).trim());
  }
  return m;
}

/** SSOT: ranking values.json の各年 partition */
async function ssotPartitions(key: string) {
  const v = await fj(`${RANK}/${key}/values.json`);
  let item: { unit?: string; title?: string; rankingName?: string } = {};
  try {
    const it = await fj(`${RANK}/${key}/item.json`);
    item = it.item || it || {};
  } catch {
    /* item は best-effort */
  }
  const unit = item.unit || v.partitions?.[0]?.values?.[0]?.unit || "";
  return (v.partitions || []).map((p: { yearCode: string; values: unknown[] }) => ({
    year: p.yearCode,
    values: p.values as Array<{ areaName: string; value: number; areaCode: string }>,
    unit,
    title: item.title || item.rankingName || key,
  }));
}

/** SSOT値が既存地図の表示値と一致する割合(0..1)。絶対0.15 or 相対1% を一致とみなす。 */
function matchRate(
  ssotVals: Array<{ areaName: string; value: number }>,
  display: Map<string, string>,
): number {
  let ok = 0;
  let n = 0;
  for (const v of ssotVals) {
    const disp = display.get(v.areaName) ?? display.get(v.areaName.replace(/[都道府県]$/, ""));
    if (!disp) continue;
    n++;
    const dnum = disp.replace(/,/g, "").match(/-?[\d.]+/)?.[0];
    if (!dnum) continue;
    const sf = parseFloat(formatTick(v.value, 1).replace(/,/g, ""));
    if (Math.abs(sf - parseFloat(dnum)) <= Math.max(0.15, Math.abs(sf) * 0.01)) ok++;
  }
  return n >= 5 ? ok / n : 0;
}

async function main() {
  const manifest = await fj(`${R2}/all.json`);
  const slugs: string[] = (manifest.articles || []).map((a: { slug: string }) => a.slug).filter(Boolean);
  console.error(`[tilemap] ${slugs.length} 記事を triage`);

  const found = await pMap(
    slugs,
    async (slug) => {
      const md = await ft(`${R2}/${slug}/article.md`);
      const refs = [...new Set([...md.matchAll(/\]\(data\/([^)]+)\.svg\)/g)].map((m) => m[1]))].filter(isMapName);
      const keys = [...new Set([...md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)].map((m) => m[1]))];
      return { slug, refs, keys };
    },
    12,
  );
  const targets = found
    .filter((g) => g && g.refs.length)
    .flatMap((g) => g.refs.map((r) => ({ slug: g.slug, base: r, keys: g.keys })));
  console.error(`[tilemap] 地図SVG: ${targets.length} 枚`);

  const work = LIMIT ? targets.slice(0, LIMIT) : targets;
  const results: Array<Record<string, unknown>> = [];
  for (const t of work) {
    try {
      const oldSvg = await ft(`${R2}/${t.slug}/data/${t.base}.svg`);
      const display = parseMapDisplay(oldSvg);
      let best: { key: string; year: string; values: Array<{ areaName: string; value: number; areaCode: string }>; unit: string; title: string; rate: number } | null = null;
      for (const key of t.keys) {
        let parts;
        try {
          parts = await ssotPartitions(key);
        } catch {
          continue;
        }
        for (const p of parts) {
          const rate = matchRate(p.values, display);
          if (!best || rate > best.rate) best = { key, ...p, rate };
        }
      }
      if (!best || best.rate < 0.8) {
        results.push({ ...t, error: `SSOT照合 失敗 (最大一致 ${best ? Math.round(best.rate * 100) : 0}% / key ${t.keys.length})` });
        continue;
      }
      const items = best.values
        .map((v) => ({ code: codeOf(v.areaName), name: v.areaName.replace(/[都道府県]$/, ""), value: v.value }))
        .filter((x) => x.code);
      const dir = path.join(STAGE, t.slug, "data");
      fs.mkdirSync(dir, { recursive: true });
      const json = {
        title: best.title,
        subtitle: `${best.year}年`,
        unit: best.unit,
        year: best.year,
        rankingKey: best.key,
        data: best.values.map((v, i) => ({ rank: i + 1, areaName: v.areaName, value: v.value, areaCode: v.areaCode })),
      };
      fs.writeFileSync(path.join(dir, `${t.base}.json`), JSON.stringify(json, null, 2));
      fs.writeFileSync(
        path.join(dir, `${t.base}.source.json`),
        JSON.stringify(
          {
            kind: "ranking",
            rankingKey: best.key,
            year: best.year,
            unit: best.unit,
            source: `r2:app/ranking/${best.key}/values.json`,
            verifiedMatchRate: Math.round(best.rate * 100),
            note: "SSOTから取得。既存地図の表示値と照合し metric+年を確定 (SVGから逆復元しない)",
          },
          null,
          2,
        ),
      );
      const newSvg = generateChoroplethSvg(items, { title: best.title, subtitle: `${best.year}年`, unit: best.unit });
      fs.writeFileSync(path.join(dir, `${t.base}.svg`), newSvg);
      results.push({ ...t, oldSvg, newSvg, key: best.key, year: best.year, rate: Math.round(best.rate * 100), n: items.length });
    } catch (e) {
      results.push({ ...t, error: String((e as Error)?.message || e).slice(0, 120) });
    }
  }

  const esc = (s: unknown) => String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
  const cards = results
    .map((r) =>
      r.error
        ? `<section class=row><h3>${esc(r.slug)}/${esc(r.base)} <span style=color:#fca5a5>✗ ${esc(r.error)}</span></h3></section>`
        : `<section class=row><h3>${esc(r.slug)}/${esc(r.base)} <span>SSOT=${esc(r.key)} ${esc(r.year)}年 一致${esc(r.rate)}% ${esc(r.n)}件</span></h3>
      <div class=grid><figure><figcaption>BEFORE (現R2)</figcaption><div class=box>${r.oldSvg}</div></figure>
      <figure><figcaption>AFTER (SSOT再生成)</figcaption><div class=box>${r.newSvg}</div></figure></div></section>`,
    )
    .join("\n");
  const ok = results.filter((r) => !r.error).length;
  fs.writeFileSync(
    "/tmp/tilemap-gallery.html",
    `<!doctype html><meta charset=utf8><title>タイルマップ SSOT再生成</title>
<style>body{margin:0;font-family:system-ui;background:#0f172a;color:#e2e8f0}main{padding:16px}.row{margin-bottom:24px;border-bottom:1px solid #334155;padding-bottom:14px}h3{font-size:14px}h3 span{color:#94a3b8;font-size:12px;font-weight:400}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}figcaption{font-size:12px;color:#94a3b8}.box svg{width:100%;height:auto;display:block}</style>
<header style="position:sticky;top:0;background:#1e293b;padding:10px 16px"><b>タイルマップ SSOT再生成 dry-run</b> 成功${ok} / 失敗${results.length - ok} (R2未反映)</header><main>${cards}</main>`,
  );
  console.error(`[tilemap] SSOT再生成 成功${ok} / 失敗${results.length - ok}`);
  console.error(`[tilemap] gallery: /tmp/tilemap-gallery.html`);
}

main();
