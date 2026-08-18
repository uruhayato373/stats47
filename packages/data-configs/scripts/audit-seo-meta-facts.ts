/**
 * `seoTitle` / `seoDescription` の事実主張を R2 の観測値と全数突合する。
 *
 * ## なぜ要るか
 *
 * SEO 文字列はランキングページの `<title>` と `<meta name="description">` として
 * **そのまま配信される**。決定的に生成されておらず照合もされていなかったため、
 * 実データと食い違う数値が検索結果に出ていた。判定の中身は
 * `packages/data-configs/src/seo-meta-facts.ts` (純関数・テスト付き) が持つ。
 *
 * ## 実行
 *
 *   npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts              # 全 active
 *   npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts --only a,b   # 変更分だけ (pre-commit 用)
 *   npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts --json /tmp/out.json
 *   npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts --update-baseline
 *   npx tsx packages/data-configs/scripts/audit-seo-meta-facts.ts --fail-on-new   # CI 用
 *
 * ## 段階導入 (縮小専用ラチェット)
 *
 * 既存違反は baseline (`.claude/state/data/seo-meta-facts-baseline.json`) に固定し、
 * **新規混入だけ**を止める。全件を一度に直そうとすると恒久的に赤いゲートになり、
 * 運用で無効化される (`check-value-format.cjs` と同じ方針)。baseline は縮小専用で、
 * 是正のたびに `--update-baseline` で減らす。
 *
 * ## 取れなかったことを「問題なし」に混ぜない
 *
 * 観測値を取得できなかった metric は `skipped` に数え、合格には数えない。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { METRICS_REGISTRY } from "../src/registry.js";
import {
  checkSeoFacts,
  extractSeoClaims,
  type SeoFactFinding,
} from "../src/seo-meta-facts.js";
import type { MetricConfig } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const BASELINE = resolve(REPO_ROOT, ".claude/state/data/seo-meta-facts-baseline.json");
const R2 = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const CONCURRENCY = 16;

interface StatsRow {
  areaName: string;
  yearCode: string;
  value: number | null;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    only: get("--only")?.split(",").map((s) => s.trim()).filter(Boolean),
    json: get("--json"),
    updateBaseline: argv.includes("--update-baseline"),
    failOnNew: argv.includes("--fail-on-new"),
  };
}

/** config.years を年の集合へ展開する */
function declaredYears(config: MetricConfig): Set<number> {
  const y = config.years as unknown as { from?: number; to?: number; years?: number[] } | undefined;
  if (!y) return new Set();
  if (Array.isArray(y.years)) return new Set(y.years);
  if (typeof y.from === "number" && typeof y.to === "number") {
    const out = new Set<number>();
    for (let n = y.from; n <= y.to; n++) out.add(n);
    return out;
  }
  return new Set();
}

async function fetchStats(key: string): Promise<StatsRow[] | null> {
  const res = await fetch(`${R2}/app/stats/${key}/values.json`).catch(() => null);
  if (!res || !res.ok) return null;
  const payload = (await res.json().catch(() => null)) as { rows?: StatsRow[] } | null;
  return payload?.rows?.length ? payload.rows : null;
}

