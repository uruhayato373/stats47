# Metric Adapters

`/goal` が各 metric を扱うときに使う連携情報の一覧。新 metric を追加するときは**この表に 1 行追加するだけ**で対応可能。

## 一覧表

| metric | 連携 improvement skill | 計測コマンド | improvement-log パス | budget ファイル | metrics state | min_wait_days |
|---|---|---|---|---|---|---|
| psi | performance-improvement | `node .claude/scripts/psi/fetch-psi-audit.mjs --urls <comma-separated> --strategy mobile --out <path>` | `.claude/skills/analytics/performance-improvement/reference/improvement-log.md` | `.claude/skills/analytics/performance-improvement/budgets.json` | `.claude/state/metrics/psi/` | 1 |
| gsc | gsc-improvement | `/fetch-gsc-data last28d page snapshot YYYY-Www` | `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` | `.claude/skills/analytics/gsc-improvement/reference/budgets.json` | `.claude/state/metrics/gsc/` | 7 |
| ga4 | ga4-improvement | `/fetch-ga4-data last28d eventName,pagePath` | (skill 内に未整備、必要なら新設) | `.claude/skills/analytics/ga4-improvement/reference/budgets.json` | `.claude/state/metrics/ga4/` | 7 |
| adsense | adsense-improvement | (skill 内既存スクリプト経由) | (skill 内に未整備、必要なら新設) | `.claude/skills/analytics/adsense-improvement/reference/budgets.json` | `.claude/state/metrics/adsense/` | 7 |
| sns | sns-metrics-improvement | (skill 内既存スクリプト経由) | `.claude/skills/analytics/sns-metrics-improvement/reference/improvement-log.md` | (未設定) | `.claude/state/metrics/sns/` | 7 |
| cost | cloudflare-cost-improvement | (skill 内既存スクリプト経由) | (skill 内に未整備、必要なら新設) | `.claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json` | `.claude/state/metrics/cloudflare/` | 30 |
| custom | (任意) | 引数で指定 | 任意 | 任意 | 任意 | (任意) |

## カラムの意味

- **metric**: `/goal define` で選択する metric 名
- **連携 improvement skill**: 施策ループの実行体。/goal は呼び出すだけ
- **計測コマンド**: cycle measured 状態への移行で実行するコマンド
- **improvement-log パス**: 施策単位の詳細記録先。/goal の cycle セクションから施策 ID で参照する
- **budget ファイル**: 終了条件の判定基準(JSON)
- **metrics state**: 計測結果の保存先ディレクトリ
- **min_wait_days**: デプロイから計測までの最小待機日数(短すぎると noise を effect と誤判定する)

## 使い方

`/goal define` で metric を選んだら、本表を Read して以下を取得:
1. 計測コマンド → cycle measured 移行時に提示
2. improvement-log パス → cycle 中の施策履歴参照
3. budget ファイル → 終了条件の自動判定
4. min_wait_days → cycle deployed → measured への最小経過日数チェック

## 拡張時の手順

新 metric を追加するとき:
1. 本表に 1 行追加
2. 該当 improvement skill が存在することを確認(無ければ先に作る)
3. metrics state ディレクトリが整備されていることを確認
4. テストとして `/goal define test-<metric>` で動作確認

スキル本体(`SKILL.md`)のロジックは変更しない。
