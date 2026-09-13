# WindowsでVitestの指定引数が届かない場合

**トリガー**: npm workspace経由で `--testTimeout=30000` を渡しても、実行ログに引数がなく `Test timed out in 10000ms` が繰り返される。
**対処**: まず失敗がassertionか時間制限かを分ける。時間制限ならapps/webからNodeで `../../node_modules/vitest/vitest.mjs run <対象> --testTimeout=30000 --maxWorkers=1` を直接起動し、実行コマンドと結果を確認する。ソースのassertionを削らず、上限を変えた事実を検証記録へ残す。
**根拠**: 2026-09-08、広告配置guardの同期ファイル走査が14〜20秒かかり2回timeout。直接起動では同じ5テストが通過した。引数が転送されない詳細な原因は未確定で、一般のnpm不具合とは断定しない。
**確信度**: 0.5
**発見日**: 2026-09-08
**関連**: `apps/web/src/features/ads/__tests__/right-rail-banner-contract.test.ts`、`run-tests`
