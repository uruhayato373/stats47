#!/usr/bin/env node
/**
 * 日次生成 routine の「期間限定 boost」を解決する。
 *
 * ★何のためにあるか (2026-08-06)
 * Max プランの週次リミットは使い切らなければ捨てるだけで、翌週へ繰り越されない。
 * オーナー不在の週は対話利用がほぼゼロになるので、その余剰を ai-content の全件完成
 * (残り約 1,959 件・通常ペースで完了見込み 516 日) に振り向けたい。
 *
 * ★なぜ workflow の LIMIT を直接書き換えないか
 * 不在中に自分で戻せないため、**設定が自動で失効すること**が要件になる。期限を持つ
 * 設定ファイルにしておけば、書き忘れても `until` を過ぎた瞬間に baseline へ戻る。
 * この repo の `expected-shape-anomaly.ts` の `until` と同じ考え方。
 *
 * ★件数と回数のどちらで増やすか (実測)
 * `.claude/state/metrics/claude-usage/history.csv` の ai-content 完走 run:
 *   limit 1 → 24 分 / $15.87      (1 件 24.0 分 / $15.87)
 *   limit 5 → 58 分 / $30.80      (1 件 11.6 分 / $6.16)
 *   limit 10 → 169 分 / 213 分     (1 件 16.9〜21.3 分 / $11〜12)
 * **1 回あたりの固定費 ≈ 15 分 / $12** (起動時に CLAUDE.md と rules を読む分。cache_read が
 * 毎回 1,000〜1,500 万トークンあることと符合する) があるので 1 件ずつ回すのは無駄。一方、
 * バッチを大きくすると 1 件あたりが**悪化する** — 同じ context で直列に処理するほど会話が
 * 長くなるため。limit 10 では 213 分の run が出て job timeout 240 分に届き、打ち切られた回もある。
 * したがって最小は「1 件ずつ」ではなく、最良は「入るだけ大きく」でもない。**実測で完走できる
 * 大きさ (= 5 件) を 5 時間枠ごとに 1 回**が最適で、産出を増やすときは件数ではなくスロット数を増やす。
 *
 * ★測れないこと
 * cost_usd は「API で課金したら幾らか」の換算値で、Pro / Max の枠消費率とは対応しない
 * (正典: .claude/state/metrics/claude-usage/README.md)。枠に当たったことは
 * **失敗からしか観測できない**ので、連続失敗で boost を落とすブレーカーを持つ。
 *
 * ★不変条件
 *   - 設定ファイルが無い = boost なし (これが通常状態。静かに baseline)
 *   - 設定が壊れている   = baseline は通す / boost スロットは失敗させる
 *     (add-on の設定ミスで中核ループを止めない。かつ 1 日 3 回赤くなるので見逃さない)
 *   - 期限切れ           = boost なし (自動失効)
 *   - 連続失敗           = boost なし (枠に当たった後の空回りを止める)
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * boost が指定できる件数の上限。workflow 側の入力検証と揃える。
 *
 * ★10 → 5 (2026-08-11)。バッチを大きくするほど 1 件あたりが悪化することが実測で確定した:
 * limit 5 = 11.6 分/$6.16 に対し limit 10 = 16.9〜21.3 分/$11〜12。さらに limit 10 では
 * 213 分の run が出て job timeout 240 分に届き、4 スロット中 2 つが 0 件で打ち切られた。
 * 遠隔から上げられるノブなので、上限そのものを実測が保証する範囲に下げる。
 * 産出を増やしたいときは件数ではなく extraCrons のスロット数を増やす。
 */
export const MAX_LIMIT = 5;
/** ブレーカーの既定値。直近この回数が連続で失敗していたら boost を落とす。 */
export const DEFAULT_MAX_CONSECUTIVE_FAILURES = 2;

export class BoostConfigError extends Error {}

