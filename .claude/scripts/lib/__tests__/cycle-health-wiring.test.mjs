// CYCLE-HEALTH-01: summarizeFlow が .claude の buildFlow (backlog-waits-core.cjs) と同じ数を返す。
// packages は .claude の部品を読まないので、実物の buildFlow を渡す確かめは基盤のテストに置く
// 年カバレッジのカードに書く .claude の CLI のコマンドも、.claude の入口 (sync-year-coverage-backlog.mjs) が渡す形で確かめる。
// (packages/ops/src/{metrics,data}/__tests__/{cycle-health,year-coverage-backlog}.test.mjs から分けた。assert は変えていない)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { summarizeFlow } from "../../../../packages/ops/src/metrics/lib/cycle-health.mjs";
import { planYearCoverageCard } from "../../../../packages/ops/src/data/lib/year-coverage-backlog.mjs";

const row = (key, configYears, estatNonNullYears, verdict = "extend-candidate") => ({
  key, statsDataId: "0000010101", configYears, estatNonNullYears, verdict,
  availableYearCodes: Array.from({ length: estatNonNullYears }, (_, i) => String(2000 + i)),
});
const commands = {
  gate: "npx tsx .claude/scripts/data/assert-year-coverage-batch.ts",
  sync: "node .claude/scripts/data/sync-year-coverage-backlog.mjs",
};

const { buildFlow } = createRequire(import.meta.url)("../../backlog-loop/backlog-waits-core.cjs");

test("起票と閉じた数は today を含む週だけを数え、backlog の総枚数を目安と比べる (backlog:waits flow と同じ数)", async () => {
  const { createRequire } = await import("node:module");
  const { parseAnnual, parseBacklog } = createRequire(import.meta.url)("../../../../packages/ops/src/management/backlog-lib.cjs");
  const backlogCards = parseBacklog([
    "## 🟡 中",
    "### [NEW-01] 今週起票",
    "タグ: [収益化] [起票:2026-11-11]",
    "### [OLD-01] 先週起票",
    "タグ: [収益化] [起票:2026-11-08]",
    "### [NEW-02] 今週起票",
    "タグ: [収益化] [起票:2026-11-15]",
  ].join("\n"));
  const annualCards = parseAnnual("## 2026-12\n\n### [ANNUAL-01] 年間計画で今週起票\nタグ: [収益化] [起票:2026-11-10] [期日:2026-12-01]");
  const ledgerItems = {
    "DONE-01": { status: "completed", completedAt: "2026-11-12T00:00:00.000Z" },
    "DONE-02": { status: "completed", completedAt: "2026-11-07T00:00:00.000Z" },
    "OPEN-01": { status: "open", completedAt: "2026-11-12T00:00:00.000Z" },
  };
  const flow = summarizeFlow({ buildFlow, backlogCards, annualCards, ledgerItems, today: "2026-11-14", target: 2 });
  assert.deepEqual(flow, { week: "2026-W46", filed: 3, closed: 1, total: 3, target: 2, overTarget: true });
  assert.equal(summarizeFlow({ buildFlow, backlogCards, annualCards: [], ledgerItems: {}, today: "2026-11-14" }).overTarget, false, "既定の目安は 200 枚");
});

test("年数差の大きい順に 10 件まで、単年確定と by-design は載せない", () => {
  const results = Object.fromEntries([
    row("small-gap", 1, 2), row("big-gap", 1, 40), row("confirmed", 1, 1, "confirmed-single-year"), row("skipped", 1, 30),
    ...Array.from({ length: 12 }, (_, i) => row(`mid-${String(i).padStart(2, "0")}`, 1, 5)),
  ].map((r) => [r.key, r]));
  const card = planYearCoverageCard({ results, openIds: [], byDesign: { skipped: { note: "定義替え" } }, today: "2026-09-26", commands });
  assert.equal(card.id, "YEAR-COV-20260926");
  assert.equal(card.keys.length, 10);
  assert.equal(card.keys[0], "big-gap");
  assert.ok(!card.keys.includes("confirmed") && !card.keys.includes("skipped") && !card.keys.includes("small-gap"));
  assert.match(card.markdown, /\[検証:npx tsx .claude\/scripts\/data\/assert-year-coverage-batch.ts /);
});
