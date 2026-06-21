---
slug: koumuin-claude-code-estat-automation
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---
## 評価サマリ
公務員業務の効率化を切り口に、stats47 の自動化アーキテクチャ（e-Stat 取得 → スキル化 → GitHub Actions 無人実行の 3 レイヤー）を実例として開示する非データ型の技術 + アフィリエイト記事。本サイト標準のランキング deep-dive ではないため、上位5+下位5 SVG・図あたり字数・アーキタイプ A–E の必須分析視点は適用対象外（チャート 0・data 空は本コンテンツ型として正しい）。読者価値の核は「踏んだ落とし穴の具体性」「実測の処理時間（2 分 / 25 分）」「90% は機械的・10% は人間という現実的な比率提示」「機密データは閉域 LLM に分けるというセキュリティ境界の論点」で、抽象論で終わらず公務員業務への転用パターン A/B/C に落とし込めている。curiosity gap（「1 人 + AI」）はタイトルの煽りと本文の中身が一致しており釣りではない。callout 3 個はいずれも本文の言い換えでなく独立した知識（年度範囲を絞るほどキャッシュが分断される逆説 / キャッシュ層の要否判断軸 / 同データ 2 回以上か）を提供しており定型反復になっていない。文体はですます調で統一（である調 copula・常体動詞終止形の混入なし）、markdown 表ゼロ、内部リンク 7 本（ranking 2 + blog 5）でリンク密度も妥当。アフィリエイト導線は「※PR」明示・1 枠のみで読者体験を損なわない。水増し段落は見当たらない。

## 指摘
- [MINOR] レイヤー2 のスキル例（73–79 行目）に実在しない例が混じる。`populate-all-rankings` はスキルとして存在せず（現状 134 スキル中に無し）、`sync-articles` は「ブログ記事を D1 に同期」と書くが、プロジェクトは完全 DB レスへ移行済み（articles は article.md → R2 が SSOT、D1 articles テーブルは廃止）。ただし sync-articles の SKILL.md 自身が今も「DB articles テーブルに同期」と古い記述のままで、記事はスキル定義に忠実なだけ（記事より skill が stale）。「典型的なスキル例」という例示の文脈であり読者の判断を誤らせる load-bearing な主張ではないため MINOR。修正案: `populate-all-rankings` を実在スキル（例: `page-data-batch`）に差し替え、`sync-articles` の説明を「ブログ記事を R2 snapshot に反映」に直すと現行アーキテクチャと整合する。
- [MINOR] 内部リンク 5 本のうち `/blog/koumuin-ai-tenshoku-1500man` と `/blog/estat-7-techniques-from-unusable-to-usable` がローカル R2 ミラー・docs/21 のどちらにも存在を確認できなかった（ローカルミラーは縮退済みのため公開済みの可能性は残るが未確証）。リンク切れだと回遊が死ぬため、公開前に R2 公開 URL（stats47.jp/blog/<slug>）で 200 を実測確認すること。残り 3 本（cc-estat-01/18/19）と ranking 2 本（fiscal-strength-index / japanese-population）は実在確認済み。
- [MINOR] 数値の根拠提示は良好だが、「132 個のスキル」「20 個のワークフロー」は実測値（現状 134 スキル / .github/workflows は 39 ファイル）とややズレる。data出典に「2026 年 5 月時点の運用実績値」と注記済みで誇張・虚偽ではないため許容範囲。スナップショット時点を明記しているので可。

## 判定理由
BLOCK 級の指摘はゼロ。図表重複・truncated 表・水増し・curiosity gap の不一致・である調混入・CTA 過多のいずれも該当しない。非データ型記事として実体のある具体性（落とし穴・実測時間・転用パターン・ガバナンス論点）が備わり読者価値は十分。指摘は全て MINOR（例示スキルの精度・未確証リンクの実測確認・数値スナップショットのズレ）で、公開後の brushup で潰せる範囲。よって verdict: PASS。MINOR の 2 点目（リンク 200 実測）は公開直後に必ず確認することを推奨。
