#!/usr/bin/env node
/**
 * normalize-a8-csv.mjs — A8 レポート CSV を正規化して SSOT へ upsert（決定的・ネットワーク不要）
 * ---------------------------------------------------------------------------
 * 由来: doboku-note の scripts/normalize-a8-csv.mjs
 *
 * stats47 での適応:
 *   - fetch-a8-ui-csv.mjs の raw run（CSV + manifest.json）の置き場を
 *     `.claude/state/metrics/affiliate/a8-ui/` から `.local/a8-ui/`（git 管理外）へ変更したのに
 *     合わせて RUN_DIR を変更した。正規化結果（a8-report-log.json / a8-results.json）は
 *     由来と同じ `.claude/state/metrics/affiliate/` に committed SSOT として残す。
 *   - パス解決を `process.cwd()` 相対ではなく `repoRoot()`（asp-browser-base.mjs 由来）に変更し、
 *     実行ディレクトリや OS に依存しないようにした。
 *   - programIdMap は **stats47 の広告 SSOT (apps/web/scripts/affiliate-ads-data.ts) の mid= から
 *     機械生成**した 72 件（doboku-note 版は手書き 4 件）。他サイト専用プログラムの除外リストは
 *     `_dobokuPrograms` ではなく `_otherSiteProgramIds.ids` を読む。
 *   - ★**両サイトが同じ A8 案件を配信している 3 プログラム**（`_sharedWithDobokuNote`）は
 *     programId では分離できない。account-wide レポートのその行は両サイト合算であり、
 *     stats47 単独の実績として報告してはならない（分離可能なのは site-summary の対象サイト行のみ）。
 *   - トップレベルで無条件に main() を呼んでいた由来のコードは、このファイルが import された
 *     だけで実行されないよう `import.meta.url` ガードを追加した（直接実行時のみ走る）。
 *
 * fetch-a8-ui-csv.mjs が保存した run（raw CSV + manifest.json）を読み、
 *   1. <runDir>/normalized/<reportKey>.json（+ .rejects.json）を書く
 *   2. .claude/state/metrics/affiliate/a8-report-log.json へ upsert（committed SSOT）
 *   3. .claude/state/metrics/affiliate/a8-results.json の records へ rollup（既存スキーマ維持）
 * raw CSV と manifest.json は書き換えない（append-only・監査可能性のため）。
 *
 * A8 は承認確定で過去月の数値が遡及変化するため、追記でなく **upsert**（最新 fetch が正）。
 *
 * CLI:
 *   node .claude/scripts/ads/normalize-a8-csv.mjs --latest
 *   node .claude/scripts/ads/normalize-a8-csv.mjs --run 2026-07-27T01-23-45-678Z
 *   node .claude/scripts/ads/normalize-a8-csv.mjs --latest --dry-run   # SSOT を書かずに差分だけ表示
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";

import {
  decodeCsvBuffer,
  normalizeA8Csv,
  upsertBy,
  KEY,
  toResultsRecords,
  crossCheckAgainstSite,
  suggestMissingPrograms,
} from "./lib/a8-report-csv.mjs";
import { repoRoot } from "./lib/asp-browser-base.mjs";

const REPO_ROOT = repoRoot();
const RAW_STATE_DIR = join(REPO_ROOT, ".local/a8-ui");
const AFF_DIR = join(REPO_ROOT, ".claude/state/metrics/affiliate");
const REPORT_LOG = join(AFF_DIR, "a8-report-log.json");
const RESULTS = join(AFF_DIR, "a8-results.json");
const CONFIG_PATH = join(REPO_ROOT, ".claude/config/a8-report-automation.json");

/** reportKey → a8-report-log.json 内の配列名とキー関数。 */
const BUCKET = {
  "site-summary": { field: "siteSummary", key: KEY.siteSummary },
  "period-monthly": { field: "monthly", key: KEY.monthly },
  "period-daily": { field: "daily", key: KEY.daily },
  "program-detail": { field: "programPeriod", key: KEY.programPeriod },
};

function parseArgs() {
  const a = process.argv.slice(2);
  const opts = { latest: false, run: null, dryRun: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--latest") opts.latest = true;
    else if (a[i] === "--dry-run") opts.dryRun = true;
    else if (a[i] === "--run") opts.run = a[++i];
  }
  if (!opts.latest && !opts.run) opts.latest = true;
  return opts;
}

