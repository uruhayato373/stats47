/**
 * decideOutcome のテスト。
 *
 * 2026-07-30 の障害 (OK 0 / FAIL 40 なのに workflow が success) の再発防止。
 * 「1 件も出せなければ落ちる」「部分的な失敗では落ちない」の両方を固定する。
 *
 * 実行: npm run test:ai-content --workspace apps/web
 */

import { describe, expect, it } from "vitest";

import { decideOutcome, type GenerationCounters } from "../generation-outcome";

const zero: GenerationCounters = { ok: 0, fail: 0, skip: 0, rejected: 0 };

describe("decideOutcome — 落とす (silent green の再発防止)", () => {
  it("★実際の障害: 対象 40 件が全件 FAIL で生成 0 件 → exit 1", () => {
    const d = decideOutcome({ ...zero, fail: 40 }, 40);
    expect(d.exitCode).toBe(1);
    expect(d.reason).toContain("40");
  });

  it("全件 SKIP (入力を読めていない) → exit 1", () => {
    expect(decideOutcome({ ...zero, skip: 12 }, 12).exitCode).toBe(1);
  });

  it("全件ゲート落ち → exit 1 (ゲートは緩めない)", () => {
    const d = decideOutcome({ ...zero, rejected: 5 }, 5);
    expect(d.exitCode).toBe(1);
    expect(d.reason).toContain("ゲート");
  });

  it("FAIL と REJECT が混在して生成 0 件 → exit 1", () => {
    expect(decideOutcome({ ...zero, fail: 3, rejected: 2 }, 5).exitCode).toBe(1);
  });
});

describe("decideOutcome — 落とさない (運用を止めない)", () => {
  it("1 件でも公開経路へ届けば成功 (残りは次回のキューが拾う)", () => {
    const d = decideOutcome({ ok: 1, fail: 39, skip: 0, rejected: 0 }, 40);
    expect(d.exitCode).toBe(0);
  });

  it("対象 0 件 (キューが空) は成功", () => {
    expect(decideOutcome(zero, 0).exitCode).toBe(0);
  });

  it("dry-run は LLM を呼ばないので常に成功", () => {
    const d = decideOutcome({ ...zero, fail: 40 }, 40, { dryRun: true });
    expect(d.exitCode).toBe(0);
  });
});

describe("decideOutcome — 診断メッセージ", () => {
  it("全件 FAIL のときは切り分けの観点を示す", () => {
    const d = decideOutcome({ ...zero, fail: 40 }, 40);
    // 何を疑えばよいかが読み取れること (0 件という事実だけで終わらせない)
    expect(d.reason).toContain("生成 0 件");
    expect(d.reason).toMatch(/認証|ネットワーク|接地/);
  });
});
