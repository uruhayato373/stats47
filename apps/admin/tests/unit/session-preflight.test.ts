import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * /ops/auth の「保存済みセッション」。launchd の session-preflight.sh が書く .local/session-preflight/latest.json を読むだけ。
 * ★結果が無いときは「未実行」(ran: false) で、空の表や「すべて有効」に見せない。
 * ★日付は日本時間で出す (UTC の ISO 先頭をそのまま出すと、日本時間の朝が前日に見える)。
 */
const FILE = ".local/session-preflight/latest.json";
const RESULT = JSON.stringify({
  schemaVersion: 1,
  generatedAt: "2026-11-14T00:00:00.000Z",
  warnDays: 3,
  sources: [
    { source: "x", label: "X", state: "expiring", reason: "期限まで 3 日以内", expiresAt: "2026-11-15T20:30:00.000Z",
      lastSuccessAt: "2026-11-12T23:10:00.000Z", failedAt: null, recovery: "node .claude/scripts/measurement/refresh-session.mjs x --wait-human" },
    { source: "note", label: "note", state: "autologin_failed", reason: "前回の自動ログインが失敗", expiresAt: null,
      lastSuccessAt: null, failedAt: "2026-11-08T00:00:00.000Z", recovery: "node .claude/scripts/measurement/refresh-session.mjs note --wait-human" },
    { source: "afb", label: "afb", state: "unknown", reason: "headless を拒否する", expiresAt: null, lastSuccessAt: null, failedAt: null, recovery: null },
    { source: "kdp", label: "KDP", state: "valid", reason: "期限内", expiresAt: "2027-11-07T23:20:05.052Z", lastSuccessAt: null, failedAt: null, recovery: "r" },
  ],
});

async function load(root: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import("@/lib/server/session-preflight");
}

describe("session preflight (admin)", () => {
  let root: string;
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
    if (root) cleanupFixtureRoot(root);
  });

  it("結果の JSON が無ければ 未実行 を返す", async () => {
    root = makeFixtureRoot();
    const { sessionPreflight } = await load(root);
    expect(sessionPreflight()).toEqual({ ran: false, file: FILE });
  });

  it("取得元ごとの状態・期限・最後に成功した取得・復旧を日本時間で返し、要対応を印す", async () => {
    root = makeFixtureRoot({ stateFiles: { [FILE]: RESULT } });
    const { sessionPreflight } = await load(root);
    const v = sessionPreflight() as Extract<ReturnType<typeof sessionPreflight>, { ran: true }>;
    expect(v.ran).toBe(true);
    expect(v.rows.map((r) => [r.source, r.stateLabel, r.needsAction])).toEqual([
      ["x", "期限が近い", true],
      ["note", "自動ログイン失敗の印あり", true],
      ["afb", "確認できない", false],
      ["kdp", "有効", false],
    ]);
    // 2026-11-15T20:30Z は日本時間で 11-16 05:30
    expect(v.rows[0]).toMatchObject({ expiresJst: "2026-11-16 05:30", lastSuccessJst: "2026-11-13 08:10" });
    expect(v.rows[0].recovery).toContain("refresh-session.mjs x --wait-human");
    expect(v.rows[1]).toMatchObject({ expiresJst: null, failedJst: "2026-11-08 09:00" });
  });

  it("形の壊れた JSON は throw せず error に畳む", async () => {
    root = makeFixtureRoot({ stateFiles: { [FILE]: JSON.stringify({ generatedAt: "x" }) } });
    const { sessionPreflight } = await load(root);
    expect(sessionPreflight()).toHaveProperty("error");
  });
});
