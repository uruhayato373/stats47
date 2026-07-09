---
type: sns-captions
slug: mcp-sqlite-search
article_title: MCP sqlite で自前 DB と e-Stat を連携 — stats47 のような統計ダッシュボードを職場で再現
created: 2026-05-26
---

# MCP sqlite で自前 DB と e-Stat を連携 — SNS 拡散キャプション

## X (旧 Twitter) — 公開時投稿 (140 字以内、本文 URL 別添前提)

e-Stat を毎回 Web で叩いて Excel 集計、月 10-20 時間。SQLite に貯めて MCP sqlite 経由で Claude Code に SQL を組ませれば、依頼受領から回答まで 1 分。stats47 と同じ仕組みを職場サイズで再現する設計。

#ClaudeCode #公務員 #eStat #MCP #自治体DX

## X — 追い投稿 (公開 1 週間後、別角度の切り口で再投稿、140 字以内)

MCP sqlite を使うとき、絶対やってはいけないのが「個人情報 DB を接続すること」。集計済データ専用のコピーを別途用意して接続するのが安全運用。守秘配慮チェックリストと SQLite ファイル分離の話。

#公務員 #自治体DX #情報セキュリティ #守秘義務

## Instagram — フィード投稿用キャプション (2200 字以内、改行は 2-3 行ずつ)

「他自治体との比較資料を作って」
「過去 5 年の推移を出して」
「議員から特定の県との対比を急ぎで」

統計担当の依頼は、毎回データの切り口が違う。
e-Stat の Web UI を毎回叩き、Excel に貼り、関数を組み立てる。

1 回 30 分から 1 時間。月 20 件で 10-20 時間。

データを 1 度 SQLite に貯めてしまえば、
Claude Code が SQL で自由に検索できる状態を作れます。

所要時間は依頼受領から回答まで 1 分。
年間 100-220 時間の削減に直結します。

MCP (Model Context Protocol) は、
Anthropic が 2024 年に公開した、
Claude Code と外部ツールをつなぐ標準プロトコル。

.mcp.json に sqlite サーバーを 1 行追加するだけで、
Claude Code が SQLite ファイルに直接 SQL を発行できるようになります。

stats47.jp の裏側では、
Cloudflare D1 (SQLite 互換) に 47 県 × 約 2,000 指標 ≒ 約 50 万行が格納されており、
MCP sqlite 経由で Claude Code が SQL で検索できる構成になっています。

1 自治体規模なら、stats47 の 1/10-1/20 で十分。
200 指標 × 47 県 ≒ 9,400 行を SQLite ファイル 1 個に収めるだけ。
クラウド BI ライセンス料は ¥0、LGWAN 制約下でも動作可能。

ただし公務員が MCP sqlite を使うときの絶対条件があります。

「個人情報 DB を MCP に接続しないこと」

住基・税・健康診断など個人特定可能な DB を Claude Code 経由で見せるのは、
情報セキュリティポリシー違反になる可能性が高い。

集計済データ専用のコピーを別途用意し、
ファイル名に mcp-readonly- プレフィックスをつけ、
本番 DB と物理的に分離する運用が安全。

note では .mcp.json の最小構成・SQL の自動生成例・stats47 のテーブル設計・守秘配慮チェックリスト・1 自治体規模の ROI 試算 を有料部分で公開しています。リンクから本文へどうぞ。

#Claude #ClaudeCode #公務員 #自治体DX #eStat #統計データ #生成AI #業務効率化 #MCP #SQLite #データベース #SQL #ダッシュボード #stats47

## ハッシュタグ候補

- 主要: #Claude #ClaudeCode #公務員 #自治体DX #eStat #MCP
- 業務系: #ダッシュボード #データベース #SQL #SQLite #データ活用
- セキュリティ系: #情報セキュリティ #守秘義務 #個人情報保護
- 拡散系: #生成AI #業務効率化 #DX #データ分析