function requireIsoInstant(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BoostConfigError(`${field} は ISO 8601 文字列が必須`);
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new BoostConfigError(`${field} を日時として解釈できない: ${value}`);
  // オフセット無しの文字列は実行環境の TZ 解釈に依存する。runner は UTC・オーナーは JST なので
  // 曖昧なまま通すと「いつ切れるか」が環境で変わる。明示を必須にする。
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(value.trim())) {
    throw new BoostConfigError(`${field} にタイムゾーンを明示する (例 2026-08-09T19:00:00+09:00): ${value}`);
  }
  return ms;
}

function requireLimit(value, field) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new BoostConfigError(`${field} は 1..${MAX_LIMIT} の整数が必須: ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * 設定 JSON を検証して正規化する。壊れていれば投げる (握り潰さない)。
 */
export function parseBoostConfig(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new BoostConfigError(`JSON として読めない: ${error.message}`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BoostConfigError('トップレベルはオブジェクトが必須');
  }

  const from = requireIsoInstant(raw.from, 'from');
  const until = requireIsoInstant(raw.until, 'until');
  if (!(from < until)) throw new BoostConfigError('from は until より前でなければならない');

  if (typeof raw.reason !== 'string' || raw.reason.trim().length < 10) {
    // 期限付きの例外を無説明で置かない (expected-shape-anomaly と同じ規律)
    throw new BoostConfigError('reason に、なぜこの期間だけ増やすのかを書く');
  }

  const ai = raw.aiContent;
  if (ai === null || typeof ai !== 'object' || Array.isArray(ai)) {
    throw new BoostConfigError('aiContent オブジェクトが必須');
  }
  const limit = requireLimit(ai.limit, 'aiContent.limit');

  const extraCrons = ai.extraCrons;
  if (!Array.isArray(extraCrons) || extraCrons.some((c) => typeof c !== 'string' || !c.trim())) {
    throw new BoostConfigError('aiContent.extraCrons は cron 文字列の配列が必須 (空配列 = 追加実行なし)');
  }

  const maxConsecutiveFailures =
    raw.maxConsecutiveFailures === undefined
      ? DEFAULT_MAX_CONSECUTIVE_FAILURES
      : raw.maxConsecutiveFailures;
  if (!Number.isInteger(maxConsecutiveFailures) || maxConsecutiveFailures < 1) {
    throw new BoostConfigError('maxConsecutiveFailures は 1 以上の整数が必須');
  }

  return {
    reason: raw.reason,
    from,
    until,
    aiContent: { limit, extraCrons: extraCrons.map((c) => c.trim()) },
    maxConsecutiveFailures,
  };
}

/** ファイルから読む。**無い = boost なし**（例外にしない。これが通常状態）。 */
export function loadBoostConfig(file) {
  if (!existsSync(file)) return null;
  return parseBoostConfig(readFileSync(file, 'utf8'));
}

export function isWithinWindow(config, nowMs) {
  return config !== null && nowMs >= config.from && nowMs <= config.until;
}

/**
 * history.csv の末尾から、その workflow の連続失敗数を数える。
 *
 * CSV は追記専用なので行順 = 実行順として扱える (record-claude-usage.mjs)。
 * 失敗 run も記録されるので「枠に当たって空回りしている」状態がここに出る。
 */
export function failureStreak(csvText, workflow) {
  const lines = String(csvText ?? '').trim().split('\n');
  if (lines.length < 2) return 0;
  const header = lines[0].split(',');
  const wfIdx = header.indexOf('workflow');
  const errIdx = header.indexOf('is_error');
  if (wfIdx === -1 || errIdx === -1) return 0;

  let streak = 0;
  for (let i = lines.length - 1; i >= 1; i -= 1) {
    const cols = lines[i].split(',');
    if (cols[wfIdx] !== workflow) continue;
    if (cols[errIdx] === '1') streak += 1;
    else break;
  }
  return streak;
}

/**
 * この実行を走らせるか、何件でやるかを決める。純粋関数。
 *
 * @returns {{run: boolean, limit: number, dryRun: boolean, boostActive: boolean, reason: string}}
 */
export function decide({
  workflow,
  eventName,
  cron = '',
  baselineCron,
  defaultLimit,
  config,
  nowMs,
  historyCsv = '',
  requestLimit = null,
  requestDryRun = null,
  requestDefaultLimit = null,
  inputLimit = null,
  inputDryRun = null,
}) {
  // schedule 以外 (手動 dispatch / cloud からの request push) は boost の対象外。
  // 明示操作なので、そのとき指定された件数をそのまま使う。
  if (eventName !== 'schedule') {
    // push request が件数を省いたときの既定は baseline と別にできる
    // (cloud からの試し打ちは小さく始めたいため、歴史的に 1 件)
    const fallback = eventName === 'push' ? (requestDefaultLimit ?? defaultLimit) : defaultLimit;
    const limit = requestLimit ?? inputLimit ?? fallback;
    const dryRun = requestDryRun ?? inputDryRun ?? false;
    return {
      run: true,
      limit,
      dryRun,
      boostActive: false,
      reason: `${eventName} は boost 非対象 (limit=${limit})`,
    };
  }

  const isBaseline = cron === baselineCron;
  const inWindow = isWithinWindow(config, nowMs);
  const streak = inWindow ? failureStreak(historyCsv, workflow) : 0;
  const tripped = inWindow && streak >= config.maxConsecutiveFailures;
  const boostActive = inWindow && !tripped;

  if (isBaseline) {
    const limit = boostActive ? config.aiContent.limit : defaultLimit;
    let reason;
    if (boostActive) reason = `boost 適用 (limit=${limit})`;
    else if (tripped) reason = `ブレーカー作動: 直近 ${streak} 回連続失敗のため baseline へ戻す (limit=${limit})`;
    else if (config === null) reason = `boost 設定なし (limit=${limit})`;
    else reason = `boost 期間外 (limit=${limit})`;
    return { run: true, limit, dryRun: false, boostActive, reason };
  }

  // 追加スロットは boost 期間中だけ動く。期間外はここで静かに終える。
  if (!boostActive) {
    const reason = tripped
      ? `追加スロットを skip: 直近 ${streak} 回連続失敗`
      : '追加スロットを skip: boost 期間外';
    return { run: false, limit: defaultLimit, dryRun: false, boostActive: false, reason };
  }
  if (!config.aiContent.extraCrons.includes(cron)) {
    return {
      run: false,
      limit: defaultLimit,
      dryRun: false,
      boostActive: true,
      reason: `追加スロットを skip: extraCrons に "${cron}" が無い`,
    };
  }
  return {
    run: true,
    limit: config.aiContent.limit,
    dryRun: false,
    boostActive: true,
    reason: `boost の追加スロット (${cron} / limit=${config.aiContent.limit})`,
  };
}

/**
 * boost 期間中の実績を集計する。「使用量が多いか」を 1 目で判断するための行。
 * 枠の消費率は測れないので、**回数・件数・失敗数**という観測できるものだけ出す。
 */
export function summarizeBoostUsage(csvText, workflow, config) {
  const lines = String(csvText ?? '').trim().split('\n');
  if (lines.length < 2 || config === null) return { runs: 0, items: 0, failures: 0 };
  const header = lines[0].split(',');
  const idx = (name) => header.indexOf(name);
  const [dIdx, wIdx, iIdx, eIdx] = [idx('date'), idx('workflow'), idx('items'), idx('is_error')];
  if ([dIdx, wIdx, iIdx, eIdx].some((i) => i === -1)) return { runs: 0, items: 0, failures: 0 };

  // date 列は日付だけなので、from の当日以降を対象にする (時刻までは絞れない)
  const fromDate = new Date(config.from).toISOString().slice(0, 10);
  let runs = 0;
  let items = 0;
  let failures = 0;
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    if (cols[wIdx] !== workflow) continue;
    if (cols[dIdx] < fromDate) continue;
    runs += 1;
    items += Number(cols[iIdx]) || 0;
    if (cols[eIdx] === '1') failures += 1;
  }
  return { runs, items, failures };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function readJsonField(file, field) {
  if (!existsSync(file)) return null;
  try {
    const v = JSON.parse(readFileSync(file, 'utf8'))[field];
    return v === undefined ? null : v;
  } catch {
    return null;
  }
}

function main() {
  const workflow = arg('workflow');
  if (!workflow) {
    console.error('--workflow は必須');
    process.exit(1);
  }
  const configFile = arg('config', '.claude/config/content-generation-boost.json');
  const historyFile = arg('history', '.claude/state/metrics/claude-usage/history.csv');
  const eventName = arg('event', 'schedule');
  const cron = arg('cron');
  const baselineCron = arg('baseline-cron');
  const defaultLimit = Number(arg('default-limit', '5'));
  const nowMs = arg('now') ? Date.parse(arg('now')) : Date.now();
  const requestFile = arg('request');

  let config = null;
  let configError = null;
  try {
    config = loadBoostConfig(configFile);
  } catch (error) {
    configError = error;
  }

  // 設定が壊れているとき、baseline は通し、追加スロットは落とす。
  // add-on の設定ミスで中核ループを止めない一方、1 日 3 回赤くなるので見逃さない。
  if (configError) {
    console.log(`::error::boost 設定が不正 (${configFile}): ${configError.message}`);
    if (eventName === 'schedule' && cron !== baselineCron) process.exit(1);
  }

  const historyCsv = existsSync(historyFile) ? readFileSync(historyFile, 'utf8') : '';
  const decision = decide({
    workflow,
    eventName,
    cron,
    baselineCron,
    defaultLimit,
    config,
    nowMs,
    historyCsv,
    requestLimit: requestFile ? readJsonField(requestFile, 'limit') : null,
    requestDryRun: requestFile ? readJsonField(requestFile, 'dryRun') : null,
    requestDefaultLimit: arg('request-default-limit') ? Number(arg('request-default-limit')) : null,
    inputLimit: arg('input-limit') ? Number(arg('input-limit')) : null,
    inputDryRun: arg('input-dry-run') ? arg('input-dry-run') === 'true' : null,
  });

  if (!Number.isInteger(decision.limit) || decision.limit < 1 || decision.limit > MAX_LIMIT) {
    console.log(`::error::解決した件数が範囲外: ${decision.limit}`);
    process.exit(1);
  }

  const usage = summarizeBoostUsage(historyCsv, workflow, config);
  const lines = [
    `run=${decision.run}`,
    `limit=${decision.limit}`,
    `dry_run=${decision.dryRun}`,
    `boost=${decision.boostActive}`,
  ];
  console.log(`判定: ${decision.reason}`);
  if (config) {
    const win = `${new Date(config.from).toISOString()} 〜 ${new Date(config.until).toISOString()}`;
    console.log(`boost 期間 (UTC): ${win}`);
    console.log(`boost 開始以降の実績: ${usage.runs} 回 / ${usage.items} 件 / 失敗 ${usage.failures} 回`);
  }

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(out, `${lines.join('\n')}\n`);
  }
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    const body = [
      '### 生成 routine の判定',
      '',
      `- ${decision.reason}`,
      config
        ? `- boost 開始以降: **${usage.runs} 回 / ${usage.items} 件 / 失敗 ${usage.failures} 回**`
        : '- boost 設定なし (baseline)',
      config ? `- 期間: ${new Date(config.from).toISOString()} 〜 ${new Date(config.until).toISOString()}` : '',
      '',
      '件数・回数を変えるには `.claude/config/content-generation-boost.json` を develop に push する',
      '(次のスケジュール実行から反映。dispatch は不要)。',
      '',
    ].filter(Boolean);
    appendFileSync(summary, `${body.join('\n')}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
