---
name: project_react_to_news_pipeline
description: じじネタ→即SNSの瞬発力パイプライン(find-metrics/quick-still/react-to-news)を新設。DB復活は却下(瞬発力の本命は発見+生成でDBではない)。発見索引は同義語レイヤー必須(ニュース語彙ギャップ)。
metadata: 
  node_type: memory
  type: project
  originSessionId: e1194c90-b06e-4903-9e42-c8e33dd6bba8
---

2026-07-02、「ブログ/時事(じじ)ネタに瞬時にSNS反応する瞬発力」の要求に対し、**ローカルD1復活は却下**して DBレスのまま瞬発力パイプラインを新設した。

**判断**: 瞬発力のボトルネックは DBクエリ速度ではなく「①ネタ→指標の発見」「②指標→ビジュアル生成」だった(調査で確定)。D1(=エッジ配信用)は用途違いかつ Phase6 肥大→解約を再発させる。「ローカルで即触りたい」直感の正解形は **R2から再生成できるローカル索引JSON(DBレス互換の使い捨てキャッシュ)**。相関は既に `app/correlation/by-ranking-key/<key>.json` にあり1 fetchで横展開ネタが取れる(SNS用途で未活用だった)。任意指標×任意の即席横断が本当に要る将来のみ DuckDBミラー(これもDBレス互換)。

**新設 (Phase 1・全て検証済)**:
- `.claude/scripts/sns/build-discovery-index.ts` → `.claude/state/sns/metric-discovery-index.json`(2211件、git TS から再生成)
- `.claude/scripts/sns/find-metrics.mjs` — 自由文トピック→指標keyランキング(--top/--json)
- `.claude/scripts/sns/news-synonyms.json` — ニュース語→指標語彙 同義語76見出し(移住→転入/転出 等)
- `.claude/scripts/sns/quick-still.ts` — 指標key→R2 fetch→上位5下位5 SVG(横960x404/IG縦1080x1350)+PNG(sharp)+caption.txt。**記事(article.md)非依存**。出力 `.local/sns-quick/<key>/`
- skill `/react-to-news` (`.claude/skills/sns/react-to-news/`、primary_agent x-strategist)

**決定的発見**: 発見索引 単体では「移住/少子化/値上げ」=0件(指標titleは硬い統計用語で語彙ギャップ)。**同義語レイヤーは任意でなく必須**。恒久版は `MetricConfig.tags`(型・search-index配線済・データ空)への editorial keyword バックフィル(2211ファイル=要ユーザー判断・未着手)。

**意図的にやらない**: 投稿の全自動化(publish-x は dry-run→本番の安全ゲート維持=誤爆事故 2026-04-18 由来 / post-instagram は push-r2 必須)。動画(bar-chart-race 10-20分/本)は瞬発力トラック外。

**連結済 (2026-07-02)**: quick-still出力→publish-x は既存の `--media`/`--caption` 直接指定モードで受け渡す (新規コード無し・外科的)。skill Step 5 に具体コマンド記載。dry-run安全ゲート維持。`quick-still` の `<key>.png`+`caption.txt` を `publish-x <key> <date> --media ... --caption ... --dry-run` に渡す。

**見送り (推奨判断)**: tags恒久バックフィル(2211件) は当面不要。同義語辞書(news-synonyms.json 76語)で語彙ギャップは埋まっており、実運用で0件になるネタが出たら辞書に追記して育てる方が低コスト・低リスク。

正典: `.claude/rules/data-sqlite-ssot.md`(DBレス) / `.claude/rules/blog-svg-chart-standards.md`(図規約)。
