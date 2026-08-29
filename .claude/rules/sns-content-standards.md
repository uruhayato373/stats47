# SNS コンテンツ標準 (チャネル戦略 + 投稿雛形 + 頻度リミットの正典)

stats47 の SNS 運用 (X / Instagram / YouTube pilot / note) における**実行規約の単一ソース (SSOT)**。
SNS 投稿を企画・生成・投稿・計測する agent / skill / 人間はこれに従う。

> **方式**: `chart-component-standards.md` / `blog-quality-standards.md` と同じ「rules に規約カタログ 1 ファイル、
> skill/agent は参照のみ」パターン。人間向けの戦略背景・KPI 判定は `docs/10_SNS戦略/` にあり、
> **食い違う場合は本ファイル (実行規約) が優先**。docs 側は読み物、rules 側が正典。

---

## 0. チャネル別の位置づけ (2026-08-23 更新)

| チャネル | 位置づけ | 目標 | 頻度上限 | 主フォーマット | primary agent |
|---|---|---|---|---|---|
| **Instagram** | **主力** | フォロワー 10K (2027-02)・保存率 | カルーセル 2 + リール 1 / 週 | 6 枚カルーセル / Reels | `instagram-strategist` |
| **X** | 自動化・トレンド瞬発 | 1-2K 維持・サイト送客 | 予約 2-3 / 週 + 引用RT 随時 (1 日 ≤ 3) | ランキング投稿 / 引用RT | `x-strategist` |
| **note** | 外部衛星 | stats47 への送客 | 上限なし (2026-08-03 オーナー判断で撤廃・下記) | 広い検索意図の記事 | `note-manager` |
| **YouTube** | **限定 pilot** | 通常動画の視聴維持・指名/サイト送客を検証 | **6週間で3本まで** | 6〜12分の横型・編集動画 | `strategy-advisor` (実験 owner) |
| **TikTok** | **撤退 (恒久)** | — | **0 (投稿しない)** | — | — |

### YouTube pilot の方式 (2026-08-23〜、EXP-006)

- **通常動画をマスターコンテンツにする**。YouTube 用の 6〜12 分動画を先に編集し、そこから Instagram Reels / X 用に各 2〜4 本を切り出す
- マスターは台本・ナレーション・実写/ストック・図表を NLE で編集する。**Remotion は図表・地図・短いアニメーション素材に限る**。Remotion の自動ランキング動画をマスターにしない
- 1 本ごとにランキング / ブログ / テーマの根拠 URL、使用 metric、`surveyId` / provenance を台本と説明欄へ引き継ぐ。出典確認なしで公開しない
- Shorts-first、Bar Chart Race の横流し、47県分割、同一動画の自動量産は pilot 対象外
- 編集・事実確認・Studio 投稿は人間承認。OAuth / 自動アップロード / 定期 cron は pilot 成功判定後まで再実装しない
- pilot の企画・基準・結果は `.claude/state/experiments.json` の `EXP-006`、投稿実績は `posts.json` を SSOT とする

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
| **YouTube 通常動画は pilot 中3本まで** | ≤ 3 / 6週間 | 少量で制作工数・視聴維持・送客を検証する。Shorts 単独量産は禁止 |
| **YouTube マスター1本からの派生** | Reels / X 各 2〜4 本 | マスター先行。派生は同じ主張・出典を保ち、切り抜きだけで意味を歪めない |
| **X は 1 日 3 本まで** (`X_DAILY_MAX=3`) | ≤ 3 / 日 | スパム判定回避。予約 + 引用RT + ニュース連動の合算 |
| **X 定型ストックは週 14-21 本** (`X_WEEKLY_TARGET_MIN=14` / `X_WEEKLY_TARGET_MAX=21`) | 14-21 / 週 | 2026-07 積極運用へ転換。ランキング定型を量産し流入を作る |
| **X 引用RT は 1 日 3 本まで** | ≤ 3 / 日 | 上記 1 日上限の内数。スパム判定回避 |
| **IG は Graph API 25 件/24h 上限** | ≤ 25 / 24h | Meta 制約 |
| **同一内容の連投禁止 (全チャネル)** | — | インプレッション食い合い。X は `lint-x-captions.cjs` の類似度チェックで機械担保 |
| **X 引用RT は 72h 以内のツイートのみ・炎上/政治回避** | — | ブランド毀損防止 |

