# Goal: 日本国勢図会の全統計を一次資料化してマルチチャネル展開する (2026-08-28)

> **Slug**: `japan-zue-content-pipeline`
> **連携 metric**: custom
> **連携 improvement skill**: (任意)
> **ステータス**: ACTIVE
> **開始日 / 最終更新**: 2026-08-28 / 2026-08-28

## 1. 定義

### 終了条件(定量・必須)
stats47対象範囲p.26–529の全定量項目の母数確定、resolution coverage 100%、公開候補の一次資料・rights・年度・単位・地域粒度欠落0、書籍/OCR/figureのruntime参照0、全媒体lineage追跡可能、版更新差分の機械列挙可能

### 撤退条件
オーナーが明示中止するか、法令・権利・source integrityの問題で継続不能な場合のみ。個別項目の一次資料不明・権利不明はfail-closed resolutionとして保持

### Max Cycles
7

### ベースライン
- 計測日: 2026-08-28
- 数値: WP0とsource-vault完了、inventory未実装、local source未復元
- ソース: .claude/todo/backlog.md;docs/02_実装計画/45_日本国勢図会一次資料化・マルチチャネル展開実装仕様.md;.claude/state/source-inventory/japan-zue/2025-26/source-bundle-manifest.json

### 関連 PR / Issue / ドキュメント
- backlog: .claude/todo/backlog.md
- spec: docs/02_実装計画/45_日本国勢図会一次資料化・マルチチャネル展開実装仕様.md

## 2. 仮説プール

define 時に列挙した仮説候補。cycle ごとに採用された仮説は [x] でマーク、却下されたものは(削除)で取り消し線。

- [x] WP1: typed inventoryと40ページpilot
- [x] WP2: 全504ページ母数確定
- [ ] WP3: 一次資料と既存SSOT全件写像
- [ ] WP4: 10項目end-to-end
- [ ] WP5: master記事と動画brief
- [ ] WP6: 全件wave展開
- [ ] WP7: 定常監査統合

## 3. サイクル履歴

_(cycle 実行時に append-only で追記される)_

<!-- CYCLE_INSERTION_POINT -->

## 4. ステータス

- 進行中 cycle: -
- ベースラインからの改善率: -
- 終了条件達成: No
- 残仮説プール数: -

_(cycle ごとに自動更新)_

## 5. 学習資産

_(close 時に確定。それまでは空欄)_

- 効いた施策: -
- 効かなかった施策: -
- 教訓: -
- 共通原則として残す内容: -

## 6. ステータスログ

