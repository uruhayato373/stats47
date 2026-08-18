---
name: audit-consistency
description: エージェント/スキル/スクリプト/フックの整合性ドリフトを点検する。Use when 会話で .claude/{agents,skills,scripts,hooks} や SKILL.md を変更した後、または Stop hook の「整合性監査が未実施」差し戻しを受けたとき、または "整合性チェック" "修正漏れ" "consistency audit" と言われたとき。機械チェック(床)＋意味レビュー(統合バグ)の二層で確認しマーカーを記録する。
primary_agent: knowledge-curator
---

agent/skill/script/hook を変更した会話の節目で、**整合性ドリフト (修正漏れ)** を自発点検する。
2026-06-16 のセッションで「新スクリプトを書いたが、その出力を消費する `auto-resubmit.mjs` の前提を読まずに
doc/memory に偽の主張を書いた」ドリフトが起きた教訓に基づく恒久ガード。

> **二層で確認する** (片方では不十分):
> - **床 (機械・決定的)**: `check-agent-skill-consistency.cjs` がリンク切れ・prompt契約・委譲上限・orphanを検出。
> - **天井 (意味・モデル判断)**: 機械では捕まらない統合バグ (今回の #1) を、消費側の前提を読んで確認する。
>
> このスキルは Stop hook (`.claude/hooks/check-consistency-on-stop.js`) からの差し戻しで起動することを想定する。
> 関連: `.claude/scripts/lib/check-agent-skill-consistency.cjs` / `.claude/todo/04_改善バックログ.md`

## 実行手順

### Step 1 — 機械チェック (床)
```bash
node .claude/scripts/lib/check-agent-skill-consistency.cjs
```
検出:
- **[E1]** SKILL.md の `primary_agent`/`co_agents` が指す `.claude/agents/<name>.md` が無い
- **[E2]** SKILL.md が参照する `.claude/scripts|hooks/...` が存在しない
- **[E3]** `settings.json` の hook command が指すファイルが存在しない
- **[E4]** custom agent の `name` / `description` / `model` が無い、modelが未許可、またはdescriptionが300文字超
- **[E5]** custom agent に `## Output Contract` が無い
- **[E6]** active skill の `name` / `description` / `primary_agent` が無い、またはSKILL.mdが500行超（task-routerのみowner不要）
- **[E7]** Opus 5の過剰検証を誘発する禁止promptが残っている
- **[E8]** 委譲skillが共通契約を参照しない、またはsubagent上限が3を超える
- **[E9]** agent/skill frontmatterにYAMLとして曖昧なplain scalarがある
- **[W1]** どこからも参照されない orphan スクリプト

error はすべて潰す。warn (orphan) は意図的なら無視可 (新規追加直後で参照元未作成など)。

### Step 2 — 意味レビュー (天井。機械では捕まらない)
この会話で変更/追加した agent/skill/script について、以下を**実装を読んで**確認する (推測しない):

1. **消費側を読んだか**: 新しい script/skill の出力 (ファイル・JSON・CSV・R2 key) を**消費する側のコード**を実際に Read したか?
   - 例 (今回の #1): `build-coverage-queue.mjs` が出す `-drilldown.csv` を `auto-resubmit.mjs` が `*.csv` 全拾いで誤爆送信していた。消費側 `findAllCsvs` を読めば即わかった。
2. **前提の検証**: 消費側の前提 (ファイル名規約 / glob パターン / スキーマ / 環境) は実装上ほんとうに成立するか? dry-run / 単体実行で実証したか?
3. **主張の裏取り**: doc/memory/SKILL に書いた「○○は××しない/する」を実装で確認したか? (CLAUDE.md 行動原則8「書く前に読む」)
4. **波及更新**: 新規 skill/agent を参照すべき場所を更新したか?
   - 担当 agent doc の「担当スキル」表 (`.claude/agents/*.md`)
   - cadence (`/weekly-review` `/weekly-plan` が拾うか)
   - index (`docs/*/00_INDEX.md`)、記録先ルール (`.claude/rules/data-storage.md`)
   - 真実源 (改善バックログ `.claude/todo/04_改善バックログ.md`)
5. **規約準拠**: Task Capsule / OUTPUT FORMAT (`model-prompting.md` / `agent-output-contract.md`)、
   SSG 保全 (`nextjs-ssg-preservation.md`)、R2 書き込み CI 限定 (`r2-storage-design.md`) 等に触れていないか。

検出した修正漏れはこの会話で是正する。是正が大きければ backlog に起票して status を残す。

### Step 3 — マーカー記録 (ゲート解除)
床と天井の確認が済んだら:
```bash
node .claude/scripts/lib/check-agent-skill-consistency.cjs --mark-audited
```
現在の関連変更ファイル集合のハッシュを `.claude/state/consistency/audited.json` に記録する。
これにより Stop hook は次回以降 (同じ変更集合なら) 黙る。**さらにファイルを編集すると集合が変わり再度ゲートが立つ** (それが正しい動作)。

## 仕組み (autonomous トリガー)

```
ターン完了 → Stop hook (check-consistency-on-stop.js)
   stop_hook_active? ──yes→ 何もしない (ループ防止)
        │ no
   check-...cjs --gate
     関連変更なし / 監査済み (hash 一致) ──→ exit 0 (黙る)
     未監査の agent/skill/script 変更あり ──→ exit 2 → hook が {"decision":"block","reason":…} で差し戻し
        ↓
   エージェントが本スキルを実行 → 是正 → --mark-audited → 次の Stop は通る
```

- skill/agent/script を触らない会話では発火しない (git status の関連変更で判定)。
- `--gate` は orphan 検査 (重い) をスキップし高速。手動 report 時のみ orphan も検査。

## いつ使うか
- Stop hook の差し戻しを受けたとき (自動)。
- 大きめに agent/skill/script を変更した後、自分から (手動)。
- 「修正漏れない?」と聞かれたとき。

## 関連
- 機械チェッカー: `.claude/scripts/lib/check-agent-skill-consistency.cjs`
- prompt設計SSOT: `.claude/rules/model-prompting.md`
- Stop hook: `.claude/hooks/check-consistency-on-stop.js` / 登録: `.claude/settings.json`
- 既存ガード群: memory `project_recurrence_guard_scripts` (`.claude/scripts/lib/check-*.cjs`)
- 親方針: CLAUDE.md 行動原則8「書く前に読む」/ 12「失敗を隠さない」
