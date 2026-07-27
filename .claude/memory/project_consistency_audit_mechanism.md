---
name: project_consistency_audit_mechanism
description: 会話完了時に agent/skill/script のドリフトを自発チェックする Stop hook ゲートの仕組みと解除方法
metadata: 
  node_type: memory
  type: project
  originSessionId: d2a38335-b56d-47a7-bbcc-1ff5b5c95ffb
---

2026-06-16 構築。agent/skill/script/hook を変更した会話の**ターン完了時**に、整合性ドリフト(修正漏れ)を自発チェックさせる二層メカニズム。きっかけは同セッションで「新スクリプトの出力を消費する `auto-resubmit.mjs` の前提(`*.csv`全拾い)を読まず doc/memory に偽主張を書いた」ドリフト([[feedback_fetch_origin_before_implementing]] と同系・CLAUDE.md 行動原則8違反)。

**構成**:
- 機械チェッカー `.claude/scripts/lib/check-agent-skill-consistency.cjs`: E1-E3の参照整合に加え、
  E4=agent frontmatter、E5=Output Contract、E6=skill owner、E7=Opus過剰検証prompt、
  E8=委譲契約参照+上限3を検査する。W1=orphan script。`--gate`(今回の変更だけ) /
  `--mark-audited`(変更hash記録) / 既定(全repo report)。
- Stop hook `.claude/hooks/check-consistency-on-stop.js` (settings.json hooks.Stop に登録): stdin の `stop_hook_active`=true なら即通過(ループ防止)。`--gate` 実行→exit2(未監査の agent/skill/script 変更あり)なら `{"decision":"block","reason":…}` を stdout に出して差し戻し→エージェントが継続して監査。
- skill `/audit-consistency` (`.claude/skills/dev/audit-consistency/`): 機械チェック(床)+意味レビュー(天井=消費側のコードを実際にReadして前提検証。機械では捕まらない統合バグ用)+`--mark-audited`。

**ゲート解除**: `node .claude/scripts/lib/check-agent-skill-consistency.cjs --mark-audited`。これで現在の関連変更集合のhashが記録され次回Stopは黙る。**さらに skill/agent/script を編集すると集合hashが変わり再びゲートが立つ**(正しい挙動)。**commit すれば git status から消えてゲートも黙る**。skill/agent/script を触らない会話では発火しない。

**判定範囲**: gate は今回触ったagent/skill/script/hook/rule/output-style/CLAUDE.mdだけを点検する。
全repo点検は`check-...cjs`（引数なし）。PR CIと週次workflowは全repoのprompt契約を検査する。
