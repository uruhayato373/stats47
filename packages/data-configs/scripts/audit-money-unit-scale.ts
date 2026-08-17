/**
 * 金額 unit を持つ metric について、e-Stat の原単位と config の unit のスケール整合を全数監査する。
 *
 * ## なぜ要るか
 *
 * e-Stat は倍率を単位文字列に埋め込む (`千円` `百万円` `十人`)。取り込みは値を変換せず、
 * `unit` は config の文字列を貼るだけなので、config が「万円」でも値は千円のまま配信されうる。
 * 2026-08-05 に職業別平均年収 39 件がこの状態だった (東京の調理従事者が 4,153.9「万円」)。
 *
 * 既存の shape-gate は金額 unit を一切見ておらず、`summarizeShape` が持つ valueMin/valueMax の
 * 消費先も `%` 検査だけだった。この監査は「族内なら 10^k で決定的」という金額族の性質だけを使う。
 *
 * ## 入力
 *
 * `.claude/state/estat/meta/<statsDataId>.json` (`fetch-estat-meta.mjs` が書くダンプ)。
 * tab の `sampleValues[].unit` に e-Stat の原単位が入っている。**未取得の表はスキップして残数に数える**
 * (取れなかったことを「問題なし」に混ぜない)。`--fetch` で未取得ぶんを取りに行く。
 *
 * ## 実行
 *
 *   npx tsx packages/data-configs/scripts/audit-money-unit-scale.ts
 *   npx tsx packages/data-configs/scripts/audit-money-unit-scale.ts --fetch   # 未取得メタを取得
 *   npx tsx packages/data-configs/scripts/audit-money-unit-scale.ts --json /tmp/out.json
 *   npx tsx packages/data-configs/scripts/audit-money-unit-scale.ts --fail-on-error   # CI 用
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  checkCombinationUnitsAgree,
  checkMoneyUnitScale,
  moneyUnitExponent,
  resolvePinnedSourceUnit,
  type MoneyUnitVerdict,
} from "../src/money-unit.js";
import { METRICS_REGISTRY } from "../src/registry.js";
import type { MetricConfig } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const META_DIR = resolve(REPO_ROOT, ".claude/state/estat/meta");

interface MetaDump {
  statsDataId: string;
  title?: string;
  error?: string;
  dimensions?: Array<{
    id: string;
    name: string;
    valueCount: number;
    sampleValues?: Array<{ code: string; name: string; unit?: string | null }>;
  }>;
}

type Row = {
  key: string;
  title: string;
  statsDataId: string;
  configUnit: string;
  /** 判定に使った tab コード (複数なら結合) */
  tabs: string[];
  sourceUnits: Array<string | null>;
  declaredScale: number;
  verdict:
    | { kind: "ok" }
    | { kind: "mismatch"; sourceUnit: string; expectedScale: number; declaredScale: number }
    | { kind: "combination-unit-mismatch"; units: string[] }
    | { kind: "skip"; reason: string };
};

function parseArgs() {
  const argv = process.argv.slice(2);
  return {
    fetch: argv.includes("--fetch"),
    failOnError: argv.includes("--fail-on-error"),
    json: argv.includes("--json") ? argv[argv.indexOf("--json") + 1] : undefined,
  };
}

