/**
 * 保存済みセッションの事前確認 (session-preflight.mjs) の状態の語彙と結果の置き場。
 * 管理画面 apps/admin もこれを import するので、node の API (fs・child_process) と相対 URL の解決を持たない。
 */
export const PREFLIGHT_DIR = '.local/session-preflight';
export const PREFLIGHT_FILE = `${PREFLIGHT_DIR}/latest.json`;
/** 通知・要対応に数える状態 */
export const ALERT_STATES = new Set(['expiring', 'expired', 'autologin_failed']);
export const STATE_LABELS = {
  valid: '有効', expiring: '期限が近い', expired: '切れている', autologin_failed: '自動ログイン失敗の印あり', unknown: '確認できない',
};

/** ISO 時刻を日本時間の YYYY-MM-DD HH:mm にする */
export function formatJst(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return new Date(t + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' ');
}
