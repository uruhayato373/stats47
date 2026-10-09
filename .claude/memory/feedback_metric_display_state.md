---
name: metric_display_state
description: 計算方法・年・地域を切り替えるときは観測値と単位・平均系列・配色方針を同じ表示stateで確定し、遅い旧応答を無視する
type: feedback
---

**問題**: ランキングの正規化切替で、取得完了前に新しい単位と配色方針を旧数値へ適用する中間表示が発生し得る。年や地域の切替でも同じ食い違いが起こる。

**原因**: `useRankingPageState` は選択した計算方法・年・地域を直ちに更新し、観測値と全国平均系列を非同期に取得していた。系列と値だけを一緒に更新しても、単位とdomainは別stateから解決される。`useTransition` 自体は複数stateの取得結果を同一単位にする契約を持たない。

**対策**: 観測値・系列・年・地域・計算方法を一つの表示stateとして、取得成功後にまとめて確定する。失敗時は旧表示とURLを保持し、要求番号で遅い旧応答を無視する。地図と要約のpresentationは確定した計算方法から解決する。画面撮影は対象単位と数値が到着してから行う。

**証拠**: `apps/web/src/features/ranking/components/RankingKeyPage/useRankingPageState.ts` と同ディレクトリの `__tests__/useRankingPageState.test.tsx`。2026-10-09に未完了取得・取得失敗・旧応答の3ケースがPASS。

## 分位区分の色は階級順で決める

**問題**: 人口密度の分位地図で下位4階級の色がほぼ同じになった。

**原因**: 分位境界を正しく計算しても、各区間の実値の中点を連続色スケールへ渡すと、右裾の大きな値が下位区間の色を押しつぶす。

**対策**: 分位区分は階級順に色の幅を使う。発散色は宣言した基準を中立色に保ち、両側の階級順から色を解決する。地図と凡例に同じ色配列を渡す。分布を均等から偏った形へ変えても同じ階級の色が変わらないテストで検査する。

**証拠**: packages/visualization の quantile-palette.test.ts と共通 resolve-choropleth-scale.ts。2026-10-09、関連13testと当該package型検査、人口密度390pxの地図・凡例の実画面で確認。

## SSOT移行は利用側・監査・配信の契約まで検査する

**問題**: 指標をdata/へ移して型と画面が通っても、運用スクリプトの直書き、原典索引の旧単一ファイル参照、監査の削除済み変数、件数を固定したテストに移行漏れが残った。

**原因**: 設定の正本とアプリの読取だけを移行対象にし、CLIの結果JSON・設定の保持契約・テスト入力/件数の参照先が別のままだった。テストからdata/の実装を直接importすると、rootDirを持つ独立パッケージの型検査範囲も越える。

**対策**: パスはconfig/datasets.mjsから解決する。分割索引は全shardを読み、空・重複・不正IDを拒否する。設定と日付付き運用snapshotの区別は台帳のkindで判定する。件数の正典が別にあるテストは正本との集合/件数照合にし、配信fixtureは必須契約を満たす。監査はimportだけでなくCLIのJSON出力まで実行し、部分検査を成功へ変えないことを固定する。

**証拠**: .claude/scripts/lib/estat-catalog/pulled.mjs・estat-catalog.test.mjs、prune-state-snapshots.test.mjs、audit/__tests__/theme-chart-live-audit.test.mjs、packages/data-configsのstat-series-ref.test.ts。PR #1116の最終必須CI 37908326854で検証。

## 全件反映の完了を確認してから公開成功と判定する

**問題**: 指標metadataの全件反映が40分で停止し、後続のコード差分だけのデプロイは反映段をskipした。

**原因**: exact manifestの全3,219件の書込み/検証は53分かかり、40分の制限を超えた。反映要否は直前pushのファイル差分だけを見ており、前回の途中停止を検知しなかった。

**対策**: 現行運用では途中停止後にworkflow_dispatchで全件を再生成・検査・反映する。公開成功は全件反映とアプリのdeploy・公開画面を別々に確認して判定する。恒久対策は既存DEPLOY-METRIC-RELEASE-TIMEOUT-01で、反映時間と前回失敗の再実行判定を扱う。公開対象を固定したmanifestのSHA検査やデータ先行の順序は維持する。

**証拠**: Deploy 37909376740のtimeout、37922790127の反映skip、37924050596の3,219件反映成功 (53分)、main 8bff690216とWorker version b5fe3442-01f8-4b70-b186-3196459acf7b。2026-10-10に公開R2/画面17ケースを確認。
