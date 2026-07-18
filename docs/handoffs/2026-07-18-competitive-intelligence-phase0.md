---
type: session-handoff
date: 2026-07-18
status: active
topic: competitive-intelligence-phase0
tags: [競合分析, SNS, browser-use, Claude-Code]
---

# 競合インテリジェンス Phase 0 引き継ぎ

## 背景

ユーザー要望は、stats47に関連するYouTube・X・Instagram投稿と競合Webサイトを継続調査し、伸びた題材、
フック、画像、動画、landingをカタログ化して、第三者素材を複製せずstats47向けに適応すること。

Codexは実装を行わず、Claude Codeが段階実装できる詳細仕様を作成した。

- 仕様: `docs/02_実装計画/31_競合インテリジェンス・勝ちパターンカタログ仕様.md`
- TODO: `docs/todo/02_機能バックログ.md#COMPETITIVE-INTELLIGENCE-01`

## 今回完了したこと

- YouTube・X・Instagram・Webの検索軸とquery templateを整理。
- 競合をdirect / format / attention / search / amplifierの5種類に分類。
- artifact、observation、assessment、pattern、adaptation、experimentの証拠連鎖を定義。
- git TS / R2 / `.claude/state` / `docs` のSSOT境界を定義。永続D1は不採用。
- 総再生数だけでなく、公開後日数、同一account通常値、形式bucketを使う決定的scoreを定義。
- browser-useは上位候補の目視分析に限定し、API・Web検索を候補発見の先行手段とした。
- Haiku / Sonnet / Opusの責務、エスカレーション条件、Output Contract、write boundaryを定義。
- gallery `/research`、権利・差別化・truth・brand・landing gate、継続計測を定義。
- 実装をPhase 0〜5に分割し、仕様末尾にPhase 0開始promptを記載。

コード、agent、skill、state、R2、本番には変更を加えていない。文書のみ。

### 追加: YouTube初回競合分析（2026-07-18）

- 12query、2024年以降、viewCount順で候補を取得し、重複排除後50動画・45channelを分析。
- 各channelのuploads直近25件から同尺bucket medianを計算し、channelLiftを算出。
- 上位9件のthumbnail/title/descriptionを目視し、常識検証、実感尺度、流動・勢力、自県探索を優先型と判定。
- 結果: `docs/04_レビュー/2026-07-18-youtube-competitive-analysis.md`。
- rawは`/tmp/youtube-competitive-raw.json`のみ。schema確定前のためrepo/R2へ永続化していない。
- API調査・文書化のみで、SNS投稿、R2 write、外部公開は行っていない。

## 次セッションで行うこと

**Phase 0だけを実装する。一括実装しない。**

1. `CLAUDE.md` と仕様 §18 の正典を読む。
2. 既存 `.claude/skills/sns/x-viral-research/`、`competitor-scan`、`trend-scout`、
   `.claude/state/sns/x-viral-posts.json`、`apps/gallery` の実在・exports・schema・呼び出し元を確認する。
3. `.claude/scripts/research/data/` の型付きsearch configとtaxonomyを設計する。
4. artifact / observation / assessment / pattern / adaptationの型とvalidatorを追加する。
5. URL canonical化、安定ID、observation append、null欠損、status非巻戻しのunit testを追加する。
6. 既存X台帳は変更せず、fixture上のread-only変換だけを検証する。
7. 変更ファイル、検証結果、Phase 1以降の未実装、既存仕様との不整合を報告する。

## Phase 0で行わないこと

- 外部サイトの本番巡回、browser-useログイン、スクリーンショット収集。
- R2 read/write、SNS投稿、draft登録、gallery `/research` UI。
- agents/rules/catalogの自動書換え。
- 本番デプロイ。
- 既存X台帳のin-place migration。

## 作業ツリー注意

2026-07-18時点で、この作業ツリーには本件以外の未コミット変更と未追跡ファイルが複数ある。
特に `.claude/agents/trend-scout.md` と `.claude/skills/sns/x-viral-research/` は本仕様と関連するが、
今回Codexが作成したものではない。所有者不明の変更として保持し、内容を確認せず上書き・削除・一括commitしない。
Claude CodeとCodexを同時に同一working treeで動かさず、必要なら別worktreeを使用する。

## 検証状態

- `git diff --check`: PASS（仕様書作成時点）。
- コード変更なしのためtype-check、unit test、buildは未実行。
- YouTube Data APIの検索・公開statistics取得仕様は2026-07-18に公式文書を確認し、仕様 §18へURLを記録。
- X・Instagramの公開項目は変更され得るため、実装時に公式文書と実画面を再確認する。

## 消化条件

Phase 0が実装・検証され、残タスクが機能バックログへ反映されたら、本ハンドオフから恒常的な決定を
該当rules/agent/skillへ抽出し、このファイルを削除する。実装途中ならstatusをactiveのまま維持する。
