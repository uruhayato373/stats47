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
// ローカル未取得のセッション (クラウド等) でも量産できるよう R2 公開データにフォールバック
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const R2_FALLBACK = `${PUBLIC_URL}/gis/gsi-pni/points.json`;

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
  const patternA = val("--pattern-a");
  return {
    input: val("--input") ?? DEFAULT_INPUT,
    // 単一 pattern モード (kind admin/nature の 2 色) と 2 パターン比較モード (patternA vs patternB) を排他で持つ。
    // 比較モードでは --pattern は不要 (--pattern-a / --pattern-b が主)。
    pattern: patternA ? (val("--pattern") ?? "") : req("--pattern"),
    patternA, // 比較モード group A の正規表現 (例 "谷")
    patternB: val("--pattern-b"), // 比較モード group B の正規表現 (例 "沢|澤")
    labelA: val("--label-a"), // group A の凡例ラベル (例 「谷」)
    labelB: val("--label-b"), // group B の凡例ラベル (例 「沢・澤」)
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
    if (input === DEFAULT_INPUT) {
      console.log(`ローカル points が無いため R2 公開データを使用: ${R2_FALLBACK}`);
      return loadPoints(R2_FALLBACK);
    }
    console.error(`✗ points ファイルがありません: ${input}`);
    console.error("  先に fetch-gsi-place-names.ts で取得 (--all) するか --input に R2 公開 URL を指定してください");
    process.exit(1);
  }
  return JSON.parse(readFileSync(input, "utf8")) as PointsFile;
}

/** 座標を 5 桁 (≈1.1m) に丸める。z15 由来の全桁を spec に埋め込むと点数の多い地名 spec が
 *  repo hygiene の 1MB 制限を超えるため (実例: 谷vs沢 33,774 点 = 2.4MB)。描画精度には影響しない。 */
const r5 = (n: number): number => Math.round(n * 1e5) / 1e5;

async function main() {
  const opts = parseArgs();
  const { meta, points } = await loadPoints(opts.input);
  console.log(`地名点 ${points.length} 件を読み込み`);

  const dataPoints: Record<string, [number, number][]> = {};
  const rows: Array<{ key: string; label: string; fill: string; count: number; marker: "point" }> = [];

  if (opts.patternA) {
    // ── 2 パターン比較モード (谷 vs 沢・澤 等) — kind を無視し 2 グループ 2 色で対比 ──
    if (!opts.patternB) {
      console.error("✗ --pattern-a を使うときは --pattern-b も必須です (2 グループ比較のため)");
      process.exit(1);
    }
    const reA = new RegExp(opts.patternA);
    const reB = new RegExp(opts.patternB);
    const groupA: [number, number][] = [];
    const groupB: [number, number][] = [];
    for (const p of points) {
      if (opts.pref && p.kind === "admin" && p.pref !== opts.pref) continue;
      if (opts.pref && p.kind !== "admin") continue;
      // A を優先判定 (両方一致する地名は少ないが A に寄せる)
      if (reA.test(p.name)) groupA.push([r5(p.lon), r5(p.lat)]);
      else if (reB.test(p.name)) groupB.push([r5(p.lon), r5(p.lat)]);
    }
    const labelA = opts.labelA ?? `「${opts.patternA}」`;
    const labelB = opts.labelB ?? `「${opts.patternB}」`;
    console.log(`比較 A "${opts.patternA}" ${groupA.length} 件 vs B "${opts.patternB}" ${groupB.length} 件`);
    if (groupA.length + groupB.length === 0) {
      console.error("✗ ヒット 0 件。--pattern-a / --pattern-b を見直してください");
      process.exit(1);
    }
    if (groupA.length) {
      dataPoints.groupA = groupA;
      rows.push({ key: "groupA", label: `${labelA}（${groupA.length}）`, fill: "accent", count: groupA.length, marker: "point" });
    }
    if (groupB.length) {
      dataPoints.groupB = groupB;
      rows.push({ key: "groupB", label: `${labelB}（${groupB.length}）`, fill: "accent2", count: groupB.length, marker: "point" });
    }
  } else {
    // ── 単一 pattern モード (kind admin/nature の 2 色) ──
    const re = new RegExp(opts.pattern);
    const admin: [number, number][] = [];
    const nature: [number, number][] = [];
    for (const p of points) {
      if (!re.test(p.name)) continue;
      if (p.kind === "admin") {
        if (opts.pref && p.pref !== opts.pref) continue;
        admin.push([r5(p.lon), r5(p.lat)]);
      } else {
        if (opts.pref) continue; // 自然地名は県コードを持たないため pref 指定時は除外
        nature.push([r5(p.lon), r5(p.lat)]);
      }
    }
    console.log(`フィルタ "${opts.pattern}"${opts.pref ? ` pref=${opts.pref}` : ""}: 行政地名 ${admin.length} / 自然地名 ${nature.length}`);
    if (admin.length + nature.length === 0) {
      console.error("✗ ヒット 0 件。--pattern を見直してください");
      process.exit(1);
    }
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
    legend: { title: opts.patternA ? "地名の比較（箇所数）" : "地名カテゴリ（箇所数）", rows },
    data: { points: dataPoints },
  };

  mkdirSync(SPECS_DIR, { recursive: true });
  const outPath = join(SPECS_DIR, `${opts.id}.json`);
  // 点数が多い spec は pretty-print だと 1MB (repo hygiene 上限) を超えるため compact で書く
  const pretty = JSON.stringify({ spec }, null, 2) + "\n";
  writeFileSync(outPath, pretty.length > 900_000 ? JSON.stringify({ spec }) + "\n" : pretty);
  console.log(`✓ spec 生成: ${outPath}`);
  console.log(`\nレンダ:`);
  console.log(`  cd apps/remotion && npx remotion still src/index.ts BuzzMap-Still-45 \\`);
  console.log(`    ../../.local/r2/sns/buzz-map/${opts.id}/x/stills/${opts.id}-45.png \\`);
  console.log(`    --props=src/features/buzz-map/specs/${opts.id}.json --browser-executable=$CHROME`);
}

main();
