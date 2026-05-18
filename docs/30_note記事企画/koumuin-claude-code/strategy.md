---
type: note-strategy
vertical: koumuin-claude-code
created: 2026-05-18
updated: 2026-05-18
status: active
target_articles: 30
free_count: 7
paid_count: 23
mvp_picks: [01, 04, 05, 09, 10]
target_followers_m6: 2000
target_revenue_m6_jpy: 200000
magazine_price_jpy: 980
tags: [koumuin, claude-code, note-strategy]
---

# 公務員 × Claude Code note 戦略

新バーティカル「公務員が Claude Code で仕事を効率化する」の note 量産戦略。全 30 本のドラフトは `docs/31_note記事原稿/koumuin-claude-code/` に格納済み (`ready-to-publish`)。本ドキュメントは公開順・集客導線・マガジン計画・KPI・撤退条件を一元管理する。

## 親プラン

- 戦略プラン (一次): `~/.claude/plans/claude-code-note-cosmic-lerdorf.md`
- ドラフト INDEX: `docs/31_note記事原稿/koumuin-claude-code/INDEX.md`
- ネタ草案: `docs/30_note記事企画/backlog/koumuin-claude-code/ideas.md`
- 既存 note 全体戦略: `docs/30_note記事企画/note戦略.md` (stats47 ランキング系の SSOT、本バーティカルとは別管理)

## 1. 公開順 (30 本の優先順位)

### MVP 5 本 (Week 1-3、撤退判定の材料)

CVR / 集客 / 継続性を検証する最小ロット。無料 3 本で集客 → 有料 2 本で課金転換を測る。

| 順位 | # | slug | 区分 | 公開週 | 役割 |
|---|---|---|---|---|---|
| 1 | 04 | meeting-minutes-30min-to-5min | 無料 | W1 | SNS 拡散ターゲット、最も普遍的な業務課題 |
| 2 | 10 | ai-without-personal-info | 無料 | W1 | 公務員特有の不安「個人情報リスク」を解消 → フォロー獲得 |
| 3 | 01 | claude-code-setup-complete | 有料 ¥1,500 | W2 | 入口商品。読者が「やってみる」最大の壁を解消 |
| 4 | 09 | assembly-question-points | 無料 | W2 | 議会事務局ペルソナへの送客、#05 への布石 |
| 5 | 05 | assembly-answer-prompts | 有料 ¥1,200 | W3 | 議会事務局ペルソナへの本命課金記事 |

MVP 5 本公開後、`/fetch-note-metrics` で CVR と PV を測定 → `docs/04_レビュー/note-koumuin/2026-06-mvp.md` に判定を記録する。

### Series A (Week 4-26、MVP 合格時のみ展開)

MVP で「続行」判定なら残り 25 本をカテゴリごとに 4 週間サイクルで投入。各週 1 無料 + 1-2 有料を基本。

| 公開週 | # | slug | 区分 | カテゴリ |
|---|---|---|---|---|
| W4 | 02 | internal-network-workarounds | 無料 | setup |
| W4 | 03 | it-dept-security-doc | 有料 ¥980 | setup |
| W5 | 11 | hooks-personal-info-masking | 有料 ¥1,200 | security |
| W5 | 12 | audit-ready-settings | 有料 ¥800 | security |
| W6 | 19 | faq-auto-generation | 無料 | pr |
| W6 | 20 | complaint-reply-patterns | 有料 ¥500 | pr |
| W7 | 06 | ordinance-revision-review | 有料 ¥980 | documents |
| W7 | 07 | official-doc-skills | 有料 ¥800 | documents |
| W8 | 14 | excel-budget-aggregation | 無料 | data |
| W8 | 17 | year-on-year-analysis | 有料 ¥500 | data |
| W9 | 08 | proposal-doc-checklist-20 | 有料 ¥500 | documents |
| W9 | 16 | subsidy-doc-consistency | 有料 ¥800 | data |
| W10 | 13 | ollama-offline-local-llm | 有料 ¥1,500 | security |
| W11 | 29 | evaluated-without-side-job | 無料 | career |
| W11 | 18 | pr-magazine-rewrite | 有料 ¥980 | pr |
| W12 | 22 | monthly-routine-skills | 有料 ¥1,200 | automation |
| W13 | 15 | data-preprocessing-intro | 有料 ¥980 | data |
| W14 | 21 | disaster-sns-multilang | 有料 ¥800 | pr |
| W15 | 24 | subagents-parallel-research | 有料 ¥980 | automation |
| W16 | 25 | excel-vba-to-python | 有料 ¥800 | automation |
| W17 | 27 | internal-study-30min | 有料 ¥800 | organization |
| W18 | 28 | ai-skeptic-qa | 有料 ¥980 | organization |
| W20 | 26 | boss-approval-deck | 有料 ¥1,500 | organization |
| W22 | 23 | mcp-internal-system | 有料 ¥1,500 | automation |
| W24 | 30 | post-retirement-career | 有料 ¥1,200 | career |

