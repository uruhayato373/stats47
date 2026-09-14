---
name: knowledge
description: 過去の失敗と学びを検索し、問題・原因・対策の3点で恒久知見を記録する。バグ解決、非自明なAPI制約、再発防止策を扱う。
user-invocable: false
primary_agent: knowledge-curator
co_agents: [strategy-advisor]
---

# knowledge

プロジェクト固有の恒久知見をrepo内memoryへ記録する。長い過去事例は必要なものだけ読む。

## 正典

- 索引: `.claude/memory/MEMORY.md`
- 個別知見: `.claude/memory/*.md`
- 歴史的な旧ナレッジ集: `reference/legacy-lessons.md`
- 記録先規律: `CLAUDE.md`「作業の節目で記録する」

## 参照

1. 現在の問題を表す固有語を `.claude/memory/MEMORY.md` と `.claude/memory/*.md` で検索する。
2. 一致した個別ファイルだけを全文読む。
3. 必要な場合だけ `reference/legacy-lessons.md` を検索し、該当sectionを読む。
4. 現在の実装・rule・一次資料を優先する。歴史記録を現行仕様として扱わない。

```bash
rg -n "<error|component|service>" .claude/memory .claude/skills/management/knowledge/reference
```

## 追記

再利用価値がある恒久知見だけを`.claude/memory/<slug>.md`へ保存し、`MEMORY.md`へ1行追加する。
一時的な作業状況や未完了TODOはmemoryへ置かず、`.claude/todo/`の該当backlogへ記録する。

```markdown
---
name: <stable_id>
description: <次のagentが検索できる一文>
type: feedback | project | reference
---

**問題**: 観測された事象と影響

**原因**: tool output・実装・一次資料で確定した原因

**対策**: 次回に適用する具体的手順と決定的gate

**証拠**: file / command / URL / date
```

## Gate

- 症状だけでなく原因が証拠で確定している。
- 対策が「注意する」だけでなく、手順・rule・test・checkerのいずれかに結び付いている。
- 既存memoryと重複せず、現行SSOTへのlinkがある。
- secret、個人情報、一時的なtokenや環境値を保存していない。

## Output Contract

chatは`Result | Memory file | Evidence | Reused by`の1表のみ。新しい知見が無い場合は
`No durable knowledge`とし、記録を水増ししない。
