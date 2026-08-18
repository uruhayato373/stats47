---
name: process-backlog
description: .claude/todo のバックログを分類して処理し、機械ゲートを通したものだけ行削除する。ledger に証拠を残し verify で突合する。Use when user says "バックログを処理", "バックログを消化", "process-backlog".
primary_agent: backlog-processor
co_agents: [backlog-solver-hard]
---

# process-backlog

`.claude/todo/05_機能バックログ.md` / `06_指標バックログ.md` のエントリを分類して処理し、
**機械ゲートを通ったものだけ**を行削除する。CI 日次ループ (Phase 1) と同じ手順を
セッション内で回す入口。

規約の正典は `.claude/rules/backlog-loop.md`。class 定義・gate 表・安全境界はそちらを読む。

## 手順

### 1. 開始時の HEAD を控える (verify の基準)

```bash
BASE=$(git rev-parse HEAD)
```

### 2. キューを得る

```bash
node .claude/scripts/backlog-loop/build-backlog-queue.mjs --limit 3 --json
```

`picked[]` が処理対象。`needsOwner[]` は owner 判断待ちなので**触らない**
(週次で人間へ surface される)。`skipped[]` は in-progress か quarantine。

### 3. 1 件ずつ分類して処理する

`route._pendingClassification` が true なら自分で class を決める。既知 class があれば踏襲し、
違うと判断したら再分類する (ledger が `reclassifiedFrom` に履歴を残し、学習の材料になる)。

class ごとの gate は正典の表に従う。**gate は実際に実行する**。

`impl-large` / `indicator-expansion` / escalated は Agent tool で `backlog-solver-hard` へ委譲する
(`mode: "bypassPermissions"`)。起動 prompt の冒頭に Task Capsule と Output Format を置く
(`.claude/rules/agent-output-contract.md`)。委譲の設計とモデル選定は
`.claude/rules/model-prompting.md` に従う。

**subagent 同時起動は最大 2 体**。1 起動 1 エントリで、互いに独立した file boundary を持つ
案件だけを並列にする (同じファイルを触る可能性があれば直列)。バックログのエントリは
scope が重なることがあるため、既定は 1 体で、明らかに独立している場合のみ 2 体。

### 4. 結果を記録する

```bash
node .claude/scripts/backlog-loop/record-backlog-outcome.mjs \
  --id <ID> --class <class> --outcome completed \
  --model sonnet --gate-commands "npm run type-check,npm test" --gate-pass \
  --evidence "何を根拠に完了としたか (≤280字)"
```

`completed` は `--gate-commands` と `--gate-pass` の両方が必須で、CLI が無ければ exit 1 で弾く。
未達なら `--outcome failed --fail-reason "..."`、再現できなかったら `--outcome deferred`。

閉じた結果として小さい残件が出たら `--follow-ups <新ID>` で名指しする。verify はエントリの
新規追加を既定で落とすが、名指しした ID だけは通す (正典 `.claude/rules/backlog-loop.md`)。

### 5. gate を通ったものだけ行削除する

行番号ベースで消す (文字列一致で消すと同じ語を含む別エントリを壊す)。

### 6. verify を通す

```bash
node .claude/scripts/backlog-loop/verify-backlog-run.mjs --base "$BASE" --queued "<ID1>,<ID2>"
npm run docs:check
```

verify が落ちたら**行を戻す**。gate 未実行のまま削除しようとしている状態なので、
`--outcome failed` か `deferred` で記録し直す。

## やってはいけないこと

- ゲートを実行せずに `--gate-pass` を付ける (verify が突合して落とす)
- `.claude/state/backlog-loop/ledger.json` を直接編集する (証拠の捏造)
- `.claude/todo/04_改善バックログ.md` を触る (improvement-triage の排他 write)
- `blocked-owner-*` エントリの status 変更・削除
- deploy / 本番 R2 push (人間の明示承認が要る)
- `git add -A` (明示パスのみ)

## 関連

- 正典: `.claude/rules/backlog-loop.md`
- agent: `.claude/agents/backlog-processor.md` / `.claude/agents/backlog-solver-hard.md`
- policy: `.claude/config/backlog-routing-policy.json`
- TODO 作成契約: `.claude/rules/docs-vs-issues.md` / `.claude/todo/00_運用ガイド.md`
