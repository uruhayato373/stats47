---
type: session-handoff
date: 2026-07-18
status: active
topic: multichannel-content-product-phase0
tags: [収益化, note, KDP, Brain, ココナラ, Claude-Code]
---

# マルチチャネル・コンテンツ商品ファクトリー Phase 0 引き継ぎ

## 背景

ユーザーは、ココナラ商品をnote、Brain、Amazon KDP/Kindle等にも展開し、AIを最大限活用して多数の仮説を作り、
反応が確認された商品へ集中する方針を決定した。

正式仕様:

- `docs/02_実装計画/32_マルチチャネル・コンテンツ商品ファクトリー仕様.md`
- 親となるOffice商品仕様: `docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md`
- 収益化SSOT: `docs/02_実装計画/01_収益化マスタープラン.md`
- TODO: `docs/todo/02_機能バックログ.md#MULTICHANNEL-CONTENT-PRODUCT-01`

## 今回完了したこと

- 無料認知→入口商品→実用品→ノウハウ→受託→B2Bの価値階段を定義。
- note、KDP、Brain、ココナラ、BOOTH/Gumroad候補、講座、B2Bの役割を分離。
- 移住、年収・生活費、公務員・自治体AI実務の初期3verticalと9商品仮説を定義。
- `ContentProductDefinition`、channel offer、AI policy、sales observation等の型案を定義。
- git TS / R2 / `.local` / `.claude/state` / docsのSSOT境界を定義。永続D1は不採用。
- AI、決定的コード、人間の責務と10段品質gateを定義。
- 無料需要、入口商品、横展開、scale/stopの定量的な初期条件を定義。
- Fable / Opus / Sonnet / Haikuの分業、agent、Output Contract、file boundaryを定義。
- gallery `/products`、CLI、unit/integration/実機検証、Phase 0〜7、最初の90日を定義。
- 収益化マスタープランへ、P3前でもdoc 32のgate内ならローカルdraft・単一pilot候補を許す限定例外を追記。
- note、KDP、Brainの公式根拠URLと2026-07-18確認日を仕様へ記録。

実装コード、商品生成、外部公開、R2、販売プラットフォームには触れていない。

## 次セッション

**仕様 §19のpromptを使い、Phase 0監査だけを行う。コードを書かない。**

1. `git status`で既存未コミット変更・未追跡ファイル・所有者を記録する。
2. `packages/product-factory`の現行型、174商品catalog、CLI、tests、生成物、statusを確認する。
3. note catalog、note戦略、note-manager、note-critic、公開writerを確認する。
4. SNS posts/metrics、experiments、product sales ledger、galleryのschemaとwriterを確認する。
5. 本仕様で提案したpath、型、agent、CLIと既存実装の重複・不足を表にする。
6. note/KDP/Brain/ココナラ等の公式条件について確認済み・未確認をregistry案にする。
7. Phase 1の最小変更ファイル、migration、unit/integration test、write boundaryを確定する。
8. `docs/04_レビュー/YYYY-MM-DD-content-product-phase0-audit.md`へ監査結果を保存する。
9. Phase 1開始可否を`ready`または`blocked`で判定する。

## Phase 0禁止事項

- TypeScript、agent、skill、script、workflow、galleryの実装変更。
- note/KDP/Brain/ココナラへのログイン、出品、アップロード、価格変更。
- 外部サイトの管理画面scraping。
- 商品原稿、表紙、PDF、PPTX、XLSXの生成。
- R2 read/write、git commit/push、PR、deploy。
- 既存product/note/SNS/stateのin-place migration。

## 重要な設計判断

- 「全てやる」は全channel同時公開ではなく、全候補をcatalog化しgate順に検証する意味。
- 最初の有料pilotは1テーマ・1channelのみ。note/KDP/Brainを同時発売しない。
- 共通content bundleは主張・出典・図表のSSOT。媒体別本文は読者jobに合わせて再構成し、同文複製しない。
- KDPはAI生成テキスト・画像・翻訳を申告する。AI生成後に大幅編集してもAI生成扱い。
- 公開、価格、AI申告、返金、support、商用条件はowner gate。
- 生成数をKPIにせず、手数料・返金・support控除後粗利と購入者価値で判定する。

## 作業ツリー注意

2026-07-18時点で、product-factory、ココナラ仕様、note/X/agent関連を含む多数の未コミット・未追跡変更がある。
今回の文書作業とは別の所有物が含まれる。Phase 0監査で必ず出所を確認し、一括commit、上書き、削除をしない。
Claude CodeとCodexを同じworking treeで同時実行せず、必要なら別worktreeを使用する。

## 検証状態

- 文書変更のみ。type-check、unit test、buildは未実行。
- `git diff --check`: PASS（2026-07-18、文書更新後）。
- platform規約は公開・実装時に再確認が必要。確認日を持たないchannelを有効化しない。

## 消化条件

Phase 0監査が完了し、Phase 1の重複なしの実装境界とblockerが確定したら、恒常的決定を該当SSOTへ抽出する。
残タスクを機能バックログへ反映後、本ハンドオフを削除する。Phase 1未着手でも監査が消化済みなら貯めない。
