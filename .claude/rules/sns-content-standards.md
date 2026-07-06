# SNS コンテンツ標準 (チャネル戦略 + 投稿雛形 + 頻度リミットの正典)

stats47 の SNS 運用 (X / Instagram / YouTube / note) における**実行規約の単一ソース (SSOT)**。
SNS 投稿を企画・生成・投稿・計測する agent / skill / 人間はこれに従う。

> **方式**: `chart-component-standards.md` / `blog-quality-standards.md` と同じ「rules に規約カタログ 1 ファイル、
> skill/agent は参照のみ」パターン。人間向けの戦略背景・KPI 判定は `docs/10_SNS戦略/` にあり、
> **食い違う場合は本ファイル (実行規約) が優先**。docs 側は読み物、rules 側が正典。

---

## 0. チャネル別の位置づけ (2026-07 更新)

| チャネル | 位置づけ | 目標 | 頻度上限 | 主フォーマット | primary agent |
|---|---|---|---|---|---|
| **Instagram** | **主力** | フォロワー 10K (2027-02)・保存率 | カルーセル 2 + リール 1 / 週 | 6 枚カルーセル / Reels | `instagram-strategist` |
| **X** | 自動化・トレンド瞬発 | 1-2K 維持・サイト送客 | 予約 2-3 / 週 + 引用RT 随時 (1 日 ≤ 3) | ランキング投稿 / 引用RT | `x-strategist` |
| **YouTube** | 凍結 → **月 1 本の慎重再開** | シャドウバン非再発・SUGGESTED_VIDEO 回復観測 | **月 1 本のみ** | BCR 長尺 / 47 県まとめ | `youtube-strategist` |
| **note** | 外部衛星 | stats47 への送客 | 月 1-2 本 | 広い検索意図の記事 | `note-manager` |
| **TikTok** | **撤退 (恒久)** | — | **0 (投稿しない)** | — | — |

### 差別化軸

競合 @riskmap.jp (治安/心霊系で 1 本 1-2 万いいね) の**感情煽り路線には入らない**。stats47 は
**信頼性 × 網羅性 × Web 送客**を軸に、「数字対比・意外性」で感情トリガーを踏む
(memory `feedback_sns_growth_emotion_themes` / `project_sns_10k_roadmap`)。テーマは数字の格差の大きさではなく、
**財布・地元愛/自虐・子育て不安・格差への怒り・意外性**という人間の欲望/コンプレックスから逆算する。

---

## 1. 頻度リミット (機械的に守る禁止事項)

| ルール | 値 | 根拠 |
|---|---|---|
| **TikTok に投稿しない** | 0 | 撤退恒久 |
| **YouTube は月 1 本を超えない** | ≤ 1 / 月 | シャドウバン真因 = 68 本/月 の量産 + 同タイトル再投稿 28 本 (2026-04) |
| **YouTube タイトル重複・再投稿の全面禁止** | — | 同上。`check-youtube-duplicate.cjs` (5 層) を必ず通す |
| **X 引用RT は 1 日 3 本まで** | ≤ 3 / 日 | スパム判定回避 |
| **X 予約は週 2-3 本** | 2-3 / 週 | 送客主目的、量産しない |
| **IG は Graph API 25 件/24h 上限** | ≤ 25 / 24h | Meta 制約 |
| **同一内容の連投禁止 (全チャネル)** | — | インプレッション食い合い |
| **X 引用RT は 72h 以内のツイートのみ・炎上/政治回避** | — | ブランド毀損防止 |

これらは skill 実行時にガードスクリプトが検証する (YouTube = `check-youtube-post-budget.cjs`)。
新規投稿スキルを作る場合は本表を必ず参照し、上限を超える経路を作らない。

---

## 2. 投稿雛形カタログ

投稿本文は下記テンプレに従う。各 post 系スキルは「雛形は本カタログ参照」に統一する
(スキル内にテンプレを重複させない = ドリフト防止)。

### 2-1. X ランキング投稿

```
【都道府県ランキング】{テーマ}

🥇1位 {県} {値}{単位}
😱47位 {県} {値}{単位}

{1 行の気づき — 意外性・対比を効かせる}

詳しくは👇
{UTM付きURL}

#都道府県 #ランキング #{テーマ関連タグ}
```

- ハッシュタグは 3-5 個。47 県全データは載せない (X は瞬発力・詳細はサイトへ)
- URL は §4 の UTM 規則に従う

### 2-2. X 引用RT

- **対象判定**: トレンド入りの話題 / 72h 以内のツイート / 統計で補足できる話題。炎上系・政治系は避ける
- **本文**: テキストのみが既定。動画添付は station-passengers / migration-flow の既存素材のみ opt-in
- **型**: 引用元の主張を統計で肯定/否定/深掘りする 1-2 文 + UTM付きURL (任意)

