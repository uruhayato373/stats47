#!/usr/bin/env node
/**
 * check-a8-report-due.mjs
 * ---------------------------------------------------------------------------
 * 由来: doboku-note の scripts/check-a8-report-due.mjs
 *
 * A8 成果レポートの取り込みが月次サイクル（既定30日）に対して期限切れかを機械判定する surfacer。
 *
 * なぜ surfacer か: A8 は公開 API が無く、取得は Playwright + A8 ログイン必須の
 * **ローカル専用・人間 in the loop** ＝ CI cron 化できない。よって「自動で回る」のではなく
 * **手動の月次儀式**にするしかなく、放置防止のため weekly-review から「そろそろ A8 成果の
 * 取り込み時期」を思い出させる。新規 cron は作らない（doboku-note 側の check-gsc-ui-due.mjs と
 * 同じ思想・同じ形）。
 *
 * 判定: `.claude/state/metrics/affiliate/a8-ui-last-run.json`（committed マーカー）の
 *       collectedAt から経過日数 >= しきい値で DUE。マーカー無ければ DUE(初回/未実施)。
 *
 * 追加で surface するもの（A8 固有・放置すると静かに壊れる）:
 *   - `crossCheck.hasShortfall`＝サイト別を allowlist で説明しきれていない＝未登録プログラムの疑い
 *   - `crossCheck.exceeded` が true＝doboku-note 混入の疑いが未解消
 *
 * stats47 での適応:
 *   - マーカーの置き場を `.claude/state/metrics/affiliate/a8-ui/last-run.json`（doboku-note の
 *     raw run ディレクトリ配下）から `.claude/state/metrics/affiliate/a8-ui-last-run.json`
 *     （フラット）へ変更した。stats47 では raw run が git 管理外 `.local/a8-ui/` に移ったため。
 *   - repo root の解決を `__dirname` からの相対ディレクトリ数え上げ（由来はスクリプトが
 *     `scripts/` 直下にある前提で `join(__dirname, "..")` だった）ではなく、
 *     `asp-browser-base.mjs` の `repoRoot()` に統一した（ファイルの実配置は
 *     `.claude/scripts/ads/` なので相対階層が異なる。他ファイルと解決ロジックを共有し
 *     ドリフトを防ぐ）。
 *   - npm script（`npm run check-a8-report-due` 相当）は追加していないため、CLI は
 *     `node .claude/scripts/ads/check-a8-report-due.mjs` の直接呼び出しに変更した。
 *   - 由来はトップレベルで `process.exit(0)` を含む逐次処理を直接実行していたため、
 *     このファイルが import されただけで実行・終了してしまわないよう、ロジック全体を
 *     `main()` に包み `import.meta.url` ガードを追加した（直接実行時のみ走る）。
 *
 * 使い方:
 *   node .claude/scripts/ads/check-a8-report-due.mjs                 # 1 行サマリ
 *   node .claude/scripts/ads/check-a8-report-due.mjs --json          # weekly-review 用 JSON
 *   node .claude/scripts/ads/check-a8-report-due.mjs --days 30
 * 常に exit 0（非ブロッキング surfacer）。
 * ---------------------------------------------------------------------------
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRoot } from "./lib/asp-browser-base.mjs";

const REPO_ROOT = repoRoot();
const MARKER = join(REPO_ROOT, ".claude/state/metrics/affiliate/a8-ui-last-run.json");
const LOG = join(REPO_ROOT, ".claude/state/metrics/affiliate/a8-report-log.json");
const REVIEW =
  "node .claude/scripts/ads/fetch-a8-ui-csv.mjs --reports all --month YYYY-MM && node .claude/scripts/ads/normalize-a8-csv.mjs --latest（ローカル・要 A8 ログイン）";

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes("--json");
  const di = args.indexOf("--days");
  // `|| 30` で書くと --days 0（常に DUE＝動作確認用）が falsy に潰れるので明示的に判定する
  const parsedDays = di >= 0 && args[di + 1] != null ? Number.parseInt(args[di + 1], 10) : NaN;
  const threshold = Number.isFinite(parsedDays) && parsedDays >= 0 ? parsedDays : 30;

  const marker = readJson(MARKER);
  const log = readJson(LOG);

  const lastIso = marker?.collectedAt || marker?.lastRun || null;
  const lastMs = lastIso
    ? Date.parse(String(lastIso).replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/, "$1T$2:$3:$4"))
    : NaN;
  const daysSince = Number.isFinite(lastMs) ? Math.floor((Date.now() - lastMs) / 86400000) : null;
  const due = marker == null || daysSince == null || daysSince >= threshold;

  // 取りこぼしの客観シグナルは「サイト別を allowlist で説明しきれていない不足分」。
  // 口座横断レポートの未写像そのものは doboku-note 分を含むので指標にしない。
  const candidates = Array.isArray(log?.missingProgramCandidates) ? log.missingProgramCandidates : [];
  const shortfall = log?.crossCheck?.hasShortfall === true;
  const exceeded = log?.crossCheck?.exceeded === true;

  const issues = [];
  if (shortfall) {
    const sf = log?.crossCheck?.shortfall ?? {};
    issues.push(
      `未登録プログラムの疑い（サイト別との不足 click ${sf.clicks ?? "-"} / 確定額 ${sf.revenueYen ?? "-"}` +
        (candidates.length ? `・候補 ${candidates.map((c) => c.programId).join(", ")}` : "") +
        "）",
    );
  }
  if (exceeded) issues.push("crossCheck 超過（他サイト混入の疑い）");

  const result = {
    check: "a8-report-due",
    thresholdDays: threshold,
    due,
    lastRun: marker?.lastRun ?? null,
    collectedAt: lastIso,
    daysSince,
    downloadedUnits: marker?.downloadedUnits ?? null,
    missingProgramCandidates: candidates.length,
    crossCheckShortfall: shortfall,
    crossCheckExceeded: exceeded,
    issues,
    review: REVIEW,
    note: "ローカル専用・要 A8 ログイン。A8 は公開 API 無しでクラウド週次では実行不可＝surface のみ。",
  };

  if (wantJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (due) {
      console.log(
        lastIso
          ? `[A8 成果取込] DUE: 前回 ${lastIso}（${daysSince}日前・しきい値${threshold}日）→ 次セッションで ${REVIEW}`
          : `[A8 成果取込] DUE: 未実施（マーカーなし）→ 次セッションで ${REVIEW}`,
      );
    } else {
      console.log(`[A8 成果取込] OK: 前回 ${lastIso}（${daysSince}日前・次回まで${threshold - daysSince}日）`);
    }
    for (const i of issues) console.log(`  [要対応] ${i}`);
  }
  process.exit(0);
}

// import された時点で実行されないよう、直接実行時のみ main() を呼ぶ
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, "/").includes("check-a8-report-due.mjs");
if (isDirectRun) {
  main();
}
