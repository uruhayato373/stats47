import test from "node:test";
import assert from "node:assert/strict";
import { latestRouting, triageAlerts, formatTriage } from "../lib/alert-triage.mjs";

const marker = "→ 振り分け:";
const now = new Date("2026-10-10T00:00:00Z");
const ids = new Set(["DEPS-NEXT16-UPGRADE-01", "EXP-006"]);
const issue = (number, createdAt, comments = []) => ({ number, title: `alert ${number}`, createdAt, comments });

test("14 日を過ぎて振り分けの無いアラートは未振り分け、期限内は fresh", () => {
  const rows = triageAlerts([issue(1, "2026-09-01T00:00:00Z"), issue(2, "2026-10-05T00:00:00Z")], { now, staleDays: 14, marker, ids });
  assert.deepEqual(rows.map((r) => [r.number, r.status]), [[1, "unrouted"], [2, "fresh"]]);
});

test("コメントの実在するカード ID・#Issue・見送りは振り分け済み、実在しない ID は行き先の誤り", () => {
  const rows = triageAlerts(
    [
      issue(1, "2026-08-01T00:00:00Z", [{ body: "調べた。\n→ 振り分け: DEPS-NEXT16-UPGRADE-01", createdAt: "2026-10-09T00:00:00Z" }]),
      issue(2, "2026-08-01T00:00:00Z", [{ body: "→ 振り分け: 見送り (誤検知。閾値を直すまで)", createdAt: "2026-10-09T00:00:00Z" }]),
      issue(3, "2026-08-01T00:00:00Z", [{ body: "→ 振り分け: NO-SUCH-CARD-01", createdAt: "2026-10-09T00:00:00Z" }]),
    ],
    { now, staleDays: 14, marker, ids },
  );
  assert.deepEqual(rows.map((r) => [r.number, r.status]), [[1, "routed"], [2, "routed"], [3, "bad-route"]]);
  assert.match(rows[2].problem, /unknown-id:NO-SUCH-CARD-01/);
});

test("振り分けは最新のコメントを採る (古い振り分けを新しい判断で上書きできる)", () => {
  const r = latestRouting(
    [
      { body: "→ 振り分け: DEPS-NEXT16-UPGRADE-01", createdAt: "2026-10-01T00:00:00Z" },
      { body: "→ 振り分け: #1119", createdAt: "2026-10-09T00:00:00Z" },
    ],
    marker,
  );
  assert.deepEqual(r.routes, ["#1119"]);
});

test("振り分けの無い本文 (workflow が書き換える) は数えず、error 件数と直し方を出す", () => {
  const rows = triageAlerts([{ number: 9, title: "x", createdAt: "2026-08-01T00:00:00Z", body: "→ 振り分け: EXP-006", comments: [] }], { now, staleDays: 14, marker, ids });
  assert.equal(rows[0].status, "unrouted");
  const { body, errors } = formatTriage(rows, { staleDays: 14, marker });
  assert.equal(errors, 1);
  assert.match(body, /#9/);
  assert.match(body, /コメントに書く/);
});
