import "server-only";

import {
  ALERT_STATES,
  PREFLIGHT_FILE,
  STATE_LABELS,
  formatJst,
} from "../../../../.claude/scripts/measurement/session-states.mjs";
import { fileExists, readJson, wrap } from "./state-io";

/**
 * 保存済みセッションの事前確認の最新結果 (読み取り専用)。書き手は launchd の scripts/scheduled/session-preflight.sh
 * (`.claude/scripts/measurement/session-preflight.mjs --write`)。管理画面はブラウザもプロファイルも開かず、この JSON だけを読む。
 * 結果が無ければ ran: false (画面は「未実行」)。
 */
export type SessionState = "valid" | "expiring" | "expired" | "autologin_failed" | "unknown";

export interface SessionPreflightRow {
  source: string;
  label: string;
  state: SessionState;
  stateLabel: string;
  /** 期限が近い・切れている・失敗印あり */
  needsAction: boolean;
  reason: string;
  /** 日本時間の YYYY-MM-DD HH:mm。期限を読めないものは null */
  expiresJst: string | null;
  lastSuccessJst: string | null;
  failedJst: string | null;
  recovery: string | null;
}

export type SessionPreflightView =
  | { ran: false; file: string }
  | { ran: true; file: string; generatedAt: string; warnDays: number; rows: SessionPreflightRow[] };

interface RawSource {
  source: string;
  label: string;
  state: string;
  reason: string;
  expiresAt: string | null;
  lastSuccessAt: string | null;
  failedAt: string | null;
  recovery: string | null;
}

const LABELS = STATE_LABELS as Record<SessionState, string>;
const ALERTS = ALERT_STATES as Set<string>;
const jst = (iso: string | null) => (iso ? (formatJst(iso) as string) : null);

export function sessionPreflight() {
  return wrap((): SessionPreflightView => {
    const file = PREFLIGHT_FILE as string;
    if (!fileExists(file)) return { ran: false, file };
    const raw = readJson<{ generatedAt: string; warnDays: number; sources: RawSource[] }>(file);
    if (!Array.isArray(raw.sources)) throw new Error(`${file} の sources が配列でない`);
    const rows = raw.sources.map((s): SessionPreflightRow => {
      const state = (s.state in LABELS ? s.state : "unknown") as SessionState;
      return {
        source: s.source,
        label: s.label,
        state,
        stateLabel: LABELS[state],
        needsAction: ALERTS.has(state),
        reason: s.reason,
        expiresJst: jst(s.expiresAt),
        lastSuccessJst: jst(s.lastSuccessAt),
        failedJst: jst(s.failedAt),
        recovery: s.recovery,
      };
    });
    return { ran: true, file, generatedAt: raw.generatedAt, warnDays: raw.warnDays, rows };
  });
}
