---
type: sns-captions
slug: subagents-parallel-research
article_title: Subagents で「複数案件の並行調査」を回す
created: 2026-05-18
---

# Subagents で「複数案件の並行調査」を回す — SNS 拡散キャプション

## X (旧 Twitter) — 公開時投稿 (140 字以内、本文 URL 別添前提)

Claude Code の Subagents は並列調査と相性が良い。5 件並列なら所要時間が 1/3-1/4 に。各 Subagent には「OUTPUT FORMAT」を冒頭で固定するのが品質維持の鍵 (末尾の word limit は無視される話)。

#ClaudeCode #公務員 #調査業務

## X — 追い投稿 (公開 1 週間後、別角度の切り口で再投稿、140 字以内)

Subagent 失敗パターンは「あれもこれも調べて」と曖昧に投げること。タスクは独立した小タスクに分解する。個人情報・機密案件は Subagent に投げない (プロンプトに含めない) 鉄則も忘れずに。

#公務員 #自治体DX

## Instagram — フィード投稿用キャプション (2200 字以内、改行は 2-3 行ずつ)

公務員の業務には「複数案件を並行調査して比較・選定する」場面が多くあります。

他自治体の事例調査
複数事業者の比較検討
複数の関連法令の整合確認
他県の補助制度の横断調査

逐次に進めると半日かかる調査も、Claude Code の Subagents 機能なら 5 件並列で 1/3-1/4 の時間に圧縮できます。

Subagents とは、Claude Code 内で並列に走る独立した調査エージェント。`.claude/agents/<name>.md` で定義します。

品質維持の鍵は OUTPUT FORMAT の固定。各 Subagent の prompt 冒頭で「結果は表のみ・列名はこれ・各セル 10 単語以内」のように固定すると、揃った形式で結果が返ります。
末尾に書いた word limit は AI に無視されることが多いので、必ず冒頭に置きます。

絶対の鉄則。
(1) 個人情報・機密案件は Subagent に投げない (プロンプトに含めない)
(2) タスクは独立した小タスクに分解 (「あれもこれも調べて」は失敗する)
(3) OUTPUT FORMAT は冒頭固定

note 有料記事 (¥980) では、Subagent 定義の完全テンプレ、5 種類の調査パターン (事例 / 法令 / 補助金 / システム比較 / 統計) の prompt サンプルを公開しました。

#Claude #ClaudeCode #公務員 #自治体DX #Subagents #調査業務 #並列処理 #生成AI #業務効率化 #DX #公務員ライフ #自治体

## ハッシュタグ候補

- 主要: #Claude #ClaudeCode #公務員 #自治体DX
- 業務系: #Subagents #調査業務 #並列処理 #事例調査
- 拡散系: #生成AI #業務効率化 #DX
