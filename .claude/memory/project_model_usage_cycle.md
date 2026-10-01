---
name: project_model_usage_cycle
description: モデル/effort の計測→記録→改善サイクル(2026-10-02)。agent は effort 未指定だとセッションの xhigh を継承、別名 sonnet/opus の解決先は CLI 版次第、canary は採点器ごと検証
metadata:
  node_type: memory
  type: project
  originSessionId: b0490c54-e3a4-45c7-a362-d63c8b1ba677
  modified: 2026-10-01T19:56:08.007Z
---

2026-10-02 にモデル・effort の継続最適化サイクルを作った (正典 `.claude/rules/model-prompting.md`「継続最適化サイクル」、画面 `/ops/agents`)。
計測 = `npm run model-usage:collect` (transcript 集計) + CI 5 本の `record-claude-usage-ci.sh`、記録 = `latest.json`、改善 = `proposeChanges` + `run-canary.mjs`。

- **agent frontmatter に effort を書かないとセッションの effort を継承する**。実測で応答の 6 割強が xhigh、自作 agent はほぼ全件 xhigh だった。費用の大半はメインセッション (4 週 $1,231 対 agent $327、API 換算)。
- **別名の解決先は Claude Code の版で決まる**。CLI 2.1.197: `sonnet`→claude-sonnet-5、`opus`→claude-opus-4-8。2.1.287: 両方 5.5。Opus 5.5 は 2.1.280 未満で API 400。CI は claude-code-base-action の固定 SHA が入れる版 (コメントの版表記は実態とずれていた: 「v2.1.220」と書かれた SHA は 2.1.278 を入れていた。action.yml の `CLAUDE_CODE_VERSION` を見る)。
- ターミナルの `claude` は zsh alias で npx 版、node の spawn は `~/.local/bin/claude` (ネイティブ) を使う。版が別々なので canary は spawn 側の版で動く。
- canary の fixture は「課題文そのものの採点 = 0」「模範解答 = 満点」を確かめてから使う (欠陥のコード片 `size - 1` や `forEach(async` が課題文に入っていて、引用だけで正解扱いになった)。両方満点の課題は差を測れない。

**Why:** 印象で「Sonnet で十分」「effort を下げる」を決めず、同じ課題の recall と費用で決めるため。
**How to apply:** 提案は自動適用しない。canary 合格を見て frontmatter / workflow を人が変える。新モデルが出たら `model-optimization-policy.json` の `latestModels` と base-action の固定 SHA を上げる。関連: [[feedback_mutation_test_passes_wrongly]]
