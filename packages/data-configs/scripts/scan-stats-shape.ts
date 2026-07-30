/**
 * scan-stats-shape — R2 の正典 `app/stats/<key>/values.json` を全件走査し、形状違反を報告する。
 *
 * 取り込み (page-data-batch) と週次監査 (audit-ranking-data-integrity) と**同じ純関数**
 * (`src/shape-gate.ts`) で判定するので、3 者の判定が食い違わない。
 *
 * ## 何のためにあるか
 *
 * 主目的は 2 つ。
 *
 * 1. **allowlist を人が手で書かないため**。2026-07-30 時点で違反は 194 件あり、
 *    これを手書きすると必ず写し間違える。`--emit-allowlist` が
 *    `src/expected-shape-anomaly.ts` に貼れる TS リテラルを出す。
 * 2. **是正の進捗を測るため**。違反件数が減っていくことが唯一の完了指標になる。
 *
 * read-only (R2 公開 URL への GET のみ) で APP_ID も S3 認証も要らないため、
 * ローカル・CI どちらでも走る。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/scan-stats-shape.ts
 *   npx tsx packages/data-configs/scripts/scan-stats-shape.ts --json /tmp/shape.json
 *   npx tsx packages/data-configs/scripts/scan-stats-shape.ts --emit-allowlist > /tmp/allowlist.ts
 *   npx tsx packages/data-configs/scripts/scan-stats-shape.ts --metric a,b,c
 *
 * exit code は既定 0 (棚卸しツールなので CI を勝手に赤くしない)。
 * `--fail-on-error` を付けると allowlist で降格されない error があるとき 1 を返す。
 */
import { writeFileSync } from "node:fs";

import { EXPECTED_SHAPE_ANOMALY } from "../src/expected-shape-anomaly.js";
import { listAllMetrics } from "../src/registry.js";
import {
  classifyShape,
  summarizeShape,
  type ShapeCheck,
  type ShapeRow,
  type ShapeViolation,
} from "../src/shape-gate.js";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

interface Args {
  json?: string;
  emitAllowlist: boolean;
  failOnError: boolean;
  concurrency: number;
  metrics?: Set<string>;
  /** allowlist を無視して素の判定を出す (allowlist 生成時に使う) */
  ignoreAllowlist: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {
    emitAllowlist: false,
    failOnError: false,
    concurrency: 25,
    ignoreAllowlist: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = argv[++i];
    else if (a === "--emit-allowlist") {
      out.emitAllowlist = true;
      out.ignoreAllowlist = true; // 生成時は既存 allowlist に影響されない素の判定を使う
    } else if (a === "--fail-on-error") out.failOnError = true;
    else if (a === "--ignore-allowlist") out.ignoreAllowlist = true;
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
    else if (a === "--metric") {
      out.metrics = new Set(
        (argv[++i] ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      );
    }
  }
  return out;
}

interface StatsPayload {
  rows?: ShapeRow[];
  meta?: { rowCount?: number };
}

/** network 断 (status 0) と 404 を区別する。断を欠落として数えないため */
async function fetchJson(path: string): Promise<{ status: number; body: StatsPayload | null }> {
  try {
    const res = await fetch(`${R2_BASE}/${path}`);
    if (!res.ok) return { status: res.status, body: null };
    return { status: 200, body: (await res.json()) as StatsPayload };
  } catch {
    return { status: 0, body: null };
  }
}

async function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

interface ScanRow {
  key: string;
  status: "ok" | "missing" | "unreachable" | "empty";
  violations: ShapeViolation[];
}

async function main(): Promise<void> {
  const args = parseArgs();
  const now = new Date();

  const configs = listAllMetrics()
    .filter((c) => c.isActive !== false)
    .filter((c) => c.entities?.includes("prefecture") ?? true)
    .filter((c) => !args.metrics || args.metrics.has(c.key));

  if (!args.emitAllowlist) {
    console.log(`# app/stats 形状スキャン (${now.toISOString()})`);
    console.log(`R2 base: ${R2_BASE}`);
    console.log(`対象: ${configs.length} 件 (isActive かつ prefecture)\n`);
  }

  const rows = await mapPool(configs, args.concurrency, async (config): Promise<ScanRow> => {
    const res = await fetchJson(`app/stats/${config.key}/values.json`);
    if (res.status === 0) return { key: config.key, status: "unreachable", violations: [] };
    if (res.status !== 200 || !res.body) return { key: config.key, status: "missing", violations: [] };

    const statsRows = res.body.rows ?? [];
    // 0 件は expected-empty.ts の担当。形状ゲートは二重に鳴らさない。
    if (statsRows.length === 0) return { key: config.key, status: "empty", violations: [] };

    const violations = classifyShape({
      key: config.key,
      entity: "prefecture",
      summary: summarizeShape(statsRows),
      unit: config.unit,
      now,
      allowlist: args.ignoreAllowlist ? [] : EXPECTED_SHAPE_ANOMALY,
    });
    return { key: config.key, status: "ok", violations };
  });

  const withViolations = rows.filter((r) => r.violations.length > 0);
  const errors = rows.filter((r) => r.violations.some((v) => v.isError));

  if (args.emitAllowlist) {
    emitAllowlist(withViolations);
  } else {
    report(rows, withViolations, errors);
  }

  if (args.json) {
    writeFileSync(args.json, JSON.stringify({ generatedAt: now.toISOString(), rows }, null, 2));
    if (!args.emitAllowlist) console.log(`\n書き出し: ${args.json}`);
  }

  if (args.failOnError && errors.length > 0) process.exit(1);
}

function countByCheck(rows: readonly ScanRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    for (const v of r.violations) out[v.check] = (out[v.check] ?? 0) + 1;
  }
  return out;
}

