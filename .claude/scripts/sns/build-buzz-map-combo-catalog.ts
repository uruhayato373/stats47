#!/usr/bin/env tsx
/**
 * build-buzz-map-combo-catalog.ts — 地図レイヤーを掛け合わせた「組み合わせカード (型E)」の
 * ネタカタログを構築する。単品カタログ (buzz-map-catalog.json) のエントリを部品 (parts) に、
 * 「ベース塗り × オーバーレイ (点/線)」の意味ある組み合わせを列挙する。
 *
 * まちの計量舎に無い「掛け合わせ地図」(過疎×医療、人口増減×高速道路網 等) が stats47 の
 * 差別化資産。e-Stat の塗り × 国土数値情報の点/線 のクロスが狙い目。
 *
 * 2 層構成 (全組み合わせは列挙しない = 爆発を避ける):
 *   1. signature combos … 物語つきの定番 (静的 seed)。story 必須
 *   2. 機械候補 … パターン別に cap。ベース × オーバーレイの実現性/異分野度でスコア
 *
 * feasibility:
 *   now           … 全 parts が availability=r2 or e-Stat (即マージ→レンダ可能)
 *   needs-pipeline … KSJ 指定地域塗り等が R2 未変換 (要 pipeline)
 *
 * 真実源: .claude/state/sns/buzz-map-combo-catalog.json (git tracked・status upsert)
 * 正典: .claude/rules/buzz-map-standards.md §4
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-buzz-map-combo-catalog.ts
 *   npx tsx .claude/scripts/sns/build-buzz-map-combo-catalog.ts --next 10 [--feasible-only]
 *   npx tsx .claude/scripts/sns/build-buzz-map-combo-catalog.ts --mark-generated <comboKey> [--theme-id <id>]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const SINGLE_PATH = join(PROJECT_ROOT, ".claude/state/sns/buzz-map-catalog.json");
const OUT_PATH = join(PROJECT_ROOT, ".claude/state/sns/buzz-map-combo-catalog.json");
const MACHINE_CAP = 120;

type Status = "candidate" | "spec" | "generated" | "posted" | "rejected";
type Feasibility = "now" | "needs-pipeline";

interface SingleEntry {
  metricKey: string;
  lane: string;
  title: string;
  category?: string;
  renderClass?: string;
  availability?: string;
  score: number;
}

interface ComboEntry {
  comboKey: string;
  title: string;
  parts: string[]; // 単品カタログの metricKey (base, overlay...)
  pattern: string; // signature | estat-fill×ksj-line | estat-fill×ksj-point | ksj-area×ksj-point
  story: string | null;
  score: number;
  feasibility: Feasibility;
  status: Status;
  themeId: string | null;
  note: string | null;
}

interface ComboFile {
  generatedAt: string | null;
  counts: { signature: number; machine: number };
  entries: ComboEntry[];
}

// ── signature combos (キュレーション seed。物語つき定番) ──
// parts は単品カタログの metricKey。e-Stat は key そのまま、KSJ は "ksj:<id>"。
const SIGNATURE: Omit<ComboEntry, "score" | "feasibility" | "status" | "themeId" | "note">[] = [
  {
    comboKey: "migration-x-highway",
    title: "高速道路が通っても人は集まるのか",
    parts: ["moving-in-excess-rate", "ksj:N06"],
    pattern: "signature",
    story: "高速道路網の整備と人口の転入超過が地理的に一致するか。インフラと人の流れの関係",
  },
  {
    comboKey: "depopulation-x-hospital",
    title: "過疎地域に病院はあるか",
    parts: ["ksj:A17", "ksj:P04"],
    pattern: "signature",
    story: "過疎地域(塗り)に医療機関(点)がどれだけあるか。無医地区の可視化。web 前例 depopulation-medical",
  },
  {
    comboKey: "migration-x-station",
    title: "人が集まる街と駅の関係",
    parts: ["moving-in-excess-rate", "ksj:S12"],
    pattern: "signature",
    story: "転入超過の市区町村(塗り)に鉄道駅(点)が集まっているか。駅と人口流入の相関",
  },
  {
    comboKey: "aging-x-hospital",
    title: "高齢化が進む街に医療は足りているか",
    parts: ["elderly-population-ratio", "ksj:P04"],
    pattern: "signature",
    story: "高齢者割合(塗り)と医療機関(点)。高齢化と医療アクセスのミスマッチ",
  },
  {
    comboKey: "snow-x-aging",
    title: "豪雪地帯と高齢化",
    parts: ["ksj:A22", "elderly-population-ratio"],
    pattern: "signature",
    story: "豪雪地帯(塗り)と高齢者割合。雪かきが重荷になる地域はどこか",
  },
  {
    comboKey: "income-x-highway",
    title: "所得の高い街と高速道路網",
    parts: ["per-taxpayer-income", "ksj:N06"],
    pattern: "signature",
    story: "課税所得(塗り)と高速道路網(線)。経済力とインフラの地理的一致",
  },
  {
    comboKey: "michinoeki-x-highway",
    title: "道の駅は高速道路網とどう補い合うか",
    parts: ["ksj:P35", "ksj:N06"],
    pattern: "signature",
    story: "道の駅(点)と高速道路網(線)。高速が通らない地域を道の駅が埋めているか",
  },
  {
    comboKey: "landprice-x-station",
    title: "地価の高い場所と駅",
    parts: ["ksj:L01", "ksj:S12"],
    pattern: "signature",
    story: "地価公示(点)と駅(点)。駅からの距離と地価の関係を全国で見る",
  },
];

function parseArgs() {
  const a = process.argv.slice(2);
  const val = (n: string) => {
    const i = a.indexOf(n);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  return {
    next: val("--next") ? Number(val("--next")) : null,
    feasibleOnly: a.includes("--feasible-only"),
    markSpec: val("--mark-spec"),
    markGenerated: val("--mark-generated"),
    markPosted: val("--mark-posted"),
    markRejected: val("--mark-rejected"),
    markCandidate: val("--mark-candidate"),
    themeId: val("--theme-id"),
    note: val("--note"),
  };
}

function loadSingle(): Map<string, SingleEntry> {
  const s = JSON.parse(readFileSync(SINGLE_PATH, "utf8")) as { entries: SingleEntry[] };
  return new Map(s.entries.map((e) => [e.metricKey, e]));
}

function loadCombo(): ComboFile {
  if (existsSync(OUT_PATH)) {
    try {
      return JSON.parse(readFileSync(OUT_PATH, "utf8")) as ComboFile;
    } catch {
      /* fresh */
    }
  }
  return { generatedAt: null, counts: { signature: 0, machine: 0 }, entries: [] };
}

