#!/usr/bin/env node
/**
 * cli.mjs — 登録済み adapter を横断して effect ラベルを確定し、機械可読な verdict を書く。
 *
 * 根拠は 2 系統に残す:
 *   - 機械可読: `.claude/state/effect-verdict/verdicts-<week>.json` (本 CLI)
 *   - 人間可読: 各 improvement-log の `### 判定` セクション (各 adapter の CLI 側で upsert)
 *
 * adapter 契約 (7 メンバ + 任意 3):
 *   domainId / listSubjects() / resolveWindow(subject) / measure(subject, week) /
 *   targetOf(subject) / logPath / headerPrefix
 *   任意: sourcesOf(subject, window) / confoundersOf(subject, window) / pastEffectKeys(subject) /
 *         reproduceCommand(subject)
 *
 * Usage:
 *   node .claude/scripts/lib/effect-verdict/cli.mjs                  # 既定 out に書く
 *   node .claude/scripts/lib/effect-verdict/cli.mjs --week 2026-W31
 *   node .claude/scripts/lib/effect-verdict/cli.mjs --dry-run        # 書かずに summary のみ
 *   node .claude/scripts/lib/effect-verdict/cli.mjs --out /tmp/v.json
 *
 * 終了コード: ガード hit は正常系 (exit 0)。閾値計算の例外は exit 1 で赤くする
 * (backlog の status 書き換えは行わない — improvement-triage の排他 write を侵さない)。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decideVerdict } from "./engine.mjs";
import { DEFAULT_THRESHOLDS } from "./thresholds.mjs";
import { weekLt } from "./iso-week.mjs";
import { currentIsoWeek } from "../../search-growth/lib/state.mjs";
import { createGscBlogWaveAdapter } from "../../blog/measure-gsc-impact.mjs";
import { createAdsenseAdapter } from "../../metrics/measure-adsense-impact.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/effect-verdict");

/** 登録済み adapter。増やすときはここに 1 行足す。 */
export function loadAdapters(opts = {}) {
  return [createGscBlogWaveAdapter(opts.gsc ?? {}), createAdsenseAdapter(opts.adsense ?? {})];
}

/**
 * adapter 1 つを走らせて verdict 配列を返す (純粋寄り: 副作用は adapter 側の read のみ)。
 * @param {object} adapter
 * @param {object} [thresholds]
 */
export function runAdapter(adapter, thresholds = DEFAULT_THRESHOLDS) {
  const out = [];
  for (const subject of adapter.listSubjects()) {
    const window = adapter.resolveWindow(subject);
    const subjectId = subject.subjectId ?? subject.id;
    if (!window.beforeWeek || !window.afterWeek || !weekLt(window.beforeWeek, window.afterWeek)) {
      out.push({
        domainId: adapter.domainId,
        subjectId,
        label: "effect/pending",
        reason: "before/after 週が解決できない (snapshot 不足)",
        guards: [{ code: "insufficient-target", detail: "計測窓が確定できない" }],
        window,
        skipped: true,
      });
      continue;
    }
    const before = adapter.measure(subject, window.beforeWeek);
    const after = adapter.measure(subject, window.afterWeek);
    const verdict = decideVerdict(
      {
        before: { value: before.value, impressions: before.impressions },
        after: { value: after.value, impressions: after.impressions },
        target: adapter.targetOf(subject),
        window,
        sources: adapter.sourcesOf ? adapter.sourcesOf(subject, window) : [],
        confounders: adapter.confoundersOf ? adapter.confoundersOf(subject, window) : {},
      },
      thresholds,
    );
    out.push({
      domainId: adapter.domainId,
      subjectId,
      label: verdict.label,
      reason: verdict.reason,
      thresholdsVersion: verdict.thresholdsVersion,
      guards: verdict.guards,
      before: verdict.evidence.before,
      after: verdict.evidence.after,
      delta: verdict.evidence.delta,
      relativeDelta: finiteOrNull(verdict.evidence.relativeDelta),
      target: verdict.evidence.target,
      attainment: verdict.attainment,
      boundaries: verdict.boundaries,
      window: verdict.evidence.window,
      sources: verdict.evidence.sources,
      confounders: verdict.evidence.confounders,
      pastEffectKeys: adapter.pastEffectKeys ? adapter.pastEffectKeys(subject) : [],
      logPath: path.relative(PROJECT_ROOT, adapter.logPath),
      reproduceCommand: adapter.reproduceCommand ? adapter.reproduceCommand(subject) : null,
      skipped: false,
    });
  }
  return out;
}

/** JSON に Infinity を残さない (JSON.stringify が null にするのを明示化)。 */
function finiteOrNull(x) {
  return x == null || !Number.isFinite(x) ? null : x;
}

function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback = null) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const dryRun = args.includes("--dry-run");
  const week = getArg("--week", currentIsoWeek());
  const outPath = getArg("--out", path.join(STATE_DIR, `verdicts-${week}.json`));

  const adapters = loadAdapters();
  const verdicts = [];
  for (const a of adapters) verdicts.push(...runAdapter(a));

  const counts = {};
  for (const v of verdicts) counts[v.label] = (counts[v.label] ?? 0) + 1;
  const guardCounts = {};
  for (const v of verdicts) for (const g of v.guards ?? []) guardCounts[g.code] = (guardCounts[g.code] ?? 0) + 1;

  const payload = {
    schemaVersion: 1,
    week,
    decidedAt: new Date().toISOString(),
    thresholdsVersion: DEFAULT_THRESHOLDS.version,
    thresholdsPath: ".claude/scripts/lib/effect-verdict/thresholds.mjs",
    note:
      "閾値エンジンによる effect ラベルの確定記録。ガード hit は effect/pending に留まる。" +
      "backlog の status 反映は improvement-triage が行う (本 CLI は書かない)。",
    summary: { total: verdicts.length, byLabel: counts, byGuard: guardCounts },
    verdicts,
  };

  const lines = [
    `# effect verdicts (${week}) — thresholds v${DEFAULT_THRESHOLDS.version}`,
    `# 合計 ${verdicts.length} 件: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" / ") || "(なし)"}`,
    `# ガード: ${Object.entries(guardCounts).map(([k, v]) => `${k}=${v}`).join(" / ") || "(なし)"}`,
    "",
  ];
  for (const v of verdicts) {
    lines.push(
      `${v.domainId.padEnd(15)} ${String(v.subjectId).padEnd(34)} ${v.label.padEnd(15)} ${v.reason}`,
    );
  }
  const confirmed = verdicts.filter((v) => v.label !== "effect/pending");
  lines.push("");
  lines.push(
    confirmed.length === 0
      ? "確定 verdict なし (全件ガード hit = 判定不能)。backlog 反映は不要。"
      : `確定 verdict ${confirmed.length} 件 — backlog 反映は improvement-triage が行う: ${confirmed.map((v) => `${v.subjectId}=${v.label}`).join(", ")}`,
  );
  process.stdout.write(lines.join("\n") + "\n");

  if (dryRun) {
    process.stderr.write("\n[dry-run] verdict JSON は書き込んでいない\n");
    return;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
  process.stderr.write(`\n✓ wrote ${outPath}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main();
}