これらは skill 実行時にガードスクリプトが検証する (X = `check-x-post-budget.cjs`)。
新規投稿スキルを作る場合は本表を必ず参照し、上限を超える経路を作らない。

> **例外: Instagram 量産実験 (2026-07-12〜2026-08-10)**。オーナー判断 (2026-07-11) で §0 の
> 「カルーセル 2 + リール 1 / 週」を期間限定で停止し、**1 日 3 本** (既存予約リール 16 本 + ランキング
> 画像 74 本 = 90 本、Graph API 25 件/24h の範囲内) を実地検証する。配信は
> `post-instagram-scheduled.yml` の cron ×3 (08:03/12:03/19:03 JST) + `instagram-w29-schedule.json`
> (エントリの `time` で枠指定、`ig-posted-log` で二重投稿防止)。効果は `/update-sns-metrics` +
> sns-weekly-report でリーチ・保存率を計測し、**悪化が確認されたら w29 の残エントリ削除で即時停止**する。
> 期間終了後は既定 (週 3 本) に戻る。

> **機械参照 (★SSOT)**: 上表の `X_DAILY_MAX` / `X_WEEKLY_TARGET_MIN` / `X_WEEKLY_TARGET_MAX` は
> `<!-- x-catalog:quota -->` ブロック (本節末) に構造化データとして持たせ、`.claude/scripts/lib/x-catalog.cjs`
> がパースする。**値を変えるときは下記ブロックだけを編集**すれば guard / 候補選定数 / schedule 割付の全系に波及する。

<!-- x-catalog:quota:start -->
```
X_DAILY_MAX=3
X_WEEKLY_TARGET_MIN=14
X_WEEKLY_TARGET_MAX=21
```
<!-- x-catalog:quota:end -->

---

## 2. 投稿雛形カタログ

投稿本文は下記テンプレに従う。各 post 系スキルは「雛形は本カタログ参照」に統一する
(スキル内にテンプレを重複させない = ドリフト防止)。**post-x / post-x-batch / x-strategist は
テンプレ本文を自前で持たず、必ず本節を参照する** (過去に 4 箇所へドリフトした反省)。

### 2-0. X テンプレ機械カタログ (★SSOT・template id)

X 投稿の「型」は下表を単一ソースとする。各投稿は `template` id を 1 つ持ち、posts.json の
`template` 列に**必ず記録する** (勝ちパターン分析 `analyze-x-winning-patterns.mjs` の前提)。
`.claude/scripts/lib/x-catalog.cjs` が下記アンカー内のテーブルをパースして
`getTemplates()` / `getImageKinds()` を返す。文言・画像割当を変えるときは本表だけを編集する。

- `structure` = キャプションの型 (LLM がこの枠で文章を書く)
- `image_kind` = §2-9 の画像種 id (投稿添付画像)
- `char_max` = URL・改行を除く本文の上限文字数
- `best_time` = 推奨投稿時間帯 (scheduled_at 割付の既定。§2-8 の時間帯表と整合)

