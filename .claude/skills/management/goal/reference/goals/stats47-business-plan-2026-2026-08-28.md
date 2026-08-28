# Goal: stats47 2.0事業計画を継続実行可能な運用へ統合する (2026-08-28)

> **Slug**: `stats47-business-plan-2026`
> **連携 metric**: custom
> **連携 improvement skill**: business-plan-operate
> **ステータス**: CLOSED-SUCCESS
> **開始日 / 最終更新**: 2026-08-28 / 2026-08-28

## 1. 定義

### 終了条件（必須）

- 原案25章を `adopted/adapted/deferred/rejected` で分類し、既存SSOTへの適合理由を持つ。
- 100コンテンツ、X案30件、note商品15件を型付きカタログで欠落・重複なく管理する。
- owner、skill、設計文書、KPI、イベント、開始ゲートの参照を機械検証する。
- 管理画面 `/strategy` が方針・文書・施策・企画・計測状態を同じSSOTから表示する。
- strategy-advisor、週次計画・レビュー、PR/週次CIへ運用を接続する。
- 対象テスト、型チェック、文書ガバナンスを通し、未計測・未公開を完了と表示しない。

### 撤退条件

8 cyclesでSSOTと管理画面の参照整合を成立させられない場合は、企画在庫を縮約してgoalを再定義する。

### Max Cycles

8

### ベースライン

- 計測日: 2026-08-28
- 数値: 原案35ページはローカルDOCXのみ。25章の採用差分、100企画、管理画面、owner/skill、KPI計測契約が未接続。
- ソース: `/Users/minamidaisuke/Downloads/stats47_2_business_plan_2026.docx` (SHA-256 `04f678551e1395a2033d8d6e34e7b6029932792f61e9dd178aedaa690de510c8`)

## 2. 仮説プール

- [x] H1: 型付きcatalogと決定的validatorで原案・実装・ownerのドリフトを防げる。
- [x] H2: 管理画面の読み取りミラーで方針と次の実行を同じ画面から判断できる。
- [x] H3: 100企画を需要ゲート付き在庫にすれば一括量産せず4系列から検証できる。
- [x] H4: 週次収益NSMと地域意思決定の先行指標を分ければ過大な効果主張を防げる。
- [ ] H5: 最初の分析系列が需要を得ればX・note・商品・B2Bへ同じ資産を再利用できる。

## 3. サイクル履歴

### Cycle 1 — 運用基盤の統合

| 項目 | 内容 |
|---|---|
| 仮説 | H1 / H2 / H3 / H4 |
| 施策 | 型付きcatalog、validator/state builder、管理画面、owner/skill、週次運用、CI、既存文書統合 |
| 想定効果 | 原案と実装の差を可視化し、開始ゲートを守って次の実装へ送れる |
| 状態 | judged / effect/full |
| 実装証拠 | commit `4674d21cbe842d79b1f21fb0a8216194813dfa15` |
| 計測証拠 | `.claude/state/business-plan/history/2026-08-28.json` |
| 結果 | 25判断・100企画・X30案・note15商品・4 pilot specを検証。data-configs 762 tests、admin 166 tests、全25 workspace type-check、admin build、文書・CI・consistency gate PASS |
| 次 | H5の市場仮説は最初の4系列を需要ゲート順に実行し、別の週次・月次計測で判定 |

<!-- CYCLE_INSERTION_POINT -->

## 4. ステータス

- 進行中 cycle: なし
- ベースラインからの改善率: 実装終了条件 6/6（100%）
- 終了条件達成: Yes
- 残仮説プール数: 1（市場反応のH5は継続運用へ移管）

## 5. 学習資産

- 効いた施策: 原案の文章を複製せず、25章の採用差分、owner、skill、KPI、開始ゲートを型付きcatalogへ変換した。derived state、管理画面、CI、週次運用が同じcatalogを参照するため、方針と実装のドリフトを機械検出できる。
- 効かなかった施策: 原案の常設D1/PostGIS、初期90日のSaaS・AIチャット、市区町村薄ページ量産は既存正典と需要ゲートに反するため採用しなかった。
- 教訓: 外部事業計画は「全面採用」ではなく、既存アーキテクチャと実測契約への適合差分として扱う。市場目標は仮説、未計測は0でないことをUIとstateへ同時に残す。
- 共通原則として残す内容: authored方針はgit TS、観測・派生はR2/state、管理画面は読み取りミラー。新しい公開面は実分析3本・provenance・GA4・thin-content gateが揃うまでindexしない。

## 6. ステータスログ

- 2026-08-28: ACTIVE 開始。原案の全量抽出と既存SSOT監査を完了し、Cycle 1を開始。
- 2026-08-28: Cycle 1をeffect/full判定。実装終了条件6/6を満たし、CLOSED-SUCCESS。
