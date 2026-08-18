import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * TODO 台帳の読み取り (lib/server/todo.ts — v3-unified)。
 *
 * ★このページは読み取り専用なので、テストの主眼は「**実物の backlog-lib** で読めているか」と
 *   「壊れた台帳でも画面が落ちないか」。書き込み経路が無いことも固定する。
 */

const BACKLOG_MD = `---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-08-18
---

# バックログ

## 🔴 高

### [ALPHA-01] 最初のカード
タグ: [収益化] [種類:不具合] [実行:sweep] [起票:2026-08-01] [期日:2026-08-31]

- **次**: 何かする。

### [BETA-02] ユーザー待ちのカード
タグ: [実行:ユーザー] [起票:2026-08-02]

## 🟡 中

### [GAMMA-03] 進行中のカード
タグ: [進行中] [Codex候補]

### ID なしの分類待ちカード

説明だけがある。

## 🟣 判断待ち

### [DELTA-04] 意思決定が要る
タグ: [種類:意思決定] [実行:対話]
`;

const WEEKLY_MD = `---
title: 今週の計画
type: weekly-plan
status: active
updated: 2026-08-18
week: 2026-W34
---

# 週間計画

## 今週やること

- [ ] タスク 1

## 今週やらないこと

- 何か
`;

const IMPROVEMENTS_MD = `---
title: 改善バックログ
type: improvement-backlog
status: active
updated: 2026-08-18
---

# 改善バックログ

## Tier 1 (P0/P1)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| IMP-A-01 | 改善施策 A | pending | 2026-08-30 | claude | gsc |
| IMP-B-01 | 改善施策 B | effect/pending | 2026-08-01 | claude | ga4 |
`;

async function loadTodo(root: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import("@/lib/server/todo");
}

describe("todo server (v3-unified)", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("実物の backlog-lib でカードを読む (tier / タグ / ID / 行番号)", async () => {
    root = makeFixtureRoot({ todoFiles: { "backlog.md": BACKLOG_MD } });
    const { todoBoard } = await loadTodo(root);
    const b = todoBoard();

    expect(b.error).toBeUndefined();
    const backlogCards = b.items.filter((c) => c.layer === "backlog");
    expect(backlogCards.map((c) => c.id)).toEqual([
      "ALPHA-01",
      "BETA-02",
      "GAMMA-03",
      null,
      "DELTA-04",
    ]);

    const alpha = backlogCards[0];
    expect(alpha).toMatchObject({
      tier: "high",
      kind: "不具合",
      executor: "sweep",
      filed: "2026-08-01",
      due: "2026-08-31",
    });
    // 行番号はエディタで開くリンクに使うので、実際の見出し行を指していること
    expect(alpha.line).toBe(BACKLOG_MD.split("\n").indexOf("### [ALPHA-01] 最初のカード") + 1);

    expect(backlogCards[2]).toMatchObject({ wip: true, codex: true });
    expect(backlogCards[4]).toMatchObject({ tier: "hold", executor: "対話" });

    // ファセット語彙は backlog-lib の宣言をそのまま渡す (画面側で別語彙を作らない)
    expect(b.kinds).toContain("不具合");
    expect(b.executors).toContain("sweep");
  });

  it("weekly は ## 見出し単位でカード化する (タグ軸は持たない)", async () => {
    root = makeFixtureRoot({ todoFiles: { "weekly.md": WEEKLY_MD } });
    const { todoBoard } = await loadTodo(root);
    const b = todoBoard();

    const weekly = b.items.filter((c) => c.layer === "weekly");
    expect(weekly.map((c) => c.title)).toEqual(["今週やること", "今週やらないこと"]);
    expect(weekly[0].body).toContain("タスク 1");
    expect(weekly[0].kind).toBeNull();
  });

  it("improvements は 6 列テーブルとして読む (カードにしない)", async () => {
    root = makeFixtureRoot({ todoFiles: { "improvements.md": IMPROVEMENTS_MD } });
    const { todoBoard } = await loadTodo(root);
    const b = todoBoard();

    expect(b.improvements).toHaveLength(2);
    expect(b.improvements[0]).toMatchObject({
      tierLabel: "Tier 1 (P0/P1)",
      id: "IMP-A-01",
      status: "pending",
      due: "2026-08-30",
    });
    expect(b.layers.find((l) => l.id === "improvements")?.count).toBe(2);
    // improvements の行はカード items に混ざらない
    expect(b.items.filter((c) => c.layer === "improvements")).toEqual([]);
  });

  it("台帳が 1 つも無くても落ちず、exists:false で返す", async () => {
    root = makeFixtureRoot({ todoFiles: {} });
    const { todoBoard } = await loadTodo(root);
    const b = todoBoard();

    expect(b.error).toBeUndefined();
    expect(b.layers).toHaveLength(4);
    expect(b.layers.map((l) => l.id)).toEqual(["backlog", "weekly", "monthly", "improvements"]);
    expect(b.layers.every((l) => !l.exists)).toBe(true);
    expect(b.items).toEqual([]);
  });

  it("frontmatter の updated を拾う", async () => {
    root = makeFixtureRoot({ todoFiles: { "backlog.md": BACKLOG_MD } });
    const { todoBoard } = await loadTodo(root);
    const b = todoBoard();

    expect(b.layers.find((l) => l.id === "backlog")?.updated).toBe("2026-08-18");
  });

  it("★書き込み関数を export しない (画面から台帳を書けないことの固定)", async () => {
    root = makeFixtureRoot({ todoFiles: {} });
    const mod = await loadTodo(root);
    const writers = Object.keys(mod).filter((k) =>
      /^(write|update|save|create|delete|remove)/i.test(k),
    );
    expect(writers).toEqual([]);
  });
});
