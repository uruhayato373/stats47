#!/usr/bin/env tsx
/**
 * build-ksj-geometry-map.ts — 国土数値情報の全データセットの「形状 (点/線/面/メッシュ)」を
 * KSJ 公式ダウンロードページから機械抽出し、git 管理の対照表 JSON を生成する。
 *
 * 背景: ksj-catalog.json (候補 superset 126 件) は形状情報を持たず、buzz-map カタログの
 * 未登録候補 83 件が renderClass=unknown だった。「点か線か面か」が判らないとネタカタログ
 * として使えないため、各データセットの公式ページ (KsjTmplt-*.html) に明記されている
 * JPGIS 型 (GM_Point/GM_Curve/GM_Surface、点型/線型/面型) を抽出して埋める。
 *
 * 出力 (git tracked・builder はこれを読むだけ = ネットワーク非依存):
 *   .claude/scripts/sns/data/ksj-geometry.generated.json
 *   { generatedAt, entries: { <dataId>: { shapes: ["point"|"line"|"polygon"|"mesh"...],
 *     evidence: {point,line,polygon,mesh}, sourceUrl } } }
 *
 * 実測ベース (evidence-based-judgment.md): 推測で分類せず、公式ページの記述のみを根拠にする。
 * トークンが 1 つも見つからないページは unknown のまま残す (正直に)。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-ksj-geometry-map.ts            # 全 126 件を取得 (~40 秒)
 *   npx tsx .claude/scripts/sns/build-ksj-geometry-map.ts --only P23,W07
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const SEED_PATH = join(PROJECT_ROOT, "packages/database/seed/ksj-catalog.json");
const OUT_PATH = join(PROJECT_ROOT, ".claude/scripts/sns/data/ksj-geometry.generated.json");

interface SeedEntry {
  id: string;
  name: string;
  source_url: string;
}

type Shape = "point" | "line" | "polygon" | "mesh";

interface GeoEntry {
  name: string;
  shapes: Shape[];
  evidence: Record<Shape, number>;
  sourceUrl: string;
  fetchedAt: string;
  error?: string;
}

/**
 * ページ本文から形状トークンを数える (2 段構え)。
 * 主根拠 = JPGIS 型表記 (GM_* / 点型・線型・面型)。これが 1 つでもあればそれだけを使う。
 * 補助 = 旧形式ページ向けのカタカナ表記 (ポイント/ライン/ポリゴン)。散文での誤検知リスクが
 * あるため、JPGIS 表記が皆無のページに限って使う。
 */
function countShapes(html: string): Record<Shape, number> {
  const count = (re: RegExp) => (html.match(re) ?? []).length;
  const strict: Record<Shape, number> = {
    point: count(/GM_Point|点型/g),
    line: count(/GM_Curve|曲線型|線型/g),
    polygon: count(/GM_Surface|面型/g),
    // メッシュ系はページ側の型表記ゆれが大きい (GM_Coverage / グリッド / メッシュ型)
    mesh: count(/GM_Coverage|GM_Grid|グリッドセル|メッシュ型/g),
  };
  if (Object.values(strict).some((v) => v > 0)) return strict;
  return {
    point: count(/ポイント/g),
    line: count(/ライン(?!ナップ)/g),
    polygon: count(/ポリゴン/g),
    mesh: 0,
  };
}

/** データセット名から機械確定できる形状 (名前に「メッシュ」= メッシュデータ)。 */
function shapeFromName(name: string): Shape[] {
  if (/メッシュ/.test(name)) return ["mesh"];
  return [];
}

function shapesOf(evidence: Record<Shape, number>): Shape[] {
  return (Object.keys(evidence) as Shape[]).filter((k) => evidence[k] > 0);
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx !== -1 ? new Set(args[onlyIdx + 1].split(",")) : null;

  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8")) as SeedEntry[];
  const targets = seed.filter((s) => !only || only.has(s.id));
  console.log(`対象: ${targets.length} 件 (KSJ 公式ページから形状抽出)`);

  // 既存の生成物があれば読み込み (差分更新・--only 時に他を消さない)
  let entries: Record<string, GeoEntry> = {};
  try {
    entries = (JSON.parse(readFileSync(OUT_PATH, "utf8")) as { entries: Record<string, GeoEntry> })
      .entries;
  } catch {
    /* fresh */
  }

  let ok = 0;
  let empty = 0;
  let failed = 0;
  for (const t of targets) {
    const html = await fetchPage(t.source_url);
    if (!html) {
      failed++;
      entries[t.id] = {
        name: t.name,
        shapes: [],
        evidence: { point: 0, line: 0, polygon: 0, mesh: 0 },
        sourceUrl: t.source_url,
        fetchedAt: new Date().toISOString(),
        error: "fetch failed",
      };
      console.log(`  ✗ ${t.id} ${t.name} (fetch 失敗)`);
      await sleep(200);
      continue;
    }
    const evidence = countShapes(html);
    // 名前で機械確定できるもの (〜メッシュ) はそれを優先 (ページ表記ゆれの影響を受けない)
    const fromName = shapeFromName(t.name);
    const shapes = fromName.length > 0 ? fromName : shapesOf(evidence);
    entries[t.id] = {
      name: t.name,
      shapes,
      evidence,
      sourceUrl: t.source_url,
      fetchedAt: new Date().toISOString(),
    };
    if (shapes.length > 0) {
      ok++;
      console.log(`  ✓ ${t.id} ${t.name} → ${shapes.join("+")}`);
    } else {
      empty++;
      console.log(`  ? ${t.id} ${t.name} (型トークン検出なし)`);
    }
    await sleep(200);
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2) + "\n",
  );
  console.log(`\n完了: 形状確定 ${ok} / 検出なし ${empty} / fetch 失敗 ${failed}`);
  console.log(`出力: ${OUT_PATH}`);
}

main();