<!-- x-catalog:templates:start -->
| template | structure | image_kind | char_max | best_time | 用途 |
|---|---|---|---|---|---|
| `shock` | 衝撃の1事実→数値対比2行→サイト誘導 | ranking-card | 140 | weekday-07-09 | 意外な1位/最下位。スクロールを止める |
| `versus` | 2者対決→数値→どっち派?問いかけ | ranking-card | 140 | weekday-12-13 | 東京 vs 地方等。賛否で引用RT誘発 |
| `question` | なぜ〇〇なのか?→答えを一部先出し→続きはサイト | ranking-card | 140 | weekday-18-20 | 好奇心ギャップ。保存誘発 |
| `paradox` | 通説提示→データは逆→驚いたら保存 | tile-map | 150 | weekday-10-12 | 逆説。知的刺激でブックマーク |
| `number` | 数値3つ以上を冒頭列挙→最大格差強調→ランキングURL | ranking-card | 150 | weekday-07-09 | 数字の羅列で驚かせる。通勤帯で保存 |
| `angle-experience` | もし〇〇県に住んでいたら→感情描写→あなたの県は? | ranking-card | 150 | weekday-21-23 | 個人化・感情移入。返信誘発 |
| `angle-howto` | このデータを使う3ステップ→試して | ranking-card | 160 | weekend-09-11 | 実用価値。週末に保存・試行 |
| `quote-rt` | 引用元の主張を統計で肯定/否定/深掘り1-2文 | none | 140 | any | 引用RT (find-quote-rt 経由。バッチ対象外) |
<!-- x-catalog:templates:end -->

- ハッシュタグは全 template 共通で **3-5 個**。URL は 1 本のみ (§4 の UTM 規則)。
- `quote-rt` は瞬発系のため `/post-x-batch` の量産対象外 (find-quote-rt → publish-x で個別運用)。
- template id と 6 角度 (§2-8) の対応: `angle-conclusion≈shock` / `angle-number≈number` /
  `angle-rebuttal≈paradox` / `angle-reason≈question`。バッチは上表 id を使う (6 角度は相性判定の語彙)。

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

### 2-7. note 衛星記事

- 広い検索意図 (移住 / 年収 / 子育て 等) を外部で獲得し stats47 へ送客
- 本文中 2-4 箇所で stats47 リンク (§4 の通り note は素の URL)
- 全文重複禁止。**投稿頻度の上限は撤廃 (2026-08-03 オーナー判断)** — 完成済み下書きは溜めずに投稿してよい。
  ただし note.com の spam 検知を避けるため、**同一セッションでの大量連続投稿は間隔を空ける**
  (旧「月 1-2 本」は spam 回避目的の保守値だった。上限撤廃後も「一気に数十本」は分散させる)。

### 2-8. 角度 × カテゴリ相性表 (★SSOT・旧 post-x-6angles/reference から吸収)

ランキングの categoryKey (17 軸) ごとに、どの切り口が効くかの早見表。`select-candidates.cjs` が
`.claude/scripts/lib/x-catalog.cjs` の `getAffinity()` 経由でこれを読み、§2-0 の template を割り付ける。
`◎`=高相性 (ファーストピック) / `○`=第二候補 / `△`=弱い / `—`=不適。6 切り口 (結論/理由/体験/反論/数字/ハウツー)
は §2-0 の template と対応する (結論≈shock, 理由≈question, 反論≈paradox, 数字≈number, 体験≈angle-experience,
ハウツー≈angle-howto)。

<!-- x-catalog:affinity:start -->
| category | 結論 | 理由 | 体験 | 反論 | 数字 | ハウツー |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| laborwage | ◎ | ○ | ○ | ◎ | ◎ | ○ |
| economy | ◎ | ○ | ○ | ◎ | ◎ | ○ |
| population | ○ | ◎ | ◎ | ○ | ◎ | ○ |
| socialsecurity | ○ | ◎ | ◎ | ◎ | ◎ | ◎ |
| educationsports | ○ | ◎ | ◎ | ○ | ◎ | ◎ |
| tourism | ◎ | ○ | ◎ | ◎ | ◎ | △ |
| agriculture | ○ | ◎ | ◎ | ◎ | ◎ | ◎ |
| landweather | ○ | ◎ | ◎ | ○ | ◎ | △ |
| safetyenvironment | ○ | ◎ | ◎ | ○ | ◎ | ◎ |
| commercial | ◎ | ○ | ◎ | ◎ | ◎ | ○ |
| miningindustry | ○ | ◎ | △ | ◎ | ◎ | ○ |
| construction | ○ | ◎ | ◎ | ○ | ◎ | ◎ |
| infrastructure | ○ | ◎ | ◎ | ○ | ◎ | ◎ |
| administrativefinancial | ◎ | ◎ | △ | ◎ | ◎ | ○ |
| international | ○ | ◎ | ◎ | ◎ | ◎ | △ |
| energy | ○ | ◎ | △ | ◎ | ◎ | ◎ |
| ict | ○ | ◎ | △ | ◎ | ◎ | ◎ |
<!-- x-catalog:affinity:end -->