並べ替え原則: (a) 無料記事を等間隔に配置して新規読者の入口を保つ、(b) 同カテゴリの連続投下は 2 本まで (飽き対策)、(c) 高単価 (¥1,200 以上) は信頼蓄積後 (W10 以降) に配置。

## 2. 集客導線 (無料 7 本 → 有料 23 本)

### 無料 7 本の役割分担

| # | slug | 主導線 |
|---|---|---|
| 02 | internal-network-workarounds | → 01 (環境構築) への前段、setup カテゴリ全体 |
| 04 | meeting-minutes-30min-to-5min | → 05 (議会答弁) / 06 (条例レビュー) / 07 (公文書校正) |
| 09 | assembly-question-points | → 05 (議会答弁) の本命課金へ橋渡し |
| 10 | ai-without-personal-info | → 11 (hooks マスキング) / 12 (監査ログ) / 13 (Ollama) |
| 14 | excel-budget-aggregation | → 15 (データ前処理) / 16 (補助金整合) / 17 (前年比較) |
| 19 | faq-auto-generation | → 18 (広報誌) / 20 (苦情返信) / 21 (災害多言語) |
| 29 | evaluated-without-side-job | → 30 (退職後キャリア) / 26 (上司承認資料) |

### 記事内 CTA 設計

各無料記事の末尾に固定 CTA を設置する。

