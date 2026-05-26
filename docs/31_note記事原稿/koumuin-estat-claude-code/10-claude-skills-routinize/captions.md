---
type: sns-captions
slug: claude-skills-routinize
article_title: 月次の e-Stat 集計を .claude/skills で 1 コマンド化する — 定型業務をスキル化する設計
created: 2026-05-26
---

# 月次の e-Stat 集計を .claude/skills で 1 コマンド化する — SNS 拡散キャプション

## X (旧 Twitter) — 公開時投稿 (140 字以内、本文 URL 別添前提)

毎月 8-16 時間かけていた e-Stat 月次集計、.claude/skills に SKILL.md 1 枚保存すれば「/monthly-estat-update」と打つだけで 5 分。人事異動が起きても、新任は SKILL.md を読めば前任者の段取りで動かせる。

#ClaudeCode #公務員 #eStat #自治体DX

## X — 追い投稿 (公開 1 週間後、別角度の切り口で再投稿、140 字以内)

Excel マクロが書ける職員が異動 → 後任が触れず白紙からやり直し。自治体あるあるの継承断絶。SKILL.md は「読めるテキストの業務マニュアル」なので、引き継ぎ書類 3 行で済むようになる。

#公務員 #自治体DX #人事異動 #業務引き継ぎ

## Instagram — フィード投稿用キャプション (2200 字以内、改行は 2-3 行ずつ)

毎月第 1 営業日。
「先月分の指標を更新して、課内資料に載せて」
この依頼で残業確定、統計担当あるあるです。

e-Stat にログインして統計表 ID を覚え直し、
API キーをどこに保存したか探し、
ダウンロード形式を毎回間違え、
Excel に貼り直す。

1 回 2-3 時間、毎月発生。
人事異動が起きると、新任者は最初の月だけで丸 1 日溶かします。

Claude Code に同じ手順をテキスト 1 枚で保存しておけば、
翌月以降は「/monthly-estat-update」と打つだけで全工程が走ります。

初回 2-3 時間 → 月次 5 分。
年間 96-192 時間 = 12-24 日相当の削減。

しかも .claude/skills/ に保存した SKILL.md は、
ただのテキストファイル。

異動した前任者の暗黙知 (「あの統計表 ID は 0003448237」「先月比 5% 以上は注意」) は、
SKILL.md の中に記述として残っています。

新任者は引き継ぎ書類 3 行を読み、ターミナルで /monthly-estat-update と打つだけで、
前任者と同じ集計が走る。

これが「skill 化」の本当の価値です。
Excel マクロより読めて、直せて、引き継げる。

note では SKILL.md の完成形・既存 skill との組み合わせ方・庁内での共有運用 (共有フォルダ vs Git) を有料部分で公開しています。

stats47.jp (約 2,000 のランキングを毎日自動更新) も、十数個の skill の組み合わせで回しています。動いている実例として参考にどうぞ。

#Claude #ClaudeCode #公務員 #自治体DX #eStat #統計データ #生成AI #業務効率化 #ClaudeSkills #SKILL #自動化 #定型業務 #人事異動 #業務引き継ぎ

## ハッシュタグ候補

- 主要: #Claude #ClaudeCode #公務員 #自治体DX #eStat
- 業務系: #定型業務 #月次集計 #業務引き継ぎ #人事異動 #自動化
- skill 系: #ClaudeSkills #SKILL #SkillMd #slashコマンド
- 拡散系: #生成AI #業務効率化 #DX #データ分析