- ranking_key の特徴による微調整: 格差 2 倍以上→数字 ◎ 必須 / 通説と逆の順位→反論優先 /
  生活直結→体験優先 / 政策含意→ハウツー / 「なぜ」が生じやすい→理由優先。
- 文例集は旧 `post-x-6angles/reference/angle-templates.md` を本表の下位資料として保持しない
  (LLM が §2-0 structure + §2-8 相性 + 勝ちパターンから執筆する)。

### 2-9. X 画像カタログ (★SSOT・添付画像の種類)

X 投稿に添付できる画像種を単一ソース化する。`.claude/scripts/lib/x-catalog.cjs` の `getImageKinds()`
が下記アンカーをパースする。§2-0 の `image_kind` 列がここを参照する。**出力パスは publish-x が読む
`.local/r2/sns/<domain>/<key>/x/stills/` に統一**する (旧 quick-still の `.local/sns-quick/` は使わない)。

<!-- x-catalog:imagekinds:start -->
| image_kind | size | generator | out_path | 備考 |
|---|---|---|---|---|
| ranking-card | 960x404 | `.claude/scripts/sns/quick-still.ts --key <key>` | `.local/r2/sns/ranking/<key>/x/stills/<key>.png` | 上位5+下位5 カード (横長)。X の既定 |
| tile-map | 1080x1080 | Remotion `RankingX-ChoroplethMap` (render-sns-stills) | `.local/r2/sns/ranking/<key>/x/stills/choropleth-map-1200x630.png` | ★既知の不整合: ラベルは 1200x630 だが実 canvas 1080x1080。修正は別タスク |
| scatter | 1200x630 | Remotion `CorrelationX-Scatter` (render-sns-stills) | `.local/r2/sns/correlation/<x>--<y>/x/stills/scatter-1200x630.png` | 相関散布図 (correlation domain のみ) |
| compare | 1200x630 | Remotion `CompareX-Post` (render-sns-stills) | `.local/r2/sns/compare/<a>-vs-<b>/x/stills/comparison-1200x630.png` | 2地域比較 (compare domain のみ) |
| none | — | — | — | 画像なし (quote-rt 等テキスト投稿) |
<!-- x-catalog:imagekinds:end -->

- **量産の既定は `ranking-card`** (quick-still.ts で決定的・数秒生成)。tile-map/scatter/compare は
  Remotion レンダが要るため瞬発量産には重い (バッチは ranking-card を主軸に、多様性のため一部 tile-map)。
- SVG→PNG 変換は `.claude/scripts/lib/svg-to-png.cjs` に一本化 (sharp 失敗時は exit≠0 で確実化)。

### 2-10. カタログ改訂手順 (★人間承認ゲート)

§2-0 / §2-8 / §2-9 / §1 quota の改訂は**実測と競合観測に基づく**こと (`evidence-based-judgment.md`)。

1. `analyze-x-winning-patterns.mjs` の月次レポート
   (`.claude/skills/sns/x-viral-research/reference/reports/<date>.md`) か
   `/competitor-scan` の月次レビューを起点にする (思いつきで変えない)。
2. x-strategist が「どの行をどう変えるか」の diff を提案として提示する。
3. **人間が承認してから**本ファイルを編集する。編集後は `node .claude/scripts/lib/x-catalog.cjs --check` を通す。

---

## 3. 投稿台帳 (posts.json への記録は必須)