1. **同カテゴリの有料記事 1-2 本**へのリンク (「もっと深く知りたい方は」)
2. **マガジン購読**への導線 (「月 ¥980 で過去全記事 + 月 4 本の新作」)
3. **X / Instagram フォロー** (継続的な業務 Tips を受け取る)
4. **stats47.jp への送客は本バーティカルでは原則しない** (公務員読者と都道府県統計読者はペルソナが異なるため。例外: #14 #15 #17 のデータ系のみ末尾に「データ可視化なら stats47.jp」を 1 行)

### 内部リンク戦略

- カテゴリ内記事は相互リンク (例: 11 → 12 → 13、document 系は 05 → 06 → 07 → 08)
- 関連 SVG / 図解は再利用しない (各記事の独立性を保つ)
- 「公務員 × Claude Code シリーズ」マガジン誘導を全記事末尾に固定

## 3. マガジン計画

### 構成

- 名称: 「公務員のための Claude Code 実務マガジン」
- 価格: **¥980 / 月**
- 提供内容:
  - 過去公開した全記事アーカイブ (有料記事含む) を読み放題
  - **月 4 本の限定記事** (マガジン購読者のみ、通常記事に昇格させない)
  - 月 1 回の Q&A 投稿 (購読者からの質問への回答記事)
  - X / Instagram で月次レポート (「今月の Tips 5 選」など)

### 開設時期

- **MVP 5 本公開後すぐは開設しない**。読者が「無料・有料記事をいくつか読んでみる → マガジンも気になる」という導線を作るため、Series A 開始から開設する (W4 目安)
- 開設時点で過去公開済の有料記事 5-7 本が読めるようにする (¥500-¥1,500 × 5 本 = ¥4,500-7,500 相当)

### 目標

| マイルストーン | マガジン購読者 |
|---|---|
| M1 (Week 4) | 10 名 (開設直後) |
| M3 (Week 13) | 30 名 |
| M6 (Week 26) | 150-200 名 |

200 名 × ¥980 = 月 ¥196,000 が目標。単体記事収益と合わせて M6 で月 ¥20 万を狙う。

### マガジン限定コンテンツの作り方

通常 30 本のラインに入らない「機微な内容」「実験的内容」をマガジン限定に回す。

- LGWAN 上の MCP 実装の踏み込んだ続編 (#23 の応用編)
- 具体的な ¥ベースの ROI 試算テンプレート (Excel ファイル付き)
- 失敗事例集 (匿名加工した「やらかし集」)
- 月 1 回の Q&A 記事

## 4. KPI (マイルストーン)

| 時点 | フォロワー | 月総収益 | マガジン | 累計記事 |
|---|---|---|---|---|
| M1 (Week 4) | 100 | ¥10,000 | 10 名 | 5 (MVP) |
| M3 (Week 13) | 500 | ¥50,000 | 30 名 | 15 |
| M6 (Week 26) | 2,000 | ¥150,000-200,000 | 150-200 名 | 30 (全公開) + α |

### 各 KPI の根拠

- **フォロワー 100 → 500 → 2,000**: 競合調査 (`reference_competitor_indicator_benchmark.md`) では「公務員 × AI」系で 1 万フォロワー超は不在、2,000 で上位プレイヤー入り
- **収益 ¥1 万 → ¥5 万 → ¥15-20 万**: CVR 2% × 平均単価 ¥1,000 × 月 PV 想定で試算 (親プラン参照)
- **マガジン 10 → 30 → 200 名**: note メンバーシップの一般的な転換率 (フォロワーの 10% 程度) を想定

### 計測手順

```bash
# 月次のメトリクス取得 (フォロワー数 / 記事別 PV / スキ / 有料 CVR / 累計収益)
/fetch-note-metrics

# バーティカル別集計 (koumuin-claude-code タグで絞り込み)
node .claude/scripts/note/aggregate-koumuin-metrics.cjs \
  --since YYYY-MM-DD --until YYYY-MM-DD \
  --tag koumuin-claude-code
```

集計結果は `docs/04_レビュー/note-koumuin/YYYY-MM.md` に月次レビューとして記録する。

## 5. 撤退条件

判断は感情でなく数字で行う。以下の条件に該当したら次のアクションに移る。

| タイミング | 条件 | アクション |
|---|---|---|
| MVP 5 本公開後 (Week 3) | 有料 CVR < 0.5% | 「Claude Code」を外し「公務員 × AI」全般へピボット、または撤退 |
| Week 13 (M3) | 月収益 < ¥10,000 が 3 ヶ月連続 | マガジン開設保留、X / Instagram 連携の強化に方向転換 |
| Week 13 (M3) | フォロワー < 200 | 記事 SEO 見直し、SNS 拡散テコ入れ |
| Week 26 (M6) | 月収益 < ¥50,000 | note 単体撤退、講演 / 法人研修パイプラインへ転換 |
| 任意の時点 | 「stats47 本業の KPI が落ちている」と週次レビューで判定 | note を週 5 本 → 週 3 本に減速 |

撤退判定はすべて `docs/04_レビュー/note-koumuin/` の月次レビューで根拠とともに記録する。「なんとなく続けて気づいたら 6 ヶ月たっていた」を避けるため、各タイミングで「続行 / 縮小 / 撤退」のいずれかを明示する。

## 6. X 連携方針

各記事公開時に X (旧 Twitter) で告知投稿を出す。

### 投稿頻度

- 公開時投稿: 各記事公開直後 (140 字以内、本文 URL 別添)
- 追い投稿: 公開 1 週間後 (別角度の切り口で再投稿、140 字以内)
- 計 2 投稿 / 記事。30 本で 60 投稿 (週 5 本想定で 12 週分の SNS 弾)

### キャプション格納

各記事ディレクトリの `captions.md` に X / Instagram 用キャプションを格納する。公開時にコピペで使用。

- 形式: `docs/31_note記事原稿/koumuin-claude-code/<NN>-<slug>/captions.md`
- 構造: X 公開時 / X 追い投稿 / Instagram キャプション / ハッシュタグ候補

### ハッシュタグ方針

- X: 2-4 個 (多すぎると視認性低下)
- Instagram: 10-15 個 (推奨範囲内、過剰は逆効果)
- 主要: `#Claude` `#ClaudeCode` `#公務員` `#自治体DX` `#生成AI`
- 業務系: 記事内容に応じて `#議事録` `#議会答弁` `#条例` `#起案` `#補助金` `#広報` `#防災` 等を選択

### X 上でのアカウント設計

- bio: 「元自治体職員 / Claude Code で公務員業務を効率化する Tips を発信 / note: <url>」
- 固定ツイート: マガジン誘導 + 無料記事 3 本リンク
- 投稿時間帯: 平日 7-8 時 (通勤時間) / 12-13 時 (昼休み) / 21-22 時 (帰宅後) を優先

## 7. Instagram 連携方針

### 投稿戦略

- フィード投稿: 各記事公開時に 1 投稿 (10 枚カルーセル: 表紙 + TL;DR 5 枚 + CTA + α)
- リール: 月 2-4 本 (記事のエッセンスを 30-60 秒に圧縮、業務 Tips 型)
- ストーリーズ: 公開当日 + 1 週間後の追い告知

### キャプション設計

- 2200 字以内、改行は 2-3 行ずつ (Instagram の可読性に最適化)
- 3-5 段落構成: 問題提起 → 解決の方向性 → 記事の要点 → 行動喚起
- ハッシュタグは末尾にまとめて 10-15 個

### カルーセル画像

- 各記事の SVG (95 個) を流用可能 (rsvg-convert で PNG 化)
- 表紙は記事タイトル + 「Before/After」「30 分 → 5 分」等の数字ベース訴求
- 詳細はキャプション格納時に各記事固有の指示を `captions.md` に記載

## 8. 守秘・倫理ガード

すべての記事 / SNS 投稿で以下を遵守する。

- **「私は」「自分は」「自分が」など発信者一人称表現は使わない** (虚偽記載リスク回避、Phase 4 で全 30 本から除去済)
- **具体的な自治体名・部署名・職員名・案件名は出さない**
- **「典型例」「人口 N 万人規模」「ある自治体では」など第三者視点で書く**
- **過剰な煽り表現 (「神」「爆速」「劇的」等の連発) は避ける**
- **個人情報を含むファイルを Claude に投げる手順は記載しない** (#04 は守秘配慮を冒頭で必ず注記)
- **AI 補助を業務文書に用いた場合は起案文に明示する運用を推奨する** (記事内で言及)

## 9. 親プランへの参照

本戦略の前提となる調査・収益試算・段階的ロードマップは親プランに記載。

- 親プラン: `~/.claude/plans/claude-code-note-cosmic-lerdorf.md`
  - 市場性サマリ (公務員 280 万人、自治体生成 AI 導入率、note 有料記事成長率)
  - 既存スキル転用マップ (publish-note 等の改修要点)
  - Phase 0 (MVP) → Phase 1 (改修) → Phase 2 (量産) のロードマップ
  - 撤退条件の根拠と数値
  - リスク 5 項目 (CLI スキルミスマッチ / ネタ枯渇 / 守秘 / note 規約 / stats47 本業との時間配分)

本ドキュメントは「公開順 / 集客 / マガジン / KPI / 撤退」の運用層を扱う。市場調査・スキル改修等の戦略層は親プランを参照。

## 10. 関連ファイル

- ドラフト本体: `docs/31_note記事原稿/koumuin-claude-code/<NN>-<slug>/draft.md`
- SNS キャプション: `docs/31_note記事原稿/koumuin-claude-code/<NN>-<slug>/captions.md` (本戦略策定と同時に全 30 本作成)
- 撮影ガイド: `docs/31_note記事原稿/koumuin-claude-code/<NN>-<slug>/screenshot-guide.md`
- 画像: `docs/31_note記事原稿/koumuin-claude-code/<NN>-<slug>/images/*.svg`
- 月次レビュー: `docs/04_レビュー/note-koumuin/YYYY-MM.md` (M1 / M3 / M6 で必須)
- 既存スキル: `.claude/skills/note/{publish-note,write-note-section,design-note-structure,edit-note-draft}/`
- メトリクス: `.claude/state/metrics/note/` (`/fetch-note-metrics` で更新)