function loadBaseline(): Set<string> {
  if (!existsSync(BASELINE)) return new Set();
  try {
    const json = JSON.parse(readFileSync(BASELINE, "utf8")) as { keys?: string[] };
    return new Set(json.keys ?? []);
  } catch {
    return new Set();
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const all = (Object.values(METRICS_REGISTRY) as MetricConfig[]).filter(
    (c) => c.isActive && (c.seoTitle || c.seoDescription),
  );
  const targets = args.only ? all.filter((c) => args.only!.includes(c.key)) : all;
  if (targets.length === 0) {
    console.log("対象がありません");
    return;
  }
  console.log(`対象 ${targets.length} 件 (isActive かつ SEO 文字列あり ${all.length} 件中)`);

  const results = new Map<string, SeoFactFinding[]>();
  let skipped = 0;
  let noClaim = 0;

  const queue = [...targets];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const config = queue.shift();
        if (!config) return;
        const text = `${config.seoTitle ?? ""} ${config.seoDescription ?? ""}`;
        // unit を渡すのは「千」がスケール接頭辞か単位そのものかを判別させるため
        // (`unit="千円"` の「13,326千円」を ×1000 しない)。
        const claims = extractSeoClaims(text, config.unit);
        if (claims.ranks.length === 0 && claims.ratio === null && claims.years.length === 0) {
          noClaim++;
          continue;
        }

        const rows = await fetchStats(config.key);
        if (!rows) {
          // 観測値を取れなかった。config だけで判定できる「宣言範囲外の年」は見る
          const f = checkSeoFacts({ claims, truth: null, declaredYears: declaredYears(config) });
          if (f.length > 0) results.set(config.key, f);
          else skipped++;
          continue;
        }

        const dataYears = new Set(rows.map((r) => r.yearCode));
        // 主張している年で判定する。無い年なら最新年 (年の食い違いは別途 finding になる)
        const years = [...dataYears].sort();
        const claimed = claims.years.map(String).find((y) => dataYears.has(y));
        const year = claimed ?? years[years.length - 1];
        const inYear = rows.filter(
          (r) => r.yearCode === year && typeof r.value === "number",
        ) as Array<{ areaName: string; yearCode: string; value: number }>;

        const truth =
          inYear.length > 0
            ? (() => {
                const sorted = [...inYear].sort((a, b) => b.value - a.value);
                return {
                  year,
                  top: { areaName: sorted[0].areaName, value: sorted[0].value },
                  bottom: {
                    areaName: sorted[sorted.length - 1].areaName,
                    value: sorted[sorted.length - 1].value,
                  },
                };
              })()
            : null;

        const findings = checkSeoFacts({
          claims,
          truth,
          declaredYears: declaredYears(config),
          dataYears,
        });
        if (findings.length > 0) results.set(config.key, findings);
      }
    }),
  );

  const violatingKeys = [...results.keys()].sort();
  const byKind = new Map<string, number>();
  for (const fs of results.values()) {
    for (const f of fs) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
  }

  console.log("");
  console.log(`  不一致のある metric : ${violatingKeys.length}`);
  console.log(`  主張なし (対象外)   : ${noClaim}`);
  console.log(`  観測値を取れず判定不能: ${skipped}`);
  if (byKind.size > 0) {
    console.log(
      `  内訳 (指摘数)       : ${[...byKind].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(" / ")}`,
    );
  }

  if (violatingKeys.length > 0) {
    console.log("\n── 不一致 ──");
    for (const key of violatingKeys.slice(0, 30)) {
      console.log(`  ${key}`);
      for (const f of results.get(key) ?? []) console.log(`    [${f.kind}] ${f.detail}`);
    }
    if (violatingKeys.length > 30) console.log(`  ... 他 ${violatingKeys.length - 30} 件`);
  }

  if (args.json) {
    mkdirSync(dirname(resolve(args.json)), { recursive: true });
    writeFileSync(
      resolve(args.json),
      JSON.stringify({ keys: violatingKeys, findings: Object.fromEntries(results) }, null, 2),
      "utf8",
    );
    console.log(`\nJSON: ${args.json}`);
  }

  if (args.updateBaseline) {
    if (args.only) {
      console.error("--update-baseline は全件走査でのみ使えます (--only と併用しない)");
      process.exit(1);
    }
    const prev = loadBaseline();
    if (violatingKeys.length > prev.size && prev.size > 0) {
      console.error(
        `baseline は縮小専用です (${prev.size} → ${violatingKeys.length} は増加)。先に是正してください`,
      );
      process.exit(1);
    }
    mkdirSync(dirname(BASELINE), { recursive: true });
    writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          note: "seoTitle/seoDescription が実データと食い違う metric。縮小専用。正典: .claude/todo/05_機能バックログ.md SEO-META-FACTUAL-GATE-01",
          updatedAt: new Date().toISOString().slice(0, 10),
          keys: violatingKeys,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    console.log(`\nbaseline を更新: ${prev.size} → ${violatingKeys.length} 件`);
    return;
  }

  if (args.failOnNew) {
    const baseline = loadBaseline();
    const added = violatingKeys.filter((k) => !baseline.has(k));
    if (added.length > 0) {
      console.error(`\n新規の不一致 ${added.length} 件: ${added.join(", ")}`);
      console.error("是正するか、意図した変更なら --update-baseline で baseline を更新してください");
      process.exit(1);
    }
    console.log("\n✅ 新規の不一致なし");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