全チャネルの投稿は `.claude/state/sns/posts.json` に記録する。**これが投稿履歴の SSOT** (完全DBレス。
永続 D1 は使わない)。

- 書込口は `sns-posts-store.cjs` / `/mark-sns-posted` のみ。直接 JSON を手編集しない
- **IG の cron 投稿は `.claude/scripts/instagram/record-posted.cjs` が記録する** (内部で store を呼ぶ)。
  `ig-posted-log.jsonl` は同日多重投稿の防止だけが役割で **SSOT ではない**。両方を同じ commit で
  更新すること — 台帳を落とすと投稿が `/update-sns-metrics` の対象外になり実績が計測できなくなる
  (2026-05-18〜08-03 に 94 件がこの状態で滞留した。ドリフト検知は `record-posted.cjs --check`)
- レコードは snake_case: `id / platform / post_type / domain / content_key / caption / post_url /
  quote_url / media_path / status / scheduled_at / posted_at / impressions / likes / reposts /
  replies / bookmarks / metrics_updated_at / template / metric_keys / parent_post_id / source_timecode /
  survey_ids / provenance_urls / ...`
- **YouTube master と派生投稿の関係**: master は `platform=youtube` / `post_type=video`、派生 Reels / X は
  master と同じ `content_key` を持ち、`parent_post_id=<YouTube row id>` と `source_timecode=<開始>-<終了>` を記録する。
  使用した調査と出典は全行で `survey_ids` / `provenance_urls` を引き継ぐ
- メトリクスは投稿後に `/update-sns-metrics` が UPDATE。時系列 snapshot は
  `.claude/skills/analytics/sns-metrics-improvement/snapshots/` が SSOT

---

## 4. UTM 規則 (旧 generate-utm-url を吸収)

SNS 投稿の stats47.jp リンクには UTM を付ける。note は付けない (素の URL)。

> **★生成の単一実装 = `.claude/scripts/lib/sns-utm.cjs`** (2026-07-17 一本化)。post-x-batch の
> register-drafts / buzz-map (`lib/buzz-map-utm-core.mjs` は薄い adapter) ともこれに委譲する。
> UTM 形式を変えるときはこのファイル 1 箇所。buzz-map は `utm_campaign=buzz-map-<ideaId>` /
> `utm_content=<variant>`。**canonical URL (catalog/spec/sitemap) に UTM を混入させない**。

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
| `utm_content` | `<template>` (例: `shock`, `paradox`) |

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
| **X (量産)** | `post-x-batch` (候補選定→画像→執筆→lint→draft 登録) | quick-still (ranking-card) | `publish-x --from-queue` (ローカル) → `mark-sns-posted` | `update-sns-metrics` → `analyze-x-winning-patterns` |
| **X (瞬発)** | `find-quote-rt` / `react-to-news` | (キャプション) | `publish-x` → `mark-sns-posted` | `update-sns-metrics` |
| **IG** | `generate-instagram-schedule` (+ `post-ig-6angles`) | `render-sns-stills` | `post-instagram` (GHA cron) → `record-posted.cjs` | `update-sns-metrics` |
| **YouTube pilot** | EXP-006 の brief → `article-writer` が構成・台本・出典表 | NLE で通常動画を編集 (`chart-author` / Remotion は図表素材のみ) | 人間が事実確認 → YouTube Studio へ手動投稿 → `sns-posts-store.cjs` で記録 | Studio の 30秒維持率・平均視聴率・視聴数を14日後に手動記録 + GA4 YouTube UTM |
| **buzz-map (X/IG 横断)** | curated catalog (`build-buzz-map-catalog.ts --next`・正典 `buzz-map-standards.md` §4-5) | `prepare-buzz-map-batch.ts` (dry-run 既定・landing contract+isPostable ゲート→R2→draft) / admin `/buzz-map` | 既存 guarded flow (`publish-x` / IG cron — draft からの昇格は人間判断) | `buzz-map-attribution.mjs` (campaign 別) → score 還流 |