function saveCombo(f: ComboFile) {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(f, null, 2) + "\n");
}

/** parts が全て「今すぐ使えるか」(e-Stat or KSJ r2)。1 つでも registered/candidate なら needs-pipeline。 */
function feasibilityOf(parts: string[], single: Map<string, SingleEntry>): Feasibility {
  for (const p of parts) {
    const e = single.get(p);
    if (!e) return "needs-pipeline"; // 未知 part
    if (e.lane === "muni" || e.lane === "pref") continue; // e-Stat は観測値 R2 前提で now
    if (e.availability !== "r2") return "needs-pipeline"; // KSJ は r2 のみ now
  }
  return "now";
}

/** part の overlay 種別 (点/線) — combo が塗り×点 か 塗り×線 か判定用 */
function overlayKind(rc?: string): "point" | "line" | "fill" | null {
  if (rc === "point-plot") return "point";
  if (rc === "line-timeline" || rc === "line-network") return "line";
  if (rc === "muni-binary") return "fill";
  return null;
}

function categoryDistance(a?: string, b?: string): number {
  if (!a || !b) return 0.5;
  return a === b ? 0.3 : 1.0; // 異分野の掛け合わせほど意外性が高い
}

function rebuild(): ComboFile {
  const single = loadSingle();
  const prev = loadCombo();
  const prevByKey = new Map(prev.entries.map((e) => [e.comboKey, e]));

  const scoreOf = (parts: string[], base = 0.7): number => {
    const es = parts.map((p) => single.get(p)?.score ?? 0.3);
    const partsAvg = es.reduce((s, v) => s + v, 0) / es.length;
    const feas = feasibilityOf(parts, single) === "now" ? 1 : 0.5;
    const cats = parts.map((p) => single.get(p)?.category);
    const dist = categoryDistance(cats[0], cats[cats.length - 1]);
    return base * (0.5 * feas + 0.3 * dist + 0.2 * partsAvg);
  };

  const mk = (
    seed: Omit<ComboEntry, "score" | "feasibility" | "status" | "themeId" | "note">,
    machine: boolean,
  ): ComboEntry => {
    const feasibility = feasibilityOf(seed.parts, single);
    const prevE = prevByKey.get(seed.comboKey);
    return {
      ...seed,
      score: Math.round(scoreOf(seed.parts, machine ? 0.6 : 0.85) * 1000) / 1000,
      feasibility,
      status: prevE?.status ?? "candidate",
      themeId: prevE?.themeId ?? null,
      note: prevE?.note ?? (feasibility === "now" ? "両レイヤー即マージ可" : "KSJ塗りが要 pipeline"),
    };
  };

  // 1) signature
  const signature = SIGNATURE.map((s) => mk(s, false));

  // 2) 機械候補 (パターン別)
  const machine: ComboEntry[] = [];
  const seen = new Set(signature.map((s) => s.comboKey));
  const all = [...single.values()];
  const estatMuni = all
    .filter((e) => e.lane === "muni")
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  const ksjLines = all.filter((e) => overlayKind(e.renderClass) === "line" && e.availability === "r2");
  const ksjPoints = all.filter((e) => e.renderClass === "point-plot" && e.availability === "r2");
  const ksjAreas = all.filter((e) => e.renderClass === "muni-binary");

  const push = (base: SingleEntry, ov: SingleEntry, pattern: string) => {
    const comboKey = `${base.metricKey.replace(/^ksj:/, "ksj-")}__${ov.metricKey.replace(/^ksj:/, "ksj-")}`;
    if (seen.has(comboKey)) return;
    seen.add(comboKey);
    machine.push(
      mk(
        {
          comboKey,
          title: `${base.title} × ${ov.title}`,
          parts: [base.metricKey, ov.metricKey],
          pattern,
          story: null,
        },
        true,
      ),
    );
  };

  // P2: e-Stat muni 塗り × KSJ 線
  for (const b of estatMuni) for (const l of ksjLines) push(b, l, "estat-fill×ksj-line");
  // P3: e-Stat muni 塗り × KSJ 点
  for (const b of estatMuni) for (const p of ksjPoints) push(b, p, "estat-fill×ksj-point");
  // P1: KSJ 指定地域 塗り × KSJ 点
  for (const a of ksjAreas) for (const p of ksjPoints) push(a, p, "ksj-area×ksj-point");

  machine.sort((a, b) => b.score - a.score);
  const machineCapped = machine.slice(0, MACHINE_CAP);

  const entries = [...signature, ...machineCapped].sort((a, b) => b.score - a.score);
  const f: ComboFile = {
    generatedAt: new Date().toISOString(),
    counts: { signature: signature.length, machine: machineCapped.length },
    entries,
  };
  saveCombo(f);
  return f;
}