function readAppId(): string | null {
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  const envPath = resolve(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
  return line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") ?? null;
}

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function loadMeta(statsDataId: string): MetaDump | null {
  const p = resolve(META_DIR, `${statsDataId}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as MetaDump;
  } catch {
    return null;
  }
}

/** getMetaInfo を叩き fetch-estat-meta.mjs と同じ形で保存する */
async function fetchMeta(statsDataId: string, appId: string): Promise<MetaDump> {
  const params = new URLSearchParams({ appId, lang: "J", statsDataId });
  const res = await fetch(`https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?${params}`);
  if (!res.ok) return { statsDataId, error: `HTTP ${res.status}` };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;
  const meta = json?.GET_META_INFO?.METADATA_INF;
  if (!meta) {
    return { statsDataId, error: json?.GET_META_INFO?.RESULT?.ERROR_MSG ?? "no METADATA_INF" };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dimensions = asArray(meta.CLASS_INF?.CLASS_OBJ).map((co: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = asArray(co.CLASS) as any[];
    return {
      id: String(co["@id"]),
      name: String(co["@name"]),
      valueCount: values.length,
      sampleValues: values.map((v) => ({
        code: String(v["@code"]),
        name: String(v["@name"]),
        unit: v["@unit"] != null ? String(v["@unit"]) : null,
      })),
    };
  });
  const dump: MetaDump = {
    statsDataId,
    title: meta.TABLE_INF?.TITLE?.$ ?? meta.TABLE_INF?.STATISTICS_NAME,
    dimensions,
  };
  mkdirSync(META_DIR, { recursive: true });
  writeFileSync(resolve(META_DIR, `${statsDataId}.json`), JSON.stringify(dump, null, 2), "utf8");
  return dump;
}

/** tab コード → e-Stat 原単位 */
function tabUnitMap(meta: MetaDump): Map<string, string | null> {
  const out = new Map<string, string | null>();
  const tab = meta.dimensions?.find((d) => d.id === "tab");
  for (const v of tab?.sampleValues ?? []) out.set(v.code, v.unit ?? null);
  return out;
}

/**
 * config が pin できる分類軸と、その pin を書く config フィールド。
 *
 * tab は別経路 (tabCombination の単位一致検査を持つ) なのでここには含めない。
 */
const CATEGORY_AXES = [
  ["cat01", "cdCat01"],
  ["cat02", "cdCat02"],
  ["cat03", "cdCat03"],
  ["cat04", "cdCat04"],
  ["cat05", "cdCat05"],
] as const;

/** pin された分類コードが持つ単位を集める (単位を持たない pin は null) */
function pinnedCategoryUnits(
  source: Record<string, unknown>,
  meta: MetaDump,
): Array<string | null> {
  const out: Array<string | null> = [];
  for (const [axis, field] of CATEGORY_AXES) {
    const code = source[field];
    if (typeof code !== "string" || code === "") continue;
    const dim = meta.dimensions?.find((d) => d.id === axis);
    const v = dim?.sampleValues?.find((x) => String(x.code) === code);
    out.push(v?.unit ?? null);
  }
  return out;
}

/**
 * config が宣言している変換倍率。
 * `tabCombination` の factor は単位を変えないので数えない (千円を 12 倍しても千円)。
 */
function declaredScaleOf(config: MetricConfig): number {
  const s = config.source;
  if (s.kind !== "estat") return 1;
  const raw = (s as { valueScale?: number }).valueScale;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 1;
}

function evaluate(config: MetricConfig, meta: MetaDump | null): Row | null {
  const s = config.source;
  if (s.kind !== "estat") return null;
  // 金額 unit の metric だけが対象。族外は判定材料がない
  if (moneyUnitExponent(config.unit) === null) return null;

  const tabs = s.tabCombination?.length
    ? s.tabCombination.map((t) => t.cdTab)
    : s.cdTab
      ? [s.cdTab]
      : [];

  const base = {
    key: config.key,
    title: config.title,
    statsDataId: s.statsDataId,
    configUnit: config.unit,
    tabs,
    declaredScale: declaredScaleOf(config),
  };

  if (!meta || meta.error) {
    return { ...base, sourceUnits: [], verdict: { kind: "skip", reason: "meta-missing" } };
  }

  const map = tabUnitMap(meta);
  const sourceUnits = tabs.map((t) => map.get(t) ?? null);

  const agree = checkCombinationUnitsAgree(sourceUnits);
  if (agree.kind === "mismatch") {
    return { ...base, sourceUnits, verdict: { kind: "combination-unit-mismatch", units: agree.units } };
  }

  // tab から原単位が取れないときは pin 済みの分類コードを見る。社会・人口統計体系は
  // tab が「観測値」1 値で単位を持たず、単位は cat01 (指標) 側にある (resolvePinnedSourceUnit 参照)。
  let sourceUnit = sourceUnits.find((u) => u != null) ?? null;
  if (sourceUnit == null) {
    const pinned = resolvePinnedSourceUnit(pinnedCategoryUnits(s as unknown as Record<string, unknown>, meta));
    if (pinned.kind === "ambiguous") {
      // どの軸の単位がこの値の単位か決められない。片方を選ばない
      return { ...base, sourceUnits, verdict: { kind: "skip", reason: "pinned-unit-ambiguous" } };
    }
    if (pinned.kind === "none") {
      return {
        ...base,
        sourceUnits,
        // tab も分類も単位を宣言していない表。メタからは決めようがない
        verdict: { kind: "skip", reason: tabs.length === 0 ? "no-unit-on-pinned-axes" : "no-source-unit" },
      };
    }
    sourceUnit = pinned.unit;
  }

  const v: MoneyUnitVerdict = checkMoneyUnitScale({
    sourceUnit,
    configUnit: config.unit,
    declaredScale: base.declaredScale,
  });

  if (v.kind === "ok") return { ...base, sourceUnits, verdict: { kind: "ok" } };
  if (v.kind === "skip") return { ...base, sourceUnits, verdict: { kind: "skip", reason: v.reason } };
  return {
    ...base,
    sourceUnits,
    verdict: {
      kind: "mismatch",
      sourceUnit: v.sourceUnit,
      expectedScale: v.expectedScale,
      declaredScale: v.declaredScale,
    },
  };
}

async function main() {
  const args = parseArgs();
  const configs = Object.values(METRICS_REGISTRY) as MetricConfig[];

  // 金額 unit × estat の metric だけを対象にする
  const targets = configs.filter(
    (c) => c.source.kind === "estat" && moneyUnitExponent(c.unit) !== null,
  );
  const ids = [...new Set(targets.map((c) => (c.source as { statsDataId: string }).statsDataId))];

  console.log(`対象 metric: ${targets.length} 件 / unique statsDataId: ${ids.length} 件`);

  const metaById = new Map<string, MetaDump | null>();
  for (const id of ids) metaById.set(id, loadMeta(id));

  const missing = ids.filter((id) => !metaById.get(id) || metaById.get(id)?.error);
  if (missing.length > 0 && args.fetch) {
    const appId = readAppId();
    if (!appId) throw new Error("--fetch には NEXT_PUBLIC_ESTAT_APP_ID が要ります");
    console.log(`メタ未取得 ${missing.length} 件を取得します...`);
    for (const id of missing) {
      const dump = await fetchMeta(id, appId);
      metaById.set(id, dump);
      console.log(`  ${id}: ${dump.error ? `ERROR ${dump.error}` : "ok"}`);
    }
  }

  const rows = targets
    .map((c) => evaluate(c, metaById.get((c.source as { statsDataId: string }).statsDataId) ?? null))
    .filter((r): r is Row => r !== null);

  const mismatches = rows.filter((r) => r.verdict.kind === "mismatch");
  const comboMismatches = rows.filter((r) => r.verdict.kind === "combination-unit-mismatch");
  const ok = rows.filter((r) => r.verdict.kind === "ok");
  const skipped = rows.filter((r) => r.verdict.kind === "skip");

  const skipReasons = new Map<string, number>();
  for (const r of skipped) {
    if (r.verdict.kind !== "skip") continue;
    skipReasons.set(r.verdict.reason, (skipReasons.get(r.verdict.reason) ?? 0) + 1);
  }

  console.log("");
  console.log(`  整合         : ${ok.length}`);
  console.log(`  スケール不一致: ${mismatches.length}`);
  console.log(`  結合単位不一致: ${comboMismatches.length}`);
  console.log(
    `  判定不能     : ${skipped.length} (${[...skipReasons].map(([k, v]) => `${k}=${v}`).join(" / ")})`,
  );

  if (mismatches.length > 0) {
    console.log("\n── スケール不一致 ──");
    // 同じ (原単位 → config unit) をまとめて出す。原因は表ごとに共通なので束ねた方が読める
    const grouped = new Map<string, Row[]>();
    for (const r of mismatches) {
      if (r.verdict.kind !== "mismatch") continue;
      const k = `${r.statsDataId} ${r.verdict.sourceUnit} → ${r.configUnit} (要 valueScale: ${r.verdict.expectedScale})`;
      grouped.set(k, [...(grouped.get(k) ?? []), r]);
    }
    for (const [k, rs] of grouped) {
      console.log(`\n  ${k}  [${rs.length} 件]`);
      for (const r of rs.slice(0, 5)) console.log(`    - ${r.key} (${r.title})`);
      if (rs.length > 5) console.log(`    ... 他 ${rs.length - 5} 件`);
    }
  }

  if (comboMismatches.length > 0) {
    console.log("\n── 線形結合の単位不一致 (足せない組み合わせ) ──");
    for (const r of comboMismatches) {
      if (r.verdict.kind !== "combination-unit-mismatch") continue;
      console.log(`  ${r.key}: tabs=${r.tabs.join("+")} units=${r.verdict.units.join(" / ")}`);
    }
  }

  if (args.json) {
    mkdirSync(dirname(resolve(args.json)), { recursive: true });
    writeFileSync(resolve(args.json), JSON.stringify({ rows }, null, 2), "utf8");
    console.log(`\nJSON: ${args.json}`);
  }

  const violations = mismatches.length + comboMismatches.length;
  if (args.failOnError && violations > 0) {
    console.error(`\n金額単位のスケール不一致 ${violations} 件`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