- **buzz-map の deep-click 計測は要ユーザー操作 (GA4 custom dimension)**: `buzz-map-attribution.mjs` は
  session KPI (landing session / engagement / SNS CTR は attribution=direct のみ) を campaign 別に取得するが、
  **CTA 深掘り (cta_click の `content_id`/`target_type`) は GA4 管理画面でカスタムディメンション (イベントスコープ) を
  登録するまで取れない** (affiliate §6 と同手順)。未登録の間は session KPI のみで degrade (異常終了しない)。
- **X 量産のライフサイクル**: `/post-x-batch` が posts.json に `status=draft` (`template`/`scheduled_at` 付き) で
  N 本積む → ローカルで `publish-x --from-queue` が `check-x-post-budget.cjs` ガードを通して予約 → `status=scheduled` →
  投稿時刻経過で `mark-sns-posted` が `posted` へ昇格。**template を必ず記録** (勝ちパターン分析の前提)。
- **Remotion レンダ入口の正典**: 静止画/動画 = `render-sns-stills`、BCR = `bar-chart-race`、
  日本地図×統計のバズカード = `buzz-map` (型A〜E: 二値/時系列/点/線ネットワーク/合成。型一覧・仕様の正典は
  `.claude/rules/buzz-map-standards.md` §1。IG 配信は `instagram/stills/slide-1-cover-1080x1350.png`+`reel.mp4`+
  `caption.txt` を R2 push → posts.json draft `template=buzzmap-<型>`)、`preview-remotion` はプレビュー専用 (レンダしない)
- 週次運用は `/sns-weekly-plan` が上記を 1 コマンドで束ねる
- 競合の定点観測は `/competitor-scan` (月次)。示唆は §2-10 の承認ゲート経由でカタログへ反映
- **YouTube 自動化の停止線**: pilot 中は Data API / OAuth / upload cron を持たない。3本の結果を EXP-006 で判定し、
  継続が決まった場合だけ専用 skill / uploader / 自動計測の要否を設計する

---

## 5.5 統合メディアコンソール (`/admin-console`) と R2 素材保持ポリシー