- 2026-08-28: ACTIVE 開始
- 2026-08-28: WP1基盤（typed inventory、validator、extractor、coverage、lineage、expression audit、版差分CLI）とsource-vaultのテストはgreen。Git/Drive manifestとpart-001のSHA一致を確認。40ページpilotはpart-002〜005未復元のため未完了
- 2026-08-28: part-002〜005の取得待ちが3回連続。原本なしでの候補母数確定を停止し、owner download後にsource-vault verifyから再開
- 2026-08-28: owner download後、6 parts / 480,666,655 bytesを照合し、1,746 files・bundle SHA `a14a45e9d6bdd29e49de0786bdb88f1080ffcff1c5cae739b62a1b2e881de02f`を別一時領域でも再現。WP1 pilotは168候補・代表10件・lineage error 0・再抽出SHA一致で完了
- 2026-08-28: p.26–529は504/504ページ、実見出し904、候補2,072、欠番・重複ページ0。出版社正誤表11件（定量影響7件）はcandidate到達0漏れ。p.1–25の第1章がbundleに存在しないため、WP2母数確定と後続の全件解決は追加source待ち
- 2026-08-28: オーナー判断で第1章「世界の国々」p.1–25をstats47の都道府県コンテンツ対象外へ変更。scope exclusionを機械記録し、対象範囲p.26–529のsource coverage 100%・2,072候補でWP2完了。次はWP3一次資料・既存SSOT全件写像
- 2026-08-28: 抽出精度監査で索引・出典注記の誤検出を除き、分割続表を統合。WP2母数を1,546候補（table 769 / figure 202 / text-stat 575）へ訂正し、40ページpilotも116候補へ再生成。全候補を793 review groupへ整理し、相互参照255件の未解決0
- 2026-08-28: WP3継続。直接出典447 group / 1,079候補のうち151 group / 537候補を56 survey IDへ完全一致で対応。高頻度の公的調査19件を公式府省ページで確認してsurvey masterへ追加し、曖昧一致・master外ID・既存2,753参照の孤児はいずれも0。metricタイトル類似165候補は厳格閾値で自動確定0とし、人手確認待ちを維持
- 2026-08-28: metric候補生成をcandidate単位・同一survey制約へ是正した結果、候補は125件（source制約対象234件）、自動確定0。全1,546候補をmetric＋survey確認26件、surveyのみ確認511件、直接出典確認542件、周辺文脈確認467件へ排他的に分類し、重複・欠落0を検証
- 2026-08-28: mapping queueでpilot既済10件を明示し、未確認1,536件を25 / 506 / 539 / 466件へ分類。既済候補を未確認作業として再計上しない契約を追加
- 2026-08-28: 図の軸・系列・凡例説明117件を本文統計の誤検出から除外し、stable sequenceを維持したままWP2母数を1,429候補（table 769 / figure 202 / text-stat 458）へ訂正。再抽出SHA `bc7f5f61bb7b9531156f53e96632a00e821a3792568f0f1c9520d234102e2b76`は2回一致。WP3は29件判断済み（coverage 2.03%）、未確認1,400件、最優先層20件は全件判断済み。review / source / metric / mapping / correctionの各queueは欠落・重複・孤児0
- 2026-08-28: 図ブロック内の説明・転記本文を追加監査し、stable sequenceを維持したままWP2母数を1,347候補（table 769 / figure 202 / text-stat 376）へ最終訂正。再抽出SHA `83b7edfb39b4bbaae181ff00fc9c8dad58ac01bc4bd7ce2e39aa99d7d4c5f77d`は再実行前後で一致。複数一次資料contractを追加し、WP3は54件判断済み（decision coverage 4.01% / resolution coverage 3.79%）、未確認1,293件、最優先層18件は全件判断済み。lineage・production blocker・queue欠落/重複はいずれも0
- 2026-08-28: 表の段組・列構成を説明する整形メモ7件を追加除外し、WP2母数を1,340候補（table 769 / figure 202 / text-stat 369）へ訂正。再抽出SHA `7707bc79d8873915cd35edd1bb712d81051f723b04086e626ce9800635513e94`で安定。p.26–65 pilotは87件すべて判断済み。WP3は96件判断済み（decision coverage 7.16% / resolution coverage 6.96%）、未確認1,244件。判断内訳は既存metric 13 / 複合分析42 / 文脈31 / 一次資料不明3 / 権利保留4 / 非定量3で、lineage・production blocker・queue欠落/重複はいずれも0
- 2026-08-28: 表の行・列注記3件を追加除外し、stable sequenceを維持したままWP2母数を1,337候補（table 769 / figure 202 / text-stat 366）へ訂正。再抽出SHA `3324fe2c9ed9d6998ab1436744d6838ce774686806dd58ff4b7e02e9ae1d38de`で安定。p.66–105の第2波97件をすべて判断し、WP3は192件判断済み（decision coverage 14.36% / resolution coverage 14.04%）、未確認1,145件。判断内訳は既存metric 14 / 複合分析108 / 文脈46 / 一次資料不明3 / 権利保留16 / 非定量5で、lineage・production blocker・queue欠落/重複はいずれも0
- 2026-08-29: 再抽出の実測でWP2母数は1,332候補（table 769 / figure 202 / text-stat 361）、`candidates.json` SHA `00c1c0375f40c274cbcdaacb6e694d8f07c2fb318f546352333f4058aacd95d9`。`extract --state-dir=<tmp>`でbyte一致を再現確認した。前行の1,337候補 / SHA `3324fe…`からtext-statが5件減った経緯は記録が無く、抽出器がGit未追跡のため差分照合もできない。判断192件と内訳、lineage error 0は前行から不変で、定量項目1,327件中187件を解決（decision coverage 14.41% / resolution coverage 14.09%）、未確認1,140件（0 / 329 / 413 / 398）。tier内訳18 / 418 / 446 / 450、直接出典447 group / 882候補、survey対応151 group / 436候補 / 56 ID、metric候補110件（制約対象185件）。`.claude/todo/backlog.md`とdoc 45の数値をこの実測へ是正し、CLIが集計しない除去件数は両文書から削除した
- 2026-08-29: WP3第3波p.106–145の137候補をすべて判断し、WP3は328件判断済み。定量項目1,323件中319件を解決（decision coverage 24.62% / resolution coverage 24.11%）、未確認1,004件（0 / 289 / 368 / 347）。判断内訳は既存metric 14 / 複合分析174 / 文脈82 / 一次資料不明3 / 権利保留46 / 非定量9で、lineage・production blocker・queue欠落/重複はいずれも0。candidates由来の値（1,332候補 / 813 review group / 相互参照208 / 直接出典447 group・882候補 / survey対応151 group・436候補・56 ID / metric候補110・制約185）は第2波から不変。state 7ファイルを全再生成して整合させ、backlogとdoc 45を同値へ更新。次はWP3-wave-p146-p185（121候補）

_(状態遷移時に追記)_
