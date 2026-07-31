/**
 * audit-reingest-queue — 「config は直っているのに配信データが古いまま」の metric を列挙する。
 *
 * ## 何を埋める検査か
 *
 * 形状ゲート (shape-gate) は 3 層あるが、どれも「**いま R2 にあるデータが壊れている**」しか
 * 言わない。config を是正しても再取り込みが走らなければ配信は古いままで、その状態は
 * `EXPECTED_SHAPE_ANOMALY` の `until` が来るまで誰も催促しない。`MAX_KNOWN_BROKEN` の
 * ラチェットも「増やさない」だけで減らす圧力が無い。
 *
 * 検査(k) (`audit-ranking-data-integrity.ts` のレシピ整合) が同じ乖離を狙っているが、
 * レシピ導入 (2026-07-30) 以前の payload は recipe を持たず `unbaked` (残数) に落ちるため
 * **全面再生成が終わるまで発火しない**。本スクリプトは recipe を必要とせず、
 * git の config 更新日と R2 の `meta.generatedAt` だけで判定する。
 *
 * ## 使い方
 *
 *   npx tsx packages/data-configs/scripts/audit-reingest-queue.ts [--json] [--ratchet] [--fail-on-stale]
 *
 *   --ratchet       : 前回の committed state より stale-delivery が増えたら exit 1 (週次 CI 用)
 *   --fail-on-stale : stale-delivery が 1 件でもあれば exit 1 (0 件を維持したい場面のみ)
 *
 * ## 対象は allowlist の `known-broken` に限る (★全 metric に広げてはいけない)
 *
 * 一度 2,295 件全部に広げて実測したところ **2,063 件 (90%)** が stale-delivery になった。
 * 一括コミットが全 config ファイルに触れるため、git の更新日では「**クエリが変わった**」と
 * 「ただ触った (整形・registry 再生成)」を区別できない。90% が該当するキューは優先度を
 * 示さないので、キューとして機能しない。
 *
 * この区別は本来 `configHash` (クエリと変換だけの指紋) の仕事で、検査(k) がそれを持つ。
 * ただし検査(k) は R2 payload に焼かれた `meta.recipe` と突き合わせる方式で、レシピ導入
 * (2026-07-30) 以前の payload には recipe が無く `unbaked` に落ちて発火しない。
 *
 * したがって本スクリプトは「**壊れていると分かっている集団の中で、config が後から直されたか**」
 * だけを見る。ここでは config への編集がほぼ確実に是正なので、日付が意味を持つ。
 * 全 metric の乖離は全面再生成後に検査(k) が担う。
 *
 * 出力: .claude/state/data/reingest-queue.json (機械) + LATEST.md (人間)
 *
 * 正典: .claude/rules/metric-config-standards.md §分類軸は必ず 1 系列に絞る
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EXPECTED_SHAPE_ANOMALY } from "../src/expected-shape-anomaly";
import {
  assessReingestNeed,
  summarizeReingest,
  type ReingestAssessment,
} from "../src/reingest-need";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/data");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const args = process.argv.slice(2);
const AS_JSON = args.includes("--json");
const FAIL_ON_STALE = args.includes("--fail-on-stale");
/**
 * 縮小専用ラチェット: 前回の committed state より stale-delivery が**増えたら**失敗する。
 *
 * `--fail-on-stale` (0 件でなければ失敗) にしないのは、恒久的に赤いジョブが無視されるため。
 * 「直っているのに配信が古い」は放置すると増える性質なので、増加を止めれば減る方へ向かう。
 * chart-provenance の日次監査と同じ方式に揃える。
 */
const RATCHET = args.includes("--ratchet");

/**
 * 全 metric config の最終更新 (git author date) を **1 回の git log** で集める。
 * ファイルごとに `git log -1` を回すと 2,300 プロセス起動になるため、name-only の
 * 1 パスで「新しい順に最初に現れたコミット日」を採る。
 */