素材の目視確認 (動画再生)・caption 微調整・投稿/予約・メトリクス閲覧は
**ローカル統合メディアコンソール** (`npm run admin` → http://127.0.0.1:4747/) で行える
(skill `.agents/skills/management/admin-console/SKILL.md`、実装 `apps/admin/` — 独立 Next.js App Router アプリ、
localhost 専用・127.0.0.1 bind 固定。2026-07-16 に旧 node:http 実装から完全移管、`sns:gallery` alias 廃止)。
全チャネルの制作・公開状態は `/content`、参考文献からサイト・ブログ・note・Kindleへの展開状況は
`/content/references`、X / Instagramの投稿操作は `/content/{x,instagram}` または共通 `/sns`、OGP/リンクカード/note カバー・
記事内画像/動画 master は `/assets`、ブログ SVG カタログは `/svg`、**プロジェクト現況 (メトリクス・進捗キュー・
改善バックログ TODO・STP 戦略) は `/dashboard`** で横断閲覧する
(画像資産の列挙 collector は CI 静的ギャラリー `build-image-gallery.mjs` と `.claude/scripts/lib/gallery-collectors.mjs` を共用。
現況 collector は `apps/admin/lib/server/dashboard.ts`、state/md を読み取り専用ミラーでライブ読み)。

- **ギャラリー経由の投稿も台帳規約は同一**: posts.json への書込は `sns-posts-store.cjs` 経由のみ
  (server も同経路)。§1 の頻度リミットは残枠バッジ + ガードで enforce される
- **コンテンツ運用画面は派生 read model**: `/content` はposts.json、note git TS catalog + R2本文、Kindle
  book-catalog/manuscripts + kdp-listingsをライブ突合する。`/content/references`は解決済み参考文献inventoryを
  metric / area単位へ重複排除し、各コンテンツSSOTの実在証跡と突合する。統合用の別SSOTや永続DBを作らない。
  `npm run audit:content-operations` をPRでblocking実行し、個別制作物をTODOカードへ複製しない
  (`K-Sx-xx` / `NOTE-ARTICLE-*` / `SNS-POST-*` 等の個別カードは監査error)。backlogには
  システム不具合・自動化・チャネル横断の意思決定だけを置く
- **draft レコード運用**: 未投稿素材は `status=draft` で台帳に登録して管理する (新 manifest は作らない)。
  R2 にあるが台帳に無い素材は画面の「R2 探索」(HEAD probe) → draft 登録で回収
- **IG 予約の二重書込**: ギャラリーの「IG 予約登録」は schedule JSON + posts.json (scheduled) を
  同一ハンドラで同時書込する。不整合は `GET /api/ig-consistency` が検出
- **IG cron の schedule ファイルは自動選択** (2026-07-07〜): `post-from-schedule.cjs` は
  `instagram-w*-schedule.json` から当日エントリを含む週ファイルを自動選択する。
  旧実装は特定週固定で更新忘れ→ cron 空振り事故が実発生 (w20 期間に w19 を読み続け 1 ヶ月未投稿)

### R2 素材保持ポリシー (★コスト対策)

**投稿済み (posted) の派生 SNS 動画 (.mp4) は投稿後 30 日で R2 から自動削除する**
(`cleanup-posted-sns-videos.ts` + `.github/workflows/cleanup-r2-sns-videos.yml` weekly)。

- サムネイル (.png) / caption.txt / posts.json の投稿記録・メトリクスは**永続**
- YouTube pilot の通常動画 master は再編集可能なソース資産のため `video/<slug>/master.mp4` に保持し、30日削除の対象外とする
- draft / scheduled が残る content_key の素材は削除しない (再投稿予定を守る)
- 削除済み動画を再投稿したい場合は **Remotion で再レンダー**する (素材は再生成可能な派生物)
- 背景: R2 は無料枠 10GB を超過し課金中 (2026-07 時点 20.65GB)。動画の無制限保持は肥大の主因になる

---

## 6. 関連

- 人間向け戦略: `docs/10_SNS戦略/01_SNSコンテンツ設計.md` / `05_SNSプロフィール.md`
- 投稿台帳ストア: `.claude/scripts/lib/sns-posts-store.cjs`
- **X 量産カタログ API**: `.claude/scripts/lib/x-catalog.cjs` (§1 quota / §2-0 templates / §2-8 affinity / §2-9 imagekinds をパース)
- **X 量産スキル**: `.claude/skills/sns/post-x-batch/` (候補選定 `select-candidates.cjs` / lint `lint-x-captions.cjs` / 登録 `register-drafts.cjs`)
- **X 頻度ガード**: `.claude/scripts/sns/check-x-post-budget.cjs`
- **X 勝ちパターン**: `.claude/scripts/sns/analyze-x-winning-patterns.mjs` → `.claude/state/sns/x-winning-patterns.json`
- **X 画像最短経路**: `.claude/scripts/sns/quick-still.ts` / SVG→PNG `.claude/scripts/lib/svg-to-png.cjs`
- **バズ地図カード (日本地図×統計)**: 規約 `.claude/rules/buzz-map-standards.md` / スキル `.claude/skills/sns/buzz-map/SKILL.md` / Remotion feature `apps/remotion/src/features/buzz-map/` (owner: sns-renderer、co: X配信=x-strategist / IG配信=instagram-strategist / 地理データ=gis-curator)
- メトリクス時系列: `.claude/skills/analytics/sns-metrics-improvement/`
- agent 責務: `.claude/agents/README.md` (Tier 4 SNS) / X オーナー `.claude/agents/x-strategist.md`
- 収益化での SNS 位置づけ: `docs/00_プロジェクト管理/02_収益化戦略.md` §6
- 競合 memory: `project_competitor_riskmap_jp` / `feedback_sns_competitor_search` / `project_competitor_indicator_benchmark`
- SNS 10K ロードマップ memory: `project_sns_10k_roadmap`
