#!/usr/bin/env tsx
/**
 * audit-provenance-queue.ts — データ出典・再現性 (provenance) の横断棚卸しキュー。
 *
 * 全 metric を再現性クラス A/A'/B/C/D (`.claude/rules/data-provenance-standards.md` §1) に分類し、
 * blog SVG lineage の集計と併せて `.claude/state/provenance/{queue.json,LATEST.md}` を出力する。
 * lint (validate-metric-config.ts) が「投入時の床」、本 script が「定期監査の全量棚卸し」を担う。
 *
 * 名前に "audit" を含むため check-checker-wiring の自動配線監視対象になる。
 *
 * Usage:
 *   npx tsx .claude/scripts/provenance/audit-provenance-queue.ts        # 棚卸し + state 出力
 *   npx tsx .claude/scripts/provenance/audit-provenance-queue.ts --check # D クラス/欠落があれば exit 1 (cron gate)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const STATE_DIR = resolve(ROOT, ".claude/state/provenance");
const CHECK = process.argv.includes("--check");

type Klass = "A" | "A'" | "B" | "C" | "D";
interface Entry {
  key: string;
  klass: Klass;
  fetcherKey?: string;
  sourceKind: string;
  missing: string[]; // provenance で欠落しているフィールド (C/D)
  isActive: boolean;
}

const REGISTRY_KEYS = new Set(Object.keys(METRICS_REGISTRY));

/** calculated metric の親参照 (numeratorKey/denominatorKey/formula) が registry に実在するか */
function calcRefsResolvable(cfg: unknown): boolean {
  const c = cfg as {
    calculation?: Record<string, unknown>;
    source?: { formula?: Record<string, unknown> };
  };
  const refs: Array<string | undefined> = [];
  const calc = c.calculation;
  if (calc) {
    for (const f of ["numeratorKey", "denominatorKey", "numeratorRankingKey", "denominatorRankingKey"]) {
      refs.push(calc[f] as string | undefined);
    }
  }
  const formula = c.source?.formula;
  if (formula) {
    for (const f of ["numerator", "denominator", "left", "right"]) {
      refs.push(formula[f] as string | undefined);
    }
  }
  const present = refs.filter(Boolean) as string[];
  return present.length > 0 && present.every((r) => REGISTRY_KEYS.has(r));
}

function classify(key: string, cfg: unknown): Entry {
  const c = cfg as {
    isActive?: boolean;
    source?: {
      kind?: string;
      fetcherKey?: string;
      statsDataId?: string;
      config?: Record<string, unknown>;
      url?: string;
    };
  };
  const src = c.source ?? {};
  const kind = src.kind ?? "unknown";
  const isActive = c.isActive === true;
  const base: Omit<Entry, "klass" | "missing"> = {
    key,
    fetcherKey: src.fetcherKey,
    sourceKind: kind,
    isActive,
  };

  // A: estat / kakei-chousa (statsDataId で機械再取得)
  if (kind === "estat" || kind === "kakei-chousa") {
    return { ...base, klass: "A", missing: [] };
  }
  if (kind === "external") {
    const conf = (src.config ?? {}) as Record<string, unknown>;
    const prov = conf.provenance as Record<string, unknown> | undefined;
    // C: manual → provenance 9点セット
    if (src.fetcherKey === "manual") {
      const missing = [
        !(prov?.pdfUrl || prov?.url) && "url/pdfUrl",
        !prov?.accessedAt && "accessedAt",
        !prov?.extraction && "extraction",
        !prov?.verification && "verification",
        !prov?.restore && "restore",
      ].filter(Boolean) as string[];
      return { ...base, klass: "C", missing };
    }
    // A': 機械 ID 付き external
    const hasMachineId = Boolean(
      conf.ksjDataId ||
        (conf.estat as Record<string, unknown> | undefined)?.statsDataId ||
        conf.statsDataId,
    );
    if (hasMachineId) return { ...base, klass: "A'", missing: [] };
    // A' (derived): calculated で親参照が resolvable なら再計算可能
    if (src.fetcherKey === "calculated" && calcRefsResolvable(cfg)) {
      return { ...base, klass: "A'", missing: [] };
    }
    // D: unknown / 出典URL も無い
    const hasUrl = Boolean(src.url || (conf.source as Record<string, unknown> | undefined)?.url);
    if (src.fetcherKey === "unknown" || !hasUrl) {
      return { ...base, klass: "D", missing: ["再取得キー/出典URL"] };
    }
    // B: url はあるが機械 ID なし (fetcher 依存)
    return { ...base, klass: "B", missing: ["再取得キー (provenance backfill 推奨)"] };
  }
  // kind:"calculated" (source union) — 親参照が resolvable なら再計算可能
  if (kind === "calculated") {
    return calcRefsResolvable(cfg)
      ? { ...base, klass: "A'", missing: [] }
      : { ...base, klass: "D", missing: ["formula 参照が registry に不在"] };
  }
  // mlit: resourceId が確定 (TODO でない) なら KSJ dataId で再取得可 → A'
  if (kind === "mlit") {
    const rid = (c.source as { resourceId?: string }).resourceId;
    if (rid && !rid.startsWith("TODO-")) return { ...base, klass: "A'", missing: [] };
    return { ...base, klass: "D", missing: ["resourceId が TODO プレースホルダ"] };
  }
  return { ...base, klass: "D", missing: ["出典不明"] };
}

