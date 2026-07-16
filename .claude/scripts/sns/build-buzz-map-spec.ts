#!/usr/bin/env tsx
/**
 * build-buzz-map-spec.ts — R2 観測値から buzz-map 型A (静止画・二値/少区分マップ) の
 * spec JSON を決定的に生成する。
 *
 * カタログ (build-buzz-map-catalog.ts) で選んだ metricKey を渡すと、R2 の観測値を指定年で
 * 二値化 (しきい値 or 上位N) し、`apps/remotion/src/features/buzz-map/specs/<id>.json` を書く。
 * そのまま `/buzz-map` (npx remotion still) でレンダできる。
 *
 * データ源: R2 公開 URL のみ (認証不要)。
 *   pref → app/stats/<key>/values.json  /  muni → app/stats/<key>/cities.json
 * 出典・単位・表示名は metric config (git TS) から自動組み立て。ダミーデータ規約は非該当 (実データ)。
 *
 * 正典: .claude/rules/buzz-map-standards.md (§1 型A / §2 spec / §4 テーマカタログ)
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-buzz-map-spec.ts \
 *     --metric <key> --id <theme_id> --level muni|pref \
 *     --mode threshold --op gte|lte|gt|lt --value 30 [--year YYYY] \
 *     --title "..." [--subtitle "..."] [--title-lines "1行目|2行目"] \
 *     --accent social|infra --label-hit "30%以上" --label-miss "30%未満"
 *
 *   # 上位N自治体モード
 *   npx tsx .claude/scripts/sns/build-buzz-map-spec.ts --metric <key> --id <id> --level muni \
 *     --mode top-n --n 100 --title "..." --accent infra --label-hit "上位100" --label-miss "その他"
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { getMetricConfig } from "@stats47/data-configs";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const SPECS_DIR = join(PROJECT_ROOT, "apps/remotion/src/features/buzz-map/specs");
const MUNI_TOPOJSON = join(PROJECT_ROOT, "apps/remotion/public/buzz-map/municipalities.topojson");

// ─── CLI ───
function parseArgs() {
  const a = process.argv.slice(2);
  const val = (n: string) => {
    const i = a.indexOf(n);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  const req = (n: string): string => {
    const v = val(n);
    if (v == null) {
      console.error(`✗ 必須引数がありません: ${n}`);
      process.exit(1);
    }
    return v;
  };
  return {
    metric: req("--metric"),
    id: req("--id"),
    level: (val("--level") ?? "muni") as "muni" | "pref",
    mode: (val("--mode") ?? "threshold") as "threshold" | "top-n",
    op: (val("--op") ?? "gte") as "gte" | "lte" | "gt" | "lt",
    value: val("--value") ? Number(val("--value")) : null,
    n: val("--n") ? Number(val("--n")) : null,
    year: val("--year"),
    title: req("--title"),
    subtitle: val("--subtitle"),
    titleLines: val("--title-lines"),
    accent: (val("--accent") ?? "infra") as "social" | "infra",
    labelHit: val("--label-hit") ?? "該当",
    labelMiss: val("--label-miss") ?? "非該当",
  };
}

// ─── R2 観測値 ───
interface StatsRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  value: number | null;
  unit?: string;
}
interface StatsPayload {
  rows: StatsRow[];
  meta?: { yearRange?: [string, string] };
}

async function fetchStats(key: string, level: "muni" | "pref"): Promise<StatsPayload> {
  const file = level === "muni" ? "cities.json" : "values.json";
  const url = `${PUBLIC_URL}/app/stats/${key}/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ R2 観測値が取得できません (${res.status}): ${url}`);
    process.exit(1);
  }
  return (await res.json()) as StatsPayload;
}

/** buzz-map muni topojson の N03_007 コード集合 (arcs 展開せず geometries から直読)。 */
function muniCodeSet(): Set<string> {
  const topo = JSON.parse(readFileSync(MUNI_TOPOJSON, "utf8")) as {
    objects: Record<string, { geometries: { properties?: Record<string, string> }[] }>;
  };
  const obj = topo.objects[Object.keys(topo.objects)[0]];
  const set = new Set<string>();
  for (const g of obj.geometries) {
    const code = g.properties?.N03_007;
    if (code) set.add(code);
  }
  return set;
}

