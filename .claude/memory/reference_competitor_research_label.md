---
name: 競合調査は GitHub Issues の competitor-research ラベルで検索
description: stats47 の競合調査結果は `competitor-research` ラベル付き Issue に集約。再調査・差別化検討時はまず gh issue list --label competitor-research を確認
type: reference
originSessionId: c8417f1f-0b16-4d1a-afe9-f4b7fa18c5a6
---
stats47 の競合（Web / SNS）に関する調査・観察ログは GitHub Issues の `competitor-research` ラベルに集約されている。

**用途:**
- 過去の競合調査結果を引っ張り出す
- 既知の直接競合・間接競合を再調査前に確認（重複調査を避ける）
- 差別化施策・コンテンツ計画の前提として参照

**コマンド:**
```bash
# ラベル付き Issue 一覧
gh issue list --label competitor-research --state all

# 本文・コメントを含めて検索
gh issue view 143 --comments
```

**初回起票:** 2026-04-27 [Issue #143](https://github.com/uruhayato373/stats47/issues/143)
- 本文: Web 競合 17 サイト列挙 + 上位 3 社（todo-ran / uub / ssds）11 軸マトリクス
- コメント 1: YouTube / Instagram 競合候補
- コメント 2: @riskmap.jp 発見の訂正

**ラベル属性:** 色 `#8250df`（critical-review と同系統の戦略系紫）

**新しい競合を発見したとき:**
- 既存 Issue があればコメント追記、無ければ `[Competitor Research] <観点>` で新規起票
- ラベル `competitor-research` を必ず付与
- 関連: [project_competitor_riskmap_jp.md](project_competitor_riskmap_jp.md)
