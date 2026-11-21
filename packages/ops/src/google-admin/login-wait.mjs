/**
 * login-wait — `cli.mjs login --wait` の待ち方と判定。
 *
 * Google のログインは人が通常の Chrome で行う (パスワード・2 段階認証・パスキーを自動化しない。README「実行境界」)。
 * ここは、その Chrome が閉じられるのを待ち、閉じたあとに専用プロファイルの認証 cookie の有無を確かめるだけ。
 * cookie は名前と期限だけを読む (session-preflight.mjs の runPreflight。値は読まない)。
 *
 * Chrome は起動中、プロファイルに SingletonLock を置き、終了すると消す (native-profile.mjs と同じ見方)。
 * 新しい認証 cookie は Chrome を閉じるまでディスクに書かれないことがあるので、閉じてから読む。
 */
import { lstatSync } from 'node:fs';
import { join } from 'node:path';

export const APPEAR_TIMEOUT_MS = 60_000;
export const CLOSE_TIMEOUT_MS = 600_000;
const POLL_MS = 2_000;

/** SingletonLock は壊れた symlink のこともあるので lstat で見る */
export function profileOpen(profileDir, lstat = lstatSync) {
  try { lstat(join(profileDir, 'SingletonLock')); return true; } catch { return false; }
}

/**
 * Chrome が開いて閉じられるまで待つ。
 * @returns {Promise<'closed' | 'never_opened' | 'timeout'>}
 */
export async function waitForProfileClosed(profileDir, {
  isOpen = (dir) => profileOpen(dir), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now,
  appearMs = APPEAR_TIMEOUT_MS, closeMs = CLOSE_TIMEOUT_MS,
} = {}) {
  const appearBy = now() + appearMs;
  while (!isOpen(profileDir)) {
    if (now() >= appearBy) return 'never_opened';
    await sleep(POLL_MS);
  }
  const closeBy = now() + closeMs;
  while (isOpen(profileDir)) {
    if (now() >= closeBy) return 'timeout';
    await sleep(POLL_MS);
  }
  return 'closed';
}

/** 事前確認の結果から GSC の行を取り出し、使えるか (有効・期限が近い) を返す */
export function gscSession(preflight) {
  const row = preflight.sources.find((s) => s.source === 'gsc');
  if (!row) return { usable: false, state: 'missing', reason: 'auth-credentials.json の sessions に gsc が無い' };
  return { usable: row.state === 'valid' || row.state === 'expiring', state: row.state, reason: row.reason };
}