function readBlogLineage(): { total: number; byStatus: Record<string, number> } | null {
  try {
    const p = resolve(ROOT, ".claude/state/blog/svg-lineage-queue.json");
    const d = JSON.parse(readFileSync(p, "utf8"));
    return { total: d.total, byStatus: d.byStatus };
  } catch {
    return null;
  }
}

function main() {
  const entries = Object.entries(METRICS_REGISTRY).map(([k, v]) => classify(k, v));
  const byClass = entries.reduce<Record<string, number>>((a, e) => {
    a[e.klass] = (a[e.klass] ?? 0) + 1;
    return a;
  }, {});
  // 是正対象 = C(欠落あり) + D。A/A'/B(url有) は当面不要
  const needsWork = entries.filter(
    (e) => (e.klass === "C" && e.missing.length > 0) || e.klass === "D",
  );
  const blog = readBlogLineage();
  const generatedAt = new Date().toISOString();

  const queue = {
    generatedAt,
    metricTotal: entries.length,
    byClass,
    needsWorkCount: needsWork.length,
    needsWork: needsWork.map((e) => ({
      key: e.key,
      klass: e.klass,
      fetcherKey: e.fetcherKey,
      missing: e.missing,
      isActive: e.isActive,
    })),
    blogLineage: blog,
  };

  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(resolve(STATE_DIR, "queue.json"), JSON.stringify(queue, null, 2));

  const md = [
    "# データ出典・再現性 (provenance) 棚卸し (LATEST)",
    "",
    `棚卸し日時: ${generatedAt}`,
    `正典: \`.claude/rules/data-provenance-standards.md\``,
    "",
    "## metric 再現性クラス分布",
    `- A (statsDataId 再取得可): **${byClass["A"] ?? 0}**`,
    `- A' (機械ID付き external): **${byClass["A'"] ?? 0}**`,
    `- B (fetcher依存・出典薄): **${byClass["B"] ?? 0}**`,
    `- C (手動抽出・provenance): **${byClass["C"] ?? 0}**`,
    `- D (出典不明・要是正): **${byClass["D"] ?? 0}**`,
    "",
    `## 是正対象 (C欠落 + D): **${needsWork.length} 件**`,
    ...needsWork
      .slice(0, 40)
      .map((e) => `- \`${e.key}\` [${e.klass}/${e.fetcherKey ?? "?"}] 欠落: ${e.missing.join(", ")}`),
    needsWork.length > 40 ? `- … 他 ${needsWork.length - 40} 件` : "",
    "",
    blog
      ? `## blog SVG lineage: total ${blog.total} / 状態 ${JSON.stringify(blog.byStatus)}`
      : "## blog SVG lineage: (state 未取得)",
    "",
    "是正は `/audit-provenance` skill 参照。fetcher コードから出典復元 → config backfill → `validate:config` 再実行。",
  ].join("\n");
  writeFileSync(resolve(STATE_DIR, "LATEST.md"), md);

  console.log(`provenance 棚卸し: metric ${entries.length} 件`);
  console.log(`  クラス分布: ${Object.entries(byClass).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  console.log(`  是正対象 (C欠落+D): ${needsWork.length} 件 → .claude/state/provenance/LATEST.md`);

  if (CHECK && needsWork.filter((e) => e.klass === "D").length > 0) {
    console.error(`\n❌ D クラス (出典不明) が ${needsWork.filter((e) => e.klass === "D").length} 件`);
    process.exit(1);
  }
  process.exit(0);
}

main();
