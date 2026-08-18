import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * TODO 台帳の読み取り (lib/server/todo.ts)。
 *
 * ★このページは読み取り専用なので、テストの主眼は「実物のパーサで読めているか」と
 *   「壊れた台帳でも画面が落ちないか」。書き込み経路が無いことも固定する。
 */

const FEATURE_MD = `---
title: 機能バックログ
type: backlog
status: active
updated: 2026-08-18
---

# 機能バックログ

## P0 緊急

### [ALPHA-01] 最初のエントリ

- **tier**: 0
- **status**: pending
- **created**: 2026-08-01
- **owner**: claude

## P1 今月

### [BETA-02] 二番目のエントリ

- **tier**: 1
- **status**: blocked-owner-approval
- **created**: 2026-08-02
- **owner**: uruhayato373
`;

const INBOX_MD = `---
title: 未整理タスク
type: todo-inbox
status: active
updated: 2026-08-18
---

# 未整理タスク

| 日付 | 内容 | 種別候補 | 根拠・再現条件 |
|---|---|---|---|
| 2026-08-10 | 何かが壊れている | バグ | 再現手順 |
| 2026-08-11 | 別の何か | 改善 | 根拠 |
`;

async function loadTodo(root: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import("@/lib/server/todo");
}

describe("todo server", () => {
  let root: string;

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("実物のパーサで 05 の見出しエントリを読む", async () => {
    root = makeFixtureRoot({
      todoFiles: { "05_機能バックログ.md": FEATURE_MD, "01_未整理タスク.md": INBOX_MD },
    });
    const { todoSummary } = await loadTodo(root);
    const s = todoSummary();

    expect(s.error).toBeUndefined();
    expect(s.featureEntries.map((e) => e.id)).toEqual(["ALPHA-01", "BETA-02"]);
    expect(s.featureEntries[0]).toMatchObject({
      section: "P0 緊急",
      status: "pending",
      owner: "claude",
      tier: "0",
    });
    // 行番号はエディタで開くリンクに使うので、実際の見出し行を指していること
    expect(s.featureEntries[0].startLine).toBe(FEATURE_MD.split("\n").indexOf("### [ALPHA-01] 最初のエントリ") + 1);
  });

  it("inbox の 4 列テーブルを読み、ヘッダと区切り行は落とす", async () => {
    root = makeFixtureRoot({ todoFiles: { "01_未整理タスク.md": INBOX_MD } });
    const { todoSummary } = await loadTodo(root);
    const s = todoSummary();

    expect(s.inboxRows).toHaveLength(2);
    expect(s.inboxRows[0]).toEqual({ date: "2026-08-10", body: "何かが壊れている", kind: "バグ" });
  });

  it("台帳が 1 つも無くても落ちず、exists:false で返す", async () => {
    root = makeFixtureRoot({ todoFiles: {} });
    const { todoSummary } = await loadTodo(root);
    const s = todoSummary();

    expect(s.error).toBeUndefined();
    expect(s.files).toHaveLength(7);
    expect(s.files.every((f) => !f.exists)).toBe(true);
    expect(s.featureEntries).toEqual([]);
  });

  it("frontmatter の updated を拾う", async () => {
    root = makeFixtureRoot({ todoFiles: { "05_機能バックログ.md": FEATURE_MD } });
    const { todoSummary } = await loadTodo(root);
    const s = todoSummary();

    expect(s.files.find((f) => f.key === "feature")?.updated).toBe("2026-08-18");
  });

  it("★書き込み関数を export しない (画面から台帳を書けないことの固定)", async () => {
    root = makeFixtureRoot({ todoFiles: {} });
    const mod = await loadTodo(root);
    const writers = Object.keys(mod).filter((k) => /^(write|update|save|create|delete|remove)/i.test(k));
    expect(writers).toEqual([]);
  });
});