### 2-3. Instagram カルーセル (6 枚構成)

| 枚 | 内容 |
|---|---|
| 1 | 表紙 (テーマ + フック。数字対比・意外性を大きく) |
| 2 | Top5 (棒 or カード) |
| 3 | コロプレス地図 (47 県の地理分布) |
| 4 | Bottom5 |
| 5 | 気づき解説 (なぜこの分布か) |
| 6 | 出典 + 「保存してね」CTA |

キャプション:
```
【都道府県ランキング】{テーマ}

1位: {県} {値}
47位: {県} {値}

{3-4 行の気づき}

保存して後で見返してね📌
プロフィールのリンクから全 47 県が見られます

#都道府県ランキング #{8-13 個のタグ}
```
- 2200 字以内。保存・いいね誘導を最優先。スライド最後に必ず保存 CTA

### 2-4. Instagram リール

- **15 字以内のフック**を冒頭に (予測 → 答え合わせ型)。例:「1 位は意外なあの県」
- 数字対比 × 意外性で 3-5 秒以内に引く。完視聴・保存を狙う

### 2-5. 6 角度フレーム (共通)

1 トレンド/1 metric から複数キャプションを作る際の切り口。IG は `/post-ig-6angles` が主力、X は手動時に利用可。

| 角度 | 型 |
|---|---|
| 結論 | 「結論、{県} が {テーマ} で圧倒的」 |
| 理由 | 「なぜ {県} が 1 位か？ 理由は {構造}」 |
| 体験 | 「{県} 出身だけど、これは実感ある」 |
| 反論 | 「{通説} と思われがちだが、データは逆」 |
| 数字 | 「{倍率}倍差。1 位 {値} vs 47 位 {値}」 |
| ハウツー | 「{テーマ} で {県} を選ぶなら知っておくこと」 |

### 2-6. YouTube 月 1 本

- タイトル 50 字以内・SEO キーワード先頭・**過去タイトルと重複させない**
- 投稿前チェックリスト (全通過が必須):
  - [ ] `check-youtube-post-budget.cjs` で当月未投稿を確認 (月 1 上限)
  - [ ] `check-youtube-duplicate.cjs` (5 層) で重複ゼロ
  - [ ] 投稿翌日に `diagnose-shadowban.js` で診断
- フォーマットは BCR 長尺 or 47 県まとめの**高品質 1 本**。Shorts 量産はしない

### 2-7. note 衛星記事

- 広い検索意図 (移住 / 年収 / 子育て 等) を外部で獲得し stats47 へ送客
- 本文中 2-4 箇所で stats47 リンク (§4 の通り note は素の URL)
- 全文重複禁止。月 1-2 本

---

## 3. 投稿台帳 (posts.json への記録は必須)

全チャネルの投稿は `.claude/state/sns/posts.json` に記録する。**これが投稿履歴の SSOT** (完全DBレス。
永続 D1 は使わない)。

- 書込口は `sns-posts-store.cjs` / `/mark-sns-posted` のみ。直接 JSON を手編集しない
- レコードは snake_case: `id / platform / post_type / domain / content_key / caption / post_url /
  quote_url / media_path / status / scheduled_at / posted_at / impressions / likes / reposts /
  replies / bookmarks / metrics_updated_at / template / metric_keys / ...`
- メトリクスは投稿後に `/update-sns-metrics` が UPDATE。時系列 snapshot は
  `.claude/skills/analytics/sns-metrics-improvement/snapshots/` が SSOT

---

## 4. UTM 規則 (旧 generate-utm-url を吸収)

SNS 投稿の stats47.jp リンクには UTM を付ける。note は付けない (素の URL)。

### ベース URL

| ドメイン | URL |
|---|---|
| ranking | `https://stats47.jp/ranking/<rankingKey>` |
| compare | `https://stats47.jp/compare?areas=<areaA>,<areaB>&cat=<categoryKey>` |
| correlation | `https://stats47.jp/correlation?x=<keyX>&y=<keyY>` |

### パラメータ

| パラメータ | 値 |
|---|---|
| `utm_source` | `x` / `instagram` / `youtube` |
| `utm_medium` | `social` |
| `utm_campaign` | ranking: `<rankingKey>` / compare: `compare-<areaA>-vs-<areaB>` / correlation: `correlation-<keyX>--<keyY>` |
| `utm_content` | `<template>` (例: `shock`, `paradox`)。YouTube pinned_comment では `<template>-pinned` |