function resolveRunDir(opts) {
  if (opts.run) {
    const direct = existsSync(opts.run) ? opts.run : join(RAW_STATE_DIR, opts.run);
    if (!existsSync(direct)) throw new Error(`run が見つかりません: ${opts.run}`);
    return direct;
  }
  if (!existsSync(RAW_STATE_DIR)) throw new Error(`run ディレクトリがありません: ${RAW_STATE_DIR}（先に fetch-a8-ui-csv.mjs を実行）`);
  const dirs = readdirSync(RAW_STATE_DIR)
    .map((n) => join(RAW_STATE_DIR, n))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, "manifest.json")))
    .sort();
  if (dirs.length === 0) throw new Error(`manifest を持つ run がありません: ${RAW_STATE_DIR}`);
  return dirs[dirs.length - 1];
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}

function emptyReportLog(site) {
  return {
    schemaVersion: 2,
    _comment:
      "A8 レポート CSV（fetch-a8-ui-csv.mjs）の正規化 SSOT。A8 は確定処理で過去分が遡及変化するため upsert 運用（最新 fetch が正）。手で編集しない。",
    _siteScopeNote:
      "siteSummary のみ対象サイトに完全分離された実績（真実源）。monthly / daily / programPeriod は **口座横断**（doboku-note 込み）で、programPeriod は programIdMap の allowlist で対象サイト分だけを抽出したもの。crossCheck が siteSummary との突合結果。",
    site,
    updatedAt: null,
    lastRun: null,
    period: null,
    siteSummary: [],
    monthly: [],
    daily: [],
    programPeriod: [],
    crossCheck: null,
    unmapped: [],
    notAttributable: [],
  };
}

