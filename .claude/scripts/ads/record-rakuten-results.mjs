#!/usr/bin/env node
/**
 * record-rakuten-results.mjs — 楽天アフィリエイトの成果を、管理画面で見た値のまま月単位で記録する。
 *
 * 楽天アフィリエイトには成果を取る API が無く (アプリ ID / Access Key は商品検索用)、自動ログインもしない。
 * 週次レビュー (/weekly-review) でオーナーが管理画面の成果レポートを開き、この CLI で記録する。
 * 週次 Issue の「週次収益 (NSM)」は nsm-revenue-lines.mjs の rakutenLine がこの記録を読む。
 * 記録が無い・古いときは 0 円ではなく判定不能になる。
 *
 * 記録先: data/affiliate/rakuten-results.json (同じ月は上書き。observedAt は記録した時刻)
 *
 * Usage:
 *   npm run rakuten:record -- --month 2026-10 --orders 3 --estimated-yen 420 [--confirmed-yen 0]
 *     --orders         … 成果件数 (発生)
 *     --estimated-yen  … 成果報酬 (発生・見込み) の円
 *     --confirmed-yen  … 確定報酬の円。まだ確定していない月は省略する (null として記録)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const RAKUTEN_RESULTS_PATH = 'data/affiliate/rakuten-results.json';

/** 引数を検査して 1 か月分の記録にする。不正なら Error を投げる。 */
export function parseRecord(argv, now = new Date()) {
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i < 0 ? undefined : argv[i + 1];
  };
  const month = value('--month');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? '')) throw new Error('--month は YYYY-MM');
  const int = (flag, required) => {
    const raw = value(flag);
    if (raw === undefined) {
      if (required) throw new Error(`${flag} が必要`);
      return null;
    }
    if (!/^\d+$/.test(raw)) throw new Error(`${flag} は 0 以上の整数`);
    return Number(raw);
  };
  return {
    month,
    orders: int('--orders', true),
    estimatedYen: int('--estimated-yen', true),
    confirmedYen: int('--confirmed-yen', false),
    observedAt: now.toISOString(),
    source: 'manual:rakuten-affiliate-dashboard',
  };
}

/** 既存の記録へ月単位で上書きして、月の昇順で返す。 */
export function upsertRecord(results, record) {
  const records = (Array.isArray(results?.records) ? results.records : []).filter((r) => r.month !== record.month);
  return { schemaVersion: 1, records: [...records, record].sort((a, b) => a.month.localeCompare(b.month)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const record = parseRecord(process.argv.slice(2));
    const path = join(ROOT, RAKUTEN_RESULTS_PATH);
    const current = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(upsertRecord(current, record), null, 2) + '\n');
    const confirmed = record.confirmedYen == null ? '未確定' : `¥${record.confirmedYen.toLocaleString('ja-JP')}`;
    console.log(`[rakuten] ${record.month}: 発生 ${record.orders} 件・¥${record.estimatedYen.toLocaleString('ja-JP')} / 確定 ${confirmed} を記録 → ${RAKUTEN_RESULTS_PATH}`);
  } catch (error) {
    console.error(`[rakuten] ${error.message}\nUsage: npm run rakuten:record -- --month YYYY-MM --orders N --estimated-yen N [--confirmed-yen N]`);
    process.exit(2);
  }
}