function report(rows: ScanRow[], withViolations: ScanRow[], errors: ScanRow[]): void {
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log("## 取得結果");
  for (const [k, v] of Object.entries(byStatus)) console.log(`  ${k}: ${v} 件`);

  console.log("\n## 違反の内訳 (検査ごと・重複計上)");
  const counts = countByCheck(withViolations);
  for (const [check, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${check}: ${n} 件`);
  }

  console.log(`\n## 違反のある metric: ${withViolations.length} 件`);
  console.log(`   うち error (allowlist で降格されない): ${errors.length} 件`);

  const worst = withViolations
    .flatMap((r) => r.violations.map((v) => ({ key: r.key, v })))
    .filter((x) => x.v.check === "duplicate-area-year")
    .sort((a, b) => b.v.severity - a.v.severity)
    .slice(0, 15);
  if (worst.length > 0) {
    console.log("\n## 重複の重い順 (上位 15)");
    for (const { key, v } of worst) {
      console.log(`  x${String(v.severity).padStart(5)}  ${key}`);
    }
  }

  if (errors.length > 0) {
    console.log("\n## error (書き込みが止まる)");
    for (const r of errors.slice(0, 30)) {
      for (const v of r.violations.filter((x) => x.isError)) console.log(`  ${v.message}`);
    }
    if (errors.length > 30) console.log(`  … 他 ${errors.length - 30} 件`);
  }
}

/**
 * `src/expected-shape-anomaly.ts` に貼れる TS リテラルを出す。
 *
 * 是正の wave 順に期限をずらせるよう、重症度の重い順に並べる
 * (重いものほど読者への実害が大きく、かつ軸が 1 本に絞れていて機械的に直しやすい)。
 */
function emitAllowlist(withViolations: readonly ScanRow[]): void {
  const entries = withViolations
    .flatMap((r) => r.violations.map((v) => ({ key: r.key, v })))
    // coverage は縮小専用ラチェットで既定 warn なので allowlist に載せない
    // (港湾・漁業のような正当な欠落を allowlist で埋め尽くさないため)
    .filter(({ v }) => v.check !== "area-coverage")
    .sort((a, b) => b.v.severity - a.v.severity || a.key.localeCompare(b.key));

  const until = "2026-12-31";
  console.log(`// 生成日時: ${new Date().toISOString()} / エントリ数: ${entries.length}`);
  for (const { key, v } of entries) {
    console.log("  {");
    console.log(`    key: ${JSON.stringify(key)},`);
    console.log(`    check: ${JSON.stringify(v.check satisfies ShapeCheck)},`);
    console.log(`    disposition: "known-broken",`);
    console.log(`    observedSeverity: ${v.severity},`);
    console.log(`    reason: ${JSON.stringify(reasonFor(v))},`);
    console.log(`    issue: "RANKING-VALUES-PARTITION-INTEGRITY-01",`);
    console.log(`    until: ${JSON.stringify(until)},`);
    console.log("  },");
  }
}

function reasonFor(v: ShapeViolation): string {
  if (v.check === "duplicate-area-year") {
    return `2026-07-30 実測: 同一 (県, 年) に最大 ${v.severity} 行。分類軸の絞り忘れ。是正待ち`;
  }
  if (v.check === "percent-out-of-range") {
    return `2026-07-30 実測: unit が % なのに最大値 ${v.severity}。率ではなく実数が入っている。是正待ち`;
  }
  return `2026-07-30 実測の既知違反 (severity ${v.severity})。是正待ち`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