function markStatus(key: string, status: Status, themeId: string | null, note: string | null) {
  const f = loadCombo();
  const e = f.entries.find((x) => x.comboKey === key);
  if (!e) {
    console.error(`✗ comboKey が見つかりません: ${key}`);
    process.exit(1);
  }
  e.status = status;
  if (status === "candidate") {
    e.themeId = null;
    e.note = null;
  }
  if (themeId) e.themeId = themeId;
  if (note) e.note = note;
  saveCombo(f);
  console.log(`✓ ${key} → status=${status}${themeId ? ` themeId=${themeId}` : ""}`);
}

function main() {
  const opts = parseArgs();
  if (opts.markCandidate) return markStatus(opts.markCandidate, "candidate", opts.themeId, opts.note);
  if (opts.markSpec) return markStatus(opts.markSpec, "spec", opts.themeId, opts.note);
  if (opts.markGenerated) return markStatus(opts.markGenerated, "generated", opts.themeId, opts.note);
  if (opts.markPosted) return markStatus(opts.markPosted, "posted", opts.themeId, opts.note);
  if (opts.markRejected) return markStatus(opts.markRejected, "rejected", opts.themeId, opts.note);

  if (opts.next != null) {
    const f = loadCombo();
    const out = f.entries
      .filter((e) => e.status === "candidate")
      .filter((e) => !opts.feasibleOnly || e.feasibility === "now")
      .slice(0, opts.next);
    for (const e of out) console.log(JSON.stringify(e));
    return;
  }

  const f = rebuild();
  console.log(
    `組み合わせカタログ再構築: signature ${f.counts.signature} + 機械候補 ${f.counts.machine} = ${f.entries.length} 件`,
  );
  const nowCount = f.entries.filter((e) => e.feasibility === "now").length;
  console.log(`即マージ可 (feasibility=now): ${nowCount} 件`);
  console.log(`SSOT: ${OUT_PATH}`);
  console.log(`\n=== signature combos (物語つき定番) ===`);
  for (const e of f.entries.filter((x) => x.pattern === "signature")) {
    console.log(`${e.score.toFixed(3)} [${e.feasibility}] ${e.comboKey}  「${e.title}」`);
  }
  console.log(`\n=== 機械候補 top10 (feasibility=now) ===`);
  for (const e of f.entries.filter((x) => x.pattern !== "signature" && x.feasibility === "now").slice(0, 10)) {
    console.log(`${e.score.toFixed(3)} ${e.pattern.padEnd(20)} 「${e.title}」`);
  }
}

main();
