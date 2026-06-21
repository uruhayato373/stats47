---
slug: cc-estat-18-cache-r2
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---

## 評価サマリ

Claude Code 連載 Part 18 の技術チュートリアル記事。「e-Stat 直叩きの限界 → R2 キャッシュ → JSON 分割設計 → 命名規約 → put/get 実装 → isolate キャッシュの落とし穴 → ETag/Cache-Control」という一本道の論理が明快で、各ステップに「なぜ」と「実例コード」が伴っている。動機 (レイテンシ/レート制限/不変性) の切り分け、all.json アンチパターンの 5 つの問題列挙、Workers isolate 特性による module-level キャッシュ事故の説明は、ランキング羅列ではなく構造的理解を読者に渡す厚みのある解説で、読者価値は十分。本シリーズ (Part 17/19) と同じ code-walkthrough アーキタイプで、SVG ランキング図が無いのは content type 上適切 (本記事の主題は prefecture データの可視化ではなく JSON 配信設計)。内部リンク (Part 17/19・/ranking/population・/category/ict) は全て 200 で解決、source-link は題材データ (/ranking/population) の文脈内に正しく配置されている。

## 指摘

- [MAJOR] L483 `wrangler r2 object purge stats47-cache` は実在しないサブコマンド。`wrangler r2 object` に `purge` は無く、読者がコピペすると確実にエラーになる (how-to 記事で copy-paste 動作するコードは信頼の根幹)。直後の `curl ... /purge_cache` (L486-490) が正しいパージ手段なので、「全パージ（雑だが手っ取り早い）」の例は **削除するか** `wrangler` ではなく Cloudflare API/ダッシュボードでのパージに置き換えるべき。
- [MINOR] アーキテクチャ叙述が「ローカル D1（source of truth）→ /sync-snapshots → R2」(L556・L276・L383 `loadFromD1`) になっており、stats47 の現行正典 (完全DBレス: git TS + R2、永続 D1 廃止) と乖離する。Part 18 は 2026-05-17 付の連載途中回で、当時の illustrative な教材フローとしては許容範囲だが、D1 を入力前提に固定すると後続回 (Part 19 で Skill 化) や読者の本番設計を誤誘導しうる。「入力ストア (DB/R2 観測値)」程度に一般化するか、現行の DBレス前提に寄せると安全。factual ではないので公開ブロックには当たらない。
- [MINOR] 同一情報を「散文で説明 → 直後に箇条書きで再掲」する型が反復している (L37-43 レイテンシ比較、L201-204 all.json vs 分割、L518-523 DevTools 転送量)。各々は表禁止ルール下で表の代替として機能しており水増しとまでは言えないが、L39 (レイテンシ 30-80ms)・L449 (R2 binding 10ms 以下)・L76 (10ms 未満) が章をまたいで同じ数値を繰り返す箇所は冗長感がある。1 箇所への集約で締まる。
- [MINOR] 図表重複なし・truncated 表なし・markdown 表ゼロ・curiosity gap 真正 (タイトルの「all.json を否定し命名規約に着地」は本文の山場 Step 2-3 と一致、釣りでない)・ですます調は地の文で完全に一貫 (である調/動詞終止形の常体混入なし、dearuEndings=0)・callout 3 個は全て記事固有の独立した注意 (NOTE=レート制限が観測ベース / TIP=R2 の弱点と適不適 / WARNING=ローカルで再現しない isolate 事故) で定型反復ではない。これらは良好。

## 判定理由

論理の一貫性・解説の厚み・curiosity gap の真正性・callout の情報量・ですます調・内部リンク妥当性のいずれも基準を満たし、水増し・図表重複・薄い解釈は無い。`wrangler r2 object purge` の誤コマンド (MAJOR) はコピペ事故を招くため修正推奨だが、(1) 直後に正しい curl パージ手段が併記されており記事の主張が破綻しないこと、(2) factual gate (rank 整合性) や公開ブロック対象 (markdown 表/である調/未描画 placeholder) には該当しないこと、(3) 教材記事として全体の読者価値が高いことから、BLOCK ではなく MAJOR とし verdict は PASS とする。article-writer 側で L483 の誤コマンド修正と、可能なら D1 前提の一般化を行えば品質はさらに上がる。
