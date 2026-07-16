#!/usr/bin/env tsx
/**
 * build-buzz-map-spec-gsi.ts — 国土地理院 地名情報 (居住地名/自然地名) の点データから
 * buzz-map spec (型C 点プロット) を生成する。地名の文字列フィルタで
 * 「◯◯のつく地名はどこか」系のカードを作る (まちの計量舎の地名系に対応)。
 *
 * データ源: fetch-gsi-place-names.ts が生成する points.json
 *   { meta, points: [{ name, kana, kind:"admin"|"nature", featureType, lon, lat, pref }] }
 *   ローカル (.local/gsi-pni/points.json) か R2 公開 URL (--input) を読む。
 *
 * 行政地名 (admin) と自然地名 (nature) を 2 区分の凡例＝2色で分けて描く
 * (renderer が row.key→row.fill で点色を解決)。片方だけヒットする場合は 1 行に自動縮退。
 *
 * 正典: .claude/rules/buzz-map-standards.md (§1 型C / §3 GSI 地名情報)
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-buzz-map-spec-gsi.ts \
 *     --pattern "宿" --id shuku-place-names \
 *     --title "「宿」のつく地名はどこか" --accent social \
 *     --label-admin "字・町名（行政地名）" --label-nature "自然地名" [--theme dark]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const SPECS_DIR = join(PROJECT_ROOT, "apps/remotion/src/features/buzz-map/specs");
const DEFAULT_INPUT = join(PROJECT_ROOT, ".local/gsi-pni/points.json");

interface PlacePoint {
  name: string;
  kana: string;
  kind: "admin" | "nature";
  featureType: string;
  lon: number;
  lat: number;
  pref: string;
}
interface PointsFile {
  meta?: { attribution?: string; generatedAt?: string };
  points: PlacePoint[];
}

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
    input: val("--input") ?? DEFAULT_INPUT,
    pattern: req("--pattern"), // name に対する正規表現 (「宿」等の部分一致も可)
    pref: val("--pref"), // 2桁県コードで居住地名を絞る (自然地名は pref 無しのため除外)
    id: req("--id"),
    title: req("--title"),
    subtitle: val("--subtitle"),
    titleLines: val("--title-lines"),
    accent: (val("--accent") ?? "social") as "social" | "infra",
    theme: val("--theme") as "blue" | "dark" | "paper" | null,
    labelAdmin: val("--label-admin") ?? "字・町名（行政地名）",
    labelNature: val("--label-nature") ?? "自然地名",
    pointRadius: val("--point-radius") ? Number(val("--point-radius")) : null,
    single: a.includes("--single"), // admin/nature を分けず 1 色にする
  };
}

async function loadPoints(input: string): Promise<PointsFile> {
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    if (!res.ok) {
      console.error(`✗ points 取得失敗 (${res.status}): ${input}`);
      process.exit(1);
    }
    return (await res.json()) as PointsFile;
  }
  if (!existsSync(input)) {
    console.error(`✗ points ファイルがありません: ${input}`);
    console.error("  先に fetch-gsi-place-names.ts で取得してください (--all)");
    process.exit(1);
  }
  return JSON.parse(readFileSync(input, "utf8")) as PointsFile;
}

async function main() {
  const opts = parseArgs();
  const { meta, points } = await loadPoints(opts.input);
  console.log(`地名点 ${points.length} 件を読み込み`);

  const re = new RegExp(opts.pattern);
  let admin: [number, number][] = [];
  let nature: [number, number][] = [];
  for (const p of points) {
    if (!re.test(p.name)) continue;
    if (p.kind === "admin") {
      if (opts.pref && p.pref !== opts.pref) continue;
      admin.push([p.lon, p.lat]);
    } else {
      if (opts.pref) continue; // 自然地名は県コードを持たないため pref 指定時は除外
      nature.push([p.lon, p.lat]);
    }
  }
  console.log(`フィルタ "${opts.pattern}"${opts.pref ? ` pref=${opts.pref}` : ""}: 行政地名 ${admin.length} / 自然地名 ${nature.length}`);
  if (admin.length + nature.length === 0) {
    console.error("✗ ヒット 0 件。--pattern を見直してください");
    process.exit(1);
  }

  const dataPoints: Record<string, [number, number][]> = {};
  const rows: Array<{ key: string; label: string; fill: string; count: number; marker: "point" }> = [];
  if (opts.single) {
    dataPoints.hit = [...admin, ...nature];
    rows.push({ key: "hit", label: opts.labelAdmin, fill: "accent", count: dataPoints.hit.length, marker: "point" });
  } else {
    if (admin.length) {
      dataPoints.admin = admin;
      rows.push({ key: "admin", label: opts.labelAdmin, fill: "accent", count: admin.length, marker: "point" });
    }
    if (nature.length) {
      dataPoints.nature = nature;
      rows.push({ key: "nature", label: opts.labelNature, fill: "accent2", count: nature.length, marker: "point" });
    }
  }

  const year = meta?.generatedAt?.slice(0, 4) ?? "";
  const source = [
    "出典: 国土地理院 電子国土基本図（地名情報）を加工して作成",
    [year, opts.pref ? `pref ${opts.pref}` : "全国"].filter(Boolean).join(" / "),
    "stats47.jp",
  ];

  const spec: Record<string, unknown> = {
    id: opts.id,
    type: "C",
    level: "pref",
    title: opts.title,
    ...(opts.titleLines ? { titleLines: opts.titleLines.split("|") } : {}),
    subtitle: opts.subtitle ?? "",
    source,
    accent: opts.accent,
    ...(opts.theme ? { theme: opts.theme } : {}),
    ...(opts.pointRadius ? { pointRadius: opts.pointRadius } : {}),
    legend: { title: "地名カテゴリ（箇所数）", rows },
    data: { points: dataPoints },
  };

  mkdirSync(SPECS_DIR, { recursive: true });
  const outPath = join(SPECS_DIR, `${opts.id}.json`);
  writeFileSync(outPath, JSON.stringify({ spec }, null, 2) + "\n");
  console.log(`✓ spec 生成: ${outPath}`);
  console.log(`\nレンダ:`);
  console.log(`  cd apps/remotion && npx remotion still src/index.ts BuzzMap-Still-45 \\`);
  console.log(`    ../../.local/r2/sns/buzz-map/${opts.id}/x/stills/${opts.id}-45.png \\`);
  console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json --browser-executable=$CHROME`);
}

main();
