---
type: sns-captions
slug: excel-budget-aggregation
article_title: Excel 予算ファイルを Claude Code で集計 (pandas / DuckDB 経由)
created: 2026-05-18
---

# Excel 予算ファイルを Claude Code で集計 (pandas / DuckDB 経由) — SNS 拡散キャプション

## X (旧 Twitter) — 公開時投稿 (140 字以内、本文 URL 別添前提)

各課から集まる Excel 予算ファイルの集計を Claude Code に任せる手順。Excel を読ませて構造を把握させると人間が説明するより早い。集計は pandas または DuckDB。月次定型業務を `/budget:monthly-aggregate` の 1 コマンド化できます。

#ClaudeCode #公務員 #Excel

## X — 追い投稿 (公開 1 週間後、別角度の切り口で再投稿、140 字以内)

セル結合・非定形フォーマット・元号西暦混在——財政担当が毎月直面する Excel あるあるも、自然言語で指示できる。SQL が読める職員には DuckDB 経由の集計が刺さります。

#公務員 #財政

## Instagram — フィード投稿用キャプション (2200 字以内、改行は 2-3 行ずつ)

各課から集まる Excel 予算ファイルの集計は、財政担当の月次ルーティンの中でも特に時間がかかる仕事。

セル結合、非定形フォーマット、元号と西暦の混在、課ごとに違う様式——人間が手で整える前提のフォーマットが、機械処理を阻みます。

Claude Code に Excel を「読ませて構造を把握させる」と、人間が説明するより早いことが分かります。

集計ロジックは 2 択。
(1) pandas (Python): 柔軟、複雑な処理も可能
(2) DuckDB (SQL): SQL が読める職員に親切、業務引継ぎしやすい

財政担当に SQL 経験者がいるなら DuckDB が刺さります。

集計用 `.claude/skills` を 1 個作れば、月次定型業務が `/budget:monthly-aggregate` の 1 コマンド化。来月以降は実行するだけです。

セル結合・非定形フォーマット・元号西暦混在も自然言語で指示できます。「A 列と B 列が結合されている場合は B 列を優先」といった指示で対応可能。

本記事は無料で全文公開。pandas / DuckDB 両方のサンプルコードと、月次集計スキルの SKILL.md テンプレを公開しました。

#Claude #ClaudeCode #公務員 #自治体DX #Excel #財政 #予算 #pandas #DuckDB #生成AI #業務効率化 #DX #公務員ライフ #自治体

## ハッシュタグ候補

- 主要: #Claude #ClaudeCode #公務員 #自治体DX
- 業務系: #Excel #財政 #予算 #pandas
- 拡散系: #生成AI #業務効率化 #DX