例:
```
https://stats47.jp/ranking/taxable-income-per-capita?utm_source=x&utm_medium=social&utm_campaign=taxable-income-per-capita&utm_content=shock
```

note の例 (UTM なし):
```
https://stats47.jp/ranking/taxable-income-per-capita
```

---

## 5. パイプライン (チャネルごとに 1 本の線で辿る)

| チャネル | 企画 | 生成 | 投稿 | 計測 |
|---|---|---|---|---|
| **X** | `post-x` / `find-quote-rt` / `react-to-news` | (キャプション) | `publish-x` → `mark-sns-posted` | `update-sns-metrics` |
| **IG** | `generate-instagram-schedule` (+ `post-ig-6angles`) | `render-sns-stills` | `post-instagram` (GHA cron) → `mark-sns-posted` | `update-sns-metrics` |
| **YouTube** | `bar-chart-race` (企画・生成・render) | (同) | `post-youtube` (月 1・ガード 3 点) → `mark-sns-posted` | `update-sns-metrics` |

- **Remotion レンダ入口の正典**: 静止画/動画 = `render-sns-stills`、BCR = `bar-chart-race`、
  `preview-remotion` はプレビュー専用 (レンダしない)
- 週次運用は `/sns-weekly-plan` が上記を 1 コマンドで束ねる
- 競合の定点観測は `/competitor-scan`

---

## 5.5 統合メディアコンソール (`/sns-gallery`) と R2 素材保持ポリシー

素材の目視確認 (動画再生)・caption 微調整・投稿/予約・メトリクス閲覧は
**ローカル統合メディアコンソール** (`npm run gallery` → http://127.0.0.1:4747/) で行える
(skill `.claude/skills/sns/sns-gallery/SKILL.md`、server `.claude/scripts/gallery/server.mjs`)。
`npm run sns:gallery` は後方互換 alias。SNS 投稿は `/sns` セクション、OGP/リンクカード/note カバー・
記事内画像/動画 master は `/assets`、ブログ SVG カタログは `/svg` で横断閲覧する
(画像資産の列挙 collector は CI 静的ギャラリー `build-image-gallery.mjs` と `.claude/scripts/lib/gallery-collectors.mjs` を共用)。

- **ギャラリー経由の投稿も台帳規約は同一**: posts.json への書込は `sns-posts-store.cjs` 経由のみ
  (server も同経路)。§1 の頻度リミットは残枠バッジ + ガードで enforce される
- **draft レコード運用**: 未投稿素材は `status=draft` で台帳に登録して管理する (新 manifest は作らない)。
  R2 にあるが台帳に無い素材は画面の「R2 探索」(HEAD probe) → draft 登録で回収
- **IG 予約の二重書込**: ギャラリーの「IG 予約登録」は schedule JSON + posts.json (scheduled) を
  同一ハンドラで同時書込する。不整合は `GET /api/ig-consistency` が検出
- **IG cron の schedule ファイルは自動選択** (2026-07-07〜): `post-from-schedule.cjs` は
  `instagram-w*-schedule.json` から当日エントリを含む週ファイルを自動選択する。
  旧実装は特定週固定で更新忘れ→ cron 空振り事故が実発生 (w20 期間に w19 を読み続け 1 ヶ月未投稿)

### R2 素材保持ポリシー (★コスト対策)

**投稿済み (posted) の動画 (.mp4) は投稿後 30 日で R2 から自動削除する**
(`cleanup-posted-sns-videos.ts` + `.github/workflows/cleanup-r2-sns-videos.yml` weekly)。

- サムネイル (.png) / caption.txt / posts.json の投稿記録・メトリクスは**永続**
- draft / scheduled が残る content_key の素材は削除しない (再投稿予定を守る)
- 削除済み動画を再投稿したい場合は **Remotion で再レンダー**する (素材は再生成可能な派生物)
- 背景: R2 は無料枠 10GB を超過し課金中 (2026-07 時点 20.65GB)。動画の無制限保持は肥大の主因になる

---

## 6. 関連

- 人間向け戦略: `docs/10_SNS戦略/01_SNSコンテンツ設計.md` / `05_SNSプロフィール.md`
- 投稿台帳ストア: `.claude/scripts/lib/sns-posts-store.cjs`
- メトリクス時系列: `.claude/skills/analytics/sns-metrics-improvement/`
- agent 責務: `.claude/agents/README.md` (Tier 4 SNS)
- 収益化での SNS 位置づけ: `docs/02_実装計画/01_収益化マスタープラン.md` §6
- 競合 memory: `project_competitor_riskmap_jp` / `feedback_sns_competitor_search` / `project_competitor_indicator_benchmark`
- SNS 10K ロードマップ memory: `project_sns_10k_roadmap`
