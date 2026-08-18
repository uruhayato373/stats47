# Cloudflare コスト改善ログ (agent 用詳細)

一覧・status の真実源は `.claude/todo/04_改善バックログ.md`。ここは検証コマンド・仮説・期日の詳細ログ。
記入テンプレ: `.claude/rules/evidence-based-judgment.md` §改善ログ記入テンプレ。

`### 判定` セクションは `.claude/scripts/lib/effect-verdict/` の閾値エンジンが upsert する。
判定・根拠データ・閾値 SSOT・ガード・再現コマンドの 5 項目が必ず出る。ガードが 1 つでも
hit していれば `effect/pending` に留まり、確定ラベルは付かない。

計測データの置き場: 日次 usage は `.claude/state/metrics/cloudflare/`、月次・週次 snapshot は
`reference/{monthly,weekly}-snapshots/`、閾値は `reference/budgets{,-daily}.json`。