function collectConfigModifiedAt(): Map<string, string> {
  const out = new Map<string, string>();
  let log: string;
  try {
    log = execFileSync(
      "git",
      ["log", "--format=%aI", "--name-only", "--", "packages/data-configs/src/metrics"],
      { cwd: PROJECT_ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
    );
  } catch {
    return out;
  }
  let current: string | null = null;
  for (const line of log.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (/^\d{4}-\d{2}-\d{2}T/.test(t)) {
      current = t;
      continue;
    }
    const m = t.match(/^packages\/data-configs\/src\/metrics\/(.+)\.ts$/);
    // git log は新しい順なので、最初に現れたものが最終更新
    if (m && current && !out.has(m[1])) out.set(m[1], current);
  }
  return out;
}

/**
 * 配信データの書き込み日時。**HEAD の Last-Modified** で判定する。
 *
 * payload を GET して `meta.generatedAt` を読むこともできるが、2,300 件を全部落とすと重い。
 * R2 の Last-Modified はオブジェクトの書き込み時刻そのもので、「いつ再生成されたか」を
 * 知るには十分。正典 (app/stats) を先に見て、無ければ配信 (app/ranking) を見る。
 */
async function dataWrittenAt(key: string): Promise<string | null> {
  for (const p of [`app/stats/${key}/values.json`, `app/ranking/${key}/values.json`]) {
    try {
      const res = await fetch(`${R2}/${p}`, { method: "HEAD" });
      if (!res.ok) continue;
      const lm = res.headers.get("last-modified");
      if (lm) return new Date(lm).toISOString();
    } catch {
      // ネットワーク不調は unknown に落ちる (誤って「直った」と言わない)
    }
  }
  return null;
}

async function main() {
  // known-broken だけが対象 (上の「対象」参照)。legitimate は統計の性質上その形が正しいので
  // 再取り込みしても変わらない。
  const knownBrokenKeys = [
    ...new Set(
      EXPECTED_SHAPE_ANOMALY.filter((e) => e.disposition === "known-broken").map((e) => e.key),
    ),
  ].sort();
  const configTimes = collectConfigModifiedAt();

  const assessments: ReingestAssessment[] = [];
  for (const key of knownBrokenKeys) {
    assessments.push({
      ...assessReingestNeed({
        key,
        configModifiedAt: configTimes.get(key) ?? null,
        dataGeneratedAt: await dataWrittenAt(key),
      }),
      knownBroken: true,
    });
  }

  const summary = summarizeReingest(assessments);
  const generatedAt = new Date().toISOString();

  // ラチェット判定は **上書きする前** に前回値を読む。
  const statePath = path.join(STATE_DIR, "reingest-queue.json");
  let previousStale: number | null = null;
  if (fs.existsSync(statePath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(statePath, "utf8")) as {
        summary?: { staleDelivery?: string[] };
      };
      const list = prev.summary?.staleDelivery;
      if (Array.isArray(list)) previousStale = list.length;
    } catch {
      // 壊れた state はラチェットの基準にしない (前回値なし扱い)
    }
  }

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    statePath,
    `${JSON.stringify({ generatedAt, summary, assessments }, null, 2)}\n`,
  );

  const byIssue = new Map<string, string[]>();
  for (const e of EXPECTED_SHAPE_ANOMALY.filter((x) => x.disposition === "known-broken")) {
    byIssue.set(e.issue, [...(byIssue.get(e.issue) ?? []), e.key]);
  }

  const stale = assessments.filter((a) => a.verdict === "stale-delivery");
  const staleKnown = stale.filter((a) => a.knownBroken);
  const md = [
    "# 再取り込みキュー (LATEST)",
    "",
    `- 生成: ${generatedAt}`,
    `- 対象: 形状 allowlist の \`known-broken\` ${summary.total} 件`,
    "- 判定: config の最終更新 (git) と 配信データの書き込み日 (R2 Last-Modified) の前後",
    "- ★全 metric には広げない。一括コミットが全 config に触れるため日付では",
    "  「クエリが変わった」と「ただ触った」を区別できない (実測 2,295 件中 2,063 件が該当)。",
    "  全件の乖離は全面再生成後に検査(k) (レシピ整合) が担う",
    "",
    "## サマリ",
    "",
    `- ★再取り込みで直る (stale-delivery): ${summary.staleDelivery.length} 件` +
      ``,
    `- 配信の方が新しい (config-insufficient): ${summary.configInsufficient.length} 件`,
    `- 判定不能 (unknown): ${summary.unknown.length} 件`,
    "",
    "## 再取り込みが要る metric",
    "",
    ...[...staleKnown, ...stale.filter((a) => !a.knownBroken)]
      .slice(0, 120)
      .map(
        (a) =>
          `- \`${a.key}\`${a.knownBroken ? " **[known-broken]**" : ""} — ${a.note}` +
          `\n  - config: ${a.configModifiedAt ?? "不明"} / data: ${a.dataGeneratedAt ?? "不明"}`,
      ),
    stale.length > 120 ? `- … 他 ${stale.length - 120} 件 (全件は reingest-queue.json)` : "",
    "",
    "## 直し方",
    "",
    "- `stale-delivery`: 該当 key を再取り込みする。取り込み時の形状ゲートが通れば配信が更新される",
    "  (`data/data-refresh-requests.json` を push して `data-refresh.yml` を発火するのが本筋。",
    "  個別なら `npx tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>`)",
    "- `config-insufficient` かつ allowlist 掲載: 再取り込みでは直らない。未指定の分類軸を診断する",
    "  (`npx tsx packages/data-configs/scripts/diagnose-unpinned-axes.ts --fetch`)",
    "- `unknown`: 配信データが存在しない (未公開 metric) か R2 が引けなかった",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(STATE_DIR, "LATEST.md"), md);

  if (AS_JSON) {
    process.stdout.write(`${JSON.stringify({ summary, assessments }, null, 2)}\n`);
  } else {
    process.stdout.write(
      `再取り込みキュー: 総数 ${summary.total} / stale-delivery ${summary.staleDelivery.length} / ` +
        `config-insufficient ${summary.configInsufficient.length} / unknown ${summary.unknown.length}\n`,
    );
    for (const a of assessments) {
      process.stdout.write(`  [${a.verdict}] ${a.key} — ${a.note}\n`);
    }
    process.stdout.write(`→ ${path.relative(PROJECT_ROOT, path.join(STATE_DIR, "LATEST.md"))}\n`);
  }

  if (RATCHET && previousStale !== null && summary.staleDelivery.length > previousStale) {
    process.stderr.write(
      `::error::「config は直っているのに配信が古い」metric が ${previousStale} → ` +
        `${summary.staleDelivery.length} 件に増えた (${summary.staleDelivery.join(", ")}) — ` +
        `config を直したら再取り込みまで通すこと\n`,
    );
    process.exitCode = 1;
  }

  if (FAIL_ON_STALE && summary.staleDelivery.length > 0) {
    process.stderr.write(
      `::error::config は直っているのに配信が古い metric が ${summary.staleDelivery.length} 件 ` +
        `(${summary.staleDelivery.slice(0, 5).join(", ")}) — 再取り込みが要る\n`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(
    `::error::[audit-reingest-queue] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