// ─── 二値化 ───
function main() {
  const opts = parseArgs();
  const config = getMetricConfig(opts.metric);
  if (!config) {
    console.error(`✗ metric config が見つかりません: ${opts.metric}`);
    process.exit(1);
  }
  if (!config.entities.includes(opts.level === "muni" ? "city" : "prefecture")) {
    console.error(`✗ ${opts.metric} は entities に "${opts.level === "muni" ? "city" : "prefecture"}" を持ちません`);
    process.exit(1);
  }

  fetchStats(opts.metric, opts.level).then((payload) => {
    // 対象年の真実源は R2 観測値 (config の latestYear は entity 間で食い違うため使わない)。
    // 既定 = payload に実在する最大 yearCode。--year 指定時はそれを厳格に使う。
    const yearsInData = [...new Set(payload.rows.map((r) => r.yearCode))].sort();
    const year = opts.year ?? yearsInData[yearsInData.length - 1] ?? null;
    if (!year) {
      console.error("✗ 対象年を決められません (観測値が空)");
      process.exit(1);
    }
    if (!yearsInData.includes(year)) {
      console.error(`✗ ${year} 年は観測値に存在しません。利用可能: ${yearsInData.join(", ")}`);
      process.exit(1);
    }
    let rows = payload.rows.filter((r) => r.yearCode === year && r.value != null);

    // muni は buzz-map topojson の N03_007 集合と join (政令市計・非掲載自治体を除外)
    let unmatched = 0;
    if (opts.level === "muni") {
      const codes = muniCodeSet();
      const before = rows.length;
      rows = rows.filter((r) => codes.has(r.areaCode));
      unmatched = before - rows.length;
    }
    if (rows.length === 0) {
      console.error(`✗ ${year} 年の観測値が 0 件です`);
      process.exit(1);
    }

    // 二値化: hit = accent 色を塗る自治体
    let hitCodes: string[];
    if (opts.mode === "threshold") {
      if (opts.value == null) {
        console.error("✗ --mode threshold には --value が必須です");
        process.exit(1);
      }
      const t = opts.value;
      const cmp: Record<string, (v: number) => boolean> = {
        gte: (v) => v >= t,
        lte: (v) => v <= t,
        gt: (v) => v > t,
        lt: (v) => v < t,
      };
      const fn = cmp[opts.op];
      hitCodes = rows.filter((r) => fn(r.value as number)).map((r) => r.areaCode);
    } else {
      if (opts.n == null) {
        console.error("✗ --mode top-n には --n が必須です");
        process.exit(1);
      }
      hitCodes = [...rows]
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, opts.n)
        .map((r) => r.areaCode);
    }

    const hitSet = new Set(hitCodes);
    const hitCount = hitSet.size;
    const totalUniverse = opts.level === "muni" ? muniCodeSet().size : 47;
    const missCount = totalUniverse - hitCount; // データなし含む (land 既定色)

    // data.values は hit のみ載せる (非該当は land 既定色 = miss と同色。sample-towns-villages 方式)
    const values: Record<string, string> = {};
    for (const c of hitCodes) values[c] = "hit";

    const sourceName =
      (config.source as { source?: { name?: string }; name?: string }).source?.name ??
      (config.source as { name?: string }).name ??
      "e-Stat（政府統計の総合窓口）";
    const source = [
      `出典: ${sourceName}を加工して作成`,
      `${year}年度データ / ${opts.level === "muni" ? "全国市区町村" : "都道府県"}`,
      "stats47.jp",
    ];

    const spec = {
      id: opts.id,
      type: "A" as const,
      level: opts.level,
      title: opts.title,
      ...(opts.titleLines ? { titleLines: opts.titleLines.split("|") } : {}),
      subtitle: opts.subtitle ?? config.subtitle ?? "",
      source,
      accent: opts.accent,
      legend: {
        title: "区分（自治体数）",
        rows: [
          { key: "hit", label: opts.labelHit, fill: "accent", count: hitCount },
          { key: "miss", label: opts.labelMiss, fill: "land", count: missCount },
        ],
      },
      data: { values },
    };

    mkdirSync(SPECS_DIR, { recursive: true });
    const outPath = join(SPECS_DIR, `${opts.id}.json`);
    writeFileSync(outPath, JSON.stringify({ spec }, null, 2) + "\n");

    console.log(`✓ spec 生成: ${outPath}`);
    console.log(`  metric=${opts.metric} year=${year} level=${opts.level}`);
    console.log(`  ${opts.labelHit}: ${hitCount} / ${opts.labelMiss}: ${missCount} (母数 ${totalUniverse})`);
    if (unmatched > 0) console.log(`  ⚠ topojson 非対応 ${unmatched} 件を除外 (政令市計・境界改定差)`);
    console.log(`\nレンダ:`);
    console.log(`  cd apps/remotion && npx remotion still src/index.ts BuzzMap-Still-45 \\`);
    console.log(`    ../../.local/r2/sns/buzz-map/${opts.id}/x/stills/${opts.id}-45.png \\`);
    console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json`);
  });
}

main();