function main() {
  const opts = parseArgs();
  const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  const runDir = resolveRunDir(opts);
  const manifest = readJson(join(runDir, "manifest.json"), null);
  if (!manifest) throw new Error(`manifest.json を読めません: ${runDir}`);

  console.log(`run: ${runDir}（collectedAt=${manifest.collectedAt} site=${manifest.site}）`);

  if (manifest.site !== cfg.a8.targetSite) {
    console.error(`manifest の site (${manifest.site}) が config の targetSite (${cfg.a8.targetSite}) と不一致。取り込みを中止します。`);
    process.exit(5);
  }

  const outDir = join(runDir, "normalized");
  mkdirSync(outDir, { recursive: true });

  const log = readJson(REPORT_LOG, emptyReportLog(cfg.a8.targetSite));
  const perReport = [];
  let totalRejects = 0;

  for (const unit of manifest.units || []) {
    if (unit.status !== "downloaded") {
      console.log(`  skip ${unit.reportKey}（status=${unit.status}）`);
      continue;
    }
    const bucket = BUCKET[unit.reportKey];
    if (!bucket) {
      console.warn(`  [warn] 未知の reportKey: ${unit.reportKey}（バケット未定義・スキップ）`);
      continue;
    }
    const decoded = decodeCsvBuffer(readFileSync(unit.rawFile), cfg.a8.csvEncoding);
    const res = normalizeA8Csv(decoded.text, {
      reportKey: unit.reportKey,
      cfg,
      fetchedAt: manifest.collectedAt,
    });
    // 期間は URL で制御できず CSV ファイル名にしか出ないので、行に焼き込んで upsert キーに使う
    const periodRaw = unit.period?.raw ?? null;
    for (const row of res.rows) row.period = periodRaw;

    writeFileSync(join(outDir, `${unit.reportKey}.json`), JSON.stringify({ reportKey: unit.reportKey, encoding: decoded.encoding, headers: res.headers, rows: res.rows }, null, 2), "utf-8");
    const rejPath = join(outDir, `${unit.reportKey}.rejects.json`);
    if (res.rejects.length > 0) {
      writeFileSync(rejPath, JSON.stringify(res.rejects, null, 2), "utf-8");
    } else if (existsSync(rejPath)) {
      // 前回実行の reject が残ると次の監査で「まだ失敗している」と誤検知される
      rmSync(rejPath, { force: true });
    }
    totalRejects += res.rejects.length;

    if (res.fatal) {
      console.error(`  ${unit.reportKey}: FATAL ${res.fatal}（列マッピング要調整・SSOT へは入れない）`);
      perReport.push({ reportKey: unit.reportKey, rows: 0, rejects: res.rejects.length, fatal: res.fatal });
      continue;
    }

    log[bucket.field] = upsertBy(log[bucket.field], res.rows, bucket.key);
    perReport.push({ reportKey: unit.reportKey, rows: res.rows.length, rejects: res.rejects.length, fatal: null });
    console.log(`  ${unit.reportKey}: ${res.rows.length} 行 upsert（reject ${res.rejects.length}）`);
  }

  // 期間: 月次 rollup の根拠は **program-detail の期間**（unit 順に依存させない）。
  // 無ければ site-summary → 任意の順で拾う。
  const unitPeriod = (key) => (manifest.units || []).find((u) => u.reportKey === key)?.period ?? null;
  const period = unitPeriod("program-detail") || unitPeriod("site-summary") || (manifest.units || []).map((u) => u.period).find(Boolean) || null;
  log.period = period;

  // ★ 期間で絞る。log.* は upsert で **過去 run の行を蓄積する**ため、絞らずに突合すると
  //   別期間の値が混ざって「混入の疑い」を誤報し、さらに累計行が当月の実績として
  //   a8-results.json へ書き込まれる（doboku-note 側で 2026-07-28 の単月取得の初回実走・
  //   および 2026-01/02 のバックフィルで実測。移植時にその修正前の版を取り込んでいたため後追いで反映）。
  // 行側は `row.period = unit.period?.raw`（上の正規化ループ）なので raw で揃える
  const currentPeriod = period?.raw ?? null;
  const inCurrentPeriod = (r) => r.period === currentPeriod;

  // ★ 検算: 口座横断から抽出した対象サイト分と、サイト別（真実源）の対象サイト行を突合。
  //   期間を特定できない run（DL 失敗・対象データ 0 件で CSV ボタンが出ない等）では**比較しない**。
  //   ここで全期間を合算すると別期間の値が混ざって誤報になる。
  const allProgramRows = (log.programPeriod || []).filter(inCurrentPeriod);
  let siteRow = null;
  if (currentPeriod == null) {
    log.crossCheck = { comparable: false, reason: "この run では期間を特定できない（有効な CSV が無い）" };
  } else {
    siteRow = (log.siteSummary || [])
      .filter(inCurrentPeriod)
      .find((r) => String(r.site || "").includes(cfg.a8.targetSite));
    const allowlisted = allProgramRows.filter((r) => r.program);
    log.crossCheck = crossCheckAgainstSite(siteRow, allowlisted);
    if (log.crossCheck) log.crossCheck.period = currentPeriod;
  }

  // ★ 3 プログラム (buildjob / kensetsu-jobs / gks) は **両サイトが同じ A8 案件を配信している**ため、
  //   programId の allowlist では stats47 分を分離できない。account-wide レポートのこれらの行は
  //   両サイト合算であり stats47 単独の実績ではない (config `_sharedWithDobokuNote`)。
  //   分離可能な真実源は site-summary の対象サイト行だけ。
  // ★ 取りこぼし検知: 口座横断レポートには doboku-note のプログラムも並ぶので「未写像 = 取りこぼし」ではない。
  //   客観シグナルは **crossCheck の不足分**（サイト別対象サイト行を allowlist で説明しきれていない）。
  //   不足があるときだけ、未写像行から既知 doboku-note を除いた候補を出す。
  const knownOtherSiteIds = (cfg.a8._otherSiteProgramIds?.ids ?? []).filter((k) => typeof k === "string");
  log.missingProgramCandidates = log.crossCheck?.hasShortfall
    ? suggestMissingPrograms(allProgramRows, { knownOtherSiteIds })
    : [];

  // program-detail から a8-results.json（既存スキーマ＝月次）へ rollup。
  // **絞り込み前の全行を渡す**（絞ってから渡すと unmapped 判定が構造上発火しない）。
  const { records, unmapped, notAttributable } = toResultsRecords(allProgramRows, {
    singleMonth: period?.singleMonth ?? null,
  });
  // 未写像の生リスト自体は doboku-note 込みでノイズが大きいので件数だけ持ち、判断材料は candidates に寄せる
  log.unmappedCount = unmapped.length;
  log.unmapped = log.missingProgramCandidates;
  log.notAttributable = notAttributable;
  log.updatedAt = new Date().toISOString();
  log.lastRun = manifest.runId;

  const results = readJson(RESULTS, { records: [] });
  const beforeCount = (results.records || []).length;
  results.schemaVersion = 2;
  results.records = upsertBy(results.records || [], records, KEY.results);
  results.updatedAt = log.updatedAt;
  results.source = "fetch-a8-ui-csv.mjs → normalize-a8-csv.mjs（自動取込。手入力は不要）";

  if (opts.dryRun) {
    console.log("\n[dry-run] SSOT は書き込みません。");
  } else {
    mkdirSync(AFF_DIR, { recursive: true });
    writeFileSync(REPORT_LOG, JSON.stringify(log, null, 2) + "\n", "utf-8");
    writeFileSync(RESULTS, JSON.stringify(results, null, 2) + "\n", "utf-8");
  }

  console.log(`\nSSOT: ${REPORT_LOG}（期間 ${period?.raw ?? "不明"}）`);
  console.log(
    `  siteSummary=${log.siteSummary.length} monthly=${log.monthly.length} daily=${log.daily.length} programPeriod=${log.programPeriod.length}`,
  );
  if (siteRow) {
    console.log(
      `  ${cfg.a8.targetSite}: click=${siteRow.clicks} 発生=${siteRow.conversions} 発生額=${siteRow.grossRevenueYen} 確定=${siteRow.approved} 確定額=${siteRow.revenueYen} キャンセル=${siteRow.cancelledCount}`,
    );
  } else {
    console.warn(`  [警告] サイト別レポートに ${cfg.a8.targetSite} 行が無い＝分離された実績を取れていない`);
  }
  if (log.crossCheck?.comparable) {
    const d = log.crossCheck.deltas;
    console.log(
      `  検算（allowlist 抽出 vs サイト別）: click ${d.clicks.picked}/${d.clicks.site} · 確定額 ${d.revenueYen.picked}/${d.revenueYen.site}` +
        (log.crossCheck.exceeded ? "  ← ★超過＝他サイト混入の疑い" : "  ← 範囲内"),
    );
  }
  console.log(`SSOT: ${RESULTS} records ${beforeCount} → ${results.records.length}`);
  if (notAttributable.length > 0) {
    console.warn(
      `\n[注意] 対象期間が単月でないため ${notAttributable.length} 件を a8-results.json（月次）へ写していません。` +
        `\n  現在の期間: ${period?.raw ?? "不明"}。月次内訳には期間フォーム対応が必要（backlog 参照）。`,
    );
  }
  if (log.crossCheck?.hasShortfall) {
    const sf = log.crossCheck.shortfall;
    console.warn(
      `\n[要対応] サイト別の ${cfg.a8.targetSite} を allowlist で説明しきれていません` +
        `（不足 click ${sf.clicks ?? "-"} / 確定額 ${sf.revenueYen ?? "-"}）＝未登録プログラムの疑い。候補:`,
    );
    for (const c of log.missingProgramCandidates) {
      console.warn(`  - ${c.programId} "${c.programRaw.slice(0, 40)}" click=${c.clicks} 発生額=${c.grossRevenueYen}`);
    }
    console.warn(`  → 自社のものなら ${CONFIG_PATH} の a8.programIdMap に追記して再実行してください。`);
  } else {
    console.log(
      `  取りこぼし: なし（サイト別を allowlist で説明できている。口座横断の未写像 ${unmapped.length} 件は他サイト分）`,
    );
  }
  if (totalRejects > 0) console.warn(`[要確認] reject 行 ${totalRejects} 件（normalized/*.rejects.json）`);
  if (perReport.some((r) => r.fatal)) process.exitCode = 4;
}

// import された時点で実行されないよう、直接実行時のみ main() を呼ぶ
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, "/").includes("normalize-a8-csv.mjs");
if (isDirectRun) {
  try {
    main();
  } catch (e) {
    console.error("Fatal:", e?.message || e);
    process.exit(1);
  }
}
